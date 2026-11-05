import { useEffect, useMemo, useState } from 'react'
import { Download, Mail, Phone, Search, Users } from 'lucide-react'
import { apiDownload, apiGet, apiPatch } from '../../../api'
import './TeamApplicationsWorkspace.css'

const typeLabels = { FACULTY: 'Join Our Faculty', COMMUNITY: 'Software House Community', INTERNSHIP: 'Internship' }
const statusLabels = { NEW: 'New', REVIEWING: 'Reviewing', SHORTLISTED: 'Shortlisted', ACCEPTED: 'Accepted', REJECTED: 'Rejected' }
const statuses = Object.keys(statusLabels)

function TeamApplicationsWorkspace({ item }) {
  const [applications, setApplications] = useState([])
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [downloadingId, setDownloadingId] = useState('')

  const loadApplications = () => {
    setLoading(true)
    apiGet('/team/applications?limit=250')
      .then(({ data }) => {
        setApplications(Array.isArray(data.items) ? data.items : [])
        setError('')
      })
      .catch((requestError) => setError(requestError.message || 'Could not load team applications.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    apiGet('/team/applications?limit=250')
      .then(({ data }) => {
        if (!active) return
        setApplications(Array.isArray(data.items) ? data.items : [])
        setError('')
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load team applications.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const filteredApplications = useMemo(() => applications.filter((application) => {
    const details = application.details || {}
    const searchable = `${application.name} ${application.email} ${application.phone} ${typeLabels[application.applicationType] || ''} ${Object.values(details).filter((value) => typeof value === 'string').join(' ')}`.toLowerCase()
    return searchable.includes(query.toLowerCase())
      && (typeFilter === 'ALL' || application.applicationType === typeFilter)
      && (statusFilter === 'ALL' || application.status === statusFilter)
  }), [applications, query, typeFilter, statusFilter])

  const updateStatus = async (application, status) => {
    setUpdatingId(application.id)
    setError('')
    try {
      const { data } = await apiPatch(`/team/applications/${application.id}`, { status })
      setApplications((current) => current.map((item) => item.id === application.id ? data.item : item))
    } catch (requestError) {
      setError(requestError.message || 'Could not update application status.')
    } finally {
      setUpdatingId('')
    }
  }

  const downloadCv = async (application) => {
    setDownloadingId(application.id)
    setError('')
    try {
      const blob = await apiDownload(`/team/applications/${application.id}/cv`)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = application.details?.cv?.originalName || `${application.name}-CV`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError.message || 'Could not download this CV.')
    } finally {
      setDownloadingId('')
    }
  }

  const count = (status) => applications.filter((application) => application.status === status).length

  return <>
    <section className="page-heading">
      <div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Review applications and CVs submitted by faculty, community, and internship candidates.</p></div>
      <button className="filter-button" type="button" onClick={loadApplications}>Refresh applications</button>
    </section>
    {error && <div className="module-success error-note" role="alert">{error}</div>}
    <section className="team-application-summary">
      <article><span>Total applications</span><strong>{applications.length}</strong></article>
      <article><span>New</span><strong>{count('NEW')}</strong></article>
      <article><span>Reviewing</span><strong>{count('REVIEWING')}</strong></article>
      <article><span>Shortlisted</span><strong>{count('SHORTLISTED')}</strong></article>
    </section>
    <section className="panel team-application-panel">
      <div className="panel-heading table-heading"><div><h2>Team applications</h2><p>{loading ? 'Loading live applications...' : `${filteredApplications.length} matching records · live database data`}</p></div><Users size={19} /></div>
      <div className="table-tools team-application-tools">
        <div className="search-box"><Search size={17} /><input placeholder="Search name, email, phone, or details" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <select className="filter-button" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="ALL">All application types</option>{Object.entries(typeLabels).map(([type, label]) => <option value={type} key={type}>{label}</option>)}</select>
        <select className="filter-button" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option>{Object.entries(statusLabels).map(([status, label]) => <option value={status} key={status}>{label}</option>)}</select>
      </div>
      <div className="table-scroll">
        <table className="team-application-table"><thead><tr><th>Applicant</th><th>Application</th><th>Details</th><th>CV</th><th>Submitted</th><th>Status</th></tr></thead>
          <tbody>{filteredApplications.map((application) => {
            const details = application.details || {}
            const detailEntries = Object.entries(details).filter(([key, value]) => key !== 'cv' && typeof value === 'string')
            return <tr key={application.id}>
              <td><strong>{application.name}</strong><a href={`mailto:${application.email}`}><Mail size={12} />{application.email}</a><a href={`tel:${application.phone}`}><Phone size={12} />{application.phone}</a></td>
              <td><span className={`team-application-type ${application.applicationType.toLowerCase()}`}>{typeLabels[application.applicationType] || application.applicationType}</span></td>
              <td>{detailEntries.length ? detailEntries.map(([key, value]) => <span className="team-application-detail" key={key}><b>{key === 'message' ? 'Message' : key.replaceAll('_', ' ')}</b>{value}</span>) : '—'}</td>
              <td><button className="team-cv-download" type="button" disabled={!details.cv?.fileName || downloadingId === application.id} onClick={() => downloadCv(application)}><Download size={14} />{downloadingId === application.id ? 'Loading…' : details.cv?.originalName || 'CV unavailable'}</button></td>
              <td>{application.created_at ? new Date(application.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</td>
              <td><select className={`team-application-status ${application.status.toLowerCase()}`} aria-label={`Status for ${application.name}`} value={application.status} disabled={updatingId === application.id} onChange={(event) => updateStatus(application, event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></td>
            </tr>
          })}</tbody>
        </table>
        {!loading && !filteredApplications.length && <div className="empty-state">No team applications match these filters.</div>}
      </div>
    </section>
  </>
}

export default TeamApplicationsWorkspace
