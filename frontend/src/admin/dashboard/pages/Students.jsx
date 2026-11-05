import { useState } from 'react'
import { BookOpen, CalendarDays, Check, ChevronDown, CircleDollarSign, MoreHorizontal, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { apiGet } from '../../../api'

const money = (minor = 0) => `Rs ${(Number(minor) / 100).toLocaleString('en-PK')}`

const Students = ({ students, courses, setShowModal, query, setQuery, onFetchStudent, onUpdateStudent }) => {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [error, setError] = useState('')
  const [feeSchedule, setFeeSchedule] = useState([])
  const [loadingFees, setLoadingFees] = useState(false)
  const filteredStudents = students.filter((student) => {
    const searchableText = `${student.name} ${student.id} ${student.fatherName || ''} ${student.mobileNumber || ''} ${student.className || ''}`.toLowerCase()
    const matchesSearch = searchableText.includes(query.toLowerCase())
    const matchesCourse = !selectedCourseId || student.courseId === selectedCourseId || student.Course?.id === selectedCourseId
    const isActive = student.status === 'Active' || student.status === 'ACTIVE'
    const matchesStatus = !selectedStatus || (selectedStatus === 'ACTIVE' ? isActive : !isActive)
    return matchesSearch && matchesCourse && matchesStatus
  })

  const saveStudent = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await onUpdateStudent(selectedStudent.studentId, {
        name: form.get('name'), fatherName: form.get('fatherName'), cnic: form.get('cnic'),
        mobileNumber: form.get('mobileNumber'), email: form.get('email') || null,
        emergencyMobileNumber: form.get('emergencyMobileNumber'), residentialAddress: form.get('residentialAddress'),
        shift: form.get('shift'), admissionFees: Number(form.get('admissionFees')) || 0,
        hasScholarship: form.get('hasScholarship') === 'on', scholarshipDetails: form.get('scholarshipDetails') || null,
        status: form.get('status'), registrationDate: form.get('registrationDate'),
      })
      setSelectedStudent(null)
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }

  const openStudent = async (student) => {
    setError('')
    setSelectedStudent(student)
    setLoadingStudent(true)
    setLoadingFees(true)
    try {
      const [freshStudentResponse, invoiceResponse] = await Promise.all([onFetchStudent(student.studentId), apiGet(`/fees/invoices?studentId=${student.studentId}&limit=100`)]);
      const freshStudent = freshStudentResponse
      setFeeSchedule(invoiceResponse.data.items || [])
      setSelectedStudent({ ...student, ...freshStudent, id: freshStudent.studentCode || student.id, className: freshStudent.Course?.name || student.className, status: freshStudent.status === 'ACTIVE' ? 'Active' : freshStudent.status === 'SUSPENDED' ? 'Disabled' : freshStudent.status, date: freshStudent.registrationDate })
    } catch (requestError) { setError(requestError.message) } finally { setLoadingStudent(false); setLoadingFees(false) }
  }

  return <>
    <section className="page-heading"><div><p className="eyebrow">Student directory</p><h1>Students</h1><p className="heading-subtitle">Manage student profiles, classes, and fee records.</p></div><button className="primary-button" onClick={() => setShowModal(true)}><Plus size={18} /> Add student</button></section>
    <section className="panel activity-panel standalone-panel"><div className="panel-heading table-heading"><div><h2>All students</h2><p>{filteredStudents.length} students enrolled this year</p></div><button className="filter-button"><SlidersHorizontal size={14} /> Filters</button></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search by student name, ID, father name, mobile" value={query} onChange={(event) => setQuery(event.target.value)} /></div><label className="course-filter"><BookOpen size={15} /><select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)} aria-label="Filter students by course"><option value="">All Courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select><ChevronDown size={15} /></label><label className="course-filter status-filter"><select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} aria-label="Filter students by status"><option value="">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select><ChevronDown size={15} /></label></div><div className="table-scroll"><table><thead><tr><th>Student</th><th>Course</th><th>Fee amount</th><th>Status</th><th>Admission date</th><th /></tr></thead><tbody>{filteredStudents.map((student) => <tr key={student.id}><td><div className="student-cell"><span className={`student-avatar ${student.color}`}>{student.initials}</span><div><strong>{student.name}</strong><small>{student.id}</small></div></div></td><td>{student.className}</td><td><strong>{student.amount}</strong></td><td><span className={`status ${student.status.toLowerCase()}`}><i />{student.status}</span></td><td>{student.date}</td><td><button className="row-menu" aria-label={`View or edit ${student.name}`} onClick={() => openStudent(student)} disabled={loadingStudent}><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table>{filteredStudents.length === 0 && <div className="empty-state">No students match your search.</div>}</div></section>
    {selectedStudent && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedStudent(null)}><div key={selectedStudent.updatedAt || selectedStudent.studentId} className="modal student-details-modal"><div className="modal-heading"><div><p className="settings-kicker">Student record</p><h2>{selectedStudent.name}</h2><p>{selectedStudent.id} · {selectedStudent.status}</p></div><button className="icon-button" type="button" onClick={() => setSelectedStudent(null)} aria-label="Close"><X size={19} /></button></div>{loadingStudent && <p className="registration-note">Loading latest student data...</p>}<form onSubmit={saveStudent}><div className="student-details-fields"><label>Student name<input name="name" defaultValue={selectedStudent.name} required /></label><label>Father name<input name="fatherName" defaultValue={selectedStudent.fatherName || ''} required /></label><label>CNIC<input name="cnic" defaultValue={selectedStudent.cnic || ''} required /></label><label>Mobile number<input name="mobileNumber" defaultValue={selectedStudent.mobileNumber || ''} required /></label><label>Email address<input name="email" type="email" defaultValue={selectedStudent.email || ''} /></label><label>Emergency mobile number<input name="emergencyMobileNumber" defaultValue={selectedStudent.emergencyMobileNumber || ''} required /></label><label className="student-details-wide">Residential address<input name="residentialAddress" defaultValue={selectedStudent.residentialAddress || ''} required /></label><label>Course<input value={selectedStudent.Course?.name || selectedStudent.className || ''} readOnly /></label><label>Duration<input value={selectedStudent.duration || `${selectedStudent.Course?.durationMonths || ''} months`} readOnly /></label><label>Shift<select name="shift" defaultValue={selectedStudent.shift || 'Morning'}><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Weekend</option></select></label><label>Admission fees<input name="admissionFees" type="number" min="0" step="0.01" defaultValue={selectedStudent.admissionFees || 0} /></label><label>Date of admission<input name="registrationDate" type="date" defaultValue={selectedStudent.registrationDate || ''} required /></label><label>Status<select name="status" defaultValue={selectedStudent.status === 'Active' ? 'ACTIVE' : selectedStudent.status === 'Disabled' ? 'SUSPENDED' : selectedStudent.status}><option value="ACTIVE">Active</option><option value="SUSPENDED">Disabled</option></select></label><label className="student-details-checkbox"><input name="hasScholarship" type="checkbox" defaultChecked={Boolean(selectedStudent.hasScholarship)} /> Scholarship given</label><label className="student-details-wide">Scholarship explanation<textarea name="scholarshipDetails" defaultValue={selectedStudent.scholarshipDetails || ''} /></label></div>{error && <p className="registration-note error-note">{error}</p>}<div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setSelectedStudent(null)}>Cancel</button><button className="primary-button" type="submit" disabled={saving || loadingStudent}>{saving ? 'Saving...' : loadingStudent ? 'Loading...' : 'Save changes'}</button></div></form><section className="student-fee-calendar"><div className="panel-heading"><div><h3><CalendarDays size={17} /> Fee calendar</h3><p>{loadingFees ? 'Loading month-wise fees...' : `${feeSchedule.length} months in course schedule`}</p></div></div><div className="fee-month-grid">{feeSchedule.map((invoice) => { const paid = invoice.status === 'PAID'; const partial = invoice.status === 'PARTIAL'; const upcoming = invoice.status === 'PENDING' && invoice.dueDate > new Date().toISOString().slice(0, 10); return <article className={`fee-month-card ${paid ? 'paid' : partial ? 'partial' : upcoming ? 'upcoming' : 'pending'}`} key={invoice.id}><div><strong>{invoice.sequenceNumber ? `Month ${invoice.sequenceNumber}` : invoice.description || 'Course fee'}</strong><small>{invoice.dueDate}</small></div><span>{paid ? <><Check size={14} /> Paid</> : partial ? <><CircleDollarSign size={14} /> Partial</> : upcoming ? 'Upcoming' : 'Pending'}</span><p>{money(invoice.amountMinor)}</p><small>{invoice.outstandingMinor > 0 ? `${money(invoice.outstandingMinor)} remaining` : 'Fully received'}</small></article> })}</div>{!loadingFees && !feeSchedule.length && <p className="registration-note">No fee schedule found for this student.</p>}</section></div></div>}
  </>
}

export default Students
