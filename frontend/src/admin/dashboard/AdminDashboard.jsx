import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import {
  Bell, BellRing, BookOpen, Building2, CalendarDays, Check, ChevronDown, CircleDollarSign, CreditCard, Download,
  ExternalLink, FileText, LayoutDashboard, Mail, Menu, MoreHorizontal, Phone, Plus, Search, Settings,
  ShieldCheck, SlidersHorizontal, Users, X,
} from 'lucide-react'
import './AdminDashboard.css'
import Overview from './pages/Overview'
import Students from './pages/Students'
import FeeCollection from './pages/FeeCollection'
import AdminModulePage from './pages/AdminModulePage'
import { itemByPath, navigationItems, navigationSections } from './navigation'
import { apiAssetUrl, apiGet, apiPatch, apiPost, apiUpdateUpload, apiUpload } from '../../api'

const localToday = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

const permissionForItem = (item) => {
  if (item.path === '/dashboard') return 'dashboard.read'
  if (item.path === '/settings/roles') return 'settings.permissions'
  if (item.path.startsWith('/settings/profile')) return 'settings.profile'
  if (item.path.startsWith('/settings/')) return 'module.read'
  if (item.path === '/students') return 'students.read'
  if (item.path.includes('/students/admissions')) return 'students.admissions.read'
  if (item.path.startsWith('/contact/messages')) return 'contact.messages.read'
  if (item.path.includes('/students/attendance')) return 'students.attendance.read'
  if (item.path.includes('/students/grades')) return 'students.grades.read'
  if (item.path.includes('/students/submissions')) return 'students.submissions.read'
  if (item.path.includes('/academics/courses')) return 'academics.courses.read'
  if (item.path.includes('/academics/programs')) return 'academics.programs.read'
  if (item.path.includes('/academics/batches/schedule')) return 'academics.batches.schedule.read'
  if (item.path.includes('/academics/batches')) return 'academics.batches.read'
  if (item.path.includes('/academics/labs')) return 'academics.labs.read'
  if (item.path.includes('/academics/certifications')) return 'academics.certifications.read'
  if (item.path.startsWith('/teachers/allocations')) return 'teachers.allocations.read'
  if (item.path.startsWith('/teachers/attendance')) return 'teachers.attendance.read'
  if (item.path.startsWith('/teachers/reviews')) return 'teachers.reviews.read'
  if (item.path.startsWith('/team/applications')) return 'team.applications.read'
  if (item.path.startsWith('/teachers')) return 'teachers.read'
  if (item.path.startsWith('/staff/attendance')) return 'staff.attendance.read'
  if (item.path.startsWith('/staff/leaves')) return 'staff.leaves.read'
  if (item.path.startsWith('/staff/payroll')) return 'staff.payroll.read'
  if (item.path.startsWith('/staff')) return 'staff.read'
  if (item.path.startsWith('/fees/expenses')) return 'fees.expenses.read'
  if (item.path.startsWith('/fees/invoices')) return 'fees.invoices.read'
  if (item.path.startsWith('/fees/defaulters')) return 'fees.defaulters.read'
  if (item.path.startsWith('/fees/scholarships')) return 'fees.scholarships.read'
  if (item.path.startsWith('/fees')) return 'fees.read'
  if (item.path.startsWith('/reports/financial')) return 'reports.financial.read'
  if (item.path.startsWith('/reports/academics')) return 'reports.academics.read'
  if (item.path.startsWith('/reports/retention')) return 'reports.retention.read'
  return 'reports.read'
}

const canAccess = (permissions, item) => permissions.includes('*') || permissions.includes(permissionForItem(item)) || permissions.includes('module.read')

function PageTitle({ eyebrow, title, subtitle, action }) {
  return <section className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="heading-subtitle">{subtitle}</p></div>{action}</section>
}

function SimpleFeeTable({ payments = [] }) {
  return <div className="table-scroll"><table><thead><tr><th>Student</th><th>Class</th><th>Fee amount</th><th>Status</th><th>Payment date</th><th /></tr></thead><tbody>{payments.map((student) => <tr key={student.id}><td><div className="student-cell"><span className="student-avatar violet">{student.name.split(' ').map((word) => word[0]).join('')}</span><div><strong>{student.name}</strong><small>{student.id}</small></div></div></td><td>{student.className}</td><td><strong>{student.amount}</strong></td><td><span className={`status ${student.status.toLowerCase()}`}><i />{student.status}</span></td><td>{student.date}</td><td><button className="row-menu" aria-label={`Actions for ${student.name}`}><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div>
}

function InnerPage({ active, students, setShowModal, query, setQuery }) {
  if (active === 'Students') return <><PageTitle eyebrow="Student directory" title="Students" subtitle="Manage student profiles, classes, and fee records." action={<button className="primary-button" onClick={() => setShowModal(true)}><Plus size={18} /> Add student</button>} /><section className="panel activity-panel standalone-panel"><div className="panel-heading table-heading"><div><h2>All students</h2><p>{students.length} students enrolled this year</p></div><button className="filter-button"><SlidersHorizontal size={14} /> Filters</button></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search students" value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="filter-button">All classes <ChevronDown size={15} /></button></div><SimpleFeeTable payments={students.filter((student) => `${student.name} ${student.id} ${student.className}`.toLowerCase().includes(query.toLowerCase()))} /></section></>

  if (active === 'Fee collection') return <><PageTitle eyebrow="Finance workspace" title="Fee collection" subtitle="Track incoming payments and follow up on outstanding balances." action={<button className="primary-button"><Download size={17} /> Export</button>} /><section className="stats-grid"><article className="stat-card"><div className="stat-top"><span>Collected this month</span><span className="stat-icon green"><Check size={18} /></span></div><strong>Rs 12,480</strong><p><b className="up">+12.5%</b> <span>from last month</span></p></article><article className="stat-card"><div className="stat-top"><span>Pending payments</span><span className="stat-icon orange"><CircleDollarSign size={18} /></span></div><strong>Rs 8,420</strong><p><span>34 invoices open</span></p></article><article className="stat-card"><div className="stat-top"><span>Overdue balance</span><span className="stat-icon purple"><FileText size={18} /></span></div><strong>Rs 2,180</strong><p><b className="down">8 families</b> <span>need attention</span></p></article></section><section className="panel activity-panel standalone-panel"><div className="panel-heading table-heading"><div><h2>Recent payments</h2><p>Every transaction from your school</p></div><button className="filter-button"><CalendarDays size={14} /> September 2026</button></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search payments" /></div><button className="filter-button">All statuses <ChevronDown size={15} /></button></div><SimpleFeeTable /></section></>

  if (active === 'Reports') return <><PageTitle eyebrow="Insights" title="Reports" subtitle="Understand collection trends and school performance." action={<button className="primary-button"><Download size={17} /> Export report</button>} /><section className="report-toolbar"><div><strong>Performance overview</strong><span>Academic year 2026 - 2027</span></div><div><button className="filter-button"><CalendarDays size={14} /> Sep 01 - Sep 07, 2026 <ChevronDown size={14} /></button><button className="filter-button"><SlidersHorizontal size={14} /> Filters</button></div></section><section className="report-overview"><article className="panel report-hero"><div className="report-hero-heading"><div><p className="report-label">Total revenue</p><strong>Rs 51,100</strong><span className="report-trend"><Check size={12} /> 9.4% vs last term</span></div><span className="report-icon purple"><CircleDollarSign size={19} /></span></div><div className="report-chart"><div className="report-chart-y"><span>Rs 15k</span><span>Rs 10k</span><span>Rs 5k</span><span>Rs 0</span></div><div className="report-chart-bars">{[42, 58, 48, 72, 64, 86].map((height, index) => <div className="report-chart-col" key={height}><span style={{ height: `${height}%` }} /><small>{['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][index]}</small></div>)}</div></div></article><article className="panel collection-health"><div className="panel-heading"><div><h2>Collection health</h2><p>Current academic year</p></div><MoreHorizontal size={18} /></div><div className="health-ring"><div><strong>83.5%</strong><small>collected</small></div></div><div className="health-legend"><span><i className="green-dot" />Collected <b>Rs 42,680</b></span><span><i className="orange-dot" />Pending <b>Rs 8,420</b></span><span><i className="gray-dot" />Overdue <b>Rs 2,180</b></span></div></article></section><section className="report-kpis"><article className="report-kpi"><span className="report-icon green"><Users size={18} /></span><div><p>Paying students</p><strong>412 <small>/ 486</small></strong><span className="up">84.8% participation</span></div></article><article className="report-kpi"><span className="report-icon orange"><FileText size={18} /></span><div><p>Outstanding invoices</p><strong>42</strong><span className="down">Needs follow-up</span></div></article><article className="report-kpi"><span className="report-icon purple"><CircleDollarSign size={18} /></span><div><p>Average payment</p><strong>Rs 1,245</strong><span className="up">+6.2% this month</span></div></article></section><section className="panel report-library"><div className="report-library-heading"><div><h2>Report library</h2><p>Download ready-to-share summaries for your school team.</p></div><button className="filter-button">All reports <ChevronDown size={14} /></button></div>{[['Monthly collection summary', 'Revenue and payment activity', 'Updated Sep 07, 2026', 'green'], ['Outstanding fee report', 'Pending invoices by student', 'Updated Sep 05, 2026', 'orange'], ['Class-wise performance', 'Collection rate by class', 'Updated Sep 01, 2026', 'purple']].map(([report, description, date, color]) => <div className="report-library-row" key={report}><span className={`report-file ${color}`}><FileText size={17} /></span><div className="report-library-copy"><strong>{report}</strong><span>{description}</span><small>{date}</small></div><span className="report-ready"><Check size={12} /> Ready</span><button className="icon-button" aria-label={`Download ${report}`}><Download size={17} /></button></div>)}</section></>

  if (active === 'Classes') return <><PageTitle eyebrow="Academic setup" title="Classes" subtitle="Organize grades, sections, and their fee plans." action={<button className="primary-button"><Plus size={18} /> Add class</button>} /><section className="class-summary"><div><span className="class-summary-icon"><BookOpen size={17} /></span><p>Total classes</p><strong>06</strong><small>Across 4 grades</small></div><div><span className="class-summary-icon gold"><Users size={17} /></span><p>Enrolled students</p><strong>162</strong><small>+12 this term</small></div><div><span className="class-summary-icon green"><CircleDollarSign size={17} /></span><p>Average annual fee</p><strong>Rs 1,000</strong><small>Across all classes</small></div></section><div className="class-list-heading"><div><h2>All classes</h2><p>Manage sections and annual fee plans</p></div><button className="filter-button">Academic year <ChevronDown size={15} /></button></div><section className="class-grid">{[['Grade 10 - A', '32 students', 'Rs 1,480', 'blue', '78%'], ['Grade 8 - A', '28 students', 'Rs 1,250', 'violet', '68%'], ['Grade 7 - C', '30 students', 'Rs 920', 'yellow', '74%'], ['Grade 6 - B', '26 students', 'Rs 850', 'coral', '63%'], ['Grade 5 - A', '24 students', 'Rs 780', 'green', '58%'], ['Grade 4 - B', '22 students', 'Rs 720', 'blue', '52%']].map(([name, count, fee, color, progress]) => <article className="class-card" key={name}><div className="class-card-top"><div className={`class-badge ${color}`}><BookOpen size={18} /></div><button className="icon-button" aria-label={`More actions for ${name}`}><MoreHorizontal size={18} /></button></div><div className="class-card-title"><div><h2>{name}</h2><p>Primary section</p></div><span className={`class-status ${color}`}>Active</span></div><div className="class-card-meta"><span><Users size={14} />{count}</span><span><CircleDollarSign size={14} />{fee}<small>/ year</small></span></div><div className="class-progress"><div><span>Fee collection</span><strong>{progress}</strong></div><i><b style={{ width: progress }} /></i></div><button className="class-manage">Manage class <span>→</span></button></article>)}</section></>

  return <><PageTitle eyebrow="Workspace preferences" title="Settings" subtitle="Keep your school profile and account preferences up to date." /><section className="settings-layout"><nav className="settings-tabs" aria-label="Settings sections"><button className="settings-tab active"><Settings size={16} /><span>School profile</span><small>Public details</small></button><button className="settings-tab"><BellRing size={16} /><span>Notifications</span><small>Alert preferences</small></button><button className="settings-tab"><CreditCard size={16} /><span>Billing &amp; plan</span><small>Subscription</small></button></nav><form className="panel settings-form" onSubmit={(event) => event.preventDefault()}><div className="settings-form-header"><div><p className="settings-kicker">The Prime Institute</p><h2>School profile</h2><p>These details appear on receipts, reports, and payment reminders.</p></div><div className="profile-status"><span />Profile complete</div></div><div className="settings-section"><div className="settings-section-title"><span className="settings-section-icon"><Settings size={16} /></span><div><h3>General information</h3><p>Tell families how to identify your institution.</p></div></div><div className="settings-fields"><label>School name<input defaultValue="The Prime" /></label><label>Academic year<select defaultValue="2026-2027"><option>2026-2027</option><option>2025-2026</option></select></label></div></div><div className="settings-section"><div className="settings-section-title"><span className="settings-section-icon"><Mail size={16} /></span><div><h3>Contact details</h3><p>Used for receipts and school communication.</p></div></div><div className="settings-fields"><label>School email<input type="email" defaultValue="admin@theprime.edu" /></label><label>Phone number<div className="settings-input-icon"><Phone size={15} /><input defaultValue="+1 (555) 014-2088" /></div></label></div></div><div className="settings-form-footer"><span>Last updated today</span><button className="primary-button" type="submit"><Check size={16} /> Save changes</button></div></form><aside className="settings-aside"><div className="settings-identity"><img src="/the-prime-logo.svg" alt="The Prime logo" /><h2>The Prime</h2><p>Institute of Science &amp; Technology</p><span className="settings-badge">Active workspace</span></div><div className="settings-aside-list"><div><CalendarDays size={16} /><span>Academic year<strong>2026 - 2027</strong></span></div><div><Mail size={16} /><span>Primary contact<strong>admin@theprime.edu</strong></span></div></div></aside></section></>
}

function AdminDashboard({ onLogout }) {
  const [students, setStudents] = useState([])
  const [query, setQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [permissions, setPermissions] = useState(() => JSON.parse(localStorage.getItem('prime_permissions') || '[]'))
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('prime_user') || 'null'))
  const [showProfile, setShowProfile] = useState(false)
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState('')
  const [hasScholarship, setHasScholarship] = useState(false)
  const [overviewData, setOverviewData] = useState(null)
  const [overviewMonth, setOverviewMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [pendingFeeCount, setPendingFeeCount] = useState(0)
  const [sidebarCounts, setSidebarCounts] = useState({ teamApplications: 0, contactMessages: 0 })
  const [institute, setInstitute] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const activeItem = itemByPath[location.pathname] || itemByPath['/dashboard']
  const active = activeItem.label
  const visibleSections = navigationSections.map((section) => ({ ...section, items: section.items.filter((item) => canAccess(permissions, item)) })).filter((section) => section.items.length)

  useEffect(() => {
    let active = true
    const loadSidebarCounts = () => {
      const requests = []
      if (canAccess(permissions, itemByPath['/team/applications'])) {
        requests.push(apiGet('/team/applications?limit=1').then(({ data }) => {
          if (active) setSidebarCounts((counts) => ({ ...counts, teamApplications: Number(data.total) || 0 }))
        }).catch((error) => console.error('Could not load team application count:', error)))
      }
      if (canAccess(permissions, itemByPath['/contact/messages'])) {
        requests.push(apiGet('/contact/messages?limit=1').then(({ data }) => {
          if (active) setSidebarCounts((counts) => ({ ...counts, contactMessages: Number(data.total) || 0 }))
        }).catch((error) => console.error('Could not load contact message count:', error)))
      }
      return Promise.all(requests)
    }

    loadSidebarCounts()
    const refreshTimer = window.setInterval(loadSidebarCounts, 30000)
    return () => {
      active = false
      window.clearInterval(refreshTimer)
    }
  }, [permissions])

  useEffect(() => {
    apiGet('/auth/me').then(({ data }) => {
      const freshPermissions = data.permissions || []
      setPermissions(freshPermissions)
      localStorage.setItem('prime_permissions', JSON.stringify(freshPermissions))
      if (data.user) {
        setCurrentUser(data.user)
        localStorage.setItem('prime_user', JSON.stringify(data.user))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    apiGet('/institutes/profile').then(({ data }) => setInstitute(data.institute)).catch(() => {})
    const updateInstitute = (event) => setInstitute(event.detail)
    window.addEventListener('institute-profile-updated', updateInstitute)
    return () => window.removeEventListener('institute-profile-updated', updateInstitute)
  }, [])

  useEffect(() => {
    if (location.pathname === '/landing') return
    if (!itemByPath[location.pathname]) navigate('/dashboard', { replace: true })
  }, [location.pathname, navigate])

  useEffect(() => {
    let active = true
    const formatFeeAmount = (student) => {
      const feeMinor = Number(student?.Course?.monthlyFeeMinor || student?.Course?.totalFeeMinor || 0)
      if (!student?.Course || feeMinor <= 0) return 'Not assigned'
      return `Rs ${(feeMinor / 100).toLocaleString('en-PK')}`
    }

    apiGet('/students?limit=100').then(({ data }) => {
      if (!active || !data?.items) return
      setStudents(data.items.map((student) => ({
        ...student,
        studentId: student.id,
        id: student.studentCode,
        className: student.Course?.name || 'Course not assigned',
        amount: formatFeeAmount(student),
        status: student.status === 'ACTIVE' ? 'Active' : student.status === 'SUSPENDED' ? 'Disabled' : student.status,
        date: student.registrationDate,
        photoUrl: apiAssetUrl(student.photoUrl),
        initials: student.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase(),
        color: 'violet',
      })))
    }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    setCoursesLoading(true)
    apiGet('/academics/courses?limit=100').then(({ data }) => {
      setCourses(data.items || [])
      setCoursesError('')
    }).catch((error) => setCoursesError(error.message)).finally(() => setCoursesLoading(false))
  }, [])

  useEffect(() => {
    apiGet('/academics/batches?limit=250').then(({ data }) => {
      setBatches((data.items || []).map((batch) => ({ ...batch, courseId: batch.courseId || batch.Course?.id })))
    }).catch(() => setBatches([]))
  }, [])

  useEffect(() => {
    if (!showModal) return undefined
    const syncBatchShift = (event) => {
      if (event.target.name !== 'batchId') return
      const batch = batches.find((item) => item.id === event.target.value)
      const shift = event.target.form?.elements?.shift
      if (batch?.shift && shift) shift.value = batch.shift
    }
    document.addEventListener('change', syncBatchShift)
    return () => document.removeEventListener('change', syncBatchShift)
  }, [batches, showModal])

  useEffect(() => {
    if (!showModal) return undefined
    const fields = [{ name: 'cnic', length: 13 }, { name: 'mobileNumber', length: 11 }, { name: 'emergencyMobileNumber', length: 11 }]
    const inputs = fields.map(({ name, length }) => {
      const input = document.querySelector(`.student-registration-modal input[name="${name}"]`)
      if (!input) return null
      input.type = 'number'
      input.inputMode = 'numeric'
      input.maxLength = length
      input.min = '0'
      input.max = '9'.repeat(length)
      const limitDigits = () => {
        const digits = input.value.replace(/\D/g, '').slice(0, length)
        if (input.value !== digits) input.value = digits
      }
      input.addEventListener('input', limitDigits)
      return { input, limitDigits }
    })
    return () => inputs.forEach((item) => item?.input.removeEventListener('input', item.limitDigits))
  }, [showModal])

  useEffect(() => {
    if (!showModal) return undefined
    const emailInput = document.querySelector('.student-registration-modal input[name="email"]')
    if (!emailInput || document.querySelector('.student-registration-modal input[name="loginPassword"]')) return undefined
    const label = document.createElement('label')
    label.textContent = 'Portal password'
    const passwordInput = document.createElement('input')
    passwordInput.name = 'loginPassword'
    passwordInput.type = 'password'
    passwordInput.required = true
    passwordInput.minLength = 8
    passwordInput.placeholder = 'Enter at least 8 characters'
    label.appendChild(passwordInput)
    emailInput.closest('label')?.after(label)
    return () => label.remove()
  }, [showModal])

  useEffect(() => {
    apiGet(`/dashboard/overview?month=${overviewMonth}`).then(({ data }) => setOverviewData(data)).catch(() => {})
  }, [overviewMonth])

  useEffect(() => {
    let active = true
    const loadPendingFeeCount = () => {
      apiGet('/fees/defaulters').then(({ data }) => {
        if (active) setPendingFeeCount((data.items || []).length)
      }).catch(() => {})
    }
    loadPendingFeeCount()
    const refresh = window.setInterval(loadPendingFeeCount, 30000)
    return () => {
      active = false
      window.clearInterval(refresh)
    }
  }, [])

  const filteredStudents = students.filter((student) =>
    `${student.name} ${student.id} ${student.className}`.toLowerCase().includes(query.toLowerCase()),
  )

  const updateProfile = async (event) => {
    event.preventDefault()
    try {
      const { data } = await apiUpdateUpload('/auth/me', new FormData(event.currentTarget))
      setCurrentUser(data.user)
      localStorage.setItem('prime_user', JSON.stringify(data.user))
      setShowProfile(false)
      setToast('Profile updated successfully')
      window.setTimeout(() => setToast(''), 2800)
    } catch (error) {
      setToast(error.message)
      window.setTimeout(() => setToast(''), 2800)
    }
  }

  const signOut = async () => {
    try { await apiPost('/auth/logout', {}) } catch {}
    onLogout()
  }

  const addStudent = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const numberFields = ['cnic', 'mobileNumber', 'emergencyMobileNumber']
    if (numberFields.some((field) => !/^\d+$/.test(String(form.get(field) || '')))) {
      setToast('CNIC and mobile numbers must contain digits only')
      window.setTimeout(() => setToast(''), 2800)
      return
    }
    form.set('courseId', form.get('course'))
    form.delete('course')
    try {
      const result = await apiUpload('/students', form)
      const student = result.data.student
      const formatFeeAmount = (item) => {
        const feeMinor = Number(item?.Course?.monthlyFeeMinor || item?.Course?.totalFeeMinor || 0)
        if (!item?.Course || feeMinor <= 0) return 'Not assigned'
        return `Rs ${(feeMinor / 100).toLocaleString('en-PK')}`
      }
      const newStudent = { ...student, studentId: student.id, name: student.name, fatherName: student.fatherName, course: student.Course?.name || form.get('course'), id: student.studentCode, className: student.Course?.name || form.get('course'), amount: 'Not assigned', status: 'Active', date: student.registrationDate, registrationDate: student.registrationDate, expiryDate: student.expiryDate, photoUrl: apiAssetUrl(student.photoUrl), initials: student.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase(), color: 'green' }
      const newStudentMapped = { ...newStudent, amount: formatFeeAmount(student) }
      setStudents((current) => [newStudentMapped, ...current])
      setShowModal(false)
      setSelectedCourse(null)
      setHasScholarship(false)
      setSelectedStudent(newStudent)
      setToast(`${student.name} was added successfully${result.data.accountCreated ? ` | Login: ${student.email} | Password: ${result.data.temporaryPassword}` : ''}`)
      window.setTimeout(() => setToast(''), 2800)
    } catch (error) {
      setToast(error.message)
      window.setTimeout(() => setToast(''), 2800)
    }
  }

  const updateStudent = async (studentId, changes) => {
    const { data } = await apiPatch(`/students/${studentId}`, changes)
    const updated = data.student
    setStudents((current) => current.map((student) => student.studentId === updated.id ? { ...student, ...updated, id: updated.studentCode, className: updated.Course?.name || student.className, status: updated.status === 'ACTIVE' ? 'Active' : updated.status === 'SUSPENDED' ? 'Disabled' : updated.status, date: updated.registrationDate } : student))
  }

  const fetchStudent = async (studentId) => {
    const { data } = await apiGet(`/students/${studentId}`)
    return data.student
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
        <div className="brand"><img src={institute?.logoUrl ? apiAssetUrl(institute.logoUrl) : '/the-prime-logo.svg'} alt={`${institute?.shortName || 'Institute'} logo`} /></div>
        <div className="workspace-switcher-wrap">
          <button className="school-switcher" onClick={() => setShowWorkspaceMenu((current) => !current)} aria-expanded={showWorkspaceMenu} aria-label="Open institute workspace menu"><div className="school-avatar">{institute?.logoUrl ? <img src={apiAssetUrl(institute.logoUrl)} alt="" /> : (institute?.shortName || 'TP').slice(0, 2).toUpperCase()}</div><div><strong>{institute?.shortName || 'The Prime'}</strong><small>Admin workspace</small></div><ChevronDown size={16} /></button>
          {showWorkspaceMenu && <div className="workspace-menu"><div className="workspace-menu-heading"><div className="workspace-menu-avatar">{institute?.logoUrl ? <img src={apiAssetUrl(institute.logoUrl)} alt="" /> : (institute?.shortName || 'TP').slice(0, 2).toUpperCase()}</div><div><strong>{institute?.shortName || 'The Prime'}</strong><small>Admin workspace</small></div></div><div className="workspace-menu-status"><i /> Active institute workspace</div><button onClick={() => { navigate('/settings/profile'); setShowWorkspaceMenu(false); setMobileNav(false) }}><Building2 size={15} /> Institute profile</button><button onClick={() => { window.open('/landing', '_blank', 'noopener,noreferrer'); setShowWorkspaceMenu(false) }}><ExternalLink size={15} /> View public landing page</button></div>}
        </div>
        <nav className="primary-nav" aria-label="Main navigation">
          {visibleSections.map((section) => <div className="nav-section" key={section.label}><p className="nav-label">{section.label}</p>{section.items.map(({ label, path, icon: Icon }) => {
            const count = path === '/team/applications' ? sidebarCounts.teamApplications : path === '/contact/messages' ? sidebarCounts.contactMessages : path === '/fees' ? pendingFeeCount : 0
            return <button className={activeItem.path === path ? 'nav-item active' : 'nav-item'} key={path} onClick={() => { navigate(path); setMobileNav(false) }}><Icon size={16} /><span>{label}</span>{count > 0 && <span className="nav-count">{count > 99 ? '99+' : count}</span>}</button>
          })}</div>)}
        </nav>
        <div className="sidebar-footer"><div className="help-icon">?</div><div><strong>Need a hand?</strong><small>Visit the help center</small></div><ChevronDown size={15} /></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="icon-button menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button><div className="breadcrumb"><span>The Prime</span><span>/</span><strong>{active}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button><button className="user-menu-trigger" onClick={() => setShowUserMenu((current) => !current)} aria-expanded={showUserMenu}>{currentUser?.avatarUrl ? <img className="user-avatar user-avatar-image" src={apiAssetUrl(currentUser.avatarUrl)} alt="" /> : <div className="user-avatar">{currentUser ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}` : 'U'}</div>}<div className="user-name"><strong>{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User'}</strong><small>{currentUser?.role ? currentUser.role.replaceAll('_', ' ') : 'User'}</small></div><ChevronDown size={16} /></button>{showUserMenu && <div className="user-menu"><div className="user-menu-heading"><strong>{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User'}</strong><small>{currentUser?.email || ''}</small></div><button onClick={() => { setShowProfile(true); setShowUserMenu(false) }}>My profile</button><button onClick={() => { setShowProfile(true); setShowUserMenu(false) }}>Account settings</button><button className="user-menu-signout" onClick={signOut}>Sign out</button></div>}</div></header>
        <div className="page-body">
          {location.pathname === '/dashboard' && <Overview students={students} query={query} setQuery={setQuery} overviewData={overviewData} currentUser={currentUser} selectedMonth={overviewMonth} onMonthChange={setOverviewMonth} />}
          {location.pathname === '/students' && <Students students={students} courses={courses} setShowModal={setShowModal} query={query} setQuery={setQuery} onFetchStudent={fetchStudent} onUpdateStudent={updateStudent} />}
          {location.pathname !== '/dashboard' && location.pathname !== '/students' && <AdminModulePage item={activeItem} />}
          {false && active === 'Overview' && <>
          <section className="page-heading"><div><p className="eyebrow">Monday, September 7, 2026</p><h1>Good morning, Jordan <span>✦</span></h1><p className="heading-subtitle">Here is what is happening with your school today.</p></div></section>

          <section className="stats-grid" aria-label="School statistics">
            <article className="stat-card"><div className="stat-top"><span>Total students</span><span className="stat-icon purple"><Users size={18} /></span></div><strong>486</strong><p><b className="up">+8.2%</b> <span>from last month</span></p></article>
            <article className="stat-card"><div className="stat-top"><span>Fees collected</span><span className="stat-icon green"><CircleDollarSign size={18} /></span></div><strong>Rs 42,680</strong><p><b className="up">+12.5%</b> <span>from last month</span></p></article>
            <article className="stat-card"><div className="stat-top"><span>Pending payments</span><span className="stat-icon orange"><FileText size={18} /></span></div><strong>Rs 8,420</strong><p><b className="down">-4.1%</b> <span>from last month</span></p></article>
            <article className="stat-card"><div className="stat-top"><span>Collection rate</span><span className="stat-icon blue"><ShieldCheck size={18} /></span></div><strong>83.5%</strong><p><b className="up">+3.7%</b> <span>from last month</span></p></article>
          </section>

          <section className="dashboard-grid"><article className="panel chart-panel"><div className="panel-heading"><div><h2>Fee collection</h2><p>Monthly revenue across all grades</p></div><button className="select-button">Last 6 months <ChevronDown size={15} /></button></div><div className="chart-wrap"><div className="chart-y"><span>Rs 50k</span><span>Rs 40k</span><span>Rs 30k</span><span>Rs 20k</span><span>Rs 10k</span><span>Rs 0</span></div><div className="chart"><div className="grid-lines"><i /><i /><i /><i /><i /><i /></div><div className="bars">{[58, 70, 54, 76, 66, 88].map((height, index) => <div className="bar-col" key={height}><div className="bar" style={{ height: `${height}%` }}><span>Rs ${[31, 38, 29, 42, 36, 48][index]}k</span></div><small>{['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][index]}</small></div>)}</div></div></div></article><article className="panel balance-panel"><div className="panel-heading"><div><h2>Payment status</h2><p>Current academic year</p></div><MoreHorizontal size={20} /></div><div className="donut-wrap"><div className="donut"><div><strong>83.5%</strong><small>collected</small></div></div></div><div className="legend"><span><i className="dot green-dot" />Paid <b>Rs 42,680</b></span><span><i className="dot orange-dot" />Pending <b>Rs 8,420</b></span><span><i className="dot gray-dot" />Overdue <b>Rs 2,180</b></span></div></article></section>

          <section className="panel activity-panel"><div className="panel-heading table-heading"><div><h2>Recent students</h2><p>Latest student fee activity</p></div><button className="ghost-button">View all <span>→</span></button></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search students" value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="filter-button">All classes <ChevronDown size={15} /></button></div><div className="table-scroll"><table><thead><tr><th>Student</th><th>Class</th><th>Fee amount</th><th>Status</th><th>Payment date</th><th /></tr></thead><tbody>{filteredStudents.map((student) => <tr key={student.id}><td><div className="student-cell"><span className={`student-avatar ${student.color}`}>{student.initials}</span><div><strong>{student.name}</strong><small>{student.id}</small></div></div></td><td>{student.className}</td><td><strong>{student.amount}</strong></td><td><span className={`status ${student.status.toLowerCase()}`}><i />{student.status}</span></td><td>{student.date}</td><td><button className="row-menu" aria-label={`Actions for ${student.name}`}><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table>{filteredStudents.length === 0 && <div className="empty-state">No students match your search.</div>}</div></section>
          </>}
        </div>
      </main>

      {showModal && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowModal(false)}><div className="modal student-registration-modal"><div className="modal-heading"><div><p className="settings-kicker">The Prime Institute</p><h2>Register a student</h2><p>Create the student profile and generate the course fee schedule.</p></div><button className="icon-button" onClick={() => setShowModal(false)} aria-label="Close"><X size={19} /></button></div><form onSubmit={addStudent}><div className="registration-fields"><label>Student name<input name="name" placeholder="e.g. Jamie Lee" required /></label><label>Father name<input name="fatherName" placeholder="e.g. Ahmed Khan" required /></label><label>CNIC<input name="cnic" placeholder="e.g. 35202-1234567-1" required /></label><label>Mobile number<input name="mobileNumber" type="tel" placeholder="e.g. 0300-1234567" required /></label><label>Email address<input name="email" type="email" placeholder="student@example.com" /></label><label>Emergency mobile number<input name="emergencyMobileNumber" type="tel" placeholder="e.g. 0301-1234567" required /></label><label className="registration-wide-field">Residential address<input name="residentialAddress" placeholder="House, street, city" required /></label><label>Course<select name="course" required defaultValue="" onChange={(event) => setSelectedCourse(courses.find((course) => course.id === event.target.value) || null)} disabled={coursesLoading || Boolean(coursesError)}><option value="" disabled>{coursesLoading ? 'Loading courses...' : coursesError ? 'Course API unavailable' : courses.length ? 'Select a course from database' : 'No courses found'}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name} - {course.durationMonths} months - Rs {((course.monthlyFeeMinor || 0) / 100).toLocaleString()}/month</option>)}</select></label><label>Batch<select name="batchId" required defaultValue="" disabled={!selectedCourse}><option value="">{selectedCourse ? 'Select a batch from database' : 'Select a course first'}</option>{batches.filter((batch) => batch.courseId === selectedCourse?.id && batch.status === 'ACTIVE').map((batch) => <option key={batch.id} value={batch.id}>{batch.name}{batch.shift ? ` - ${batch.shift}` : ''}</option>)}</select></label><label>Duration<input name="duration" value={selectedCourse ? `${selectedCourse.durationMonths} months` : ''} placeholder="Select a course first" readOnly required /></label><label>Monthly fee<input value={selectedCourse ? `Rs ${((selectedCourse.monthlyFeeMinor || 0) / 100).toLocaleString()}` : ''} placeholder="Select a course first" readOnly /></label><label>Total course fee<input value={selectedCourse ? `Rs ${((selectedCourse.totalFeeMinor || 0) / 100).toLocaleString()}` : ''} placeholder="Select a course first" readOnly /></label><label>Shift<select name="shift" defaultValue="Morning" required><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Weekend</option></select></label><label>Admission fees<input name="admissionFees" type="number" min="0" step="0.01" placeholder="0" required /></label><label>Date of admission<input name="registrationDate" type="date" defaultValue={localToday()} required /></label><label className="registration-photo-field">Profile image<input name="photo" type="file" accept="image/png,image/jpeg,image/webp" /></label><label className="registration-checkbox"><input name="hasScholarship" type="checkbox" checked={hasScholarship} onChange={(event) => setHasScholarship(event.target.checked)} />Any scholarship given?</label>{hasScholarship && <label className="registration-wide-field">Scholarship explanation<textarea name="scholarshipDetails" placeholder="Explain the scholarship" required /></label>}</div>{coursesError && <p className="registration-note">{coursesError}. Restart the backend and try again.</p>}<p className="registration-note">Course, batch, and duration come from the database. Registration automatically creates one invoice for every course month.</p><div className="modal-actions"><button type="button" className="ghost-button" onClick={() => { setHasScholarship(false); setSelectedCourse(null); setShowModal(false) }}>Cancel</button><button className="primary-button" type="submit" disabled={coursesLoading || !courses.length}>Register &amp; create schedule</button></div></form></div></div>}
      {showProfile && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowProfile(false)}><div className="modal profile-modal"><div className="modal-heading"><div><p className="settings-kicker">Account settings</p><h2>Update profile</h2><p>Update your name, email, image, or password.</p></div><button className="icon-button" onClick={() => setShowProfile(false)} aria-label="Close"><X size={19} /></button></div><form onSubmit={updateProfile}><label>First name<input name="firstName" defaultValue={currentUser?.firstName || ''} required /></label><label>Last name<input name="lastName" defaultValue={currentUser?.lastName || ''} required /></label><label>Email<input name="email" type="email" defaultValue={currentUser?.email || ''} required /></label><label>Profile image<input name="avatar" type="file" accept="image/png,image/jpeg,image/webp" /></label><label>Current password<input name="currentPassword" type="password" placeholder="Required only for password change" /></label><label>New password<input name="newPassword" type="password" minLength="8" placeholder="Leave empty to keep current password" /></label><div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setShowProfile(false)}>Cancel</button><button className="primary-button" type="submit">Save profile</button></div></form></div></div>}
      {selectedStudent && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedStudent(null)}><div className="student-id-card"><button className="icon-button student-id-close" onClick={() => setSelectedStudent(null)} aria-label="Close student ID card"><X size={18} /></button><div className="student-id-header"><img src="/the-prime-logo.svg" alt="The Prime logo" /><div><strong>The Prime</strong><small>Institute of Science &amp; Technology</small></div></div><div className="student-id-body"><div className="student-id-avatar">{selectedStudent.photoUrl ? <img src={selectedStudent.photoUrl} alt={`${selectedStudent.name} profile`} /> : selectedStudent.initials}</div><div className="student-id-main"><div><p className="student-id-label">Student identity card</p><h2>{selectedStudent.name}</h2><span className="student-id-number">{selectedStudent.id}</span></div><div className="student-id-qr"><QRCodeCanvas value={JSON.stringify({ institute: 'The Prime Institute of Science & Technology', studentId: selectedStudent.id, name: selectedStudent.name, fatherName: selectedStudent.fatherName, course: selectedStudent.course, registered: selectedStudent.registrationDate, expires: selectedStudent.expiryDate })} size={82} bgColor="#ffffff" fgColor="#30356f" level="M" /><small>Scan to verify</small></div></div><div className="student-id-details"><span>Father name<strong>{selectedStudent.fatherName}</strong></span><span>Course<strong>{selectedStudent.course}</strong></span><span>Registered<strong>{selectedStudent.registrationDate}</strong></span><span>Expires<strong>{selectedStudent.expiryDate}</strong></span></div></div><div className="student-id-footer"><span>The Prime student record</span><span className="student-id-mark"><ShieldCheck size={14} /> Verified</span></div><button className="primary-button student-id-print" onClick={() => window.print()}><Download size={15} /> Print ID card</button></div></div>}
      {toast && <div className="toast"><ShieldCheck size={18} />{toast}</div>}
    </div>
  )
}

export default AdminDashboard
