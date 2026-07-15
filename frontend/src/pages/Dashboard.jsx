import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatsCard from '../components/Dashboard/StatsCard';
import StatusBadge from '../components/Common/StatusBadge';
import {
  CalendarCheck, CheckCircle2, PlayCircle, Clock, Users,
  Plus, UserPlus, Building2, BarChart3, RefreshCw,
  MapPin, Phone, ArrowUpRight, History,
} from 'lucide-react';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const todaySchedules = dashboardData?.today_schedules || [];
  const recentHistory = dashboardData?.recent_history || [];
  const upcomingSchedules = dashboardData?.upcoming_schedules || [];

  const quickActions = [
    { label: 'Novo Agendamento', icon: Plus, color: 'bg-primary-800 hover:bg-primary-900', path: '/schedule', roles: ['admin', 'supervisor'] },
    { label: 'Novo Cliente', icon: Building2, color: 'bg-success hover:bg-emerald-600', path: '/clients', roles: ['admin', 'supervisor'] },
    { label: 'Novo Funcionário', icon: UserPlus, color: 'bg-info hover:bg-blue-600', path: '/employees', roles: ['admin'] },
    { label: 'Relatórios', icon: BarChart3, color: 'bg-warning hover:bg-amber-600', path: '/reports', roles: ['admin', 'supervisor'] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resumo operacional de {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        <button onClick={loadDashboard} className="btn-secondary flex items-center gap-1.5 text-sm py-2">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatsCard title="Atendimentos Hoje" value={stats.total_hoje || 0} icon={CalendarCheck} color="primary" onClick={() => navigate('/schedule')} />
        <StatsCard title="Confirmados" value={stats.confirmados || 0} icon={CheckCircle2} color="success" />
        <StatsCard title="Em Andamento" value={stats.em_andamento || 0} icon={PlayCircle} color="info" />
        <StatsCard title="Pendentes" value={stats.pendentes || 0} icon={Clock} color="warning" />
        <StatsCard title="Funcionários Ativos" value={stats.active_employees || 0} icon={Users} color="primary" />
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* AGENDA DE HOJE - 75% */}
        <div className="lg:col-span-3">
          <div className="card-premium overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Agenda de Hoje</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{todaySchedules.length} atendimentos programados</p>
                </div>
                <button onClick={() => navigate('/schedule')} className="text-sm text-primary-800 hover:text-primary-900 font-medium flex items-center gap-1">
                  Ver agenda completa <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {todaySchedules.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Horário</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Funcionários</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Endereço</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Serviço</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {todaySchedules.map((schedule, index) => (
                      <tr key={schedule._id || index} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate('/schedule')}>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900">{schedule.start_time} - {schedule.end_time}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{schedule.client_name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {schedule.client_phone || ''}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {schedule.employee_names?.length > 0 ? (
                              schedule.employee_names.map((emp, i) => (
                                <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  schedule.status === 'em_andamento' 
                                    ? 'bg-info-light text-info animate-pulse' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {emp}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm text-gray-600 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{schedule.address || 'Sem endereço'}</span>
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{schedule.service || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={schedule.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center">
                  <CalendarCheck className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-medium text-gray-500">Nenhum atendimento para hoje</p>
                  <p className="text-sm text-gray-400 mt-1">Os agendamentos do dia aparecerão aqui</p>
                </div>
              )}
            </div>
          </div>

          {/* Próximos Agendamentos */}
          {upcomingSchedules.length > 0 && (
            <div className="card-premium p-5 mt-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Próximos Agendamentos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcomingSchedules.map((schedule, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CalendarCheck className="w-5 h-5 text-primary-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{schedule.client_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(schedule.date).toLocaleDateString('pt-BR')} • {schedule.start_time} - {schedule.end_time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="card-premium p-5 mt-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action, index) => {
                if (action.roles && !action.roles.includes(user?.role)) return null;
                const Icon = action.icon;
                return (
                  <button key={index} onClick={() => navigate(action.path)}
                    className={`${action.color} text-white p-4 rounded-xl flex flex-col items-center gap-2.5 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}>
                    <Icon className="w-7 h-7" />
                    <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA - 25% */}
        <div className="lg:col-span-1 space-y-5">
          {/* Alterações Recentes */}
          <div className="card-premium p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4">Alterações Recentes</h2>
            {recentHistory.length > 0 ? (
              <div className="space-y-0">
                {recentHistory.slice(0, 6).map((item, index) => (
                  <div key={item._id || index} className="relative pl-5 pb-3.5 last:pb-0">
                    {index < Math.min(recentHistory.length, 6) - 1 && (
                      <div className="absolute left-[5px] top-2.5 bottom-0 w-px bg-gray-200" />
                    )}
                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-light bg-white" />
                    <div>
                      <p className="text-xs text-gray-900">
                        <span className="font-medium">{item.user_name}</span>{' '}
                        <span className="text-gray-600">{item.action?.replace(/_/g, ' ')}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.time_ago}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Nenhuma alteração</p>
              </div>
            )}
          </div>

          {/* Resumo do Mês */}
          {dashboardData?.month_summary && (
            <div className="card-premium p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">Resumo do Mês</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total de atendimentos</span>
                  <span className="text-lg font-bold text-gray-900">{dashboardData.month_summary.total}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                  {dashboardData.month_summary.concluidos > 0 && (
                    <div className="h-full bg-success" style={{ width: `${(dashboardData.month_summary.concluidos / Math.max(dashboardData.month_summary.total, 1)) * 100}%` }} />
                  )}
                  {dashboardData.month_summary.pendentes > 0 && (
                    <div className="h-full bg-warning" style={{ width: `${(dashboardData.month_summary.pendentes / Math.max(dashboardData.month_summary.total, 1)) * 100}%` }} />
                  )}
                  {dashboardData.month_summary.cancelados > 0 && (
                    <div className="h-full bg-danger" style={{ width: `${(dashboardData.month_summary.cancelados / Math.max(dashboardData.month_summary.total, 1)) * 100}%` }} />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="text-center"><p className="text-base font-bold text-success">{dashboardData.month_summary.concluidos}</p><p className="text-[11px] text-gray-500">Concluídos</p></div>
                  <div className="text-center"><p className="text-base font-bold text-warning">{dashboardData.month_summary.pendentes}</p><p className="text-[11px] text-gray-500">Pendentes</p></div>
                  <div className="text-center"><p className="text-base font-bold text-danger">{dashboardData.month_summary.cancelados}</p><p className="text-[11px] text-gray-500">Cancelados</p></div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmações de Hoje */}
          <div className="card-premium p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Confirmações Hoje</h2>
              <span className="text-2xl font-bold text-success">{dashboardData?.today_confirmations || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Atendimentos confirmados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}