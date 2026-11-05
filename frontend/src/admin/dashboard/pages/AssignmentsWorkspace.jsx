import { useEffect, useState } from 'react'
import { Check, Code2, FileArchive, GitBranch, Plus, Search, Upload, X } from 'lucide-react'
import { apiGet, apiPatch, apiPost, apiUpload } from '../../../api'

const today = () => new Date().toISOString().slice(0, 10)
const statusLabels = { PENDING: 'Needs review', REVIEWED: 'Reviewed', REVISION_REQUESTED: 'Revision requested' }
const sourceLabels = { GITHUB: 'GitHub repository', ZIP: 'ZIP upload' }

function AssignmentsWorkspace({ item }) {
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [batches, setBatches] = useState([])
  const [students, setStudents] = useState([])
  const [summary, setSummary] = useState({})
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [reviewing, setReviewing] = useState(null)
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    Promise.all([apiGet('/students/submissions'), apiGet('/academics/batches?limit=250'), apiGet('/students?limit=250')]).then(([assignmentResponse, batchResponse, studentResponse]) => {
      setAssignments(assignmentResponse.data.assignments || [])
      setSubmissions(assignmentResponse.data.submissions || [])
      setSummary(assignmentResponse.data.summary || {})
      setBatches(batchResponse.data.items || [])
      setStudents(studentResponse.data.items || [])
      setError('')
    }).catch((requestError) => setError(requestError.message))
  }

  useEffect(() => { load() }, [])

  const createAssignment = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget).entries())
      const response = await apiPost('/students/submissions/assignments', { ...data, maxScore: Number(data.maxScore) })
      setAssignments((current) => [response.data.assignment, ...current])
      setShowAssignmentForm(false)
      setError('')
      load()
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }

  const createSubmission = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData(event.currentTarget)
      const submittedDate = formData.get('submittedDate')
      const submittedTime = formData.get('submittedTime') || '12:00'
      formData.set('submittedAt', new Date(`${submittedDate}T${submittedTime}:00`).toISOString())
      formData.delete('submittedDate')
      formData.delete('submittedTime')
      await apiUpload('/students/submissions', formData)
      setShowSubmissionForm(false)
      setError('')
      load()
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }

  const reviewSubmission = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget).entries())
      await apiPatch(`/students/submissions/${reviewing.id}/review`, { score: Number(data.score), reviewStatus: data.reviewStatus, feedback: data.feedback })
      setReviewing(null)
      setError('')
      load()
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }

  const selectedAssignment = assignments.find((assignment) => assignment.id === reviewing?.assignmentId)
  const filteredSubmissions = submissions.filter((submission) => {
    const text = `${submission.Assignment?.title || ''} ${submission.Student?.name || ''} ${submission.Student?.Batch?.name || ''} ${submission.fileName || ''} ${submission.repositoryUrl || ''}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (!sourceFilter || submission.sourceType === sourceFilter) && (!statusFilter || submission.reviewStatus === statusFilter)
  })

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Create batch assignments, track submissions, and review student work with a consistent rubric.</p></div><div className="page-heading-actions"><button className="filter-button" type="button" onClick={() => setShowSubmissionForm(true)}><Upload size={15} /> Add submission</button><button className="primary-button" type="button" onClick={() => setShowAssignmentForm(true)}><Plus size={17} /> Create assignment</button></div></section>
    {error && <div className="module-success error-note">{error}</div>}
    {showAssignmentForm && <section className="panel module-form"><div className="module-form-heading"><div><p className="settings-kicker">Academic workspace</p><h2>Create assignment</h2><p>Assign a clear task and deadline to an active batch.</p></div><button className="icon-button" type="button" onClick={() => setShowAssignmentForm(false)} aria-label="Close assignment form"><X size={17} /></button></div><form onSubmit={createAssignment}><div className="module-form-fields"><label>Assignment title<input name="title" placeholder="REST API with Node.js" required /></label><label>Batch<select name="batchId" defaultValue="" required><option value="" disabled>Select active batch</option>{batches.filter((batch) => batch.status === 'ACTIVE').map((batch) => <option key={batch.id} value={batch.id}>{batch.name} · {batch.Course?.name || 'Course'}</option>)}</select></label><label>Due date<input name="dueDate" type="date" min={today()} required /></label><label>Maximum score<input name="maxScore" type="number" min="1" defaultValue="100" required /></label><label className="module-form-wide">Instructions<input name="description" placeholder="Build and document the required API endpoints." /></label></div><div className="module-form-actions"><button className="ghost-button" type="button" onClick={() => setShowAssignmentForm(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}><Check size={15} /> {saving ? 'Saving...' : 'Save assignment'}</button></div></form></section>}
    {showSubmissionForm && <section className="panel module-form"><div className="module-form-heading"><div><p className="settings-kicker">Submission desk</p><h2>Record student submission</h2><p>Log GitHub or upload a ZIP against the correct batch assignment.</p></div><button className="icon-button" type="button" onClick={() => setShowSubmissionForm(false)} aria-label="Close submission form"><X size={17} /></button></div><form onSubmit={createSubmission} encType="multipart/form-data"><div className="module-form-fields"><label>Assignment<select name="assignmentId" defaultValue="" required><option value="" disabled>Select assignment</option>{assignments.filter((assignment) => assignment.status === 'ACTIVE').map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.title} · {assignment.Batch?.name || 'Batch'}</option>)}</select></label><label>Student<select name="studentId" defaultValue="" required><option value="" disabled>Select student</option>{students.filter((student) => student.status === 'ACTIVE').map((student) => <option key={student.id} value={student.id}>{student.name} · {student.Batch?.name || 'Batch'}</option>)}</select></label><label>Source<select name="sourceType" defaultValue="GITHUB"><option value="GITHUB">GitHub repository</option><option value="ZIP">ZIP upload</option></select></label><label>Submitted date<input name="submittedDate" type="date" defaultValue={today()} required /></label><label>Submitted time<input name="submittedTime" type="time" defaultValue="12:00" required /></label><label>Repository URL<input name="repositoryUrl" type="url" placeholder="https://github.com/student/project" /></label><label className="module-form-wide">ZIP file<input name="submissionFile" type="file" accept=".zip,application/zip" /></label></div><div className="module-form-actions"><button className="ghost-button" type="button" onClick={() => setShowSubmissionForm(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}><Check size={15} /> {saving ? 'Saving...' : 'Save submission'}</button></div></form></section>}
    {reviewing && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setReviewing(null)}><section className="modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="settings-kicker">Review submission</p><h2>{reviewing.Student?.name || 'Student submission'}</h2><p>{reviewing.Assignment?.title || selectedAssignment?.title}</p></div><button className="icon-button" type="button" onClick={() => setReviewing(null)} aria-label="Close review"><X size={17} /></button></div><form onSubmit={reviewSubmission}><label>Score (out of {reviewing.Assignment?.maxScore || selectedAssignment?.maxScore || 100})<input name="score" type="number" min="0" max={reviewing.Assignment?.maxScore || selectedAssignment?.maxScore || 100} defaultValue={reviewing.score ?? ''} required /></label><label>Review status<select name="reviewStatus" defaultValue={reviewing.reviewStatus}><option value="PENDING">Needs review</option><option value="REVIEWED">Reviewed</option><option value="REVISION_REQUESTED">Revision requested</option></select></label><label>Feedback<textarea name="feedback" defaultValue={reviewing.feedback || ''} placeholder="Share actionable feedback" /></label><div className="modal-actions"><button className="ghost-button" type="button" onClick={() => setReviewing(null)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>Save review</button></div></form></section></div>}
    <section className="assignment-summary"><div><span className="assignment-summary-icon"><FileArchive size={17} /></span><p>Active assignments</p><strong>{summary.activeAssignments || 0}</strong><small>Across {summary.batchCount || 0} batches</small></div><div><span className="assignment-summary-icon gold"><Upload size={17} /></span><p>Pending reviews</p><strong>{summary.pendingReviews || 0}</strong><small>Needs instructor action</small></div><div><span className="assignment-summary-icon green"><Code2 size={17} /></span><p>Average code score</p><strong>{summary.averageScore || '—'}</strong><small>Across reviewed work</small></div></section>
    <section className="assignment-tools"><div><strong>Submission review queue</strong><span>{assignments.length} assignments · {submissions.length} submissions</span></div><div><button className="filter-button" type="button" onClick={load}>Refresh records</button></div></section>
    <section className="panel assignment-table-panel"><div className="panel-heading table-heading"><div><h2>Assignment register</h2><p>Assignments fetched from the institute database.</p></div><FileArchive size={18} /></div><div className="table-scroll"><table className="assignment-table"><thead><tr><th>Assignment</th><th>Batch</th><th>Due date</th><th>Max score</th><th>Submissions</th><th>Status</th></tr></thead><tbody>{assignments.map((assignment) => <tr key={assignment.id}><td><strong>{assignment.title}</strong><small>{assignment.description || 'No instructions added'}</small></td><td>{assignment.Batch?.name || 'Batch unavailable'}<small>{assignment.Batch?.Course?.name || ''}</small></td><td>{assignment.dueDate}</td><td>{assignment.maxScore}</td><td>{submissions.filter((submission) => submission.assignmentId === assignment.id).length}</td><td><span className={`assignment-status ${assignment.status === 'ACTIVE' ? 'green' : 'coral'}`}>{assignment.status === 'ACTIVE' ? 'Active' : 'Closed'}</span></td></tr>)}</tbody></table>{!assignments.length && <div className="empty-state">No assignments created yet.</div>}</div></section>
    <section className="panel assignment-table-panel"><div className="panel-heading table-heading"><div><h2>Submission review queue</h2><p>Live student work from the institute database.</p></div><GitBranch size={18} /></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search assignment, student, or batch" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className="filter-button" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="">All sources</option><option value="GITHUB">GitHub repository</option><option value="ZIP">ZIP upload</option></select><select className="filter-button" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="PENDING">Needs review</option><option value="REVIEWED">Reviewed</option><option value="REVISION_REQUESTED">Revision requested</option></select></div><div className="table-scroll"><table className="assignment-table"><thead><tr><th>Assignment</th><th>Student / batch</th><th>Source</th><th>Submitted</th><th>Score</th><th>Status</th><th /></tr></thead><tbody>{filteredSubmissions.map((submission) => <tr key={submission.id}><td><div className="assignment-name"><span className={`assignment-file ${submission.sourceType === 'ZIP' ? 'zip' : 'repo'}`}>{submission.sourceType === 'ZIP' ? <FileArchive size={15} /> : <GitBranch size={15} />}</span><strong>{submission.Assignment?.title || 'Assignment'}</strong></div></td><td><div className="assignment-student"><strong>{submission.Student?.name || 'Student'}</strong><small>{submission.Student?.Batch?.name || 'Batch unavailable'}</small></div></td><td>{sourceLabels[submission.sourceType]}<small>{submission.fileName || submission.repositoryUrl || ''}</small></td><td>{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</td><td><strong>{submission.score == null ? `— / ${submission.Assignment?.maxScore || 100}` : `${submission.score} / ${submission.Assignment?.maxScore || 100}`}</strong></td><td><span className={`assignment-status ${submission.reviewStatus === 'REVIEWED' ? 'green' : submission.reviewStatus === 'REVISION_REQUESTED' ? 'coral' : 'gold'}`}>{statusLabels[submission.reviewStatus]}</span></td><td><button className="ghost-button" type="button" onClick={() => setReviewing(submission)}>Review</button></td></tr>)}</tbody></table>{!filteredSubmissions.length && <div className="empty-state">No submissions found. Create an assignment or record a submission to begin.</div>}</div></section>
  </>
}

export default AssignmentsWorkspace
