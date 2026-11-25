const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all /api/admin/* endpoints: must be logged in AND have role === 'ADMIN' (FR9)
router.use(authenticateToken, authorizeRoles('ADMIN'));

// ==========================================
// UC-02: MANAGE USERS (Teachers, Parents, Admins) - FR1
// ==========================================
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true,
        childrenLinks: { include: { student: true } },
        classesTaught: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { username, fullName, password, role } = req.body;
    if (!username || !fullName || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, fullName, passwordHash, role },
      select: { id: true, username: true, fullName: true, role: true },
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'Username already exists or invalid data.' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// UC-02: MANAGE CLASSES - FR1
// ==========================================
router.get('/classes', async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        teacher: { select: { id: true, fullName: true } },
        students: true,
      },
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/classes', async (req, res) => {
  try {
    const { name, teacherId } = req.body;
    const newClass = await prisma.class.create({
      data: {
        name,
        teacherId: teacherId ? Number(teacherId) : null,
      },
    });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ error: 'Class name already exists or invalid teacher.' });
  }
});

router.delete('/classes/:id', async (req, res) => {
  try {
    await prisma.class.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Class deleted.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// UC-02 & UC-03: MANAGE STUDENTS & MULTI-CHILD PARENT LINKS - FR1, FR2
// ==========================================
router.get('/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        class: true,
        parents: { include: { parent: { select: { id: true, fullName: true, username: true } } } },
        fees: true,
      },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/students', async (req, res) => {
  try {
    const { rollNumber, fullName, classId, parentId } = req.body;
    const student = await prisma.student.create({
      data: {
        rollNumber,
        fullName,
        classId: Number(classId),
        // Optionally link to a parent immediately (FR2)
        parents: parentId
          ? { create: [{ parentId: Number(parentId) }] }
          : undefined,
      },
    });
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ error: 'Roll number must be unique and class must exist.' });
  }
});

// Link an existing Parent to an existing Child (UC-03 / FR2)
router.post('/link-child', async (req, res) => {
  try {
    const { parentId, studentId } = req.body;
    const link = await prisma.parentChild.create({
      data: {
        parentId: Number(parentId),
        studentId: Number(studentId),
      },
    });
    res.status(201).json(link);
  } catch (error) {
    res.status(400).json({ error: 'Parent and student are already linked.' });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    await prisma.student.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Student deleted.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// UC-04: MANAGE STUDENT BILLING (Fees, Payments, Dues) - FR3
// ==========================================
router.get('/billing', async (req, res) => {
  try {
    const fees = await prisma.feeRecord.findMany({
      include: { student: { include: { class: true } } },
      orderBy: { id: 'desc' },
    });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/billing', async (req, res) => {
  try {
    const { title, totalAmount, paidAmount, dueDate, studentId } = req.body;
    const record = await prisma.feeRecord.create({
      data: {
        title,
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount || 0),
        dueDate,
        studentId: Number(studentId),
      },
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Record a fee payment & recalculate dues (UC-04)
router.patch('/billing/:id/pay', async (req, res) => {
  try {
    const { amount } = req.body;
    const existing = await prisma.feeRecord.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!existing) return res.status(404).json({ error: 'Fee record not found.' });

    const updatedPaid = Math.min(existing.totalAmount, existing.paidAmount + Number(amount));
    const updated = await prisma.feeRecord.update({
      where: { id: Number(req.params.id) },
      data: { paidAmount: updatedPaid },
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// UC-05: PUBLISH CIRCULARS & EVENTS - FR8
// ==========================================
router.get('/circulars', async (req, res) => {
  try {
    const circulars = await prisma.circular.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(circulars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/circulars', async (req, res) => {
  try {
    const { title, body, type, eventDate } = req.body;
    const circular = await prisma.circular.create({
      data: { title, body, type: type || 'CIRCULAR', eventDate: eventDate || null },
    });
    res.status(201).json(circular);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;