import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Plus, Search, Shield, User as UserIcon, Mail, Briefcase, Lock, Key, MoreVertical, Ban, Eye, RotateCcw, X, Check, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

const PERMISSION_LABELS: Record<string, string> = {
  'dashboard.view': 'Visualizar Dashboard',
  'products.view': 'Visualizar Produtos', 'products.create': 'Criar Produtos', 'products.edit': 'Editar Produtos', 'products.delete': 'Excluir Produtos',
  'stock.view': 'Visualizar Estoque', 'stock.adjust': 'Ajustar Estoque',
  'sales.view': 'Visualizar Vendas', 'sales.create': 'Criar Vendas', 'sales.cancel': 'Cancelar Vendas',
  'pos.access': 'Acessar PDV',
  'financial.view': 'Visualizar Financeiro', 'financial.create': 'Criar Lançamento', 'financial.edit': 'Editar Lançamento', 'financial.delete': 'Excluir Lançamento',
  'customers.view': 'Visualizar Clientes', 'customers.create': 'Criar Clientes', 'customers.edit': 'Editar Clientes', 'customers.delete': 'Excluir Clientes',
  'suppliers.view': 'Visualizar Fornecedores', 'suppliers.create': 'Criar Fornecedores', 'suppliers.edit': 'Editar Fornecedores', 'suppliers.delete': 'Excluir Fornecedores',
  'reports.view': 'Visualizar Relatórios', 'reports.export': 'Exportar Relatórios',
  'users.view': 'Visualizar Usuários', 'users.create': 'Criar Usuários', 'users.edit': 'Editar Usuários', 'users.delete': 'Excluir Usuários', 'users.manage': 'Gerenciar Usuários',
  'demands.view': 'Visualizar Demandas', 'demands.create': 'Criar Demandas', 'demands.edit': 'Editar Demandas', 'demands.delete': 'Excluir Demandas',
  'settings.view': 'Visualizar Configurações', 'settings.edit': 'Editar Configurações',
};

const CATEGORY_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', products: 'Produtos', stock: 'Estoque', sales: 'Vendas', pos: 'PDV',
  financial: 'Financeiro', customers: 'Clientes', suppliers: 'Fornecedores', reports: 'Relatórios',
  users: 'Usuários', demands: 'Demandas', settings: 'Configurações',
};

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('EMPLOYEE');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Create form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [roleName, setRoleName] = useState('EMPLOYEE');
  const [submitting, setSubmitting] = useState(false);

  // Permission modal
  const [permModalUser, setPermModalUser] = useState<any>(null);
  const [permData, setPermData] = useState<any>(null);
  const [permSelected, setPermSelected] = useState<string[]>([]);
  const [permSaving, setPermSaving] = useState(false);

  // Reset password modal
  const [resetPwUser, setResetPwUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const token = () => localStorage.getItem('@ERP:token');
  const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

  useEffect(() => {
    const u = localStorage.getItem('@ERP:user');
    if (u) { const p = JSON.parse(u); setCurrentUserRole(p.roleName || p.role || 'EMPLOYEE'); }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token()}` } });
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: headers(), body: JSON.stringify({ name, email, passwordString: password, roleName, position }) });
      const json = await res.json();
      if (json.success) { setIsCreateModalOpen(false); setName(''); setEmail(''); setPassword(''); setPosition(''); setRoleName('EMPLOYEE'); fetchUsers(); }
      else alert(json.message);
    } catch (e) { alert('Falha ao criar usuário'); }
    finally { setSubmitting(false); }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ isActive: !currentStatus }) });
      const json = await res.json();
      if (json.success) fetchUsers();
      else alert(json.message);
    } catch (e) { alert('Erro ao alterar status'); }
    setActionMenuId(null);
  };

  const handleOpenPermissions = async (user: any) => {
    setPermModalUser(user);
    setActionMenuId(null);
    try {
      const res = await fetch(`/api/users/${user.id}/permissions`, { headers: { 'Authorization': `Bearer ${token()}` } });
      const json = await res.json();
      if (json.success) { setPermData(json.data); setPermSelected(json.data.effectivePermissions || []); }
    } catch (e) { console.error(e); }
  };

  const handleSavePermissions = async () => {
    if (!permModalUser) return;
    setPermSaving(true);
    try {
      const res = await fetch(`/api/users/${permModalUser.id}/permissions`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ permissions: permSelected }) });
      const json = await res.json();
      if (json.success) { setPermModalUser(null); setPermData(null); fetchUsers(); }
      else alert(json.message);
    } catch (e) { alert('Erro ao salvar permissões'); }
    finally { setPermSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!resetPwUser || !newPassword) return;
    try {
      const res = await fetch(`/api/users/${resetPwUser.id}/reset-password`, { method: 'POST', headers: headers(), body: JSON.stringify({ newPassword }) });
      const json = await res.json();
      if (json.success) { setResetPwUser(null); setNewPassword(''); alert('Senha redefinida com sucesso!'); }
      else alert(json.message);
    } catch (e) { alert('Erro ao redefinir senha'); }
  };

  const handleImpersonate = async (user: any) => {
    setActionMenuId(null);
    try {
      const res = await fetch(`/api/users/${user.id}/impersonate`, { method: 'POST', headers: headers() });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem('@ERP:token', json.data.token);
        localStorage.setItem('@ERP:user', JSON.stringify(json.data.user));
        window.location.href = '/';
      } else alert(json.message);
    } catch (e) { alert('Erro ao personificar'); }
  };

  const togglePerm = (key: string) => {
    setPermSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      'ADMIN': { label: 'ADMINISTRADOR', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
      'MANAGER': { label: 'GERENTE', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
      'EMPLOYEE': { label: 'FUNCIONÁRIO', cls: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
    };
    const m = map[role] || map['EMPLOYEE'];
    return <span className={`${m.cls} border px-2 py-0.5 rounded-md text-xs font-bold`}>{m.label}</span>;
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Gestão de Equipe</h1>
          <p className="text-neutral-500 mt-1">Gerencie acessos, cargos e permissões dos usuários.</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition shadow-sm">
          <Plus className="w-5 h-5" /> Novo Usuário
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex gap-4 bg-neutral-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou email..." className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-neutral-500 font-semibold">Carregando usuários...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Role / Cargo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Cadastro</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">{user.name?.charAt(0)}</div>
                      <div>
                        <div className="font-bold text-neutral-900">{user.name}</div>
                        <div className="text-sm text-neutral-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div>{getRoleBadge(user.roleName || user.role?.name || 'EMPLOYEE')}</div>
                      {user.position && <span className="text-xs text-neutral-500 font-medium">{user.position}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>Ativo</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800"><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>Bloqueado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500 font-medium">{format(new Date(user.createdAt), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 text-right relative">
                    <button onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)} className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {actionMenuId === user.id && (
                      <div className="absolute right-6 top-full mt-1 w-56 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 py-1 text-left" onMouseLeave={() => setActionMenuId(null)}>
                        <button onClick={() => handleOpenPermissions(user)} className="w-full px-4 py-2.5 text-sm text-left hover:bg-neutral-50 flex items-center gap-3 font-medium"><Shield className="w-4 h-4 text-indigo-500" /> Editar Permissões</button>
                        <button onClick={() => { setResetPwUser(user); setActionMenuId(null); }} className="w-full px-4 py-2.5 text-sm text-left hover:bg-neutral-50 flex items-center gap-3 font-medium"><Key className="w-4 h-4 text-amber-500" /> Redefinir Senha</button>
                        <button onClick={() => handleToggleStatus(user.id, user.isActive)} className="w-full px-4 py-2.5 text-sm text-left hover:bg-neutral-50 flex items-center gap-3 font-medium">
                          <Ban className="w-4 h-4 text-red-500" /> {user.isActive ? 'Bloquear Acesso' : 'Desbloquear'}
                        </button>
                        {currentUserRole === 'ADMIN' && (user.roleName || user.role?.name) !== 'ADMIN' && (
                          <button onClick={() => handleImpersonate(user)} className="w-full px-4 py-2.5 text-sm text-left hover:bg-neutral-50 flex items-center gap-3 font-medium border-t border-neutral-100"><Eye className="w-4 h-4 text-emerald-500" /> Personificar Usuário</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2"><UserIcon className="w-5 h-5 text-indigo-600" /> Novo Usuário</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">Nome Completo *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">Cargo (Operacional) *</label>
                <input type="text" required value={position} onChange={e => setPosition(e.target.value)} placeholder="Ex: Caixa, Estoquista, Gerente" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">E-mail de Acesso *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@empresa.com" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">Senha Inicial *</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">Nível de Acesso (Role) *</label>
                <select value={roleName} onChange={e => setRoleName(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition">
                  <option value="EMPLOYEE">Funcionário</option>
                  <option value="MANAGER">Gerente</option>
                  {currentUserRole === 'ADMIN' && <option value="ADMIN">Administrador</option>}
                </select>
                <p className="mt-1 text-xs text-neutral-400">Role = nível de acesso. Cargo = função operacional.</p>
              </div>
              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl transition text-sm">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-sm shadow-sm disabled:opacity-50">{submitting ? 'Salvando...' : 'Salvar Usuário'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PERMISSIONS MODAL */}
      {permModalUser && permData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-600" /> Permissões de {permModalUser.name}</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Role base: {getRoleBadge(permData.roleName)}</p>
              </div>
              <button onClick={() => { setPermModalUser(null); setPermData(null); }} className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {permData.roleName === 'ADMIN' ? (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800 font-medium">Administradores possuem acesso total ao sistema. Não é possível restringir permissões.</div>
              ) : (
                Object.entries(permData.catalog || {}).map(([category, keys]: [string, any]) => (
                  <div key={category} className="border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200">
                      <h3 className="text-sm font-bold text-neutral-700">{CATEGORY_LABELS[category] || category}</h3>
                    </div>
                    <div className="p-3 space-y-1.5">
                      {(keys as string[]).map((permKey: string) => (
                        <label key={permKey} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition">
                          <input type="checkbox" checked={permSelected.includes(permKey) || permSelected.includes('*')} disabled={permSelected.includes('*')} onChange={() => togglePerm(permKey)} className="w-4 h-4 text-indigo-600 rounded border-neutral-300 focus:ring-indigo-500" />
                          <span className="text-sm text-neutral-700">{PERMISSION_LABELS[permKey] || permKey}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            {permData.roleName !== 'ADMIN' && (
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3 shrink-0">
                <button onClick={() => { setPermModalUser(null); setPermData(null); }} className="px-5 py-2.5 text-neutral-600 font-bold hover:bg-neutral-200 rounded-xl transition text-sm">Cancelar</button>
                <button onClick={handleSavePermissions} disabled={permSaving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-sm shadow-sm disabled:opacity-50">{permSaving ? 'Salvando...' : 'Salvar Permissões'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPwUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><Key className="w-5 h-5 text-amber-500" /> Redefinir Senha</h2>
              <button onClick={() => { setResetPwUser(null); setNewPassword(''); }} className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-600">Redefinir senha de <strong>{resetPwUser.name}</strong> ({resetPwUser.email})</p>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">Nova Senha *</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setResetPwUser(null); setNewPassword(''); }} className="px-5 py-2.5 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl transition text-sm">Cancelar</button>
                <button onClick={handleResetPassword} disabled={!newPassword} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition text-sm shadow-sm disabled:opacity-50">Redefinir Senha</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
