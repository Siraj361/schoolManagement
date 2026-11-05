const { Op } = require("sequelize");
const { Assignment, AssignmentSubmission, Batch, Course, CourseSession, FacultyAllocation, Student, User } = require("../models");

const list = async (req, res, next) => {
  try {
    const instituteId = req.user.instituteId;
    const student = req.user.role === "STUDENT" ? await Student.findOne({ where: { userId: req.user.id, instituteId } }) : null;
    if (req.user.role === "STUDENT" && !student) return res.status(404).json({ success: false, error: { code: "STUDENT_PROFILE_REQUIRED", message: "No student profile is linked to this login" } });
    const assignmentWhere = { instituteId, ...(student ? { batchId: student.batchId } : req.user.role === "INSTRUCTOR" ? { createdBy: req.user.id } : {}) };
    const [assignments, submissions] = await Promise.all([
      Assignment.findAll({ where: assignmentWhere, order: [["courseSessionId", "ASC"], ["sessionOrder", "ASC"], ["dueDate", "DESC"]], include: [{ model: Batch, attributes: ["id", "name", "courseId"], include: [{ model: Course, attributes: ["id", "name"] }] }, { model: CourseSession, required: false, attributes: ["id", "title", "sequenceNumber", "status"] }] }),
      AssignmentSubmission.findAll({ where: { instituteId, ...(student ? { studentId: student.id } : {}) }, order: [["submittedAt", "DESC"]], include: [{ model: Assignment, where: req.user.role === "INSTRUCTOR" ? { createdBy: req.user.id } : undefined, attributes: ["id", "title", "batchId", "maxScore", "dueDate"] }, { model: Student, attributes: ["id", "name", "studentCode", "batchId"], include: [{ model: Batch, attributes: ["id", "name"] }] }] }),
    ]);
    const pending = submissions.filter((submission) => submission.reviewStatus === "PENDING");
    const scored = submissions.filter((submission) => Number.isFinite(Number(submission.score)));
    const averageScore = scored.length ? Number((scored.reduce((total, submission) => total + Number(submission.score), 0) / scored.length).toFixed(1)) : 0;
    return res.json({ success: true, data: { assignments, submissions, summary: { activeAssignments: assignments.filter((assignment) => assignment.status === "ACTIVE").length, batchCount: new Set(assignments.map((assignment) => assignment.batchId)).size, pendingReviews: pending.length, averageScore } } });
  } catch (error) { return next(error); }
};

const createAssignment = async (req, res, next) => {
  try {
    if (req.user.role === "STUDENT") return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Students cannot create assignments" } });
    const { batchId: requestedBatchId, courseSessionId, sessionOrder, title, description, dueDate, maxScore } = req.body || {};
    if (!title?.trim() || !dueDate || !Number.isInteger(Number(maxScore)) || Number(maxScore) <= 0) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Title, due date, and positive max score are required" } });
    const courseSession = courseSessionId && await CourseSession.findOne({ where: { id: courseSessionId, instituteId: req.user.instituteId } });
    let batchId = requestedBatchId;
    if (!batchId && req.user.role === "INSTRUCTOR" && courseSession) {
      const allocation = await FacultyAllocation.findOne({
        where: { instituteId: req.user.instituteId, facultyId: req.user.id, status: "ACTIVE" },
        include: [{ model: Batch, where: { courseId: courseSession.courseId }, required: true }],
      });
      batchId = allocation?.batchId;
    }
    if (!batchId) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "An allocated batch is required" } });
    const batch = await Batch.findOne({ where: { id: batchId, instituteId: req.user.instituteId }, include: [{ model: Course, attributes: ["id", "name"] }] });
    if (!batch) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Batch does not belong to this institute" } });
    if (courseSessionId && (!courseSession || courseSession.courseId !== batch.courseId)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Session does not belong to the selected batch course" } });
    if (req.user.role === "INSTRUCTOR" && !await FacultyAllocation.findOne({ where: { instituteId: req.user.instituteId, facultyId: req.user.id, batchId, status: "ACTIVE" } })) return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You can only assign work to your allocated batches" } });
    const assignment = await Assignment.create({ instituteId: req.user.instituteId, batchId, courseSessionId: courseSession?.id || null, sessionOrder: Number(sessionOrder) || 1, title: title.trim(), description: description?.trim() || null, dueDate, maxScore: Number(maxScore), createdBy: req.user.id });
    return res.status(201).json({ success: true, data: { assignment: { ...assignment.toJSON(), Batch: batch } } });
  } catch (error) { return next(error); }
};

const createSubmission = async (req, res, next) => {
  try {
    const { assignmentId, sourceType, repositoryUrl, fileName, submittedAt } = req.body || {};
    const linkedStudent = req.user.role === "STUDENT" ? await Student.findOne({ where: { userId: req.user.id, instituteId: req.user.instituteId } }) : null;
    const studentId = linkedStudent?.id || req.body?.studentId;
    if (!assignmentId || !studentId || !["GITHUB", "ZIP"].includes(sourceType) || !submittedAt) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Assignment, student, source type, and submitted date are required" } });
    if (sourceType === "GITHUB" && !repositoryUrl?.trim()) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Repository URL is required for GitHub submissions" } });
    if (sourceType === "ZIP" && !req.file && !fileName?.trim()) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "ZIP file is required" } });
    const assignment = await Assignment.findOne({ where: { id: assignmentId, instituteId: req.user.instituteId }, include: [{ model: CourseSession, required: false }] });
    const student = await Student.findOne({ where: { id: studentId, instituteId: req.user.instituteId, ...(assignment ? { batchId: assignment.batchId } : {}) } });
    if (!assignment || !student) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Assignment or student not found for this institute and batch" } });
    if (assignment.CourseSession && assignment.CourseSession.status !== "CURRENT") return res.status(403).json({ success: false, error: { code: "SESSION_LOCKED", message: "This course session is not currently open" } });
    const sequence = await Assignment.findAll({ where: { instituteId: req.user.instituteId, batchId: assignment.batchId, courseSessionId: assignment.courseSessionId }, order: [["sessionOrder", "ASC"], ["dueDate", "ASC"], ["created_at", "ASC"]] });
    const assignmentIndex = sequence.findIndex((item) => item.id === assignment.id);
    if (assignmentIndex > 0) {
      const previousSubmission = await AssignmentSubmission.findOne({ where: { assignmentId: sequence[assignmentIndex - 1].id, studentId: student.id } });
      if (previousSubmission?.reviewStatus !== "REVIEWED") return res.status(403).json({ success: false, error: { code: "ASSIGNMENT_LOCKED", message: "Teacher approval is required before submitting the next assignment" } });
    }
    const nextFileName = req.file?.originalname || fileName?.trim() || null;
    const nextFileUrl = req.file ? `/uploads/assignments/${req.file.filename}` : null;
    const [submission, created] = await AssignmentSubmission.findOrCreate({ where: { assignmentId, studentId }, defaults: { instituteId: req.user.instituteId, sourceType, repositoryUrl: repositoryUrl?.trim() || null, fileName: nextFileName, fileUrl: nextFileUrl, submittedAt } });
    if (!created) await submission.update({ sourceType, repositoryUrl: repositoryUrl?.trim() || null, fileName: nextFileName, fileUrl: nextFileUrl || submission.fileUrl, submittedAt, reviewStatus: "PENDING", score: null, feedback: null });
    return res.status(created ? 201 : 200).json({ success: true, data: { submission } });
  } catch (error) { return next(error); }
};

const review = async (req, res, next) => {
  try {
    if (!["INSTRUCTOR", "SUPER_ADMIN"].includes(req.user.role)) return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only the assignment teacher or super admin can approve submissions" } });
    const { score, reviewStatus, feedback } = req.body || {};
    if (!Number.isInteger(Number(score)) || Number(score) < 0 || !["PENDING", "REVIEWED", "REVISION_REQUESTED"].includes(reviewStatus)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Valid score and review status are required" } });
    const submission = await AssignmentSubmission.findOne({ where: { id: req.params.submissionId, instituteId: req.user.instituteId }, include: [{ model: Assignment, where: req.user.role === "INSTRUCTOR" ? { createdBy: req.user.id } : undefined, attributes: ["maxScore", "createdBy"] }] });
    if (!submission) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Submission not found" } });
    if (Number(score) > Number(submission.Assignment.maxScore)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Score cannot exceed the assignment max score" } });
    await submission.update({ score: Number(score), reviewStatus, feedback: feedback?.trim() || null, reviewedAt: new Date(), reviewedBy: req.user.id });
    return res.json({ success: true, data: { submission } });
  } catch (error) { return next(error); }
};

module.exports = { list, createAssignment, createSubmission, review };