import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Common/Modal';
import StatusBadge from '../components/Common/StatusBadge';
import {
  Plus,
  Repeat,
  UserCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Phone,
  Filter,
  X,
  RefreshCw,
  Trash2,
  Edit3,
  Building2,
  Navigation,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const SERVICE_TYPES = [
  'Diária Completa - Limpeza Residencial',
  'Diária Completa - Limpeza de Apartamento',
  'Diária Completa - Limpeza Pós-Obra',
  'Diária Completa - Limpeza de Alojamento',
  'Diária Completa - Limpeza de Escritório',
  'Diária Completa - Limpeza de Condomínio',
  'Diária Completa - Limpeza de Igreja',
  'Diária Completa - Limpeza de Escola',
  'Meia Diária - Limpeza Residencial',
  'Meia Diária - Limpeza de Apartamento',
  'Meia Diária - Limpeza de Alojamento',
  'Meia Diária - Limpeza de Escritório',
  'Meia Diária - Limpeza de Condomínio',
  'Meia Diária - Limpeza de Igreja',
  'Meia Diária - Limpeza de Escola',
];

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'concluido_ressalva', label: 'Concluído c/ Ressalva' },
  { value: 'cancelado_cliente', label: 'Cancelado pelo Cliente' },
  { value: 'funcionario_faltou', label: 'Funcionário Faltou' },
];

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month');
  const [notification, setNotification] = useState(null);
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showQuickReplaceModal, setShowQuickReplaceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteLoteModal, setShowDeleteLoteModal] = useState(false);
  const [deleteLoteClientId, setDeleteLoteClientId] = useState('');
  const [selectedClientAddresses, setSelectedClientAddresses] = useState([]);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [formData, setFormData] = useState({
    client_id: '',
    employee_ids: [],
    date: '',
    start_time: '07:00',
    end_time: '17:00',
    service: 'Limpeza Comercial',
    address: '',
    notes: '',
  });

  const [recurringData, setRecurringData] = useState({
    client_id: '',
    employee_ids: [],
    start_date: '',
    end_date: '',
    frequency: 'semanal',
    days_of_week: [],
    start_time: '07:00',
    end_time: '17:00',
    service: 'Limpeza Comercial',
    address: '',
    notes: '',
  });

  const [replaceData, setReplaceData] = useState({
    client_id: '',
    address: '',
    old_employee_id: '',
    new_employee_id: '',
  });

  const [statusData, setStatusData] = useState({
    schedule_id: null,
    status: '',
  });

  const [quickReplaceData, setQuickReplaceData] = useState({
    schedule_id: null,
    client_name: '',
    address: '',
    date: '',
    old_employee_id: '',
    old_employee_name: '',
    new_employee_id: '',
  });

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/schedules', {
        params: { month: currentMonth + 1, year: currentYear }
      });
      setSchedules(response.data);
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients', { params: { active: true } });
      setClients(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get('/employees', { params: { active: true } });
      setEmployees(response.data);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  useEffect(() => {
    loadSchedules();
    loadClients();
    loadEmployees();
  }, [loadSchedules]);

  useEffect(() => {
    filterSchedulesByView();
  }, [schedules, viewMode, currentDate]);

  const filterSchedulesByView = () => {
    const today = new Date();
    if (viewMode === 'month') {
      setFilteredSchedules(schedules);
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const filtered = schedules.filter(s => {
        if (!s.date) return false;
        const scheduleDate = new Date(s.date + 'T00:00:00');
        return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
      });
      setFilteredSchedules(filtered);
    } else if (viewMode === 'day') {
      const targetDate = selectedDate 
        ? new Date(selectedDate.year, selectedDate.month, selectedDate.day)
        : today;
      const dateStr = targetDate.toISOString().split('T')[0];
      const filtered = schedules.filter(s => s.date === dateStr);
      setFilteredSchedules(filtered);
    }
  };

  const handleClientSelect = (clientId, isRecurring = false) => {
    const client = clients.find(c => c._id === clientId);
    if (client && client.addresses && client.addresses.length > 0) {
      setSelectedClientAddresses(client.addresses);
      if (isRecurring) {
        setRecurringData({ ...recurringData, client_id: clientId, address: '' });
      } else {
        setFormData({ ...formData, client_id: clientId, address: '' });
      }
    } else {
      setSelectedClientAddresses([]);
      if (isRecurring) {
        setRecurringData({ ...recurringData, client_id: clientId, address: '' });
      } else {
        setFormData({ ...formData, client_id: clientId, address: '' });
      }
    }
  };

  const handleAddressSelect = (address, isRecurring = false) => {
    const fullAddress = `${address.street} - ${address.neighborhood} - ${address.city}`;
    if (isRecurring) {
      setRecurringData({ ...recurringData, address: fullAddress });
    } else {
      setFormData({ ...formData, address: fullAddress });
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/schedules', formData);
      setShowNewModal(false);
      resetForm();
      await loadSchedules();
      showNotification('✅ Agendamento criado com sucesso!');
    } catch (error) {
      if (error.response?.status === 409) {
        showNotification('❌ ' + error.response.data.error, 'error');
      } else {
        showNotification('❌ Erro: ' + (error.response?.data?.error || error.message), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRecurring = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.post('/schedules/recurring', recurringData);
      setShowRecurringModal(false);
      resetRecurringForm();
      await loadSchedules();
      showNotification(`✅ ${response.data.total_generated} agendamentos criados!`);
    } catch (error) {
      showNotification('❌ Erro: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReplaceEmployee = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        old_employee_id: replaceData.old_employee_id,
        new_employee_id: replaceData.new_employee_id,
      };
      if (replaceData.client_id) {
        const schedulesToUpdate = schedules.filter(s => {
          const clientMatch = s.client_id === replaceData.client_id;
          const employeeMatch = s.employee_ids?.includes(replaceData.old_employee_id);
          const addressMatch = replaceData.address ? (s.address || '').includes(replaceData.address.split(' - ')[0]) : true;
          return clientMatch && employeeMatch && addressMatch;
        });
        for (const schedule of schedulesToUpdate) {
          const newEmployeeIds = schedule.employee_ids.map(id => 
            id === replaceData.old_employee_id ? replaceData.new_employee_id : id
          );
          await api.put(`/schedules/${schedule._id}`, { employee_ids: newEmployeeIds });
        }
        showNotification(`✅ ${schedulesToUpdate.length} agendamentos atualizados!`);
      } else {
        const response = await api.post('/schedules/replace-employee', payload);
        showNotification(`✅ ${response.data.updated_schedules} agendamentos atualizados!`);
      }
      setShowReplaceModal(false);
      setReplaceData({ client_id: '', address: '', old_employee_id: '', new_employee_id: '' });
      setSelectedClientAddresses([]);
      await loadSchedules();
    } catch (error) {
      showNotification('❌ Erro: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const openQuickReplace = (schedule) => {
    const currentEmployeeName = schedule.employee_names?.join(', ') || 
      (schedule.employee_details && schedule.employee_details.length > 0 
        ? schedule.employee_details.map(e => e.name).join(', ') 
        : 'Não informado');
    setQuickReplaceData({
      schedule_id: schedule._id,
      client_name: schedule.client_name || 'Não informado',
      address: schedule.address || 'Endereço não informado',
      date: schedule.date || '',
      old_employee_id: schedule.employee_ids?.[0] || '',
      old_employee_name: currentEmployeeName,
      new_employee_id: '',
    });
    setShowQuickReplaceModal(true);
  };

  const handleQuickReplace = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newEmployeeIds = [quickReplaceData.new_employee_id];
      await api.put(`/schedules/${quickReplaceData.schedule_id}`, { employee_ids: newEmployeeIds });
      setShowQuickReplaceModal(false);
      await loadSchedules();
      showNotification('✅ Funcionário substituído com sucesso!');
    } catch (error) {
      showNotification('❌ Erro: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/schedules/${statusData.schedule_id}/status`, { status: statusData.status });
      setShowStatusModal(false);
      await loadSchedules();
      showNotification('✅ Status alterado com sucesso!');
    } catch (error) {
      showNotification('❌ Erro: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId, clientName) => {
    if (confirm(`Tem certeza que deseja excluir o agendamento de ${clientName}?`)) {
      setSaving(true);
      try {
        await api.delete(`/schedules/${scheduleId}`);
        await loadSchedules();
        showNotification('✅ Agendamento excluído!');
      } catch (error) {
        showNotification('❌ Erro: ' + (error.response?.data?.error || error.message), 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  const openEditModal = (schedule) => {
    setEditingSchedule({ ...schedule });
    setShowEditModal(true);
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/schedules/${editingSchedule._id}`, {
        date: editingSchedule.date,
        start_time: editingSchedule.start_time,
        end_time: editingSchedule.end_time,
        service: editingSchedule.service,
        address: editingSchedule.address,
        notes: editingSchedule.notes,
        employee_ids: editingSchedule.employee_ids
      });
      setShowEditModal(false);
      await loadSchedules();
      showNotification('✅ Agendamento atualizado!');
    } catch (error) {
      showNotification('❌ Erro: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteByClient = async () => {
    if (confirm('Excluir TODOS os agendamentos pendentes deste cliente?')) {
      setSaving(true);
      try {
        const response = await api.delete(`/schedules/client/${deleteLoteClientId}`);
        setShowDeleteLoteModal(false);
        await loadSchedules();
        showNotification(`✅ ${response.data.deleted_count} agendamentos excluídos!`);
      } catch (error) {
        showNotification('❌ Erro: ' + (error.response?.data?.error || error.message), 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '', employee_ids: [], date: '', start_time: '07:00', end_time: '17:00',
      service: 'Limpeza Comercial', address: '', notes: '',
    });
    setSelectedClientAddresses([]);
  };

  const resetRecurringForm = () => {
    setRecurringData({
      client_id: '', employee_ids: [], start_date: '', end_date: '',
      frequency: 'semanal', days_of_week: [], start_time: '07:00', end_time: '17:00',
      service: 'Limpeza Comercial', address: '', notes: '',
    });
    setSelectedClientAddresses([]);
  };

  const toggleEmployee = (empId) => {
    const ids = [...formData.employee_ids];
    if (ids.includes(empId)) {
      setFormData({ ...formData, employee_ids: ids.filter(id => id !== empId) });
    } else {
      setFormData({ ...formData, employee_ids: [...ids, empId] });
    }
  };

  const toggleRecurringEmployee = (empId) => {
    const ids = [...recurringData.employee_ids];
    if (ids.includes(empId)) {
      setRecurringData({ ...recurringData, employee_ids: ids.filter(id => id !== empId) });
    } else {
      setRecurringData({ ...recurringData, employee_ids: [...ids, empId] });
    }
  };

  const toggleDayOfWeek = (day) => {
    const days = [...recurringData.days_of_week];
    if (days.includes(day)) {
      setRecurringData({ ...recurringData, days_of_week: days.filter(d => d !== day) });
    } else {
      setRecurringData({ ...recurringData, days_of_week: [...days, day] });
    }
  };

  const getDaysInMonth = () => {
    const year = currentYear;
    const month = currentMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, month: month - 1, year: month === 0 ? year - 1 : year, isOtherMonth: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: month, year: year, isOtherMonth: false });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, month: month + 1, year: month === 11 ? year + 1 : year, isOtherMonth: true });
    }
    return days;
  };

  const getSchedulesForDate = (day, month, year) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.filter(s => s.date === dateStr);
  };

  const getStatusColor = (status) => {
    const colors = {
      pendente: '#EAB308', confirmado: '#22C55E', em_andamento: '#3B82F6',
      concluido: '#10B981', concluido_ressalva: '#F59E0B',
      cancelado_cliente: '#EF4444', funcionario_faltou: '#DC2626',
    };
    return colors[status] || '#6B7280';
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentYear, currentMonth + delta, 1));
    setSelectedDate(null);
  };

  const today = new Date();
  const isToday = (day, month, year) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in-right p-4 rounded-xl shadow-lg ${notification.type === 'error' ? 'bg-danger text-white' : 'bg-success text-white'}`}>
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
            <p className="text-sm font-medium text-gray-700">Processando...</p>
          </div>
        </div>
      )}

      {/* ========== HEADER CORRIGIDO ========== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500 mt-1">Gerencie todos os agendamentos da sua equipe</p>
        </div>
        <div className="flex items-center gap-3 flex-nowrap">
          <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-2 h-11 whitespace-nowrap">
            <Plus className="w-4 h-4 flex-shrink-0" /> <span>Novo Agendamento</span>
          </button>
          <button onClick={() => setShowRecurringModal(true)} className="btn-success flex items-center gap-2 h-11 whitespace-nowrap">
            <Repeat className="w-4 h-4 flex-shrink-0" /> <span>Agenda Recorrente</span>
          </button>
          <button onClick={() => { setSelectedClientAddresses([]); setReplaceData({ client_id: '', address: '', old_employee_id: '', new_employee_id: '' }); setShowReplaceModal(true); }} 
            className="bg-warning text-white px-4 h-11 rounded-xl font-medium hover:bg-amber-600 shadow-soft flex items-center gap-2 whitespace-nowrap transition-all duration-200">
            <UserCheck className="w-4 h-4 flex-shrink-0" /> <span>Substituir Func.</span>
          </button>
          <button onClick={() => setShowDeleteLoteModal(true)} 
            className="bg-danger text-white px-4 h-11 rounded-xl font-medium hover:bg-red-600 shadow-soft flex items-center gap-2 whitespace-nowrap transition-all duration-200">
            <Trash2 className="w-4 h-4 flex-shrink-0" /> <span>Excluir em Lote</span>
          </button>
        </div>
      </div>
      {/* ========== FIM HEADER CORRIGIDO ========== */}

      <div className="card-premium p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => { setCurrentDate(new Date()); loadSchedules(); }} className="btn-secondary text-sm py-1.5">Hoje</button>
            <div className="flex items-center gap-1">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">{MONTHS[currentMonth]} {currentYear}</h2>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadSchedules} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar</button>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {[{ key: 'month', label: 'Mês' }, { key: 'week', label: 'Semana' }, { key: 'day', label: 'Dia' }].map(mode => (
                <button key={mode.key} onClick={() => { setViewMode(mode.key); if (mode.key === 'day' && !selectedDate) setSelectedDate({ day: today.getDate(), month: today.getMonth(), year: today.getFullYear() }); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === mode.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{mode.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {viewMode === 'month' && (
        <div className="card-premium overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEKDAYS.map(day => <div key={day} className="p-3 text-center"><span className="text-xs font-semibold text-gray-500 uppercase">{day}</span></div>)}
          </div>
          <div className="grid grid-cols-7">
            {getDaysInMonth().map((dateObj, index) => {
              const dateSchedules = getSchedulesForDate(dateObj.day, dateObj.month, dateObj.year);
              return (
                <div key={index} onClick={() => { setSelectedDate(dateObj); setViewMode('day'); }}
                  className={`min-h-[100px] p-2 border-b border-r border-gray-50 cursor-pointer hover:bg-gray-50/50 relative ${!dateObj.isOtherMonth ? '' : 'opacity-40'} ${isToday(dateObj.day, dateObj.month, dateObj.year) ? 'bg-primary-50 border-2 border-primary-800' : ''}`}>
                  <span className={`text-sm font-medium mb-1 inline-block ${isToday(dateObj.day, dateObj.month, dateObj.year) ? 'bg-primary-800 text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>{dateObj.day}</span>
                  <div className="space-y-0.5">
                    {dateSchedules.slice(0, 3).map((schedule, idx) => (
                      <div key={idx} className="text-xs p-1 rounded bg-gray-50 border-l-2 truncate" style={{ borderLeftColor: getStatusColor(schedule.status) }}>
                        <span className="font-medium">{schedule.start_time}</span> <span className="text-gray-500">{schedule.client_name}</span>
                      </div>
                    ))}
                    {dateSchedules.length > 3 && <p className="text-xs text-primary-800 font-medium">+{dateSchedules.length - 3} mais</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(viewMode === 'week' || viewMode === 'day') && (
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{viewMode === 'week' ? 'Agendamentos da Semana' : `Agendamentos do dia ${selectedDate?.day || today.getDate()}`}</h3>
            <button onClick={loadSchedules} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"><RefreshCw className="w-3.5 h-3.5" /> Atualizar</button>
          </div>
          {loading ? (
            <div className="text-center py-12"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-800 rounded-full animate-spin mx-auto mb-3" /><p className="text-gray-500">Carregando...</p></div>
          ) : filteredSchedules.length > 0 ? (
            <div className="space-y-3">
              {filteredSchedules.map((schedule, idx) => (
                <div key={idx} className="p-4 border border-gray-100 rounded-xl hover:shadow-soft transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-primary-800" /></div>
                      <div><p className="font-semibold text-gray-900">{schedule.client_name}</p><p className="text-sm text-gray-500">{schedule.date ? new Date(schedule.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''} • {schedule.start_time} - {schedule.end_time}</p></div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={schedule.status} />
                      <button onClick={() => { setStatusData({ schedule_id: schedule._id, status: schedule.status }); setShowStatusModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Alterar status"><RefreshCw className="w-4 h-4 text-gray-400" /></button>
                      <button onClick={() => openEditModal(schedule)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Editar agendamento"><Edit3 className="w-4 h-4 text-gray-400 hover:text-blue-600" /></button>
                      <button onClick={() => openQuickReplace(schedule)} className="p-1.5 hover:bg-amber-50 rounded-lg" title="Substituir funcionário"><UserCheck className="w-4 h-4 text-gray-400 hover:text-warning" /></button>
                      <button onClick={() => handleDeleteSchedule(schedule._id, schedule.client_name)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Excluir"><Trash2 className="w-4 h-4 text-gray-400 hover:text-danger" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600"><Building2 className="w-4 h-4 text-gray-400" /><span>{schedule.service}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4 text-gray-400" /><span className="truncate">{schedule.address || 'Sem endereço'}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><Users className="w-4 h-4 text-gray-400" /><span>{schedule.employee_names?.join(', ') || 'Não informado'}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" /><span>{schedule.client_phone || 'Não informado'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Nenhum agendamento neste período</p></div>
          )}
        </div>
      )}

      {/* MODAL NOVO AGENDAMENTO */}
      <Modal isOpen={showNewModal} onClose={() => { setShowNewModal(false); resetForm(); }} title="Novo Agendamento" size="lg">
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div><label className="label-premium">Cliente *</label><select value={formData.client_id} onChange={(e) => handleClientSelect(e.target.value)} className="select-premium" required><option value="">Selecionar cliente...</option>{clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          {selectedClientAddresses.length > 0 && (<div><label className="label-premium">Endereço *</label><div className="space-y-2 max-h-48 overflow-y-auto">{selectedClientAddresses.map((addr, idx) => (<label key={idx} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 ${formData.address === `${addr.street} - ${addr.neighborhood} - ${addr.city}` ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}><input type="radio" name="address" checked={formData.address === `${addr.street} - ${addr.neighborhood} - ${addr.city}`} onChange={() => handleAddressSelect(addr)} className="mt-0.5" /><div className="flex-1"><p className="text-sm font-medium text-gray-900">{addr.street}</p><p className="text-xs text-gray-500">{addr.neighborhood} - {addr.city}</p></div></label>))}</div></div>)}
          <div className="grid grid-cols-3 gap-4"><div><label className="label-premium">Data *</label><input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="input-premium" required /></div><div><label className="label-premium">Início *</label><input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className="input-premium" required /></div><div><label className="label-premium">Fim *</label><input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} className="input-premium" required /></div></div>
          <div><label className="label-premium">Serviço *</label><select value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})} className="select-premium" required>{SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
          <div><label className="label-premium">Funcionários *</label><div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">{employees.map(emp => (<label key={emp._id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"><input type="checkbox" checked={formData.employee_ids.includes(emp._id)} onChange={() => toggleEmployee(emp._id)} className="rounded" /><span className="text-sm">{emp.name}</span></label>))}</div></div>
          <div><label className="label-premium">Observações</label><textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="textarea-premium" rows={2} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => { setShowNewModal(false); resetForm(); }} className="btn-secondary">Cancelar</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Criar Agendamento'}</button></div>
        </form>
      </Modal>

      {/* MODAL AGENDA RECORRENTE */}
      <Modal isOpen={showRecurringModal} onClose={() => { setShowRecurringModal(false); resetRecurringForm(); }} title="Agenda Recorrente" size="lg">
        <form onSubmit={handleCreateRecurring} className="space-y-4">
          <div><label className="label-premium">Cliente *</label><select value={recurringData.client_id} onChange={(e) => handleClientSelect(e.target.value, true)} className="select-premium" required><option value="">Selecionar cliente...</option>{clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          {selectedClientAddresses.length > 0 && (<div><label className="label-premium">Endereço *</label><div className="space-y-2 max-h-48 overflow-y-auto">{selectedClientAddresses.map((addr, idx) => (<label key={idx} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 ${recurringData.address === `${addr.street} - ${addr.neighborhood} - ${addr.city}` ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}><input type="radio" name="rec_addr" checked={recurringData.address === `${addr.street} - ${addr.neighborhood} - ${addr.city}`} onChange={() => handleAddressSelect(addr, true)} className="mt-0.5" /><div className="flex-1"><p className="text-sm font-medium text-gray-900">{addr.street}</p><p className="text-xs text-gray-500">{addr.neighborhood} - {addr.city}</p></div></label>))}</div></div>)}
          <div className="grid grid-cols-2 gap-4"><div><label className="label-premium">Data Início *</label><input type="date" value={recurringData.start_date} onChange={(e) => setRecurringData({...recurringData, start_date: e.target.value})} className="input-premium" required /></div><div><label className="label-premium">Data Fim *</label><input type="date" value={recurringData.end_date} onChange={(e) => setRecurringData({...recurringData, end_date: e.target.value})} className="input-premium" required /></div><div><label className="label-premium">Início *</label><input type="time" value={recurringData.start_time} onChange={(e) => setRecurringData({...recurringData, start_time: e.target.value})} className="input-premium" required /></div><div><label className="label-premium">Fim *</label><input type="time" value={recurringData.end_time} onChange={(e) => setRecurringData({...recurringData, end_time: e.target.value})} className="input-premium" required /></div><div><label className="label-premium">Serviço *</label><select value={recurringData.service} onChange={(e) => setRecurringData({...recurringData, service: e.target.value})} className="select-premium" required>{SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div><div><label className="label-premium">Frequência *</label><select value={recurringData.frequency} onChange={(e) => setRecurringData({...recurringData, frequency: e.target.value})} className="select-premium" required><option value="semanal">Semanal</option><option value="quinzenal">Quinzenal</option><option value="mensal">Mensal</option></select></div></div>
          <div><label className="label-premium">Dias da Semana *</label><div className="grid grid-cols-7 gap-2">{WEEKDAYS.map(day => <label key={day} className="flex items-center justify-center gap-1 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"><input type="checkbox" checked={recurringData.days_of_week.includes(day)} onChange={() => toggleDayOfWeek(day)} className="rounded" /><span className="text-xs">{day}</span></label>)}</div></div>
          <div><label className="label-premium">Funcionários *</label><div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">{employees.map(emp => <label key={emp._id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"><input type="checkbox" checked={recurringData.employee_ids.includes(emp._id)} onChange={() => toggleRecurringEmployee(emp._id)} className="rounded" /><span className="text-sm">{emp.name}</span></label>)}</div></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => { setShowRecurringModal(false); resetRecurringForm(); }} className="btn-secondary">Cancelar</button><button type="submit" disabled={saving} className="btn-success">{saving ? 'Gerando...' : 'Gerar Agendamentos'}</button></div>
        </form>
      </Modal>

      {/* MODAL SUBSTITUIR LOTE */}
      <Modal isOpen={showReplaceModal} onClose={() => { setShowReplaceModal(false); setSelectedClientAddresses([]); }} title="Substituir Funcionário" size="lg">
        <form onSubmit={handleReplaceEmployee} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800">💡 <strong>Substituição em lote:</strong> Filtre por empresa e endereço.</div>
          <div><label className="label-premium">Empresa/Cliente (opcional)</label><select value={replaceData.client_id} onChange={(e) => { const clientId = e.target.value; setReplaceData({...replaceData, client_id: clientId, address: ''}); if (clientId) { const client = clients.find(c => c._id === clientId); setSelectedClientAddresses(client?.addresses?.length > 0 ? client.addresses : []); } else { setSelectedClientAddresses([]); }}} className="select-premium"><option value="">Todos os clientes</option>{clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          {selectedClientAddresses.length > 0 && replaceData.client_id && <div><label className="label-premium">Endereço (opcional)</label><select value={replaceData.address} onChange={(e) => setReplaceData({...replaceData, address: e.target.value})} className="select-premium"><option value="">Todos</option>{selectedClientAddresses.map((addr, idx) => <option key={idx} value={`${addr.street} - ${addr.neighborhood} - ${addr.city}`}>{addr.street}</option>)}</select></div>}
          <div className="grid grid-cols-2 gap-4"><div><label className="label-premium">Func. Atual *</label><select value={replaceData.old_employee_id} onChange={(e) => setReplaceData({...replaceData, old_employee_id: e.target.value})} className="select-premium" required><option value="">Selecionar...</option>{employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}</select></div><div><label className="label-premium">Novo Func. *</label><select value={replaceData.new_employee_id} onChange={(e) => setReplaceData({...replaceData, new_employee_id: e.target.value})} className="select-premium" required><option value="">Selecionar...</option>{employees.filter(e => e._id !== replaceData.old_employee_id).map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}</select></div></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => { setShowReplaceModal(false); setSelectedClientAddresses([]); }} className="btn-secondary">Cancelar</button><button type="submit" disabled={saving} className="bg-warning text-white px-6 py-2.5 rounded-xl font-medium hover:bg-amber-600">{saving ? 'Substituindo...' : 'Substituir em Lote'}</button></div>
        </form>
      </Modal>

      {/* MODAL SUBSTITUIÇÃO RÁPIDA */}
      <Modal isOpen={showQuickReplaceModal} onClose={() => setShowQuickReplaceModal(false)} title="Substituir Funcionário" size="sm">
        <form onSubmit={handleQuickReplace} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl space-y-3"><div className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="font-medium text-gray-900">{quickReplaceData.client_name}</span></div><div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700">{quickReplaceData.date ? new Date(quickReplaceData.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Data não informada'}</span></div><div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{quickReplaceData.address || 'Endereço não informado'}</span></div><div className="flex items-center gap-2 text-sm border-t border-gray-200 pt-2"><Users className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><span className="text-xs text-gray-500 block">Funcionário Atual</span><span className="font-medium text-gray-900">{quickReplaceData.old_employee_name}</span></div></div></div>
          <div><label className="label-premium">Substituir por *</label><select value={quickReplaceData.new_employee_id} onChange={(e) => setQuickReplaceData({...quickReplaceData, new_employee_id: e.target.value})} className="select-premium" required><option value="">Selecionar...</option>{employees.filter(e => e._id !== quickReplaceData.old_employee_id).map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}</select></div>
          <div className="bg-amber-50 p-3 rounded-xl text-xs text-amber-700 flex items-start gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>Substituirá <strong>{quickReplaceData.old_employee_name}</strong> <strong>apenas neste agendamento</strong>.</span></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setShowQuickReplaceModal(false)} className="btn-secondary">Cancelar</button><button type="submit" disabled={saving} className="bg-warning text-white px-6 py-2.5 rounded-xl font-medium hover:bg-amber-600">{saving ? 'Substituindo...' : 'Substituir'}</button></div>
        </form>
      </Modal>

      {/* MODAL EDITAR AGENDAMENTO */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Agendamento" size="lg">
        {editingSchedule && (<form onSubmit={handleUpdateSchedule} className="space-y-4"><div className="bg-gray-50 p-4 rounded-xl"><p className="text-sm font-medium text-gray-900">{editingSchedule.client_name}</p></div><div className="grid grid-cols-3 gap-4"><div><label className="label-premium">Data *</label><input type="date" value={editingSchedule.date || ''} onChange={(e) => setEditingSchedule({...editingSchedule, date: e.target.value})} className="input-premium" required /></div><div><label className="label-premium">Início *</label><input type="time" value={editingSchedule.start_time || ''} onChange={(e) => setEditingSchedule({...editingSchedule, start_time: e.target.value})} className="input-premium" required /></div><div><label className="label-premium">Fim *</label><input type="time" value={editingSchedule.end_time || ''} onChange={(e) => setEditingSchedule({...editingSchedule, end_time: e.target.value})} className="input-premium" required /></div></div><div><label className="label-premium">Serviço *</label><select value={editingSchedule.service || ''} onChange={(e) => setEditingSchedule({...editingSchedule, service: e.target.value})} className="select-premium" required>{SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div><div><label className="label-premium">Endereço *</label><input type="text" value={editingSchedule.address || ''} onChange={(e) => setEditingSchedule({...editingSchedule, address: e.target.value})} className="input-premium" required /></div><div><label className="label-premium">Observações</label><textarea value={editingSchedule.notes || ''} onChange={(e) => setEditingSchedule({...editingSchedule, notes: e.target.value})} className="textarea-premium" rows={2} /></div><div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancelar</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar Alterações'}</button></div></form>)}
      </Modal>

      {/* MODAL EXCLUIR EM LOTE */}
      <Modal isOpen={showDeleteLoteModal} onClose={() => setShowDeleteLoteModal(false)} title="Excluir Agendamentos em Lote" size="sm">
        <div className="space-y-4"><p className="text-sm text-gray-600">Selecione o cliente para excluir todos os agendamentos pendentes.</p><div><label className="label-premium">Cliente *</label><select value={deleteLoteClientId} onChange={(e) => setDeleteLoteClientId(e.target.value)} className="select-premium" required><option value="">Selecionar cliente...</option>{clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div><div className="bg-red-50 p-3 rounded-xl text-xs text-red-700 flex items-start gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>Esta ação <strong>não pode ser desfeita</strong>.</span></div><div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setShowDeleteLoteModal(false)} className="btn-secondary">Cancelar</button><button onClick={handleDeleteByClient} disabled={!deleteLoteClientId || saving} className="bg-danger text-white px-6 py-2.5 rounded-xl font-medium hover:bg-red-600">{saving ? 'Excluindo...' : 'Excluir Todos'}</button></div></div>
      </Modal>

      {/* MODAL ALTERAR STATUS */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Alterar Status" size="sm">
        <form onSubmit={handleStatusChange} className="space-y-4"><div><label className="label-premium">Novo Status *</label><select value={statusData.status} onChange={(e) => setStatusData({...statusData, status: e.target.value})} className="select-premium" required><option value="">Selecionar...</option>{STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div><div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setShowStatusModal(false)} className="btn-secondary">Cancelar</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button></div></form>
      </Modal>

      {/* Legenda */}
      <div className="card-premium p-4">
        <div className="flex flex-wrap gap-4">
          {[{ color: 'bg-success', label: 'Confirmado' }, { color: 'bg-info', label: 'Em andamento' }, { color: 'bg-warning', label: 'Pendente' }, { color: 'bg-danger', label: 'Cancelado' }].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2"><div className={`w-3 h-3 ${item.color} rounded-full`} /><span className="text-sm text-gray-600">{item.label}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}