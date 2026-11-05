import { useEffect, useState } from 'react'
import { Check, Pencil, Plus, Search } from 'lucide-react'
import { apiGet, apiPatch, apiPost } from '../../../api'

const suggestedCategories = ['IT & Technology', 'Diploma Programs', 'Linguistic Programs', 'CSS & CCE Preparation', 'Short Courses']

function ProgramWorkspace({ item }) {
  const [programs, setPrograms] = useState([])
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const loadPrograms = () => apiGet('/academics/programs?limit=250')
    .then(({ data }) => setPrograms(data.items || []))
    .catch((requestError) => setError(requestError.message))

  useEffect(() => { loadPrograms() }, [])

  const saveProgram = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    const form = new FormData(event.currentTarget)
    const durationValue = form.get('durationMonths')
    const values = {
      name: form.get('name'),
      slug: form.get('slug'),
      category: form.get('category'),
      description: form.get('description'),
      durationMonths: durationValue ? Number(durationValue) : null,
    }
    try {
      if (editing) {
        const { data } = await apiPatch(`/academics/programs/${editing.id}`, values)
        setPrograms((current) => current.map((program) => program.id === data.item.id ? data.item : program))
      } else {
        const { data } = await apiPost('/academics/programs', values)
        setPrograms((current) => [data.item, ...current])
      }
      setShowForm(false)
      setEditing(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (program) => {
    setError('')
    try {
      const { data } = await apiPatch(`/academics/programs/${program.id}`, { status: program.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE' })
      setPrograms((current) => current.map((itemRecord) => itemRecord.id === data.item.id ? data.item : itemRecord))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const filtered = programs.filter((program) => `${program.name} ${program.category} ${program.slug}`.toLowerCase().includes(query.toLowerCase()))
  const openNewProgram = () => { setEditing(null); setShowForm(true); setError('') }

  return <div className="course-workspace">
    <section className="page-heading">
      <div><p className="eyebrow">{item.section}</p><h1>{item.label}</h1><p className="heading-subtitle">Program records saved here are returned by the public landing-page API.</p></div>
      <button className="primary-button" type="button" onClick={openNewProgram}><Plus size={17} /> Add program</button>
    </section>
    {error && <div className="module-success error-note" role="alert">{error}</div>}
    {showForm && <section className="panel module-form">
      <div className="module-form-heading"><div><p className="settings-kicker">Database program record</p><h2>{editing ? 'Edit program' : 'Create program'}</h2><p>Changes are saved to the database and appear on the landing page.</p></div><button className="icon-button" type="button" onClick={() => { setShowForm(false); setEditing(null) }} aria-label="Close form">×</button></div>
      <form key={editing?.id || 'new-program'} onSubmit={saveProgram}>
        <div className="module-form-fields">
          <label>Program name<input name="name" maxLength={160} defaultValue={editing?.name} placeholder="MERN Full Stack" required /></label>
          <label>Slug<input name="slug" maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={editing?.slug} placeholder="mern-full-stack" required /></label>
          <label>Category<input name="category" maxLength={100} list="program-category-options" defaultValue={editing?.category} placeholder="Linguistic Programs" required /><datalist id="program-category-options">{[...new Set([...suggestedCategories, ...programs.map((program) => program.category)])].map((category) => <option key={category} value={category} />)}</datalist></label>
          <label>Duration (months)<input name="durationMonths" type="number" min="1" max="120" defaultValue={editing?.durationMonths || ''} placeholder="Optional" /></label>
        </div>
        <label className="course-description-field">Landing-page description<textarea name="description" rows={4} maxLength={5000} defaultValue={editing?.description} placeholder="Describe the program shown on the landing page" required /></label>
        <div className="module-form-actions"><button type="button" className="ghost-button" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button><button className="primary-button" type="submit" disabled={saving}><Check size={15} /> {saving ? 'Saving...' : editing ? 'Update program' : 'Save program'}</button></div>
      </form>
    </section>}
    <section className="panel module-table">
      <div className="panel-heading"><div><h2>Landing-page program catalog</h2><p>{programs.length} saved program records</p></div></div>
      <div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search programs" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
      <div className="module-records">
        <div className="module-record-header"><span>Program</span><span>Category</span><span>Status</span><span>Duration</span><span>Actions</span></div>
        {filtered.map((program) => <div className="module-record" key={program.id}>
          <div className="module-record-name"><span><strong>{program.name}</strong><small>{program.description}</small></span></div>
          <span>{program.category}</span>
          <span className={`module-record-status ${program.status === 'ACTIVE' ? 'active' : 'review'}`}><i />{program.status}</span>
          <small>{program.durationMonths ? `${program.durationMonths} months` : 'Not specified'}</small>
          <div className="course-record-actions">
            <button className="ghost-button" type="button" onClick={() => { setEditing(program); setShowForm(true); setError('') }}><Pencil size={14} /> Edit</button>
            <button className="ghost-button" type="button" onClick={() => toggleStatus(program)}>{program.status === 'ACTIVE' ? 'Archive' : 'Activate'}</button>
          </div>
        </div>)}
        {!filtered.length && <div className="empty-state">{programs.length ? 'No programs match your search.' : 'No programs saved yet. Add a program to display it on the landing page.'}</div>}
      </div>
    </section>
  </div>
}

export default ProgramWorkspace
