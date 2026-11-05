import { CalendarDays, Check, ChevronDown, CircleDollarSign, FileText, Search } from 'lucide-react'

const feeRows = [
  { name: 'Aarav Sharma', id: 'STU-1024', className: 'Grade 8 - A', amount: 'Rs 1,250', status: 'Paid', date: 'Sep 05, 2026', initials: 'AS', color: 'violet' },
  { name: 'Maya Patel', id: 'STU-1023', className: 'Grade 6 - B', amount: 'Rs 850', status: 'Pending', date: 'Sep 04, 2026', initials: 'MP', color: 'coral' },
  { name: 'Noah Williams', id: 'STU-1022', className: 'Grade 10 - A', amount: 'Rs 1,480', status: 'Paid', date: 'Sep 03, 2026', initials: 'NW', color: 'blue' },
  { name: 'Sofia Garcia', id: 'STU-1021', className: 'Grade 7 - C', amount: 'Rs 920', status: 'Overdue', date: 'Aug 30, 2026', initials: 'SG', color: 'yellow' },
]

function FeeCollection() {
  return <>
    <section className="page-heading"><div><p className="eyebrow">Finance workspace</p><h1>Fee collection</h1><p className="heading-subtitle">Track incoming payments and follow up on outstanding balances.</p></div><button className="primary-button">Record payment</button></section>
    <section className="stats-grid"><article className="stat-card"><div className="stat-top"><span>Collected this month</span><span className="stat-icon green"><Check size={18} /></span></div><strong>Rs 12,480</strong><p><b className="up">+12.5%</b> <span>from last month</span></p></article><article className="stat-card"><div className="stat-top"><span>Pending payments</span><span className="stat-icon orange"><CircleDollarSign size={18} /></span></div><strong>Rs 8,420</strong><p><span>34 invoices open</span></p></article><article className="stat-card"><div className="stat-top"><span>Overdue balance</span><span className="stat-icon purple"><FileText size={18} /></span></div><strong>Rs 2,180</strong><p><b className="down">8 families</b> <span>need attention</span></p></article></section>
    <section className="panel activity-panel standalone-panel"><div className="panel-heading table-heading"><div><h2>Recent payments</h2><p>Every transaction from your school</p></div><button className="filter-button"><CalendarDays size={14} /> September 2026</button></div><div className="table-tools"><div className="search-box"><Search size={17} /><input placeholder="Search payments" /></div><button className="filter-button">All statuses <ChevronDown size={15} /></button></div><div className="table-scroll"><table><thead><tr><th>Student</th><th>Class</th><th>Fee amount</th><th>Status</th><th>Payment date</th><th /></tr></thead><tbody>{feeRows.map((student) => <tr key={student.id}><td><div className="student-cell"><span className={`student-avatar ${student.color}`}>{student.initials}</span><div><strong>{student.name}</strong><small>{student.id}</small></div></div></td><td>{student.className}</td><td><strong>{student.amount}</strong></td><td><span className={`status ${student.status.toLowerCase()}`}><i />{student.status}</span></td><td>{student.date}</td><td /></tr>)}</tbody></table></div></section>
  </>
}

export default FeeCollection
