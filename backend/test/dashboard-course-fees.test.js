const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCourseFeeSummary } = require('../src/controllers/dashboard.controller');

test('buildCourseFeeSummary groups current month fee totals by course', () => {
  const now = new Date('2026-09-15T12:00:00Z');
  const courses = [
    { id: 'course-1', name: 'Python', instituteId: 'inst-1', status: 'ACTIVE' },
    { id: 'course-2', name: 'Web Design', instituteId: 'inst-1', status: 'ACTIVE' },
  ];
  const students = [
    { id: 'student-1', instituteId: 'inst-1', courseId: 'course-1', status: 'ACTIVE' },
    { id: 'student-2', instituteId: 'inst-1', courseId: 'course-1', status: 'ACTIVE' },
    { id: 'student-3', instituteId: 'inst-1', courseId: 'course-2', status: 'ACTIVE' },
  ];
  const invoices = [
    { id: 'inv-1', studentId: 'student-1', amountMinor: 25000, dueDate: '2026-09-05' },
    { id: 'inv-2', studentId: 'student-2', amountMinor: 30000, dueDate: '2026-09-12' },
    { id: 'inv-3', studentId: 'student-3', amountMinor: 40000, dueDate: '2026-08-28' },
    { id: 'inv-4', studentId: 'student-1', amountMinor: 15000, dueDate: '2026-10-03' },
  ];
  const payments = [
    { id: 'pay-1', studentId: 'student-1', amountMinor: 20000, paidAt: '2026-09-10T10:00:00Z' },
    { id: 'pay-2', studentId: 'student-2', amountMinor: 30000, paidAt: '2026-09-15T12:00:00Z' },
    { id: 'pay-3', studentId: 'student-3', amountMinor: 10000, paidAt: '2026-09-01T08:00:00Z' },
  ];

  const summary = buildCourseFeeSummary({ courses, students, invoices, payments, now });

  assert.deepEqual(summary, [
    {
      courseId: 'course-1',
      courseName: 'Python',
      studentCount: 2,
      dueMinor: 55000,
      collectedMinor: 50000,
      pendingMinor: 5000,
      currency: 'PKR',
    },
    {
      courseId: 'course-2',
      courseName: 'Web Design',
      studentCount: 1,
      dueMinor: 0,
      collectedMinor: 10000,
      pendingMinor: 0,
      currency: 'PKR',
    },
  ]);
});
