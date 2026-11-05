import { useEffect, useState } from 'react'
import { Check, Plus, Search, Users, X } from 'lucide-react'
import { apiGet, apiPost } from '../../../api'

function BatchesWorkspace({ item }) {
  const [batches, setBatches] = useState([])
  const [courses, setCourses] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const loadData = () => Promise.all([
    apiGet('/academics/batches?limit=100'),
    apiGet('/academics/courses?limit=100'),
  ]).then(([batchResponse, courseResponse]) => {
    setBatches(batchResponse.data.items || [])
    setCourses(courseResponse.data.items || [])
  }).catch((requestError) => setError(requestError.message))

  useEffect(() => { loadData() }, [])

  const createBatch = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const { data } = await apiPost('/academics/batches', Object.fromEntries(form.entries()))
      setBatches((current) => [data.item, ...current])
      setShowForm(false)
      setError('')
    } catch (requestError) { setError(requestError.message) }
  }

  const filtered = batches.filter((batch) => {
    const matchesQuery = `${batch.name} ${batch.Course?.name || ''} ${batch.shift || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (statusFilter === 'ALL' || batch.status === statusFilter)
  })
  const activeCount = batches.filter((batch) => batch.status === 'ACTIVE').length
  const attentionCount = batches.filter((batch) => batch.status !== 'ACTIVE').length
  const completionRate = batches.length ? Math.round((activeCount / batches.length) * 100) : 0

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Manage cohort dates, shifts, mentors, and active enrollments.</p></div><button className="primary-button" onClick={() => setShowForm(true)}><Plus size={17} /> Manage records</button></section>
    {error && <div className="module-success error-note">{error}</div>}
    {showForm && <section className="panel module-form"><div className="module-form-heading"><div><p className="settings-kicker">The Prime Institute</p><h2>Create batch or cohort</h2><p>Assign a course, schedule, and enrollment capacity.</p></div><button className="icon-button" type="button" onClick={() => setShowForm(false)} aria-label="Close form"><X size={17} /></button></div><form onSubmit={createBatch}><div className="module-form-fields"><label>Course<select name="courseId" required defaultValue=""><option value="" disabled>Select course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label><label>Batch name<input name="name" placeholder="Python-06 Morning" required /></label><label>Shift<select name="shift" defaultValue="Morning"><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Weekend</option></select></label><label>Start date<input name="startDate" type="date" /></label><label>End date<input name="endDate" type="date" /></label><label>Capacity<input name="capacity" type="number" min="1" placeholder="30" /></label></div><div className="module-form-actions"><button type="button" className="ghost-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={15} /> Save batch</button></div></form></section>}
    <section className="module-hero"><div className="module-hero-icon"><Users size={24} /></div><div><p className="module-kicker">The Prime Institute</p><h2>Batches &amp; cohorts workspace</h2><p>Manage this area with clear ownership, consistent records, and permission-aware actions.</p></div><span className="module-access">Active records</span></section>
    <section className="module-stats"><article><span>Active records</span><strong>{activeCount}</strong><small><Check size={12} /> Updated today</small></article><article><span>Needs attention</span><strong>{attentionCount}</strong><small className="module-warning">Review queue</small></article><article><span>Completion rate</span><strong>{completionRate}%</strong><small><Check size={12} /> On track</small></article></section>
    <section className="panel module-table"><div className="panel-heading"><div><h2>All batches &amp; cohorts</h2><p>{batches.length} records in this institute</p></div><Users size={18} /></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search batches or courses" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className="filter-button" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option></select></div><div className="table-scroll"><table><thead><tr><th>Batch / cohort</th><th>Course</th><th>Shift</th><th>Dates</th><th>Enrollments</th><th>Status</th></tr></thead><tbody>{filtered.map((batch) => <tr key={batch.id}><td><strong>{batch.name}</strong></td><td>{batch.Course?.name || 'Course unavailable'}</td><td>{batch.shift || 'Not set'}</td><td>{batch.startDate || 'No start'} - {batch.endDate || 'No end'}</td><td>{batch.enrollmentCount}{batch.capacity ? ` / ${batch.capacity}` : ''}</td><td><span className={`status ${batch.status === 'ACTIVE' ? 'paid' : 'pending'}`}><i />{batch.status}</span></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state">No batches match your filters.</div>}</div></section>
  </>
}

export default BatchesWorkspace
