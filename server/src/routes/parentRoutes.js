const express = require('express');
const prisma = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all /api/parent/* endpoints: must be logged in AND have role === 'PARENT' (FR9)
router.use(authenticateToken, authorizeRoles('PARENT'));

// 1. Get all children linked to this parent + notifications + circulars (FR2, FR7, FR8)
router.get('/overview', async (req, res) => {
  try {
    const parentId = req.user.id;

    // Fetch all linked children (FR2)
    const links = await prisma.parentChild.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            class: {
              include: { teacher: { select: { fullName: true } } },
            },
          },
        },
      },
    });

    const children = links.map((link) => link.student);

    // Fetch parent's homework notifications (FR7)
    const notifications = await prisma.notification.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch published school circulars & events (FR8)
    const circulars = await prisma.circular.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({ children, notifications, circulars });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. UC-10 / Sequence Diagram 14.3: GET /api/parent/children/:childId/dashboard
router.get('/children/:childId/dashboard', async (req, res) => {
  try {
    const parentId = req.user.id;
    const studentId = Number(req.params.childId);

    // Security Check (Sequence Diagram 14.3, Step 3): Verify child is linked to this parent
    const link = await prisma.parentChild.findUnique({
      where: {
        parentId_studentId: { parentId, studentId },
      },
    });

    if (!link) {
      return res.status(403).json({
        error: '403 Access Denied: This student is not linked to your parent account.',
      });
    }

    // Fetch child's class, attendance (FR4), results (FR5), homework (FR6), and fees (FR3)
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            teacher: { select: { fullName: true } },
            homeworks: { orderBy: { createdAt: 'desc' } },
          },
        },
        attendances: { orderBy: { date: 'desc' } },
        results: { orderBy: { id: 'desc' } },
        fees: { orderBy: { id: 'desc' } },
      },
    });

    res.json({ student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Mark all notifications as read
router.patch('/notifications/read', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { parentId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;