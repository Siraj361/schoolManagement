import { useEffect, useState } from 'react'
import { CalendarDays, Check, Plus, Search, UserPlus, X } from 'lucide-react'
import { apiGet, apiPost } from '../../../api'

const stageLabels = { NEW: 'New inquiry', CONTACTED: 'Contacted', COUNSELLING: 'Counselling scheduled', REGISTERED: 'Registered', OFFER_SENT: 'Offer sent' }

function AdmissionsWorkspace({ item }) {
  const [inquiries, setInquiries] = useState([])
  const [courses, setCourses] = useState([])
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const loadData = () => Promise.all([apiGet('/admissions/inquiries?limit=250'), apiGet('/academics/courses?limit=100')]).then(([inquiryResponse, courseResponse]) => {
    setInquiries(inquiryResponse.data.items || [])
    setCourses(courseResponse.data.items || [])
  }).catch((requestError) => setError(requestError.message))
  useEffect(() => { loadData() }, [])

  const createInquiry = async (event) => {
    event.preventDefault()
    try {
      const { data } = await apiPost('/admissions/inquiries', Object.fromEntries(new FormData(event.currentTarget).entries()))
      setInquiries((current) => [data.item, ...current])
      setShowForm(false)
      setError('')
    } catch (requestError) { setError(requestError.message) }
  }

  const filtered = inquiries.filter((inquiry) => `${inquiry.name} ${inquiry.Course?.name || ''} ${inquiry.source || ''}`.toLowerCase().includes(query.toLowerCase()) && (stageFilter === 'ALL' || inquiry.stage === stageFilter))
  const count = (stage) => inquiries.filter((inquiry) => inquiry.stage === stage).length
  const registered = count('REGISTERED')
  const conversion = inquiries.length ? ((registered / inquiries.length) * 100).toFixed(1) : '0.0'

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Track prospective students from first inquiry to confirmed registration.</p></div><button className="primary-button" onClick={() => setShowForm(true)}><Plus size={17} /> Add inquiry</button></section>
    {error && <div className="module-success error-note">{error}</div>}
    {showForm && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><section className="modal student-registration-modal"><div className="modal-heading"><div><h2>Add inquiry</h2><p>Capture a prospective student and follow-up stage.</p></div><button className="icon-button" type="button" onClick={() => setShowForm(false)}><X size={17} /></button></div><form onSubmit={createInquiry}><label>Applicant name<input name="name" placeholder="Applicant name" required /></label><label>Course<select name="courseId" required defaultValue=""><option value="" disabled>Select course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label><label>Source<select name="source" defaultValue="Walk-in inquiry"><option>Website inquiry</option><option>Referral</option><option>Instagram campaign</option><option>Walk-in inquiry</option></select></label><label>Stage<select name="stage" defaultValue="NEW"><option value="NEW">New inquiry</option><option value="CONTACTED">Contacted</option><option value="COUNSELLING">Counselling scheduled</option><option value="OFFER_SENT">Offer sent</option><option value="REGISTERED">Registered</option></select></label><div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={15} /> Save inquiry</button></div></form></section></div>}
    <section className="admission-summary"><div><span className="admission-summary-icon"><UserPlus size={17} /></span><p>New inquiries</p><strong>{count('NEW')}</strong><small>{inquiries.length} total records</small></div><div><span className="admission-summary-icon gold"><CalendarDays size={17} /></span><p>Counselling booked</p><strong>{count('COUNSELLING')}</strong><small>Active follow-up queue</small></div><div><span className="admission-summary-icon green"><Check size={17} /></span><p>Converted this month</p><strong>{registered}</strong><small>{conversion}% conversion rate</small></div></section>
    <section className="admission-pipeline"><div className="admission-pipeline-heading"><div><h2>Inquiry pipeline</h2><p>Current admissions funnel</p></div><span>Live records</span></div><div className="pipeline-steps"><span className="complete"><b>{count('NEW')}</b>New inquiries</span><i /><span className="complete"><b>{count('CONTACTED')}</b>Contacted</span><i /><span className="current"><b>{count('COUNSELLING')}</b>Counselling</span><i /><span><b>{registered}</b>Registered</span></div></section>
    <section className="panel inquiry-table-panel"><div className="admission-list-heading"><div><h2>Recent inquiries</h2><p>Follow up with prospective students</p></div><select className="filter-button" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="ALL">All stages</option>{Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search applicant or course" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="table-scroll"><table className="inquiry-table"><thead><tr><th>Applicant</th><th>Course</th><th>Source</th><th>Stage</th><th>Follow-up</th><th>Action</th></tr></thead><tbody>{filtered.map((inquiry) => <tr key={inquiry.id}><td><strong>{inquiry.name}</strong></td><td>{inquiry.Course?.name || 'Course unavailable'}</td><td>{inquiry.source}</td><td><span className="inquiry-stage navy">{stageLabels[inquiry.stage]}</span></td><td><span className="inquiry-date"><CalendarDays size={12} />{inquiry.followUpAt ? new Date(inquiry.followUpAt).toLocaleDateString() : 'Not scheduled'}</span></td><td><button className="inquiry-open">Open</button></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state">No inquiries match your filters.</div>}</div></section>
  </>
}

export default AdmissionsWorkspace
