import { useEffect, useMemo, useState } from 'react'
import { Mail, RefreshCw, Search } from 'lucide-react'
import { apiGet, apiPatch } from '../../../api'
import './ContactMessagesWorkspace.css'

const messageStatuses = ['NEW', 'READ', 'REPLIED']
const statusLabels = { NEW: 'New', READ: 'Read', REPLIED: 'Replied' }

function ContactMessagesWorkspace({ item }) {
  const [messages, setMessages] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  const loadMessages = () => {
    setLoading(true)
    apiGet('/contact/messages?limit=250')
      .then(({ data }) => {
        setMessages(Array.isArray(data.items) ? data.items : [])
        setError('')
      })
      .catch((requestError) => setError(requestError.message || 'Could not load contact messages.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    apiGet('/contact/messages?limit=250')
      .then(({ data }) => {
        if (active) {
          setMessages(Array.isArray(data.items) ? data.items : [])
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load contact messages.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const filteredMessages = useMemo(() => messages.filter((message) => {
    const searchable = `${message.name} ${message.email} ${message.subject} ${message.message}`.toLowerCase()
    return searchable.includes(query.trim().toLowerCase())
      && (statusFilter === 'ALL' || message.status === statusFilter)
  }), [messages, query, statusFilter])

  const updateStatus = async (message, status) => {
    setUpdatingId(message.id)
    setError('')
    try {
      const { data } = await apiPatch(`/contact/messages/${message.id}`, { status })
      setMessages((current) => current.map((item) => item.id === message.id ? data.item : item))
    } catch (requestError) {
      setError(requestError.message || 'Could not update message status.')
    } finally {
      setUpdatingId('')
    }
  }

  const count = (status) => messages.filter((message) => message.status === status).length

  return <>
    <section className="page-heading">
      <div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">View and follow up on messages sent through the public website contact form.</p></div>
      <button className="filter-button" type="button" onClick={loadMessages} disabled={loading}><RefreshCw size={14} /> Refresh messages</button>
    </section>
    {error && <div className="module-success error-note" role="alert">{error}</div>}
    <section className="contact-message-summary">
      <article><span>Total messages</span><strong>{messages.length}</strong></article>
      <article><span>New</span><strong>{count('NEW')}</strong></article>
      <article><span>Read</span><strong>{count('READ')}</strong></article>
      <article><span>Replied</span><strong>{count('REPLIED')}</strong></article>
    </section>
    <section className="panel contact-message-panel">
      <div className="panel-heading table-heading"><div><h2>Website messages</h2><p>{loading ? 'Loading messages...' : `${filteredMessages.length} matching messages · live database records`}</p></div><Mail size={19} /></div>
      <div className="table-tools contact-message-tools">
        <div className="search-box"><Search size={17} /><input placeholder="Search name, email, subject, or message" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <select className="filter-button" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by message status">
          <option value="ALL">All statuses</option>
          {messageStatuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
        </select>
      </div>
      <div className="table-scroll">
        <table className="contact-message-table">
          <thead><tr><th>Sender</th><th>Subject</th><th>Message</th><th>Received</th><th>Status</th></tr></thead>
          <tbody>{filteredMessages.map((message) => (
            <tr key={message.id}>
              <td><strong>{message.name}</strong><a href={`mailto:${message.email}`}><Mail size={12} />{message.email}</a></td>
              <td>{message.subject}</td>
              <td className="contact-message-body">{message.message}</td>
              <td>{message.created_at ? new Date(message.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</td>
              <td><select className={`contact-message-status ${message.status.toLowerCase()}`} aria-label={`Status for message from ${message.name}`} value={message.status} disabled={updatingId === message.id} onChange={(event) => updateStatus(message, event.target.value)}>
                {messageStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select></td>
            </tr>
          ))}</tbody>
        </table>
        {!loading && !filteredMessages.length && <div className="empty-state">No contact messages match these filters.</div>}
      </div>
    </section>
  </>
}

export default ContactMessagesWorkspace
