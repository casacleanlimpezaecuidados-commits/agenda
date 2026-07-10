import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Common/Modal';
import {
  Plus,
  Edit3,
  Trash2,
  X,
  Shield,
  User,
  UserCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

const roleLabels = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  auxiliar: 'Auxiliar',
};

const roleIcons = {
  admin: Shield,
  supervisor: UserCheck,
  auxiliar: User,
};

const roleColors = {
  admin: 'text-purple-600 bg-purple-50 border-purple-200',
  supervisor: 'text-info bg-info-light border-info/20',
  auxiliar: 'text-success bg-success-light border-success/20',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'auxiliar',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      showNotification('Erro ao carregar usuários', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingUser) {
        const updateData = { name: form.name, email: form.email, role: form.role };
        if (form.password) updateData.password = form.password;
        await api.put(`/users/${editingUser._id}`, updateData);
        showNotification('✅ Usuário atualizado com sucesso!');
      } else {
        await api.post('/users', form);
        showNotification('✅ Usuário criado com sucesso!');
      }
      setShowModal(false);
      resetForm();
      loadUsers();
    } catch (error) {
      showNotification('❌ ' + (error.response?.data?.error || 'Erro ao salvar'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'auxiliar',
    });
    setShowModal(true);
  };

  const handleToggle = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { active: !user.active });
      loadUsers();
      showNotification(user.active ? '✅ Usuário desativado' : '✅ Usuário ativado');
    } catch (error) {
      showNotification('❌ Erro ao alterar status', 'error');
    }
  };

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', role: 'auxiliar' });
    setEditingUser(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in-right p-4 rounded-xl shadow-lg ${
          notification.type === 'error' ? 'bg-danger text-white' : 'bg-success text-white'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <p className="text-sm font-medium">{notification.message}</p>
            <button onClick={() => setNotification(null)}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {saving && (
        <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-strong flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-800 rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-700">Salvando...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 mt-1">Gerencie os acessos ao sistema</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-premium p-5 bg-gradient-to-br from-primary-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-primary-800" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{users.length}</p><p className="text-sm text-gray-500">Total</p></div>
          </div>
        </div>
        <div className="card-premium p-5 bg-gradient-to-br from-success/5 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success-light rounded-xl flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-success" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{users.filter(u => u.active).length}</p><p className="text-sm text-gray-500">Ativos</p></div>
          </div>
        </div>
        <div className="card-premium p-5 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><Shield className="w-6 h-6 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'admin').length}</p><p className="text-sm text-gray-500">Admins</p></div>
          </div>
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-800 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando usuários...</p>
            </div>
          ) : users.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Usuário</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Email</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Perfil</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => {
                  const Icon = roleIcons[user.role] || User;
                  return (
                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${roleColors[user.role]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.active ? 'bg-success-light text-success' : 'bg-danger-light text-danger'
                        }`}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(user)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Editar">
                            <Edit3 className="w-4 h-4 text-gray-400 hover:text-primary-600" />
                          </button>
                          <button onClick={() => handleToggle(user)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={user.active ? 'Desativar' : 'Ativar'}>
                            {user.active ? (
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-danger" />
                            ) : (
                              <RefreshCw className="w-4 h-4 text-gray-400 hover:text-success" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum usuário cadastrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar/Editar Usuário */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingUser ? 'Editar Usuário' : 'Novo Usuário'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-premium">Nome *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
              className="input-premium" placeholder="Nome completo" required />
          </div>
          <div>
            <label className="label-premium">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
              className="input-premium" placeholder="email@exemplo.com" required />
          </div>
          <div>
            <label className="label-premium">{editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
              className="input-premium" placeholder="••••••••" required={!editingUser} />
          </div>
          <div>
            <label className="label-premium">Perfil *</label>
            <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="select-premium" required>
              <option value="auxiliar">Auxiliar</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}