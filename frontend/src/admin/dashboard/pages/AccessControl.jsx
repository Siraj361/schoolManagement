import { useEffect, useState } from 'react'
import { Check, Plus, ShieldCheck, Users, X } from 'lucide-react'
import { apiAssetUrl, apiGet, apiRequest, apiUpload } from '../../../api'

const actions = ['read', 'create', 'update', 'delete']
const titleCase = (value) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

function AccessControl({ item }) {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [catalog, setCatalog] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [selectedRole, setSelectedRole] = useState('')
  const [rolePermissions, setRolePermissions] = useState([])
  const [view, setView] = useState('users')
  const [saved, setSaved] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createError, setCreateError] = useState('')
  const [error, setError] = useState('')

  const loadAccess = () => Promise.all([apiGet('/settings/users'), apiGet('/settings/roles')]).then(([userResult, roleResult]) => {
    const userItems = userResult.data?.items || []
    const roleItems = roleResult.data?.roles || []
    setUsers(userItems)
    setRoles(roleItems)
    setCatalog(roleResult.data?.catalog || [])
    if (!selectedId && userItems[0]) setSelectedId(userItems[0].id)
    if (!selectedRole && roleItems[0]) setSelectedRole(roleItems[0].role)
  }).catch((requestError) => setError(requestError.message))

  useEffect(() => { loadAccess() }, [])
  useEffect(() => {
    if (!selectedId) return
    apiGet(`/settings/users/${selectedId}/access`).then(({ data }) => setSelectedPermissions(data.effectivePermissions || [])).catch((requestError) => setError(requestError.message))
  }, [selectedId])
  useEffect(() => {
    const role = roles.find((entry) => entry.role === selectedRole)
    setRolePermissions(role?.permissions || [])
  }, [roles, selectedRole])

  const toggle = (permission, setter) => setter((current) => current.includes(permission) ? current.filter((value) => value !== permission) : [...current, permission])
  const saveUser = async () => {
    await apiRequest(`/settings/users/${selectedId}/access`, { method: 'PUT', body: JSON.stringify({ permissions: selectedPermissions }) })
    setUsers((current) => current.map((user) => user.id === selectedId ? { ...user, permissions: selectedPermissions } : user))
    setSaved(true)
  }
  const saveRole = async () => {
    const result = await apiRequest(`/settings/roles/${selectedRole}`, { method: 'PUT', body: JSON.stringify({ permissions: rolePermissions }) })
    setRoles((current) => current.map((role) => role.role === selectedRole ? { ...role, permissions: result.data.permissions } : role))
    setSaved(true)
  }
  const createUser = async (event) => {
    event.preventDefault()
    setCreateError('')
    try {
      const result = await apiUpload('/settings/users', new FormData(event.currentTarget))
      const user = result.data.user
      setUsers((current) => [user, ...current])
      setSelectedId(user.id)
      setView('users')
      setShowCreate(false)
      setSaved(true)
    } catch (requestError) { setCreateError(requestError.message) }
  }
  const activePermissions = view === 'users' ? selectedPermissions : rolePermissions
  const setActivePermissions = view === 'users' ? setSelectedPermissions : setRolePermissions
  const selectedUser = users.find((user) => user.id === selectedId)

  return <>
    <section className="page-heading"><div><p className="eyebrow">{item.section}</p><h1>Roles &amp; permissions</h1><p className="heading-subtitle">Give each role or team member independent read, create, update, and delete access.</p></div><div className="access-heading-actions">{view === 'users' && <button className="filter-button" onClick={() => setShowCreate(true)}><Plus size={15} /> Add team member</button>}<button className="primary-button" onClick={view === 'users' ? saveUser : saveRole} disabled={view === 'users' ? !selectedUser : !selectedRole}><Check size={16} /> Save {view === 'users' ? 'user access' : 'role access'}</button></div></section>
    {saved && <div className="module-success"><Check size={15} /> Access changes saved successfully.</div>}
    {error && <div className="module-success error-note">{error}</div>}
    {showCreate && <section className="panel module-form access-create-form"><div className="module-form-heading"><div><p className="settings-kicker">Super Admin</p><h2>Create team member</h2><p>Create login credentials and assign a base role.</p></div><button className="icon-button" type="button" onClick={() => setShowCreate(false)} aria-label="Close"><X size={17} /></button></div><form onSubmit={createUser}><div className="module-form-fields"><label>First name<input name="firstName" required /></label><label>Last name<input name="lastName" required /></label><label>Email<input name="email" type="email" required /></label><label>Password<input name="password" type="password" minLength="8" required /></label><label>Role<select name="role" defaultValue="ADMIN">{['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_HEAD', 'INSTRUCTOR', 'ACCOUNTS', 'CASHIER', 'HR', 'LAB_ADMIN', 'ADMISSION_OFFICER', 'STAFF'].map((role) => <option key={role}>{role}</option>)}</select></label><label>Profile image<input name="avatar" type="file" accept="image/png,image/jpeg,image/webp" /></label></div>{createError && <p className="login-error" role="alert">{createError}</p>}<div className="module-form-actions"><button type="button" className="ghost-button" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={15} /> Create user</button></div></form></section>}
    <section className="system-tabs access-view-tabs"><button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}><Users size={15} /> Individual users</button><button className={view === 'roles' ? 'active' : ''} onClick={() => setView('roles')}><ShieldCheck size={15} /> Role presets</button></section>
    {view === 'users' ? <section className="access-control-layout"><div className="panel access-user-panel"><div className="panel-heading"><div><h2>Team members</h2><p>Select a person to manage individual access.</p></div><Users size={18} /></div><div className="access-user-list">{users.map((user) => <button className={selectedId === user.id ? 'access-user active' : 'access-user'} key={user.id} onClick={() => { setSelectedId(user.id); setSaved(false) }}>{user.avatarUrl ? <img className="access-user-avatar" src={apiAssetUrl(user.avatarUrl)} alt="" /> : <span className="permission-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</span>}<span><strong>{user.firstName} {user.lastName}</strong><small>{user.email} · {titleCase(user.role)}</small></span></button>)}</div></div><PermissionMatrix catalog={catalog} permissions={activePermissions} onToggle={(permission) => toggle(permission, setActivePermissions)} /></section> : <section className="panel role-presets-panel"><div className="role-selector">{roles.map((role) => <button className={selectedRole === role.role ? 'active' : ''} key={role.role} onClick={() => setSelectedRole(role.role)}>{titleCase(role.role)}</button>)}</div><PermissionMatrix catalog={catalog} permissions={activePermissions} onToggle={(permission) => toggle(permission, setActivePermissions)} /></section>}
  </>
}

function PermissionMatrix({ catalog, permissions, onToggle }) {
  return <div className="panel access-permission-panel"><div className="panel-heading"><div><h2>CRUD access matrix</h2><p>Read opens records. Create, update, and delete are controlled independently.</p></div><ShieldCheck size={18} /></div><div className="access-permission-grid access-crud-grid"><div className="access-crud-header"><span>Module</span>{actions.map((action) => <span key={action}>{titleCase(action)}</span>)}</div>{catalog.map(({ module, label }) => <div className="access-crud-row" key={module}><strong>{label}</strong>{actions.map((action) => { const permission = `${module}.${action}`; return <label key={permission}><input type="checkbox" checked={permissions.includes('*') || permissions.includes(permission)} onChange={() => onToggle(permission)} /><span>{permissions.includes('*') || permissions.includes(permission) ? 'On' : 'Off'}</span></label> })}</div>)}</div></div>
}

export default AccessControl
