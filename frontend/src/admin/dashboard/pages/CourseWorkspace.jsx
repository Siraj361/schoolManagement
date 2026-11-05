import { useEffect, useState } from 'react'
import { BookOpen, Check, Eye, Pencil, Plus, Search, X } from 'lucide-react'
import { apiGet, apiPatch, apiPost } from '../../../api'

const suggestedCategories = ['IT & Technology', 'Diploma Programs', 'Linguistic Programs', 'CSS & CCE Preparation', 'Short Courses']

function CourseWorkspace({ item }) {
  const [courses, setCourses] = useState([])
  const [showForm, setShowForm] = useState(item.path.endsWith('/create'))
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [courseDuration, setCourseDuration] = useState(6)
  const [courseMonthlyFee, setCourseMonthlyFee] = useState('')
  const [editingCourse, setEditingCourse] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseStudents, setCourseStudents] = useState([])
  const [studentFilter, setStudentFilter] = useState('ALL')
  const [studentsLoading, setStudentsLoading] = useState(false)

  const loadCourses = () => apiGet('/academics/courses?limit=100').then(({ data }) => setCourses(data.items || [])).catch((requestError) => setError(requestError.message))
  useEffect(() => { loadCourses() }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setStudentsLoading(true)
    apiGet(`/academics/courses/${selectedCourse.id}/students?feeStatus=${studentFilter}`)
      .then(({ data }) => setCourseStudents(data.items || []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setStudentsLoading(false))
  }, [selectedCourse, studentFilter])

  const createCourse = async (event) => {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const monthlyFee = Number(form.get('monthlyFee'))
      const durationMonths = Number(form.get('durationMonths'))
      const values = { name: form.get('name'), slug: form.get('slug'), category: form.get('category'), description: form.get('description'), durationMonths, monthlyFeeMinor: monthlyFee * 100, totalFeeMinor: monthlyFee * durationMonths * 100 }
      if (editingCourse) {
        const { data } = await apiPatch(`/academics/courses/${editingCourse.id}`, values)
        setCourses((current) => current.map((course) => course.id === data.course.id ? data.course : course))
      } else {
        const { data } = await apiPost('/academics/courses', values)
        setCourses((current) => [data.course, ...current])
      }
      setEditingCourse(null)
      setShowForm(false)
    } catch (requestError) { setError(requestError.message) }
  }

  const startEditingCourse = (course) => {
    setEditingCourse(course)
    setCourseDuration(course.durationMonths)
    setCourseMonthlyFee(String((course.monthlyFeeMinor || 0) / 100))
    setShowForm(true)
    setError('')
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingCourse(null)
  }

  const filtered = courses.filter((course) => `${course.name} ${course.slug}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="course-workspace">
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Manage real courses that can be selected during student registration.</p></div><button className="primary-button" onClick={() => { setEditingCourse(null); setCourseDuration(6); setCourseMonthlyFee(''); setShowForm(true) }}><Plus size={17} /> Add course</button></section>
    {error && <div className="module-success" style={{ color: '#b44' }}>{error}</div>}
    {showForm && <section className="panel module-form"><div className="module-form-heading"><div><p className="settings-kicker">Academic setup</p><h2>{editingCourse ? 'Edit course' : 'Create course'}</h2><p>Total fee is calculated automatically from duration × monthly fee.</p></div><button className="icon-button" type="button" onClick={closeForm}>×</button></div><form key={editingCourse?.id || 'new-course'} onSubmit={createCourse}>
      <div className="module-form-fields">
        <label>Course name<input name="name" defaultValue={editingCourse?.name} placeholder="Full Stack Web Development" required /></label>
        <label>Slug<input name="slug" defaultValue={editingCourse?.slug} placeholder="full-stack-web-development" required /></label>
        <label>Category<input name="category" maxLength={100} defaultValue={editingCourse?.category} list="course-category-options" placeholder="Select or enter a category" required /><datalist id="course-category-options">{[...new Set([...suggestedCategories, ...courses.map((course) => course.category).filter(Boolean)])].map((category) => <option key={category} value={category} />)}</datalist></label>
        <label>Duration months<input name="durationMonths" type="number" min="1" value={courseDuration} onChange={(event) => setCourseDuration(Number(event.target.value) || 0)} required /></label>
        <label>Monthly fee (PKR)<input name="monthlyFee" type="number" min="1" value={courseMonthlyFee} onChange={(event) => setCourseMonthlyFee(event.target.value)} required /></label>
        <label>Total course fee (PKR)<input name="totalFee" value={(Number(courseMonthlyFee) || 0) * (Number(courseDuration) || 0)} readOnly /></label>
      </div>
      <label className="course-description-field">Description<textarea name="description" defaultValue={editingCourse?.description || ''} placeholder="Course description" /></label>
      <div className="module-form-actions"><button type="button" className="ghost-button" onClick={closeForm}>Cancel</button><button className="primary-button" type="submit"><Check size={15} /> {editingCourse ? 'Update course' : 'Save course'}</button></div>
    </form></section>}
    <section className="panel module-table"><div className="panel-heading"><div><h2>Course catalog</h2><p>{courses.length} courses in this institute</p></div><BookOpen size={18} /></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search courses" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="module-records"><div className="module-record-header"><span>Course</span><span>Fee plan</span><span>Status</span><span>Duration</span><span>Actions</span></div>{filtered.map((course) => <div className="module-record" key={course.id}><div className="module-record-name"><span className="module-record-icon"><BookOpen size={15} /></span><span><strong>{course.name}</strong><small>{course.category}</small></span></div><span>Rs {((course.totalFeeMinor || 0) / 100).toLocaleString()} total / Rs {((course.monthlyFeeMinor || 0) / 100).toLocaleString()} monthly</span><span className="module-record-status active"><i />{course.status}</span><small>{course.durationMonths} months</small><div className="course-record-actions"><button className="ghost-button" type="button" onClick={() => startEditingCourse(course)}><Pencil size={14} /> Edit</button><button className="ghost-button" type="button" onClick={() => { setSelectedCourse(course); setStudentFilter('ALL') }}><Eye size={15} /> View</button></div></div>)}</div></section>
    {selectedCourse && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedCourse(null)}><section className="modal course-students-modal"><div className="panel-heading"><div><p className="settings-kicker">{selectedCourse.name}</p><h2>Students and fee status</h2><p>Duration: {selectedCourse.durationMonths} months · Current month fee records for this course</p></div><button className="icon-button" type="button" aria-label="Close course students" onClick={() => setSelectedCourse(null)}><X size={17} /></button></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search students" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className="filter-button" value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}><option value="ALL">All fee status</option><option value="PAID">Paid</option><option value="UNPAID">Unpaid</option></select></div>{studentsLoading ? <div className="empty-state">Loading students...</div> : <div className="table-scroll"><table><thead><tr><th>Student</th><th>Student code</th><th>Due this month</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr></thead><tbody>{courseStudents.filter((student) => `${student.name} ${student.studentCode}`.toLowerCase().includes(query.toLowerCase())).map((student) => <tr key={student.id}><td><strong>{student.name}</strong></td><td>{student.studentCode}</td><td>Rs {(student.dueMinor / 100).toLocaleString('en-PK')}</td><td>Rs {(student.paidMinor / 100).toLocaleString('en-PK')}</td><td>Rs {(student.outstandingMinor / 100).toLocaleString('en-PK')}</td><td><span className={`status ${student.feeStatus.toLowerCase()}`}><i />{student.feeStatus}</span></td></tr>)}</tbody></table>{!courseStudents.length && <div className="empty-state">No students found for this fee filter.</div>}</div>}</section></div>}
  </div>
}

export default CourseWorkspace
