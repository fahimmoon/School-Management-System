const prisma = require('../db');

// UC-09 / Sequence Diagram 14.2: Notify Class Parents on Homework Upload (FR7)
async function notifyClassParents(classId, className, homeworkTitle, dueDate) {
  // 1. Find all students enrolled in this class along with their linked parents
  const students = await prisma.student.findMany({
    where: { classId: Number(classId) },
    include: {
      parents: true, // ParentChild links
    },
  });

  // 2. Collect unique parent IDs (in case a parent has two children in the same class)
  const uniqueParentIds = new Set();
  for (const student of students) {
    for (const link of student.parents) {
      uniqueParentIds.add(link.parentId);
    }
  }

  if (uniqueParentIds.size === 0) return 0;

  // 3. Create a notification alert for every linked parent in the database
  const notificationsData = Array.from(uniqueParentIds).map((parentId) => ({
    parentId,
    message: `New Homework in ${className}: "${homeworkTitle}" (Due: ${dueDate})`,
  }));

  await prisma.notification.createMany({
    data: notificationsData,
  });

  return notificationsData.length;
}

module.exports = { notifyClassParents };