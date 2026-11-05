const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCompensation } = require('../src/controllers/faculty.controller');

test('buildCompensation calculates percentage earnings for each assigned batch student', () => {
  const result = buildCompensation({
    instructor: { compensationType: 'PERCENTAGE', percentage: 20, fixedSalary: 0 },
    allocations: [
      { id: 'allocation-1', batchId: 'batch-1', title: 'MERN', Batch: { name: 'MERN Morning' } },
    ],
    students: [
      { id: 'student-1', name: 'Aarav', studentCode: 'STU-1', batchId: 'batch-1' },
      { id: 'student-2', name: 'Maya', studentCode: 'STU-2', batchId: 'batch-1' },
      { id: 'student-3', name: 'Noah', studentCode: 'STU-3', batchId: 'batch-2' },
    ],
    payments: [
      { studentId: 'student-1', amountMinor: 50000 },
      { studentId: 'student-1', amountMinor: 25000 },
      { studentId: 'student-2', amountMinor: 30000 },
    ],
  });

  assert.equal(result.collectedMinor, 105000);
  assert.equal(result.earnedMinor, 21000);
  assert.equal(result.batches[0].studentCount, 2);
  assert.deepEqual(result.batches[0].students.map(({ studentId, collectedMinor, earnedMinor }) => ({ studentId, collectedMinor, earnedMinor })), [
    { studentId: 'student-1', collectedMinor: 75000, earnedMinor: 15000 },
    { studentId: 'student-2', collectedMinor: 30000, earnedMinor: 6000 },
  ]);
});

test('buildCompensation keeps fixed salary separate from batch percentage earnings', () => {
  const result = buildCompensation({
    instructor: { compensationType: 'FIXED', fixedSalary: '45000', percentage: 20 },
    allocations: [{ id: 'allocation-1', batchId: 'batch-1', title: 'MERN' }],
    students: [{ id: 'student-1', name: 'Aarav', studentCode: 'STU-1', batchId: 'batch-1' }],
    payments: [{ studentId: 'student-1', amountMinor: 50000 }],
  });
  assert.deepEqual(result, { type: 'FIXED', fixedSalary: 45000, percentage: 0, batches: [], collectedMinor: 0, earnedMinor: 0 });
});
