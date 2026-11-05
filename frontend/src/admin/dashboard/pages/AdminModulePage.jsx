import { useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowUpRight, Award, BadgeCheck, Building2, CalendarDays, Check, CheckCircle2, Clock3, Code2, CreditCard, FileArchive, GitBranch, KeyRound, Mail, MapPin, Monitor, Phone, Plus, Receipt, Search, ScrollText, ShieldCheck, Star, TrendingUp, UserCog, Users, UserPlus, UserCheck, UserX, Upload, Wallet, Wifi, Wrench } from 'lucide-react'
import { apiAssetUrl, apiGet, apiModulePath, apiPatch, apiPost, apiUpdateUpload, apiUpload } from '../../../api'
import AccessControl from './AccessControl'
import CourseWorkspace from './CourseWorkspace'
import ProgramWorkspace from './ProgramWorkspace'
import BatchesWorkspace from './BatchesWorkspace'
import AdmissionsWorkspace from './AdmissionsWorkspace'
import TeamApplicationsWorkspace from './TeamApplicationsWorkspace'
import ContactMessagesWorkspace from './ContactMessagesWorkspace'
import FinanceDynamic from './FinanceDynamic'
import DailyExpenses from './DailyExpenses'
import HRWorkspace from './HRWorkspace'
import AssignmentsWorkspace from './AssignmentsWorkspace'

const localDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const moduleData = {
  courses: ['Web Development Bootcamp', 'Data Science & Python', 'UI/UX Product Design'],
  batches: ['MERN-06 Morning', 'Python-04 Evening', 'Design-03 Weekend'],
  labs: ['Lab A - 24 terminals', 'Lab B - 18 terminals', 'Mac Studio - 12 terminals'],
  certifications: ['Full Stack Certificate', 'Python Associate Badge', 'UI/UX Foundation'],
  students: ['Aarav Sharma', 'Maya Patel', 'Noah Williams'],
  teachers: ['Sarah Ahmed', 'Usman Khan', 'Hina Raza'],
  fees: ['September fee cycle', 'MERN-06 invoices', 'Scholarship review queue'],
  staff: ['Lab operations team', 'Front desk team', 'Student support team'],
  reports: ['Monthly performance report', 'Collection analysis', 'Retention review'],
  settings: ['Institute profile', 'Role permission matrix', 'System integrations'],
}

function getModuleRecords(path) {
  const group = path.split('/')[1]
  const key = group === 'academics' ? path.includes('batches') ? 'batches' : path.includes('labs') ? 'labs' : path.includes('certifications') ? 'certifications' : 'courses' : group
  return (moduleData[key] || moduleData.settings).map((name, index) => ({ name, owner: ['Admin team', 'Academic office', 'Finance desk'][index], status: index === 1 ? 'In review' : 'Active', updated: `${index + 1} hour${index ? 's' : ''} ago` }))
}

function BatchSchedule({ item }) {
  const [sessions, setSessions] = useState([])
  const [batches, setBatches] = useState([])
  const [faculty, setFaculty] = useState([])
  const [weekStart, setWeekStart] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    return localDateKey(date)
  })
  const [batchFilter, setBatchFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    const scheduleQuery = `/academics/batches/schedule?weekStart=${weekStart}${batchFilter ? `&batchId=${batchFilter}` : ''}`
    Promise.all([apiGet(scheduleQuery), apiGet('/academics/batches?limit=250'), apiGet('/faculty')]).then(([scheduleResponse, batchResponse, facultyResponse]) => {
      setSessions(scheduleResponse.data.items || [])
      setBatches(batchResponse.data.items || [])
      setFaculty(facultyResponse.data.faculty || [])
      setError('')
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [weekStart, batchFilter])

  const moveWeek = (offset) => {
    const date = new Date(`${weekStart}T12:00:00`)
    date.setDate(date.getDate() + offset * 7)
    setWeekStart(localDateKey(date))
  }

  const createSession = async (event) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      await apiPost('/academics/batches/schedule', values)
      setShowForm(false)
      load()
    } catch (requestError) { setError(requestError.message) }
  }

  const dateKey = (date) => localDateKey(date)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${weekStart}T12:00:00`)
    date.setDate(date.getDate() + index)
    return { key: dateKey(date), day: date.toLocaleDateString('en-US', { weekday: 'long' }), date: date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) }
  })
  const roomsInUse = new Set(sessions.map((session) => session.room).filter(Boolean)).size
  const activeLearners = batches.filter((batch) => batch.status === 'ACTIVE').reduce((total, batch) => total + Number(batch.enrollmentCount || 0), 0)
  const toneFor = (index) => ['navy', 'gold', 'green', 'coral'][index % 4]

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Coordinate live sessions, rooms, instructors, and batch capacity.</p></div><button className="primary-button" onClick={() => setShowForm(true)}><Plus size={17} /> Add session</button></section>
    {error && <div className="module-success error-note">{error}</div>}
    {showForm && <section className="panel module-form"><div className="module-form-heading"><div><p className="settings-kicker">Academic schedule</p><h2>Add batch session</h2><p>Save a session to the institute timetable.</p></div><button className="icon-button" type="button" onClick={() => setShowForm(false)} aria-label="Close form">X</button></div><form onSubmit={createSession}><div className="module-form-fields"><label>Batch<select name="batchId" required><option value="">Select active batch</option>{batches.filter((batch) => batch.status === 'ACTIVE').map((batch) => <option key={batch.id} value={batch.id}>{batch.name} · {batch.Course?.name || 'Course'}</option>)}</select></label><label>Session title<input name="title" placeholder="Frontend Fundamentals" required /></label><label>Instructor<select name="instructorId"><option value="">Select instructor</option>{faculty.filter((person) => person.status === 'ACTIVE').map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label>Date<input name="date" type="date" defaultValue={weekStart} required /></label><label>Start time<input name="startTime" type="time" defaultValue="09:00" required /></label><label>End time<input name="endTime" type="time" defaultValue="11:00" required /></label><label>Room<input name="room" placeholder="Lab A or Room 204" /></label></div><div className="module-form-actions"><button type="button" className="ghost-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={15} /> Save session</button></div></form></section>}
    <section className="schedule-summary"><div><span className="schedule-summary-icon"><Clock3 size={17} /></span><p>Sessions this week</p><strong>{sessions.length}</strong><small>{loading ? 'Loading live schedule' : 'Live database records'}</small></div><div><span className="schedule-summary-icon gold"><Users size={17} /></span><p>Active learners</p><strong>{activeLearners}</strong><small>Across active batches</small></div><div><span className="schedule-summary-icon green"><MapPin size={17} /></span><p>Rooms in use</p><strong>{roomsInUse}</strong><small>In this week view</small></div></section>
    <section className="schedule-toolbar"><div><strong>Week of {new Date(`${weekStart}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong><span>{sessions.length} scheduled session{sessions.length === 1 ? '' : 's'} across active batches</span></div><div><button className="filter-button" type="button" onClick={() => moveWeek(-1)}>Previous week</button><button className="filter-button" type="button" onClick={() => { const date = new Date(); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); setWeekStart(localDateKey(date)) }}>This week</button><button className="filter-button" type="button" onClick={() => moveWeek(1)}>Next week</button><select className="filter-button" value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)}><option value="">All batches</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></div></section>
    <section className="schedule-grid">{days.map((day) => { const daySessions = sessions.filter((session) => session.date === day.key); return <article className="schedule-day" key={day.key}><header><div><strong>{day.day}</strong><span>{day.date}</span></div><span className="schedule-day-count">{daySessions.length} sessions</span></header><div className="schedule-slots">{daySessions.map((session, index) => <div className={`schedule-slot ${toneFor(index)}`} key={session.id}><span className="schedule-time"><Clock3 size={12} />{session.startTime} - {session.endTime}</span><h3>{session.title}</h3><p>{session.Batch?.name || 'Batch unavailable'}</p><div className="schedule-slot-meta"><span><Users size={12} />{session.Instructor ? `${session.Instructor.firstName} ${session.Instructor.lastName}` : 'Instructor pending'}</span><span><MapPin size={12} />{session.room || 'Room pending'}</span></div></div>)}</div>{!daySessions.length && <p className="schedule-empty">No sessions scheduled</p>}</article> })}</section>
  </>
}

function LabAllocation({ item }) {
  const [rooms, setRooms] = useState([])
  const [summary, setSummary] = useState({})
  const [statusFilter, setStatusFilter] = useState('')
  const [networkFilter, setNetworkFilter] = useState('')
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (networkFilter) params.set('networkStatus', networkFilter)
    if (query) params.set('search', query)
    apiGet(`/academics/labs?${params}`).then(({ data }) => { setRooms(data.items || []); setSummary(data.summary || {}); setError('') }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter, networkFilter, query])

  const createRoom = async (event) => {
    event.preventDefault()
    try {
      await apiPost('/academics/labs', Object.fromEntries(new FormData(event.currentTarget).entries()))
      setShowForm(false)
      load()
    } catch (requestError) { setError(requestError.message) }
  }

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Monitor live rooms, terminal capacity, network health, and allocations.</p></div><button className="primary-button" onClick={() => setShowForm(true)}><Plus size={17} /> Add room</button></section>
    {error && <div className="module-success error-note">{error}</div>}
    {showForm && <section className="panel module-form"><div className="module-form-heading"><div><p className="settings-kicker">Facilities workspace</p><h2>Add room or lab</h2><p>Save room capacity and network status.</p></div><button className="icon-button" type="button" onClick={() => setShowForm(false)} aria-label="Close form">X</button></div><form onSubmit={createRoom}><div className="module-form-fields"><label>Name<input name="name" placeholder="Lab A" required /></label><label>Type<input name="type" placeholder="Advanced development lab" required /></label><label>Total capacity<input name="capacity" type="number" min="0" required /></label><label>Used capacity<input name="usedCapacity" type="number" min="0" defaultValue="0" required /></label><label>Network status<select name="networkStatus" defaultValue="ONLINE"><option value="ONLINE">Online</option><option value="MAINTENANCE">Maintenance</option><option value="OFFLINE">Offline</option></select></label><label>Room status<select name="status" defaultValue="AVAILABLE"><option value="AVAILABLE">Available</option><option value="IN_USE">In use</option><option value="MAINTENANCE">Maintenance</option></select></label></div><div className="module-form-actions"><button type="button" className="ghost-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={15} /> Save room</button></div></form></section>}
    <section className="lab-summary"><div><span className="lab-summary-icon"><Monitor size={17} /></span><p>Total rooms</p><strong>{summary.totalRooms || 0}</strong><small>Live institute rooms</small></div><div><span className="lab-summary-icon green"><CheckCircle2 size={17} /></span><p>Available terminals</p><strong>{summary.availableCapacity || 0}</strong><small>Of {summary.totalCapacity || 0} total capacity</small></div><div><span className="lab-summary-icon gold"><Wifi size={17} /></span><p>Network online</p><strong>{summary.networkOnline || 0}</strong><small>Of {summary.totalRooms || 0} rooms connected</small></div></section>
    <div className="lab-list-heading"><div><h2>Rooms &amp; labs</h2><p>{loading ? 'Loading live rooms...' : 'Live allocation and equipment status'}</p></div><div><select className="filter-button" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All rooms</option><option value="AVAILABLE">Available</option><option value="IN_USE">In use</option><option value="MAINTENANCE">Maintenance</option></select><select className="filter-button" value={networkFilter} onChange={(event) => setNetworkFilter(event.target.value)}><option value="">All status</option><option value="ONLINE">Online</option><option value="MAINTENANCE">Maintenance</option><option value="OFFLINE">Offline</option></select></div></div>
    <section className="lab-grid">{rooms.map((room, index) => { const networkLabel = room.networkStatus[0] + room.networkStatus.slice(1).toLowerCase(); const allocation = room.allocation?.Batch?.name || 'Available'; const tone = ['navy', 'green', 'gold', 'coral'][index % 4]; return <article className={`lab-card ${tone}`} key={room.id}><div className="lab-card-top"><span className="lab-icon"><Monitor size={19} /></span><span className={`lab-status ${room.networkStatus === 'ONLINE' ? 'online' : 'maintenance'}`}><i />{networkLabel}</span></div><h2>{room.name}</h2><p>{room.type}</p><div className="lab-card-divider" /><div className="lab-card-detail"><span><Users size={14} />Allocation<strong>{allocation}</strong></span><span><Monitor size={14} />Capacity<strong>{room.usedCapacity} / {room.capacity}</strong></span></div><div className="lab-capacity"><div><span>Terminal usage</span><strong>{room.usagePercent}%</strong></div><i><b style={{ width: `${room.usagePercent}%` }} /></i></div><button className="lab-manage" type="button">Manage allocation <ArrowUpRight size={14} /></button></article> })}</section>{!loading && !rooms.length && <div className="empty-state">No rooms match these filters.</div>}
  </>
}

function Certifications({ item }) {
  const [certifications, setCertifications] = useState([])
  const [summary, setSummary] = useState({})
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    apiGet(`/academics/certifications?limit=250${statusFilter ? `&status=${statusFilter}` : ''}`).then(({ data }) => { setCertifications(data.items || []); setSummary(data.summary || {}); setError('') }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  const createExam = async (event) => {
    event.preventDefault()
    try { await apiPost('/academics/certifications', Object.fromEntries(new FormData(event.currentTarget).entries())); setShowForm(false); load() } catch (requestError) { setError(requestError.message) }
  }

  const statusLabel = (status) => status === 'REGISTRATION_OPEN' ? 'Registration open' : status[0] + status.slice(1).toLowerCase()
  const toneFor = (index) => ['navy', 'gold', 'green', 'coral'][index % 4]
  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Manage live exams, issue certificates, and verify student credentials.</p></div><button className="primary-button" onClick={() => setShowForm(true)}><Plus size={17} /> Create exam</button></section>
    {error && <div className="module-success error-note">{error}</div>}
    {showForm && <section className="panel module-form"><div className="module-form-heading"><div><p className="settings-kicker">Credential centre</p><h2>Create exam program</h2><p>Save a certification and its candidate details.</p></div><button className="icon-button" type="button" onClick={() => setShowForm(false)} aria-label="Close form">X</button></div><form onSubmit={createExam}><div className="module-form-fields"><label>Program title<input name="title" placeholder="Full Stack Web Development" required /></label><label>Program code<input name="code" placeholder="TP-FS-2026" required /></label><label>Exam date<input name="examDate" type="date" /></label><label>Candidate count<input name="candidateCount" type="number" min="0" defaultValue="0" /></label><label>Status<select name="status" defaultValue="SCHEDULED"><option value="SCHEDULED">Scheduled</option><option value="REGISTRATION_OPEN">Registration open</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></label></div><div className="module-form-actions"><button type="button" className="ghost-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={15} /> Save exam</button></div></form></section>}
    <section className="cert-summary"><div><span className="cert-summary-icon"><CalendarDays size={17} /></span><p>Upcoming exams</p><strong>{summary.upcoming || 0}</strong><small>Live scheduled programs</small></div><div><span className="cert-summary-icon gold"><Users size={17} /></span><p>Registered candidates</p><strong>{summary.candidates || 0}</strong><small>Across certification programs</small></div><div><span className="cert-summary-icon green"><BadgeCheck size={17} /></span><p>Certificates issued</p><strong>{summary.issued || 0}</strong><small>QR verification enabled</small></div></section>
    <section className="cert-banner"><div className="cert-banner-icon"><BadgeCheck size={24} /></div><div><p>Official credential centre</p><h2>Trusted certificates for every learner</h2><span>Every program record keeps its exam and verification status live.</span></div><button className="filter-button" type="button" onClick={load}>Refresh records <ArrowUpRight size={14} /></button></section>
    <div className="cert-list-heading"><div><h2>Exams &amp; certificate programs</h2><p>{loading ? 'Loading live programs...' : `${certifications.length} live programs`}</p></div><select className="filter-button" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All programs</option><option value="SCHEDULED">Scheduled</option><option value="REGISTRATION_OPEN">Registration open</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></div>
    <section className="cert-grid">{certifications.map((cert, index) => <article className={`cert-card ${toneFor(index)}`} key={cert.id}><div className="cert-card-top"><span className="cert-program-icon"><BadgeCheck size={19} /></span><span className={`cert-status ${toneFor(index)}`}>{statusLabel(cert.status)}</span></div><p className="cert-code">{cert.code}</p><h2>{cert.title}</h2><div className="cert-details"><span><Users size={14} />{cert.candidateCount} candidates</span><span><CalendarDays size={14} />{cert.examDate || 'Date not set'}</span></div><div className="cert-card-footer"><span><ShieldCheck size={13} /> {cert.issuedCount} issued · QR enabled</span><button type="button" aria-label={`Refresh ${cert.title}`} onClick={load}>Refresh <ArrowUpRight size={14} /></button></div></article>)}</section>{!loading && !certifications.length && <div className="empty-state">No certification programs found.</div>}
  </>
}

const inquiries = [
  { name: 'Hamza Ali', course: 'Web Development Bootcamp', source: 'Website inquiry', date: 'Today, 10:30 AM', stage: 'New inquiry', tone: 'navy' },
  { name: 'Ayesha Khan', course: 'Data Science & Python', source: 'Referral', date: 'Today, 09:15 AM', stage: 'Counselling scheduled', tone: 'gold' },
  { name: 'Bilal Ahmed', course: 'UI/UX Product Design', source: 'Instagram campaign', date: 'Yesterday', stage: 'Registration pending', tone: 'green' },
  { name: 'Zainab Raza', course: 'Web Development Bootcamp', source: 'Walk-in inquiry', date: '08 Sep 2026', stage: 'Offer sent', tone: 'coral' },
]

function Admissions({ item }) {
  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Track prospective students from first inquiry to confirmed registration.</p></div><button className="primary-button"><UserPlus size={17} /> Add inquiry</button></section>
    <section className="admission-summary"><div><span className="admission-summary-icon"><UserPlus size={17} /></span><p>New inquiries</p><strong>24</strong><small>+18% this month</small></div><div><span className="admission-summary-icon gold"><CalendarDays size={17} /></span><p>Counselling booked</p><strong>12</strong><small>Next session today</small></div><div><span className="admission-summary-icon green"><CheckCircle2 size={17} /></span><p>Converted this month</p><strong>08</strong><small>33.3% conversion rate</small></div></section>
    <section className="admission-pipeline"><div className="admission-pipeline-heading"><div><h2>Inquiry pipeline</h2><p>Current admissions funnel</p></div><button className="filter-button">September 2026</button></div><div className="pipeline-steps"><span className="complete"><b>24</b>New inquiries</span><i /><span className="complete"><b>16</b>Contacted</span><i /><span className="current"><b>12</b>Counselling</span><i /><span><b>08</b>Registered</span></div></section>
    <section className="panel inquiry-table-panel"><div className="admission-list-heading"><div><h2>Recent inquiries</h2><p>Follow up with prospective students</p></div><button className="filter-button">All stages</button></div><div className="table-scroll"><table className="inquiry-table"><thead><tr><th>Applicant</th><th>Course</th><th>Source</th><th>Stage</th><th>Follow-up</th><th>Action</th></tr></thead><tbody>{inquiries.map((inquiry) => <tr key={inquiry.name}><td><div className="inquiry-applicant"><span className="inquiry-avatar">{inquiry.name.split(' ').map((word) => word[0]).join('')}</span><strong>{inquiry.name}</strong></div></td><td>{inquiry.course}</td><td><span className="inquiry-source"><Mail size={12} />{inquiry.source}</span></td><td><span className={`inquiry-stage ${inquiry.tone}`}>{inquiry.stage}</span></td><td><span className="inquiry-date"><CalendarDays size={12} />{inquiry.date}</span></td><td><button className="inquiry-open">Open <ArrowUpRight size={13} /></button></td></tr>)}</tbody></table></div></section>
  </>
}

function Attendance({ item }) {
  const [rows, setRows] = useState([])
  const [batches, setBatches] = useState([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [batchId, setBatchId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [query, setQuery] = useState('')
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    const queryParams = new URLSearchParams({ date })
    if (batchId) queryParams.set('batchId', batchId)
    apiGet(`/students/attendance?${queryParams}`).then(({ data }) => {
      setRows(data.items || [])
      setCounts(data.counts || {})
      setError('')
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }

  useEffect(() => {
    apiGet('/academics/batches?limit=250').then(({ data }) => setBatches(data.items || [])).catch(() => setBatches([]))
  }, [])

  useEffect(() => { load() }, [date, batchId])

  const saveStatus = async (studentId, status) => {
    setSavingId(studentId)
    try {
      await apiPost('/students/attendance', { studentId, date, status, method: 'MANUAL' })
      load()
    } catch (requestError) { setError(requestError.message) } finally { setSavingId('') }
  }

  const filteredRows = rows.filter((student) => {
    const attendanceStatus = student.attendance?.status || 'ABSENT'
    return `${student.name} ${student.studentCode} ${student.Batch?.name || ''}`.toLowerCase().includes(query.toLowerCase()) && (!statusFilter || attendanceStatus === statusFilter)
  })
  const presentCount = Number(counts.PRESENT || 0) + Number(counts.LATE || 0)
  const absentCount = Number(counts.ABSENT || 0)

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Record daily attendance for active students by date and batch.</p></div><button className="primary-button" type="button" onClick={load}><CalendarDays size={17} /> Refresh attendance</button></section>
    {error && <div className="module-success error-note">{error}</div>}
    <section className="attendance-summary"><div><span className="attendance-summary-icon green"><UserCheck size={17} /></span><p>Present today</p><strong>{presentCount}</strong><small>Present and late check-ins</small></div><div><span className="attendance-summary-icon gold"><Clock3 size={17} /></span><p>Late arrivals</p><strong>{counts.LATE || 0}</strong><small>Needs session review</small></div><div><span className="attendance-summary-icon red"><UserX size={17} /></span><p>Absence alerts</p><strong>{absentCount}</strong><small>Not marked present</small></div></section>
    <section className="attendance-status"><div className="attendance-status-icon"><Wifi size={19} /></div><div><strong>Live attendance records</strong><p>{date} · Changes are saved to the institute database.</p></div><span><i />Connected</span></section>
    <section className="panel attendance-table-panel"><div className="panel-heading table-heading"><div><h2>Daily attendance</h2><p>{loading ? 'Loading active students...' : `${filteredRows.length} of ${rows.length} active students`}</p></div><div><label className="filter-button"><CalendarDays size={13} /><input className="attendance-date-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><select className="filter-button" value={batchId} onChange={(event) => setBatchId(event.target.value)}><option value="">All batches</option>{batches.filter((batch) => batch.status === 'ACTIVE').map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></div></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search student or batch" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className="filter-button" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="PRESENT">Present</option><option value="LATE">Late</option><option value="ABSENT">Absent</option><option value="EXCUSED">Excused</option></select></div><div className="table-scroll"><table className="attendance-table"><thead><tr><th>Student</th><th>Batch</th><th>Check-in time</th><th>Method</th><th>Status</th></tr></thead><tbody>{filteredRows.map((student) => { const attendanceStatus = student.attendance?.status || 'ABSENT'; const statusLabel = attendanceStatus[0] + attendanceStatus.slice(1).toLowerCase(); return <tr key={student.id}><td><div className="student-cell"><span className="student-avatar violet">{student.name.split(' ').map((word) => word[0]).join('')}</span><div><strong>{student.name}</strong><small>{student.studentCode}</small></div></div></td><td>{student.Batch?.name || 'No batch'}</td><td>{student.attendance?.createdAt ? new Date(student.attendance.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td><td>{student.attendance?.method === 'BIOMETRIC' ? 'Biometric' : student.attendance ? 'Manual check-in' : 'No check-in'}</td><td><select className={`attendance-status-select ${attendanceStatus.toLowerCase()}`} value={attendanceStatus} disabled={savingId === student.id} onChange={(event) => saveStatus(student.id, event.target.value)} aria-label={`Attendance status for ${student.name}`}><option value="PRESENT">Present</option><option value="LATE">Late</option><option value="ABSENT">Absent</option><option value="EXCUSED">Excused</option></select><span className="attendance-status-pill-label">{statusLabel}</span></td></tr> })}</tbody></table>{!loading && !filteredRows.length && <div className="empty-state">No active students match these filters.</div>}</div></section>
  </>
}

const assignmentRows = [
  { title: 'REST API with Node.js', student: 'Aarav Sharma', batch: 'MERN-06 Morning', submitted: 'Today, 09:18 AM', score: '92 / 100', status: 'Reviewed', tone: 'green', type: 'GitHub repository' },
  { title: 'Python Data Analysis', student: 'Maya Patel', batch: 'Python-04 Evening', submitted: 'Today, 08:42 AM', score: 'Pending', status: 'Needs review', tone: 'gold', type: 'ZIP upload' },
  { title: 'Mobile App Wireframes', student: 'Noah Williams', batch: 'Design-03 Weekend', submitted: 'Yesterday', score: '86 / 100', status: 'Reviewed', tone: 'green', type: 'GitHub repository' },
  { title: 'Database Schema Design', student: 'Sofia Garcia', batch: 'MERN-06 Morning', submitted: '07 Sep 2026', score: '68 / 100', status: 'Revision requested', tone: 'coral', type: 'ZIP upload' },
]

function Assignments({ item }) {
  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Review repositories, ZIP uploads, and code scoring rubrics.</p></div><button className="primary-button"><Plus size={17} /> Create assignment</button></section>
    <section className="assignment-summary"><div><span className="assignment-summary-icon"><FileArchive size={17} /></span><p>Active assignments</p><strong>18</strong><small>Across 6 batches</small></div><div><span className="assignment-summary-icon gold"><Upload size={17} /></span><p>Pending reviews</p><strong>14</strong><small>Needs instructor action</small></div><div><span className="assignment-summary-icon green"><Code2 size={17} /></span><p>Average code score</p><strong>82.4</strong><small>+4.8 points this term</small></div></section>
    <section className="assignment-tools"><div><strong>Submission review queue</strong><span>Updated today at 09:20 AM</span></div><div><button className="filter-button"><GitBranch size={13} /> All sources</button><button className="filter-button">All batches</button></div></section>
    <section className="panel assignment-table-panel"><div className="panel-heading table-heading"><div><h2>Recent submissions</h2><p>Evaluate student work using the institute scoring rubric.</p></div><button className="filter-button">Rubric settings <ArrowUpRight size={13} /></button></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search assignment or student" /></div><button className="filter-button">All statuses</button></div><div className="table-scroll"><table className="assignment-table"><thead><tr><th>Assignment</th><th>Student / batch</th><th>Source</th><th>Submitted</th><th>Score</th><th>Status</th><th /></tr></thead><tbody>{assignmentRows.map((assignment) => <tr key={assignment.title}><td><div className="assignment-name"><span className={`assignment-file ${assignment.type === 'ZIP upload' ? 'zip' : 'repo'}`}>{assignment.type === 'ZIP upload' ? <FileArchive size={15} /> : <GitBranch size={15} />}</span><strong>{assignment.title}</strong></div></td><td><div className="assignment-student"><strong>{assignment.student}</strong><small>{assignment.batch}</small></div></td><td>{assignment.type}</td><td>{assignment.submitted}</td><td><strong className={assignment.score === 'Pending' ? 'score-pending' : ''}>{assignment.score}</strong></td><td><span className={`assignment-status ${assignment.tone}`}>{assignment.status}</span></td><td><button className="row-menu" aria-label={`Review ${assignment.title}`}><ArrowUpRight size={16} /></button></td></tr>)}</tbody></table></div></section>
  </>
}

const gradeRows = [
  { name: 'Aarav Sharma', id: 'STU-1024', batch: 'MERN-06 Morning', lab: '92 / 100', exam: '88 / 100', gpa: '3.8', grade: 'A', tone: 'green' },
  { name: 'Maya Patel', id: 'STU-1023', batch: 'Python-04 Evening', lab: '86 / 100', exam: '91 / 100', gpa: '3.7', grade: 'A-', tone: 'navy' },
  { name: 'Noah Williams', id: 'STU-1022', batch: 'MERN-06 Morning', lab: '78 / 100', exam: '84 / 100', gpa: '3.3', grade: 'B+', tone: 'gold' },
  { name: 'Sofia Garcia', id: 'STU-1021', batch: 'Design-03 Weekend', lab: '69 / 100', exam: '74 / 100', gpa: '2.9', grade: 'B', tone: 'coral' },
]

function Gradebook({ item }) {
  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Manage lab scores, exams, GPA, and downloadable grade cards.</p></div><button className="primary-button"><Award size={17} /> Create grade card</button></section>
    <section className="grade-summary"><div><span className="grade-summary-icon"><TrendingUp size={17} /></span><p>Average GPA</p><strong>3.42</strong><small>+0.18 this term</small></div><div><span className="grade-summary-icon gold"><Code2 size={17} /></span><p>Lab average</p><strong>81.6%</strong><small>Across 6 batches</small></div><div><span className="grade-summary-icon green"><Award size={17} /></span><p>Grade cards ready</p><strong>124</strong><small>98% completion</small></div></section>
    <section className="grade-overview"><div><div className="grade-overview-heading"><div><h2>Academic performance</h2><p>Current term grade distribution</p></div><button className="filter-button">Term 1, 2026</button></div><div className="grade-bars"><span><b style={{ height: '88%' }} /><small>A</small><strong>32%</strong></span><span><b style={{ height: '72%' }} /><small>A-</small><strong>24%</strong></span><span><b style={{ height: '60%' }} /><small>B+</small><strong>19%</strong></span><span><b style={{ height: '44%' }} /><small>B</small><strong>14%</strong></span><span><b style={{ height: '30%' }} /><small>C</small><strong>8%</strong></span></div></div><div className="grade-score-card"><span className="grade-score-icon"><BadgeCheck size={19} /></span><p>Students on track</p><strong>84.8%</strong><small><Check size={12} /> Meeting academic targets</small></div></section>
    <section className="panel grade-table-panel"><div className="panel-heading table-heading"><div><h2>Student gradebook</h2><p>Lab and examination scores for active students.</p></div><button className="filter-button">Download grade cards <ArrowUpRight size={13} /></button></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search student or batch" /></div><button className="filter-button">All grades</button><button className="filter-button">All batches</button></div><div className="table-scroll"><table className="grade-table"><thead><tr><th>Student</th><th>Batch</th><th>Lab score</th><th>Exam score</th><th>GPA</th><th>Grade</th><th /></tr></thead><tbody>{gradeRows.map((student) => <tr key={student.id}><td><div className="student-cell"><span className="student-avatar violet">{student.name.split(' ').map((word) => word[0]).join('')}</span><div><strong>{student.name}</strong><small>{student.id}</small></div></div></td><td>{student.batch}</td><td>{student.lab}</td><td>{student.exam}</td><td><strong>{student.gpa}</strong></td><td><span className={`grade-pill ${student.tone}`}>{student.grade}</span></td><td><button className="row-menu" aria-label={`Open grade card for ${student.name}`}><ArrowUpRight size={16} /></button></td></tr>)}</tbody></table></div></section>
  </>
}

const facultyRows = [
  { name: 'Sarah Ahmed', role: 'Senior Frontend Instructor', specialty: 'React, Node.js', workload: '18 hrs / week', status: 'Available', tone: 'green', rating: '4.9' },
  { name: 'Usman Khan', role: 'Python & Data Instructor', specialty: 'Python, SQL, ML', workload: '16 hrs / week', status: 'In session', tone: 'navy', rating: '4.8' },
  { name: 'Hina Raza', role: 'Database Instructor', specialty: 'SQL, Architecture', workload: '12 hrs / week', status: 'Available', tone: 'green', rating: '4.7' },
  { name: 'Ayesha Malik', role: 'Product Design Mentor', specialty: 'Figma, UX Research', workload: '10 hrs / week', status: 'On leave', tone: 'gold', rating: '4.9' },
]

function FacultyWorkspace({ item }) {
  const isAllocation = item.path.includes('allocations')
  const isAttendance = item.path.includes('attendance')
  const isReviews = item.path.includes('reviews')
  const [data, setData] = useState({ faculty: [], allocations: [], attendance: [], reviews: [], batches: [] })
  const [form, setForm] = useState(null)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const title = isAllocation ? 'Workload & allocation' : isAttendance ? 'Faculty attendance' : isReviews ? 'Ratings & feedback' : 'Faculty directory'
  const description = isAllocation ? 'Resolve timetable conflicts and balance instructor lecture hours.' : isAttendance ? 'Track instructor check-ins, attendance patterns, and exceptions.' : isReviews ? 'Review learner feedback, instructor ratings, and improvement signals.' : 'Manage teacher profiles, technical specializations, and teaching assignments.'
  const load = () => { setLoading(true); Promise.allSettled([apiGet('/faculty'), apiGet('/academics/batches')]).then(([facultyResult, batchesResult]) => { if (facultyResult.status === 'rejected') throw facultyResult.reason; setData({ ...facultyResult.value.data, batches: batchesResult.status === 'fulfilled' ? batchesResult.value.data.items || [] : [] }); setError('') }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [item.path])
  useEffect(() => {
    if (form !== 'instructor') return undefined
    const emailInput = document.querySelector('.module-form input[name="email"]')
    if (!emailInput || document.querySelector('.module-form input[name="password"]')) return undefined
    const label = document.createElement('label')
    label.textContent = 'Portal password'
    const passwordInput = document.createElement('input')
    passwordInput.name = 'password'
    passwordInput.type = 'password'
    passwordInput.required = true
    passwordInput.minLength = 8
    passwordInput.placeholder = 'Enter at least 8 characters'
    label.appendChild(passwordInput)
    emailInput.closest('label')?.after(label)
    return () => label.remove()
  }, [form])
  const submit = async (event) => { event.preventDefault(); const formData = new FormData(event.currentTarget); const values = Object.fromEntries(formData.entries()); try { const endpoint = form === 'instructor' ? (editingFaculty ? `/faculty/${editingFaculty.id}` : '/faculty') : form === 'allocation' ? '/faculty/allocations' : form === 'attendance' ? '/faculty/attendance' : '/faculty/reviews'; const body = form === 'instructor' ? formData : form === 'allocation' ? { ...values, hoursPerWeek: Number(values.hoursPerWeek) } : form === 'attendance' ? values : { ...values, rating: Number(values.rating) }; if (form === 'instructor') { if (editingFaculty) await apiUpdateUpload(endpoint, body); else await apiUpload(endpoint, body) } else await apiPost(endpoint, body); setForm(null); setEditingFaculty(null); load() } catch (requestError) { setError(requestError.message) } }
  const openForm = isAllocation ? 'allocation' : isAttendance ? 'attendance' : isReviews ? 'review' : 'instructor'
  const names = Object.fromEntries(data.faculty.map((faculty) => [faculty.id, faculty.name]))
  const rows = isAllocation ? data.allocations.map((allocation) => ({ id: allocation.id, faculty: names[allocation.facultyId] || allocation.facultyId, main: allocation.title, detail: `${allocation.Batch?.name || 'Unassigned batch'} · ${allocation.hoursPerWeek} hrs / week`, status: allocation.status, date: allocation.schedule || '-' })) : isAttendance ? data.faculty.map((faculty) => ({ id: faculty.id, faculty: faculty.name, avatarUrl: faculty.avatarUrl, main: faculty.attendance?.checkIn ? new Date(faculty.attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-', detail: faculty.attendance?.status || 'ABSENT', status: faculty.attendance?.status || 'ABSENT', date: faculty.attendance?.note || '-' })) : isReviews ? data.reviews.map((review) => ({ id: review.id, faculty: names[review.facultyId] || review.facultyId, main: `${review.rating} / 5`, detail: review.comment || 'No comment', status: review.status, date: review.Student?.name || 'Anonymous' })) : data.faculty.map((faculty) => ({ id: faculty.id, faculty: faculty.name, avatarUrl: faculty.avatarUrl, main: faculty.compensation?.type === 'PERCENTAGE' ? `${faculty.compensation.percentage}% · PKR ${(faculty.compensation.earnedMinor / 100).toLocaleString()}` : `PKR ${Number(faculty.compensation?.fixedSalary || 0).toLocaleString()} fixed`, detail: faculty.compensation?.type === 'PERCENTAGE' ? `${faculty.compensation.batches.reduce((total, batch) => total + batch.studentCount, 0)} students · ${faculty.compensation.batches.length} batches · ${faculty.compensation.batches.map((batch) => batch.students.map((student) => `${student.studentName}: PKR ${(student.earnedMinor / 100).toLocaleString()}`).join(', ')).join(' · ') || 'No collected fees yet'}` : [faculty.qualifications, faculty.skills, faculty.cnic].filter(Boolean).join(' · ') || faculty.email, status: faculty.status, date: faculty.created_at ? `Joined ${new Date(faculty.created_at).toLocaleDateString()}` : 'Profile details pending', compensation: faculty.compensation, source: faculty }))
  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()))
  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{title}</h1><p className="heading-subtitle">{description}</p></div><button className="primary-button" onClick={() => { setEditingFaculty(null); setForm(openForm) }}><Plus size={17} /> {isReviews ? 'Add feedback' : isAttendance ? 'Mark attendance' : isAllocation ? 'Add allocation' : 'Add instructor'}</button></section>
    {error && <div className="module-success" style={{ color: '#b44' }}>{error}</div>}
    <section className="faculty-summary"><div><span className="faculty-summary-icon"><Users size={17} /></span><p>Active instructors</p><strong>{data.faculty.length}</strong><small>Live institute directory</small></div><div><span className="faculty-summary-icon gold"><Clock3 size={17} /></span><p>{isAttendance ? 'Present today' : 'Teaching hours'}</p><strong>{isAttendance ? `${data.faculty.filter((faculty) => ['PRESENT', 'LATE'].includes(faculty.attendance?.status)).length} / ${data.faculty.length}` : data.faculty.reduce((total, faculty) => total + Number(faculty.workloadHours || 0), 0)}</strong><small>{isAttendance ? 'Attendance records' : 'Allocated weekly hours'}</small></div><div><span className="faculty-summary-icon green"><Star size={17} /></span><p>Average rating</p><strong>{data.faculty.filter((faculty) => faculty.rating).length ? (data.faculty.filter((faculty) => faculty.rating).reduce((total, faculty) => total + faculty.rating, 0) / data.faculty.filter((faculty) => faculty.rating).length).toFixed(1) : '—'}</strong><small>{data.reviews.length} published reviews</small></div></section>
    {form && <section className="panel module-form"><div className="module-form-heading"><div><p className="settings-kicker">Faculty workspace</p><h2>{form === 'instructor' ? (editingFaculty ? 'Edit instructor compensation' : 'Add instructor') : form === 'allocation' ? 'Add workload allocation' : form === 'attendance' ? 'Mark faculty attendance' : 'Add rating & feedback'}</h2></div><button className="icon-button" onClick={() => { setForm(null); setEditingFaculty(null) }}>x</button></div><form onSubmit={submit}><div className="module-form-fields">{form === 'instructor' && <><label>First name<input name="firstName" defaultValue={editingFaculty?.firstName || ''} placeholder="First name" required /></label><label>Last name<input name="lastName" defaultValue={editingFaculty?.lastName || ''} placeholder="Last name" required /></label><label>Father name<input name="fatherName" defaultValue={editingFaculty?.fatherName || ''} placeholder="Father name" /></label><label>Caste<input name="caste" defaultValue={editingFaculty?.caste || ''} /></label><label>Religion<input name="religion" defaultValue={editingFaculty?.religion || ''} /></label><label>CNIC<input name="cnic" defaultValue={editingFaculty?.cnic || ''} required /></label><label>Address<input name="address" defaultValue={editingFaculty?.address || ''} /></label><label>Qualifications<input name="qualifications" defaultValue={editingFaculty?.qualifications || ''} placeholder="BS Computer Science" /></label><label>Skills<input name="skills" defaultValue={editingFaculty?.skills || ''} placeholder="React, Node.js, SQL" /></label><label>Email<input name="email" type="email" defaultValue={editingFaculty?.email || ''} required /></label><label>Profile image<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" /></label><label>Status<select name="status" defaultValue={editingFaculty?.status || 'ACTIVE'}><option value="ACTIVE">Active</option><option value="INVITED">Invited</option><option value="SUSPENDED">Suspended</option></select></label><label>Payment mode<select name="compensationType" defaultValue={editingFaculty?.compensationType || 'FIXED'} onChange={(event) => { const fixedSalary = event.currentTarget.form.elements.fixedSalary; fixedSalary.disabled = event.target.value === 'PERCENTAGE'; if (fixedSalary.disabled) fixedSalary.value = 0 }}><option value="FIXED">Fixed salary</option><option value="PERCENTAGE">Batch fee percentage</option></select></label><label>Fixed salary (PKR)<input name="fixedSalary" type="number" min="0" step="0.01" defaultValue={editingFaculty?.fixedSalary || 0} disabled={editingFaculty?.compensationType === 'PERCENTAGE'} /></label><label>Fee percentage<input name="percentage" type="number" min="0" max="100" step="0.01" defaultValue={editingFaculty?.percentage || 0} placeholder="e.g. 20" /></label></>}{form !== 'instructor' && <label>Instructor<select name="facultyId" required><option value="">Select instructor</option>{data.faculty.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}</select></label>}{form === 'allocation' && <><label>Batch<select name="batchId" required><option value="">Select batch</option>{data.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name} · {batch.enrollmentCount || 0} students</option>)}</select></label><label>Class / allocation title<input name="title" placeholder="Frontend Fundamentals" required /></label><label>Hours per week<input name="hoursPerWeek" type="number" min="0.5" step="0.5" required /></label><label>Schedule<input name="schedule" placeholder="Mon & Wed, 09:00 - 11:00" /></label></>}{form === 'attendance' && <><label>Date<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Status<select name="status" defaultValue="PRESENT"><option value="PRESENT">Present</option><option value="LATE">Late</option><option value="ABSENT">Absent</option><option value="ON_LEAVE">On leave</option></select></label><label>Note<input name="note" /></label></>}{form === 'review' && <><label>Rating<select name="rating" defaultValue="5"><option value="5">5 - Excellent</option><option value="4">4 - Very good</option><option value="3">3 - Good</option><option value="2">2 - Needs improvement</option><option value="1">1 - Poor</option></select></label><label>Feedback<input name="comment" placeholder="Share feedback" /></label></>}</div><div className="module-form-actions"><button type="button" className="ghost-button" onClick={() => { setForm(null); setEditingFaculty(null) }}>Cancel</button><button className="primary-button" type="submit"><Check size={15} /> Save</button></div></form></section>}
    <section className="panel faculty-table-panel"><div className="panel-heading table-heading"><div><h2>{isReviews ? 'Instructor feedback' : isAttendance ? "Today's faculty attendance" : isAllocation ? 'Teaching allocations' : 'All instructors'}</h2><p>{loading ? 'Loading live faculty records...' : `${rows.length} live records`}</p></div></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search faculty records" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="table-scroll"><table className="faculty-table"><thead><tr><th>Instructor</th><th>{isReviews ? 'Rating' : isAttendance ? 'Check-in' : isAllocation ? 'Allocation' : 'Compensation'}</th><th>{isReviews ? 'Feedback' : isAttendance ? 'Attendance' : 'Details'}</th><th>{isReviews ? 'Student' : 'Status'}</th>{!isAllocation && !isAttendance && !isReviews && <th />}</tr></thead><tbody>{filtered.map((row) => <tr key={row.id}><td><div className="faculty-person">{row.avatarUrl ? <img className="faculty-avatar faculty-avatar-image" src={apiAssetUrl(row.avatarUrl)} alt={`${row.faculty} profile`} /> : <span className="faculty-avatar navy">{row.faculty.split(' ').map((word) => word[0]).join('')}</span>}<div><strong>{row.faculty}</strong><small>{row.date}</small></div></div></td><td>{row.main}</td><td>{row.detail}</td><td><span className="faculty-status green">{row.status}</span></td>{!isAllocation && !isAttendance && !isReviews && <td><button className="row-menu" type="button" aria-label={`Edit compensation for ${row.faculty}`} onClick={() => { setEditingFaculty(row.source); setForm('instructor') }}><UserCog size={16} /></button></td>}</tr>)}</tbody></table>{!loading && !filtered.length && <div className="empty-state">No faculty records found.</div>}</div></section>
  </>
}

const invoiceRows = [
  { invoice: 'INV-2026-0912', student: 'Aarav Sharma', batch: 'MERN-06 Morning', amount: 'Rs 48,000', due: '15 Sep 2026', status: 'Pending', tone: 'gold' },
  { invoice: 'INV-2026-0911', student: 'Maya Patel', batch: 'Python-04 Evening', amount: 'Rs 42,000', due: '10 Sep 2026', status: 'Paid', tone: 'green' },
  { invoice: 'INV-2026-0908', student: 'Sofia Garcia', batch: 'Design-03 Weekend', amount: 'Rs 36,000', due: '05 Sep 2026', status: 'Overdue', tone: 'coral' },
]

function FinanceWorkspace({ item }) {
  const [formMode, setFormMode] = useState(null)
  const [saved, setSaved] = useState(false)
  const isInvoices = item.path.includes('invoices')
  const isCollect = item.path.includes('collect')
  const isDefaulters = item.path.includes('defaulters')
  const isScholarships = item.path.includes('scholarships')
  const title = isInvoices ? 'Invoices & vouchers' : isCollect ? 'Collect fee / payments' : isDefaulters ? 'Defaulters list' : isScholarships ? 'Scholarships & concessions' : 'Fee overview'
  const description = isInvoices ? 'Generate batch-wise invoices, vouchers, and recurring fee plans.' : isCollect ? 'Record counter payments, issue receipts, and keep payment status current.' : isDefaulters ? 'Track due balances and follow up with families before the next deadline.' : isScholarships ? 'Manage approved scholarships, discounts, and fee concessions.' : 'Monitor collections, outstanding balances, and finance performance.'
  const openForm = (mode) => { setSaved(false); setFormMode(mode) }
  const saveForm = (event) => { event.preventDefault(); setSaved(true); setFormMode(null) }

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{title}</h1><p className="heading-subtitle">{description}</p></div><button className="primary-button" onClick={() => openForm(isCollect ? 'payment' : isInvoices ? 'invoice' : isScholarships ? 'concession' : 'collection')}>{isCollect ? <CreditCard size={17} /> : <Plus size={17} />}{isCollect ? 'Record payment' : isInvoices ? 'Create invoice' : isDefaulters ? 'Send reminders' : isScholarships ? 'Add concession' : 'View collections'}</button></section>
    {saved && <div className="module-success"><Check size={15} /> {formMode === 'payment' ? 'Payment recorded and receipt generated.' : 'Finance record saved successfully.'}</div>}
    {formMode && <section className="panel finance-form"><div className="module-form-heading"><div><p className="settings-kicker">The Prime Finance Desk</p><h2>{formMode === 'payment' ? 'Record a payment' : formMode === 'invoice' ? 'Create an invoice' : formMode === 'concession' ? 'Add a concession' : 'Collection summary'}</h2><p>Enter the details below to update your finance records.</p></div><button className="icon-button" type="button" onClick={() => setFormMode(null)} aria-label="Close finance form">×</button></div><form onSubmit={saveForm}><div className="module-form-fields"><label>Student / account<input name="account" placeholder="Search student or account" required /></label><label>{formMode === 'invoice' ? 'Invoice amount (PKR)' : formMode === 'concession' ? 'Concession amount (PKR)' : 'Payment amount (PKR)'}<input name="amount" type="number" min="0" placeholder="0" required /></label><label>Payment method<select defaultValue="Bank transfer"><option>Cash</option><option>Bank transfer</option><option>Online gateway</option></select></label></div><div className="module-form-actions"><button type="button" className="ghost-button" onClick={() => setFormMode(null)}>Cancel</button><button type="submit" className="primary-button"><Check size={15} /> Save finance record</button></div></form></section>}
    <section className="finance-summary"><div><span className="finance-summary-icon"><Wallet size={17} /></span><p>{isDefaulters ? 'Total due balance' : isScholarships ? 'Approved concessions' : 'Collected this month'}</p><strong>{isDefaulters ? 'Rs 2,180' : isScholarships ? 'Rs 3.4M' : 'Rs 12,480'}</strong><small>{isDefaulters ? '8 families need action' : isScholarships ? '42 active students' : '+12.5% from last month'}</small></div><div><span className="finance-summary-icon gold"><Receipt size={17} /></span><p>{isInvoices ? 'Open invoices' : isCollect ? 'Payments today' : 'Pending payments'}</p><strong>{isInvoices ? '34' : isCollect ? '18' : 'Rs 8,420'}</strong><small>{isInvoices ? '12 due this week' : isCollect ? 'Rs 86,400 collected' : '34 invoices open'}</small></div><div><span className="finance-summary-icon green"><CheckCircle2 size={17} /></span><p>{isScholarships ? 'Average concession' : 'Collection rate'}</p><strong>{isScholarships ? '18.5%' : '83.5%'}</strong><small>{isScholarships ? 'Across approved plans' : '+3.7% this academic year'}</small></div></section>
    {isDefaulters && <section className="finance-alert"><AlertCircle size={19} /><div><strong>8 families require follow-up</strong><p>Send a payment reminder before the September 15 deadline.</p></div><button className="filter-button">Send reminders <ArrowUpRight size={13} /></button></section>}
    {isCollect && <section className="payment-entry"><div className="payment-entry-icon"><CreditCard size={22} /></div><div><p>Quick payment entry</p><h2>Record a counter payment</h2><span>Capture payment details and issue a digital receipt instantly.</span></div><button className="primary-button" onClick={() => openForm('payment')}>Open payment form <ArrowUpRight size={14} /></button></section>}
    {isScholarships && <section className="concession-banner"><div><p>Concession programme</p><h2>Merit and need-based support</h2><span>42 students currently receive an approved scholarship or fee concession.</span></div><div className="concession-progress"><strong>Rs 3.4M</strong><small>allocated this year</small><i><b /></i></div></section>}
    <section className="panel finance-table-panel"><div className="panel-heading table-heading"><div><h2>{isDefaulters ? 'Students with outstanding balances' : isScholarships ? 'Approved scholarships' : isCollect ? 'Recent payments' : isInvoices ? 'Invoices & vouchers' : 'Finance activity'}</h2><p>Updated today · September 2026 finance records</p></div><button className="filter-button">All statuses</button></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder={isScholarships ? 'Search student or programme' : 'Search student or invoice'} /></div><button className="filter-button">All batches</button><button className="filter-button">September 2026</button></div><div className="table-scroll"><table className="finance-table"><thead><tr><th>{isInvoices ? 'Invoice' : 'Student'}</th><th>{isInvoices ? 'Student / batch' : 'Batch'}</th><th>{isScholarships ? 'Programme' : 'Amount'}</th><th>{isInvoices ? 'Due date' : isScholarships ? 'Concession' : 'Status'}</th><th>{isInvoices ? 'Status' : isScholarships ? 'Valid until' : 'Action'}</th><th /></tr></thead><tbody>{invoiceRows.map((row) => <tr key={row.invoice}><td><div className="finance-person"><span className="finance-row-icon">{isInvoices ? <Receipt size={15} /> : <Users size={15} />}</span><div><strong>{isInvoices ? row.invoice : row.student}</strong><small>{isInvoices ? row.student : row.invoice}</small></div></div></td><td>{row.batch}</td><td><strong>{isScholarships ? 'Merit scholarship' : row.amount}</strong></td><td>{isInvoices ? row.due : <span className={`finance-status ${row.tone}`}>{row.status}</span>}</td><td>{isInvoices ? <span className={`finance-status ${row.tone}`}>{row.status}</span> : row.due}</td><td><button className="row-menu" aria-label={`Open finance record for ${row.student}`}><ArrowUpRight size={16} /></button></td></tr>)}</tbody></table></div></section>
  </>
}

const auditRows = [
  { action: 'Fee status updated', user: 'Jordan Davis', target: 'INV-2026-0912', time: 'Today, 09:14 AM', type: 'Finance' },
  { action: 'Grade card generated', user: 'Sarah Ahmed', target: 'STU-1024', time: 'Today, 08:52 AM', type: 'Academic' },
  { action: 'New instructor added', user: 'Admin team', target: 'Faculty directory', time: 'Yesterday, 04:20 PM', type: 'System' },
  { action: 'Role permission changed', user: 'Jordan Davis', target: 'Academic Head', time: 'Yesterday, 02:05 PM', type: 'Security' },
]

const defaultLifeAtPrime = {
  eyebrow: 'Campus experience',
  titlePrefix: 'Life at',
  titleHighlight: 'The Prime.',
  description: 'Beyond lectures, a vibrant community where you grow through events, teamwork, culture, and real-world exposure.',
  categories: ['Events & societies', 'Sports & wellness', 'Student community', 'Labs & practical skills'],
  gallery: [],
}

function LifeAtPrimeSettings({ item }) {
  const [recordId, setRecordId] = useState(null)
  const [settings, setSettings] = useState(defaultLifeAtPrime)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null)

  useEffect(() => {
    let active = true
    apiGet('/modules/life-at-prime?limit=20').then(({ data }) => {
      if (!active) return
      const record = data.items?.find((entry) => entry.status === 'ACTIVE')
      if (record) {
        setRecordId(record.id)
        setSettings({ ...defaultLifeAtPrime, ...record.details, categories: Array.isArray(record.details?.categories) ? record.details.categories : defaultLifeAtPrime.categories, gallery: Array.isArray(record.details?.gallery) ? record.details.gallery : defaultLifeAtPrime.gallery })
      }
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  const updateCategory = (index, value) => setSettings((current) => ({ ...current, categories: current.categories.map((category, categoryIndex) => categoryIndex === index ? value : category) }))
  const updateGalleryItem = (index, changes) => setSettings((current) => ({ ...current, gallery: current.gallery.map((image, imageIndex) => imageIndex === index ? { ...image, ...changes } : image) }))
  const uploadGalleryImage = async (index, file) => {
    if (!file) return
    setUploadingImageIndex(index)
    setError('')
    const formData = new FormData()
    formData.set('image', file)
    try {
      const response = await apiUpload('/modules/life-at-prime/images', formData)
      updateGalleryItem(index, { src: response.data.imageUrl })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUploadingImageIndex(null)
    }
  }
  const save = async (event) => {
    event.preventDefault()
    if (settings.gallery.some((image) => !image.src?.trim() || !image.caption?.trim() || !image.alt?.trim())) {
      setError('Every gallery image needs an image, a caption, and alt text.')
      return
    }
    setSaving(true)
    setSaved(false)
    setError('')
    const payload = { name: 'Life at The Prime', details: settings, status: 'ACTIVE', owner: 'Admin team' }
    try {
      const response = recordId
        ? await apiPatch(`/modules/life-at-prime/${recordId}`, payload)
        : await apiPost('/modules/life-at-prime', payload)
      setRecordId(response.data.item.id)
      setSaved(true)
      window.dispatchEvent(new CustomEvent('life-at-prime-updated', { detail: settings }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>Life at The Prime</h1><p className="heading-subtitle">Manage the campus experience heading, categories, and gallery images shown on the public landing page.</p></div></section>
    {error && <div className="module-success error-note" role="alert">{error}</div>}
    {saved && <div className="module-success"><Check size={15} /> Campus experience updated.</div>}
    <form className="panel system-form" onSubmit={save}>
      <div className="system-form-heading"><div><p className="settings-kicker">Public landing page</p><h2>Campus experience content</h2><p>Changes are shown in the Life at The Prime section.</p></div><span className="profile-status"><span />{loading ? 'Loading...' : 'Ready to edit'}</span></div>
      <div className="system-fields">
        <label>Eyebrow text<input value={settings.eyebrow} onChange={(event) => setSettings((current) => ({ ...current, eyebrow: event.target.value }))} maxLength={80} required /></label>
        <label>Heading first part<input value={settings.titlePrefix} onChange={(event) => setSettings((current) => ({ ...current, titlePrefix: event.target.value }))} maxLength={80} required /></label>
        <label>Highlighted heading text<input value={settings.titleHighlight} onChange={(event) => setSettings((current) => ({ ...current, titleHighlight: event.target.value }))} maxLength={80} required /></label>
        <label className="system-logo-field">Description<textarea value={settings.description} onChange={(event) => setSettings((current) => ({ ...current, description: event.target.value }))} maxLength={500} rows={3} /></label>
        {settings.categories.map((category, index) => <label key={`campus-category-${index}`}>Category {index + 1}<span className="settings-category-field"><input value={category} onChange={(event) => updateCategory(index, event.target.value)} maxLength={100} required /><button className="filter-button" type="button" onClick={() => setSettings((current) => ({ ...current, categories: current.categories.filter((_, categoryIndex) => categoryIndex !== index) }))} aria-label={`Remove category ${index + 1}`}>Remove</button></span></label>)}
      </div>
      <div className="life-gallery-editor"><div className="life-gallery-editor-heading"><h3>Campus gallery</h3><p>Upload JPEG, PNG, or WebP images up to 5 MB each.</p></div>{settings.gallery.map((image, index) => <article className="life-gallery-item" key={`campus-gallery-${index}`}>{image.src && <img className="life-gallery-preview" src={apiAssetUrl(image.src)} alt={image.alt || ''} />}<div className="life-gallery-item-fields"><label>Image {index + 1}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadGalleryImage(index, event.target.files?.[0])} disabled={uploadingImageIndex !== null} />{uploadingImageIndex === index && <small>Uploading image...</small>}</label><label>Caption<input value={image.caption} onChange={(event) => updateGalleryItem(index, { caption: event.target.value })} maxLength={100} required /></label><label>Alt text<input value={image.alt} onChange={(event) => updateGalleryItem(index, { alt: event.target.value })} maxLength={180} required /></label></div><button className="filter-button" type="button" onClick={() => setSettings((current) => ({ ...current, gallery: current.gallery.filter((_, imageIndex) => imageIndex !== index) }))} aria-label={`Remove gallery image ${index + 1}`}>Remove</button></article>)}</div>
      <div className="system-form-footer"><div className="life-gallery-add-actions"><button className="filter-button" type="button" onClick={() => setSettings((current) => ({ ...current, categories: [...current.categories, ''] }))}>Add category</button><button className="filter-button" type="button" onClick={() => setSettings((current) => ({ ...current, gallery: [...current.gallery, { src: '', alt: '', caption: '' }] }))}>Add gallery image</button></div><button className="primary-button" type="submit" disabled={loading || saving || uploadingImageIndex !== null}>{saving ? 'Saving...' : 'Save content'}</button></div>
    </form>
  </>
}

function InstituteProfile({ item }) {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    apiGet('/institutes/profile').then(({ data }) => {
      if (active) setProfile(data.institute)
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    })
    return () => { active = false }
  }, [])

  const updateField = (event) => setProfile((current) => ({ ...current, [event.target.name]: event.target.value }))
  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const result = await apiUpdateUpload('/institutes/profile', new FormData(event.currentTarget))
      setProfile(result.data.institute)
      window.dispatchEvent(new CustomEvent('institute-profile-updated', { detail: result.data.institute }))
      setSaved(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const logo = profile?.logoUrl ? apiAssetUrl(profile.logoUrl) : '/the-prime-logo.svg'
  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>Institute profile</h1><p className="heading-subtitle">Manage institute identity, contact details, branding, and academic year.</p></div></section>
    {error && <div className="module-success error-note">{error}</div>}
    {saved && <div className="module-success"><Check size={15} /> Institute profile updated.</div>}
    <section className="settings-profile-layout">
      <form className="panel system-form" onSubmit={save}>
        <div className="system-form-heading"><div><p className="settings-kicker">Institute identity</p><h2>Institute profile</h2><p>Manage institute contact numbers and the links used by its social icons.</p></div><span className="profile-status"><span />{profile ? 'Live profile' : 'Loading...'}</span></div>
        <div className="system-fields">
          <label>Institute name<input name="name" value={profile?.name || ''} onChange={updateField} required /></label>
          <label>Short name<input name="shortName" value={profile?.shortName || ''} onChange={updateField} required /></label>
          <label>Institute email (Email icon)<input name="email" type="email" value={profile?.email || ''} onChange={updateField} required /></label>
          <label>Phone number<input name="phone" value={profile?.phone || ''} onChange={updateField} /></label>
          <label>Second phone number<input name="secondaryPhone" type="tel" value={profile?.secondaryPhone || ''} onChange={updateField} placeholder="e.g. 03103252548" /></label>
          <label>Academic year<input name="academicYear" value={profile?.academicYear || ''} onChange={updateField} placeholder="2026-2027" required /></label>
          <label>Years of excellence<input name="yearsOfExcellence" type="number" min="0" value={profile?.yearsOfExcellence ?? 5} onChange={updateField} /></label>
          <label>Institute address<input name="address" value={profile?.address || ''} onChange={updateField} /></label>
          <label>Facebook URL<input name="facebookUrl" type="url" value={profile?.facebookUrl || ''} onChange={updateField} placeholder="https://facebook.com/your-institute" /></label>
          <label>Instagram URL<input name="instagramUrl" type="url" value={profile?.instagramUrl || ''} onChange={updateField} placeholder="https://instagram.com/your-institute" /></label>
          <label>YouTube URL<input name="youtubeUrl" type="url" value={profile?.youtubeUrl || ''} onChange={updateField} placeholder="https://youtube.com/@your-institute" /></label>
          <label>LinkedIn URL<input name="linkedinUrl" type="url" value={profile?.linkedinUrl || ''} onChange={updateField} placeholder="https://linkedin.com/company/your-institute" /></label>
          <label>Institute logo<input name="logo" type="file" accept="image/png,image/jpeg,image/webp" /><small>JPEG, PNG, or WebP (up to 5 MB).</small></label>
        </div>
        <div className="system-form-footer"><span>{profile?.updatedAt ? `Updated ${new Date(profile.updatedAt).toLocaleDateString()}` : 'Live institute record'}</span><button className="primary-button" type="submit" disabled={!profile || saving}>{saving ? 'Saving...' : 'Save profile'}</button></div>
      </form>
      <aside className="system-brand-card"><img src={logo} alt={`${profile?.shortName || 'Institute'} logo`} /><h2>{profile?.shortName || 'Institute'}</h2><p>{profile?.name || 'Loading institute profile...'}</p><span>{profile?.logoUrl ? 'Uploaded institute logo' : 'Default institute logo'}</span></aside>
    </section>
  </>
}

function SettingsWorkspace({ item }) {
  const navigate = useNavigate()
  const isRoles = item.path.includes('/roles')
  const isIntegrations = item.path.includes('/integrations')
  const isLogs = item.path.includes('/logs')
  const isLifeAtPrime = item.path.includes('/life-at-prime')
  const [auditLogs, setAuditLogs] = useState([])
  const [auditQuery, setAuditQuery] = useState('')
  const [auditAction, setAuditAction] = useState('')
  const [auditRange, setAuditRange] = useState('30')
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')
  const title = isRoles ? 'Roles & permissions' : isIntegrations ? 'Payment gateways & SMS API' : isLogs ? 'Audit / activity logs' : 'Institute profile'
  const description = isRoles ? 'Control access using role-based create, read, update, and delete permissions.' : isIntegrations ? 'Connect payments, SMS, email, and WhatsApp services for institute workflows.' : isLogs ? 'Review login history, grade overrides, and manual finance activity.' : 'Manage institute identity, contact details, branding, and academic year.'

  useEffect(() => {
    if (!isLogs) return
    setAuditLoading(true)
    const params = new URLSearchParams({ limit: '250' })
    if (auditAction) params.set('action', auditAction)
    if (auditRange !== 'all') {
      const date = new Date()
      date.setDate(date.getDate() - Number(auditRange))
      params.set('dateFrom', date.toISOString().slice(0, 10))
    }
    apiGet(`/settings/logs?${params}`).then(({ data }) => { setAuditLogs(data.items || []); setAuditError('') }).catch((requestError) => setAuditError(requestError.message)).finally(() => setAuditLoading(false))
  }, [isLogs, auditAction, auditRange])

  const filteredAuditLogs = auditLogs.filter((log) => `${log.action} ${log.entityType} ${log.entityId || ''} ${log.Actor?.firstName || ''} ${log.Actor?.lastName || ''}`.toLowerCase().includes(auditQuery.toLowerCase()))
  const auditActionLabel = (action) => action.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
  const auditCategory = (log) => log.entityType === 'Payment' || log.action.includes('INVOICE') ? 'Finance' : log.entityType === 'RolePermission' || log.action.includes('PERMISSION') ? 'Security' : log.entityType === 'Student' ? 'Academic' : 'System'

  if (isLifeAtPrime) return <LifeAtPrimeSettings item={item} />
  if (!isRoles && !isIntegrations && !isLogs) return <InstituteProfile item={item} />

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{title}</h1><p className="heading-subtitle">{description}</p></div><button className="primary-button"><Plus size={17} /> {isRoles ? 'Add role' : isIntegrations ? 'Add integration' : isLogs ? 'Filter logs' : 'Edit profile'}</button></section>
    <section className="system-tabs"><button type="button" className={!isRoles && !isIntegrations && !isLogs ? 'active' : ''} onClick={() => navigate('/settings/profile')}><BuildingIcon /> Institute profile</button><button type="button" className={isRoles ? 'active' : ''} onClick={() => navigate('/settings/roles')}><KeyRound size={15} /> Roles &amp; permissions</button><button type="button" className={isIntegrations ? 'active' : ''} onClick={() => navigate('/settings/integrations')}><Wrench size={15} /> Integrations</button><button type="button" className={isLogs ? 'active' : ''} onClick={() => navigate('/settings/logs')}><ScrollText size={15} /> Audit logs</button></section>
    {!isRoles && !isIntegrations && !isLogs && <section className="settings-profile-layout"><form className="panel system-form"><div className="system-form-heading"><div><p className="settings-kicker">Institute identity</p><h2>Institute profile</h2><p>These details appear on ID cards, certificates, receipts, and reports.</p></div><span className="profile-status"><span />Complete</span></div><div className="system-fields"><label>Institute name<input defaultValue="The Prime Institute of Science & Technology" /></label><label>Short name<input defaultValue="The Prime" /></label><label>Institute email<input type="email" defaultValue="admin@theprime.edu" /></label><label>Phone number<input defaultValue="+92 300 1234567" /></label><label>Academic year<select defaultValue="2026-2027"><option>2026-2027</option><option>2025-2026</option></select></label><label>Institute address<input defaultValue="Jamshoro, Sindh, Pakistan" /></label></div><div className="system-form-footer"><span>Last updated today</span><button className="primary-button" type="submit">Save profile</button></div></form><aside className="system-brand-card"><img src="/the-prime-logo.svg" alt="The Prime logo" /><h2>The Prime</h2><p>Institute of Science &amp; Technology</p><span>Verified institute profile</span></aside></section>}
    {isRoles && <section className="panel system-table-panel"><div className="panel-heading"><div><h2>Role permission matrix</h2><p>Choose what each team role can access.</p></div><button className="filter-button">All modules</button></div><div className="permission-grid">{['Super Admin', 'Academic Head', 'Accounts', 'Instructors', 'Staff'].map((role, index) => <article className="permission-card" key={role}><div><span className="permission-avatar">{role.split(' ').map((word) => word[0]).join('')}</span><div><h3>{role}</h3><p>{index === 0 ? 'Full system access' : `${index + 2} modules assigned`}</p></div></div><span className="permission-count">{index === 0 ? 'Full access' : `${index + 2} roles`}</span><button className="ghost-button">Manage <ArrowUpRight size={14} /></button></article>)}</div></section>}
    {isIntegrations && <section className="integration-grid">{[['Payment gateway', 'Connect online fee payments and automatic reconciliation.', 'Connected', 'green', CreditCard], ['SMS notifications', 'Send payment reminders and attendance alerts to families.', 'Connected', 'green', Mail], ['Email service', 'Deliver receipts, certificates, and account notifications.', 'Not connected', 'gold', Mail], ['WhatsApp Business', 'Send approved reminders through WhatsApp templates.', 'Configure', 'navy', Wrench]].map(([name, text, status, tone, IntegrationIcon]) => <article className="panel integration-card" key={name}><div className={`integration-icon ${tone}`}><IntegrationIcon size={19} /></div><h2>{name}</h2><p>{text}</p><span className={`integration-status ${tone}`}><i />{status}</span><button className="ghost-button">{status === 'Connected' ? 'Manage' : 'Configure'} <ArrowUpRight size={14} /></button></article>)}</section>}
    {isLogs && <section className="panel audit-table-panel"><div className="panel-heading table-heading"><div><h2>Activity history</h2><p>{auditLoading ? 'Loading live audit records...' : `${filteredAuditLogs.length} records from the institute database.`}</p></div><select className="filter-button" value={auditRange} onChange={(event) => setAuditRange(event.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option></select></div>{auditError && <div className="module-success error-note">{auditError}</div>}<div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search activity or user" value={auditQuery} onChange={(event) => setAuditQuery(event.target.value)} /></div><select className="filter-button" value={auditAction} onChange={(event) => setAuditAction(event.target.value)}><option value="">All activity</option>{[...new Set(auditLogs.map((log) => log.action))].map((action) => <option key={action} value={action}>{auditActionLabel(action)}</option>)}</select></div><div className="table-scroll"><table className="audit-table"><thead><tr><th>Activity</th><th>Changed by</th><th>Reference</th><th>Time</th><th>Category</th></tr></thead><tbody>{filteredAuditLogs.map((log) => <tr key={log.id}><td><div className="audit-action"><span><ScrollText size={14} /></span><strong>{auditActionLabel(log.action)}</strong></div></td><td>{log.Actor ? `${log.Actor.firstName} ${log.Actor.lastName}` : 'System'}</td><td>{log.entityId || log.entityType}</td><td>{log.created_at ? new Date(log.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</td><td><span className="audit-category">{auditCategory(log)}</span></td></tr>)}</tbody></table>{!auditLoading && !filteredAuditLogs.length && <div className="empty-state">No audit records found for these filters.</div>}</div></section>}
  </>
}

function BuildingIcon() {
  return <Building2 size={15} />
}

function AdminModulePage({ item }) {
  const Icon = item.icon
  const [records, setRecords] = useState(() => getModuleRecords(item.path))
  const [showForm, setShowForm] = useState(item.path.endsWith('/create'))
  const [saved, setSaved] = useState(false)
  const modulePath = apiModulePath(item.path)

  useEffect(() => {
    let active = true
    setShowForm(item.path.endsWith('/create'))
    apiGet(`/modules/${modulePath}`).then(({ data }) => {
      if (active && data?.items?.length) setRecords(data.items.map((record) => ({ ...record, updated: new Date(record.updated_at).toLocaleDateString() })))
    }).catch(() => {})
    return () => { active = false }
  }, [item.path, modulePath])

  if (item.path === '/academics/batches/schedule') return <BatchSchedule item={item} />
  if (item.path === '/academics/batches') return <BatchesWorkspace item={item} />
  if (item.path === '/students/admissions') return <AdmissionsWorkspace item={item} />
  if (item.path === '/team/applications') return <TeamApplicationsWorkspace item={item} />
  if (item.path === '/contact/messages') return <ContactMessagesWorkspace item={item} />
  if (item.path === '/academics/labs') return <LabAllocation item={item} />
  if (item.path === '/academics/certifications') return <Certifications item={item} />
  if (item.path === '/staff' || item.path.startsWith('/staff/')) return <HRWorkspace item={item} />
  if (item.path === '/students/admissions') return <Admissions item={item} />
  if (item.path === '/students/attendance') return <Attendance item={item} />
  if (item.path === '/students/submissions') return <AssignmentsWorkspace item={item} />
  if (item.path === '/students/grades') return <Gradebook item={item} />
  if (item.path === '/teachers' || item.path.startsWith('/teachers/')) return <FacultyWorkspace item={item} />
  if (item.path === '/settings/roles') return <AccessControl item={item} />
  if (item.path === '/academics/courses' || item.path === '/academics/courses/create') return <CourseWorkspace item={item} />
  if (item.path === '/academics/programs') return <ProgramWorkspace item={item} />
  if (item.path === '/fees/expenses') return <DailyExpenses item={item} />
  if (item.path === '/fees' || item.path.startsWith('/fees/')) return <FinanceDynamic item={item} />
  if (item.path === '/settings/profile' || item.path.startsWith('/settings/')) return <SettingsWorkspace item={item} />
  const actionLabel = item.path.endsWith('/create') ? 'Create new' : item.path.includes('collect') ? 'Record payment' : 'Manage records'
  const formTitle = item.path.endsWith('/create') ? 'Create a new course' : `${actionLabel} in ${item.label}`
  const firstField = item.path.includes('course') ? 'Course name' : item.path.includes('batch') ? 'Batch name' : item.path.includes('fee') ? 'Student or invoice' : 'Record name'

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const { data } = await apiPost(`/modules/${modulePath}`, { name: form.get('name'), details: { detail: form.get('detail') }, status: form.get('status'), owner: 'You' })
      setRecords((current) => [{ ...data.item, updated: 'Just now' }, ...current])
      setSaved(true)
      setShowForm(false)
    } catch (error) {
      setSaved(false)
    }
  }

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">{item.description}</p></div><button className="primary-button" onClick={() => setShowForm(true)}><Plus size={17} />{actionLabel}</button></section>
    {saved && <div className="module-success"><Check size={15} /> Record saved successfully. It is now visible in the activity list.</div>}
    {showForm && <section className="panel module-form"><div className="module-form-heading"><div><p className="settings-kicker">The Prime Institute</p><h2>{formTitle}</h2><p>Enter the details below to keep your records up to date.</p></div><button className="icon-button" type="button" onClick={() => setShowForm(false)} aria-label="Close form">×</button></div><form onSubmit={handleSubmit}><div className="module-form-fields"><label>{firstField}<input name="name" placeholder={`Enter ${firstField.toLowerCase()}`} required /></label><label>{item.path.includes('course') ? 'Track / technology' : item.path.includes('fee') ? 'Amount (PKR)' : 'Department / category'}<input name="detail" type={item.path.includes('fee') ? 'number' : 'text'} placeholder={item.path.includes('fee') ? '0' : 'Enter details'} required /></label><label>Status<select defaultValue="Active"><option>Active</option><option>In review</option><option>Draft</option></select></label></div><div className="module-form-actions"><button type="button" className="ghost-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button"><Check size={15} /> Save record</button></div></form></section>}
    <section className="module-hero"><div className="module-hero-icon"><Icon size={24} /></div><div><p className="module-kicker">The Prime Institute</p><h2>{item.label} workspace</h2><p>Manage this area with clear ownership, consistent records, and permission-aware actions.</p></div><span className="module-access"><ShieldCheck size={14} /> {item.roles.join(' / ')}</span></section>
    <section className="module-stats"><article><span>Active records</span><strong>{records.length * 82}</strong><small><Check size={12} /> Updated today</small></article><article><span>Needs attention</span><strong>{records.length + 4}</strong><small className="module-warning"><ArrowUpRight size={12} /> Review queue</small></article><article><span>Completion rate</span><strong>{item.path.includes('attendance') ? '91.2%' : '83.5%'}</strong><small><Check size={12} /> On track</small></article></section>
    <section className="panel module-table"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest updates from the {item.label.toLowerCase()} module.</p></div><button className="filter-button">View all <ArrowUpRight size={14} /></button></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder={`Search ${item.label.toLowerCase()}`} /></div><button className="filter-button">All statuses</button></div><div className="module-records"><div className="module-record-header"><span>Record</span><span>Owner</span><span>Status</span><span>Updated</span></div>{records.map((record) => <div className="module-record" key={record.name}><div className="module-record-name"><span className="module-record-icon"><Icon size={15} /></span><strong>{record.name}</strong></div><span>{record.owner}</span><span className={`module-record-status ${record.status === 'Active' ? 'active' : 'review'}`}><i />{record.status}</span><small>{record.updated}</small></div>)}</div></section>
  </>
}

export default AdminModulePage
