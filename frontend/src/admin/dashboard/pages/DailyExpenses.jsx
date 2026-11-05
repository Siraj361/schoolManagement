import { useEffect, useState } from 'react'
import { Check, Filter, Plus, RotateCcw, Wallet, X } from 'lucide-react'
import { apiGet, apiPatch, apiPost } from '../../../api'

const categories = ['Utilities', 'Rent', 'Salaries', 'Supplies', 'Maintenance', 'Transport', 'Marketing', 'Other']
const methods = { CASH: 'Cash', BANK_TRANSFER: 'Bank transfer', CARD: 'Card', ONLINE: 'Online' }
const money = (minor = 0) => `Rs ${(Number(minor) / 100).toLocaleString('en-PK')}`
const localDate = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function DailyExpenses({ item }) {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({})
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('RECORDED')
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '250' })
    if (category) params.set('category', category)
    if (status) params.set('status', status)
    apiGet(`/fees/expenses?${params}`).then(({ data }) => {
      setExpenses(data.items || [])
      setSummary(data.summary || {})
      setError('')
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [category, status])

  const createExpense = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      const data = new FormData(event.currentTarget)
      await apiPost('/fees/expenses', {
        category: data.get('category'),
        description: data.get('description'),
        vendor: data.get('vendor'),
        amountMinor: Math.round(Number(data.get('amount')) * 100),
        expenseDate: data.get('expenseDate'),
        paymentMethod: data.get('paymentMethod'),
        notes: data.get('notes'),
      })
      setShowForm(false)
      setSaved(true)
      load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const voidExpense = async (expense) => {
    if (!window.confirm(`Void expense "${expense.description}"?`)) return
    try {
      await apiPatch(`/fees/expenses/${expense.id}/status`, { status: 'VOID' })
      load()
    } catch (requestError) { setError(requestError.message) }
  }

  const filteredExpenses = expenses.filter((expense) => `${expense.category} ${expense.description} ${expense.vendor || ''} ${expense.notes || ''}`.toLowerCase().includes(query.toLowerCase()))

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>Daily expenses</h1><p className="heading-subtitle">Track every institute operating cost with a clear, auditable record.</p></div><button className="primary-button" type="button" onClick={() => { setShowForm(true); setSaved(false) }}><Plus size={17} /> Add expense</button></section>
    {error && <div className="module-success error-note">{error}</div>}
    {saved && <div className="module-success"><Check size={15} /> Expense recorded successfully.</div>}
    {showForm && <section className="panel module-form"><div className="module-form-heading"><div><p className="settings-kicker">Finance desk</p><h2>Record institute expense</h2><p>Capture the cost, vendor, payment method, and supporting note.</p></div><button className="icon-button" type="button" onClick={() => setShowForm(false)} aria-label="Close expense form"><X size={17} /></button></div><form onSubmit={createExpense}><div className="module-form-fields"><label>Category<select name="category" defaultValue="" required><option value="" disabled>Select category</option>{categories.map((option) => <option key={option}>{option}</option>)}</select></label><label>Amount (PKR)<input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label><label>Description<input name="description" placeholder="Electricity bill for September" required /></label><label>Vendor / payee<input name="vendor" placeholder="K-Electric or office supplier" /></label><label>Expense date<input name="expenseDate" type="date" defaultValue={localDate()} required /></label><label>Payment method<select name="paymentMethod" defaultValue="CASH">{Object.entries(methods).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="module-form-wide">Notes<input name="notes" placeholder="Optional reference, receipt number, or approval note" /></label></div><div className="module-form-actions"><button type="button" className="ghost-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}><Check size={15} /> {saving ? 'Saving...' : 'Save expense'}</button></div></form></section>}
    <section className="finance-summary"><div><span className="finance-summary-icon"><Wallet size={17} /></span><p>Today</p><strong>{money(summary.todayMinor)}</strong><small>Recorded operating costs</small></div><div><span className="finance-summary-icon gold"><Filter size={17} /></span><p>Filtered total</p><strong>{money(summary.totalMinor)}</strong><small>{summary.recordCount || 0} active records</small></div><div><span className="finance-summary-icon green"><RotateCcw size={17} /></span><p>Control</p><strong>Auditable</strong><small>Void instead of delete</small></div></section>
    <section className="panel finance-table-panel"><div className="panel-heading table-heading"><div><h2>Expense register</h2><p>{loading ? 'Loading live expenses...' : `${filteredExpenses.length} records shown`}</p></div><button className="filter-button" type="button" onClick={load}><RotateCcw size={14} /> Refresh</button></div><div className="table-tools"><div className="search-box"><Wallet size={17} /><input placeholder="Search category, vendor, or description" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className="filter-button" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((option) => <option key={option}>{option}</option>)}</select><select className="filter-button" value={status} onChange={(event) => setStatus(event.target.value)}><option value="RECORDED">Recorded</option><option value="VOID">Voided</option><option value="">All statuses</option></select></div><div className="table-scroll"><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Vendor / payee</th><th>Method</th><th>Amount</th><th>Status</th><th /></tr></thead><tbody>{filteredExpenses.map((expense) => <tr key={expense.id}><td>{expense.expenseDate}</td><td><strong>{expense.category}</strong></td><td>{expense.description}<small>{expense.notes || ''}</small></td><td>{expense.vendor || '-'}</td><td>{methods[expense.paymentMethod] || expense.paymentMethod}</td><td><strong>{money(expense.amountMinor)}</strong></td><td>{expense.status === 'VOID' ? 'Voided' : 'Recorded'}</td><td>{expense.status === 'RECORDED' && <button className="ghost-button" type="button" onClick={() => voidExpense(expense)}>Void</button>}</td></tr>)}</tbody></table>{!loading && !filteredExpenses.length && <div className="empty-state">No expenses found for these filters.</div>}</div></section>
  </>
}

export default DailyExpenses