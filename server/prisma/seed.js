const bcrypt = require('bcryptjs');
const prisma = require('../src/db');

async function main() {
  console.log('Seeding School Management System database...');

  // 1. Hash passwords securely (FR9 / Non-Functional Security Requirement)
  const adminHash = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);
  const parentHash = await bcrypt.hash('parent123', 10);

  // 2. Create Users (Admin, Teacher, Parent)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      fullName: 'Marjan Sikandar (Admin)',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { username: 'teacher1' },
    update: {},
    create: {
      username: 'teacher1',
      fullName: 'Fahim Ahmad (Faculty)',
      passwordHash: teacherHash,
      role: 'TEACHER',
    },
  });

  const parent = await prisma.user.upsert({
    where: { username: 'parent1' },
    update: {},
    create: {
      username: 'parent1',
      fullName: 'Tariq Mahmood (Parent)',
      passwordHash: parentHash,
      role: 'PARENT',
    },
  });

  // 3. Create Classes assigned to Teacher (FR1)
  const class8A = await prisma.class.upsert({
    where: { name: 'Grade 8-A' },
    update: {},
    create: { name: 'Grade 8-A', teacherId: teacher.id },
  });

  const class5B = await prisma.class.upsert({
    where: { name: 'Grade 5-B' },
    update: {},
    create: { name: 'Grade 5-B', teacherId: teacher.id },
  });

  // 4. Create Two Students & Link Both to parent1 (FR2: Multi-Child Parent Account)
  const student1 = await prisma.student.upsert({
    where: { rollNumber: 'SMS-101' },
    update: {},
    create: { rollNumber: 'SMS-101', fullName: 'Ayaan Tariq', classId: class8A.id },
  });

  const student2 = await prisma.student.upsert({
    where: { rollNumber: 'SMS-102' },
    update: {},
    create: { rollNumber: 'SMS-102', fullName: 'Zoya Tariq', classId: class5B.id },
  });

  await prisma.parentChild.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student1.id } },
    update: {},
    create: { parentId: parent.id, studentId: student1.id },
  });

  await prisma.parentChild.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student2.id } },
    update: {},
    create: { parentId: parent.id, studentId: student2.id },
  });

  // 5. Add Sample Fee Records (FR3) & Circular (FR8)
  const existingFees = await prisma.feeRecord.count();
  if (existingFees === 0) {
    await prisma.feeRecord.createMany({
      data: [
        { title: 'Term 1 Tuition Fee', totalAmount: 25000, paidAmount: 25000, dueDate: '2026-09-15', studentId: student1.id },
        { title: 'Term 2 Tuition Fee', totalAmount: 25000, paidAmount: 10000, dueDate: '2026-11-30', studentId: student1.id },
        { title: 'Term 2 Tuition Fee', totalAmount: 22000, paidAmount: 0, dueDate: '2026-11-30', studentId: student2.id },
      ],
    });
  }

  const existingCirculars = await prisma.circular.count();
  if (existingCirculars === 0) {
    await prisma.circular.create({
      data: {
        title: 'Annual Parent-Teacher Meeting (PTM)',
        body: 'All parents are invited to attend the Term 2 PTM on Saturday from 9:00 AM to 1:00 PM.',
        type: 'EVENT',
        eventDate: '2026-11-28',
      },
    });
  }

  console.log('Seed completed! Demo accounts ready:');
  console.log('  Admin   -> admin / admin123');
  console.log('  Teacher -> teacher1 / teacher123');
  console.log('  Parent  -> parent1 / parent123 (linked to Ayaan Tariq & Zoya Tariq)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });