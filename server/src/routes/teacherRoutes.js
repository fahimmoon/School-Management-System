const express = require('express');
const prisma = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { notifyClassParents } = require('../services/notificationService');

const router = express.Router();

// Protect all /api/teacher/* routes (FR9)
router.use(authenticateToken, authorizeRoles('TEACHER', 'ADMIN'));

// Get classes assigned to the logged-in teacher (along with enrolled students)
router.get('/my-classes', async (req, res) => {
  try {
    const whereClause = req.user.role === 'ADMIN' ? {} : { teacherId: req.user.id };
    const classes = await prisma.class.findMany({
      where: whereClause,
      include: {
        students: { orderBy: { rollNumber: 'asc' } },
      },
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// UC-06: MARK CLASS ATTENDANCE - FR4
// ==========================================
router.get('/classes/:classId/attendance', async (req, res) => {
  try {
    const { date } = req.query;
    const records = await prisma.attendance.findMany({
      where: {
        classId: Number(req.params.classId),
        ...(date ? { date } : {}),
      },
      include: { student: true },
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk save or update daily attendance for a class
router.post('/classes/:classId/attendance', async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    const { date, records } = req.body; // records = [{ studentId: 1, status: "PRESENT" }, ...]

    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Date and attendance records array are required.' });
    }

    // Upsert each student's attendance for that date
    const operations = records.map((rec) =>
      prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: Number(rec.studentId),
            date,
          },
        },
        update: { status: rec.status },
        create: {
          date,
          status: rec.status,
          studentId: Number(rec.studentId),
          classId,
        },
      })
    );

    await prisma.$transaction(operations);
    res.status(201).json({ message: `Attendance saved for ${records.length} students.` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// UC-07: ENTER STUDENT RESULTS - FR5
// ==========================================
router.get('/classes/:classId/results', async (req, res) => {
  try {
    const results = await prisma.result.findMany({
      where: { classId: Number(req.params.classId) },
      include: { student: true },
      orderBy: { id: 'desc' },
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/classes/:classId/results', async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    const { examTitle, totalMarks, entries } = req.body; // entries = [{ studentId, marks }]

    if (!examTitle || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'Exam title and student marks are required.' });
    }

    const max = Number(totalMarks || 100);
    for (const entry of entries) {
      if (Number(entry.marks) < 0 || Number(entry.marks) > max) {
        return res.status(400).json({ error: `Marks must be between 0 and ${max}.` });
      }
    }

    const created = await prisma.result.createMany({
      data: entries.map((e) => ({
        examTitle,
        marks: Number(e.marks),
        totalMarks: max,
        studentId: Number(e.studentId),
        classId,
      })),
    });

    res.status(201).json({ message: `${created.count} result records saved.` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// UC-08 & UC-09: UPLOAD HOMEWORK & NOTIFY CLASS PARENTS - FR6, FR7
// ==========================================
router.get('/classes/:classId/homework', async (req, res) => {
  try {
    const homeworks = await prisma.homework.findMany({
      where: { classId: Number(req.params.classId) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(homeworks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/classes/:classId/homework', async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    const { title, description, dueDate, fileUrl } = req.body;

    if (!title || !description || !dueDate) {
      return res.status(400).json({ error: 'Title, description, and due date are required.' });
    }

    const targetClass = await prisma.class.findUnique({ where: { id: classId } });
    if (!targetClass) return res.status(404).json({ error: 'Class not found.' });

    // 1. Save Homework in database (UC-08 / FR6)
    const homework = await prisma.homework.create({
      data: {
        title,
        description,
        dueDate,
        fileUrl: fileUrl || null,
        classId,
      },
    });

    // 2. Trigger Notification Service to alert all class parents (UC-09 / FR7)
    const notifiedCount = await notifyClassParents(classId, targetClass.name, title, dueDate);

    res.status(201).json({
      homework,
      notifiedParentsCount: notifiedCount,
      message: `Homework posted and ${notifiedCount} parent(s) notified!`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;