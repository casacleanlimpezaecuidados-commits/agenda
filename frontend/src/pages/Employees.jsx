import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Plus,
  Search,
  Phone,
  Mail,
  Star,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  UserCheck,
  Users,
  TrendingUp,
} from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSchedule, setEmployeeSchedule] = useState([]);

  useEffect(() => {
    loadEmployees();
  }, [search]);

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
    loadEmployeeSchedule(employee.id);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-primary-100 text-primary-800',
      supervisor: 'bg-info-light text-info',
      auxiliar: 'bg-success-light text-success',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      auxiliar: 'Auxiliar',
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-gray-500 mt-1">
            Gerencie sua equipe de profissionais
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Funcionário
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-premium p-5 bg-gradient-to-br from-primary-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-800" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              <p className="text-sm text-gray-500">Total de Funcionários</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5 bg-gradient-to-br from-success/5 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success-light rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(e => e.active).length}
              </p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5 bg-gradient-to-br from-info/5 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-info-light rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {employees.reduce((acc, e) => acc + (e.today_schedules || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">Atendimentos Hoje</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="card-premium p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar funcionário por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de funcionários */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="card-premium p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-800 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando funcionários...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((employee, index) => (
                <div
                  key={employee.id}
                  onClick={() => handleSelectEmployee(employee)}
                  className={`
                    card-premium p-5 cursor-pointer group
                    hover:shadow-medium transform hover:-translate-y-0.5
                    transition-all duration-200
                    ${selectedEmployee?.id === employee.id ? 'ring-2 ring-light shadow-medium' : ''}
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center
                      bg-gradient-to-br from-primary-800 to-light text-white
                      font-bold text-lg flex-shrink-0 shadow-lg
                    `}>
                      {getInitials(employee.name)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-800 transition-colors">
                        {employee.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(employee.role)}`}>
                          {getRoleLabel(employee.role)}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {employee.phone}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{employee.total_schedules || 0}</p>
                          <p className="text-xs text-gray-500">Total mês</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-success">{employee.today_schedules || 0}</p>
                          <p className="text-xs text-gray-500">Hoje</p>
                        </div>
                        <div className="text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            employee.active 
                              ? 'bg-success-light text-success' 
                              : 'bg-danger-light text-danger'
                          }`}>
                            {employee.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Painel de detalhes do funcionário */}
        {selectedEmployee && (
          <div className="card-premium p-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-800 to-light rounded-3xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-xl">
                {getInitials(selectedEmployee.name)}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{selectedEmployee.name}</h3>
              <p className={`text-sm mt-1 ${getRoleColor(selectedEmployee.role)}`}>
                {getRoleLabel(selectedEmployee.role)}
              </p>
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
              <h4 className="font-semibold text-gray-900 mb-4">
                Agenda da Semana
              </h4>
              {employeeSchedule.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {employeeSchedule.slice(0, 7).map((schedule, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <div className="text-center flex-shrink-0">
                        <p className="text-xs font-bold text-primary-800">
                          {new Date(schedule.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                        <p className="text-xs text-gray-500">{schedule.start_time}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {schedule.service}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {schedule.address}
                        </p>
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
          </div>
        )}
      </div>
    </div>
  );
}