import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Common/Modal';
import {
  Plus,
  Search,
  Phone,
  Mail,
  CheckCircle2,
  TrendingUp,
  Users,
  UserCheck,
  Edit3,
  Trash2,
  X,
  CalendarCheck,
  AlertTriangle,
  Briefcase,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSchedule, setEmployeeSchedule] = useState([]);
  const [notification, setNotification] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'auxiliar',
    type: 'clt',
  });

  const roleLabels = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    auxiliar: 'Auxiliar',
  };

  const typeLabels = {
    clt: 'CLT',
    diarista: 'Diarista',
    fora_de_folha: 'Fora de Folha',
  };

  const typeColors = {
    clt: 'bg-blue-100 text-blue-700 border-blue-200',
    diarista: 'bg-orange-100 text-orange-700 border-orange-200',
    fora_de_folha: 'bg-green-100 text-green-700 border-green-200',
  };

  const typeIcons = {
    clt: Briefcase,
    diarista: Clock,
    fora_de_folha: RefreshCw,
  };

  useEffect(() => {
    loadEmployees();
  }, [search]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees', {
        params: { search, active: true }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeSchedule = async (employeeId) => {
    try {
      const today = new Date();
      const response = await api.get(`/employees/${employeeId}/schedule`, {
        params: {
          month: today.getMonth() + 1,
          year: today.getFullYear()
        }
      });
      setEmployeeSchedule(response.data);
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    loadEmployeeSchedule(employee._id);
  };

  // Criar/Editar funcionário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, form);
        showNotification('✅ Funcionário atualizado!');
      } else {
        await api.post('/employees', form);
        showNotification('✅ Funcionário cadastrado!');
      }
      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      loadEmployees();
    } catch (error) {
      showNotification('❌ Erro ao salvar: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setForm({
      name: employee.name || '',
      phone: employee.phone || '',
      email: employee.email || '',
      role: employee.role || 'auxiliar',
      type: employee.type || 'clt',
    });
    setShowModal(true);
  };

  const handleDelete = async (employee) => {
    if (confirm(`Desativar funcionário "${employee.name}"?`)) {
      try {
        await api.delete(`/employees/${employee._id}`);
        loadEmployees();
        setSelectedEmployee(null);
        showNotification('✅ Funcionário desativado!');
      } catch (error) {
        showNotification('❌ Erro ao desativar', 'error');
      }
    }
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', role: 'auxiliar', type: 'clt' });
    setEditingEmployee(null);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      supervisor: 'bg-info-light text-info',
      auxiliar: 'bg-success-light text-success',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
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
          <h1 className="text-3xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-gray-500 mt-1">Gerencie sua equipe de profissionais</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Funcionário
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="card-premium p-4 bg-gradient-to-br from-primary-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-primary-800" /></div>
            <div><p className="text-xl font-bold text-gray-900">{employees.length}</p><p className="text-xs text-gray-500">Total</p></div>
          </div>
        </div>
        <div className="card-premium p-4 bg-gradient-to-br from-success/5 to-white">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-success-light rounded-xl flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-success" /></div>
            <div><p className="text-xl font-bold text-gray-900">{employees.filter(e => e.active).length}</p><p className="text-xs text-gray-500">Ativos</p></div>
          </div>
        </div>
        <div className="card-premium p-4 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Briefcase className="w-5 h-5 text-blue-700" /></div>
            <div><p className="text-xl font-bold text-gray-900">{employees.filter(e => e.type === 'clt').length}</p><p className="text-xs text-gray-500">CLT</p></div>
          </div>
        </div>
        <div className="card-premium p-4 bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-orange-700" /></div>
            <div><p className="text-xl font-bold text-gray-900">{employees.filter(e => e.type === 'diarista').length}</p><p className="text-xs text-gray-500">Diaristas</p></div>
          </div>
        </div>
        <div className="card-premium p-4 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><RefreshCw className="w-5 h-5 text-green-700" /></div>
            <div><p className="text-xl font-bold text-gray-900">{employees.filter(e => e.type === 'fora_de_folha').length}</p><p className="text-xs text-gray-500">Fora de Folha</p></div>
          </div>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="card-premium p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por nome ou telefone..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-premium pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de funcionários */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="card-premium p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-800 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((employee, index) => {
                const TypeIcon = typeIcons[employee.type] || Briefcase;
                return (
                  <div key={employee._id} onClick={() => handleSelectEmployee(employee)}
                    className={`card-premium p-5 cursor-pointer group hover:shadow-medium transform hover:-translate-y-0.5 transition-all duration-200 ${
                      selectedEmployee?._id === employee._id ? 'ring-2 ring-light shadow-medium' : ''
                    }`} style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary-800 to-light text-white font-bold text-lg flex-shrink-0 shadow-lg">
                        {getInitials(employee.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-800 transition-colors">{employee.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(employee.role)}`}>
                            {roleLabels[employee.role] || employee.role}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${typeColors[employee.type] || 'bg-gray-100 text-gray-600'}`}>
                            <TypeIcon className="w-3 h-3 inline mr-0.5" />
                            {typeLabels[employee.type] || employee.type}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{employee.phone}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                          <div className="text-center"><p className="text-lg font-bold text-gray-900">{employee.total_schedules || 0}</p><p className="text-xs text-gray-500">Total mês</p></div>
                          <div className="text-center"><p className="text-lg font-bold text-success">{employee.today_schedules || 0}</p><p className="text-xs text-gray-500">Hoje</p></div>
                          <div className="flex gap-1 ml-auto">
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(employee); }}
                              className="p-1.5 hover:bg-gray-100 rounded-lg" title="Editar"><Edit3 className="w-4 h-4 text-gray-400" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(employee); }}
                              className="p-1.5 hover:bg-red-50 rounded-lg" title="Desativar"><Trash2 className="w-4 h-4 text-gray-400 hover:text-danger" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel de detalhes */}
        {selectedEmployee && (
          <div className="card-premium p-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-800 to-light rounded-3xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-xl">
                {getInitials(selectedEmployee.name)}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{selectedEmployee.name}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(selectedEmployee.role)}`}>
                  {roleLabels[selectedEmployee.role] || selectedEmployee.role}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${typeColors[selectedEmployee.type] || 'bg-gray-100 text-gray-600'}`}>
                  {typeLabels[selectedEmployee.type] || selectedEmployee.type}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-700">{selectedEmployee.phone}</p>
              </div>
              {selectedEmployee.email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-700">{selectedEmployee.email}</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Agenda do Mês</h4>
              {employeeSchedule.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {employeeSchedule.map((schedule, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <div className="text-center flex-shrink-0">
                        <p className="text-xs font-bold text-primary-800">{new Date(schedule.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                        <p className="text-xs text-gray-500">{schedule.start_time}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{schedule.service}</p>
                        <p className="text-xs text-gray-500 truncate">{schedule.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhum agendamento</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t">
              <button onClick={() => handleEdit(selectedEmployee)} className="btn-secondary text-sm flex-1">Editar</button>
              <button onClick={() => handleDelete(selectedEmployee)} className="btn-danger text-sm flex-1">Desativar</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Criar/Editar Funcionário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold">{editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label-premium">Nome *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-premium" required />
              </div>
              <div>
                <label className="label-premium">Telefone *</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input-premium" required />
              </div>
              <div>
                <label className="label-premium">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-premium" />
              </div>
              <div>
                <label className="label-premium">Cargo *</label>
                <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="select-premium" required>
                  <option value="auxiliar">Auxiliar</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="label-premium">Tipo de Contrato *</label>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="select-premium" required>
                  <option value="clt">CLT (Fixo)</option>
                  <option value="diarista">Diarista</option>
                  <option value="fora_de_folha">Fora de Folha</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}