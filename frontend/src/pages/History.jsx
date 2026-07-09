import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  History,
  Filter,
  Search,
  Clock,
  User,
  Calendar,
  Building2,
  MapPin,
  Phone,
  ChevronDown,
  X,
  RefreshCw,
  Eye,
  GitBranch,
  Edit3,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Users,
} from 'lucide-react';

const actionConfig = {
  login: { 
    icon: User, 
    color: 'text-info bg-info-light border-info/20',
    label: 'Login no sistema',
    category: 'Sistema'
  },
  criou_cliente: { 
    icon: Plus, 
    color: 'text-success bg-success-light border-success/20',
    label: 'Criou cliente',
    category: 'Clientes'
  },
  atualizou_cliente: { 
    icon: Edit3, 
    color: 'text-warning bg-warning-light border-warning/20',
    label: 'Atualizou cliente',
    category: 'Clientes'
  },
  desativou_cliente: { 
    icon: Trash2, 
    color: 'text-danger bg-danger-light border-danger/20',
    label: 'Desativou cliente',
    category: 'Clientes'
  },
  criou_funcionario: { 
    icon: Plus, 
    color: 'text-success bg-success-light border-success/20',
    label: 'Criou funcionário',
    category: 'Funcionários'
  },
  criou_agendamento: { 
    icon: Plus, 
    color: 'text-primary-800 bg-primary-50 border-primary-100',
    label: 'Criou agendamento',
    category: 'Agendamentos'
  },
  atualizou_agendamento: { 
    icon: Edit3, 
    color: 'text-warning bg-warning-light border-warning/20',
    label: 'Atualizou agendamento',
    category: 'Agendamentos'
  },
  removeu_agendamento: { 
    icon: Trash2, 
    color: 'text-danger bg-danger-light border-danger/20',
    label: 'Removeu agendamento',
    category: 'Agendamentos'
  },
  alterou_status: { 
    icon: RefreshCw, 
    color: 'text-info bg-info-light border-info/20',
    label: 'Alterou status',
    category: 'Agendamentos'
  },
  substituiu_funcionario: { 
    icon: GitBranch, 
    color: 'text-purple-600 bg-purple-50 border-purple-100',
    label: 'Substituiu funcionário',
    category: 'Agendamentos'
  },
  fechamento_automatico: { 
    icon: Clock, 
    color: 'text-gray-600 bg-gray-100 border-gray-200',
    label: 'Fechamento automático',
    category: 'Sistema'
  },
  criou_recorrencia: { 
    icon: RefreshCw, 
    color: 'text-success bg-success-light border-success/20',
    label: 'Criou recorrência',
    category: 'Agendamentos'
  },
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [groupedHistory, setGroupedHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (selectedAction) params.action = selectedAction;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/history', { params });
      setHistory(response.data.history || []);
      setGroupedHistory(response.data.grouped || {});
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedAction('');
    setSelectedUser('');
    setStartDate('');
    setEndDate('');
    loadHistory();
  };

  const getActionInfo = (action) => {
    return actionConfig[action] || {
      icon: Clock,
      color: 'text-gray-500 bg-gray-50 border-gray-200',
      label: action.replace(/_/g, ' '),
      category: 'Outros'
    };
  };

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const uniqueActions = [...new Set(history.map(h => h.action))];
  const uniqueUsers = [...new Set(history.map(h => h.user_name))].filter(Boolean);

  // Agrupar por data
  const dates = Object.keys(groupedHistory).sort().reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Histórico de Alterações</h1>
          <p className="text-gray-500 mt-1">
            Registro completo de todas as ações no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-primary-500 text-primary-800' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={loadHistory}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Painel de filtros */}
      {showFilters && (
        <div className="card-premium p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label-premium">Tipo de Ação</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="select-premium"
              >
                <option value="">Todas as ações</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>
                    {getActionInfo(action).label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="label-premium">Data Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-premium"
              />
            </div>
            
            <div>
              <label className="label-premium">Data Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-premium"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadHistory}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-premium p-4 bg-gradient-to-br from-primary-50 to-white">
          <p className="text-sm text-gray-500">Total de Registros</p>
          <p className="text-2xl font-bold text-gray-900">{history.length}</p>
        </div>
        <div className="card-premium p-4 bg-gradient-to-br from-success/5 to-white">
          <p className="text-sm text-gray-500">Criações</p>
          <p className="text-2xl font-bold text-success">
            {history.filter(h => h.action.includes('criou')).length}
          </p>
        </div>
        <div className="card-premium p-4 bg-gradient-to-br from-warning/5 to-white">
          <p className="text-sm text-gray-500">Alterações</p>
          <p className="text-2xl font-bold text-warning">
            {history.filter(h => h.action.includes('alterou') || h.action.includes('atualizou')).length}
          </p>
        </div>
        <div className="card-premium p-4 bg-gradient-to-br from-danger/5 to-white">
          <p className="text-sm text-gray-500">Remoções</p>
          <p className="text-2xl font-bold text-danger">
            {history.filter(h => h.action.includes('removeu') || h.action.includes('desativou')).length}
          </p>
        </div>
      </div>

      {/* Timeline agrupada por data */}
      <div className="card-premium p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-800 rounded-full animate-spin" />
          </div>
        ) : dates.length > 0 ? (
          <div className="space-y-8">
            {dates.map(date => (
              <div key={date}>
                {/* Data */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary-800 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>
                  <span className="text-sm text-gray-500">
                    ({groupedHistory[date].length} registros)
                  </span>
                </div>

                {/* Itens do dia */}
                <div className="relative ml-4 pl-6 border-l-2 border-gray-100 space-y-4">
                  {groupedHistory[date].map((item, index) => {
                    const actionInfo = getActionInfo(item.action);
                    const ActionIcon = actionInfo.icon;
                    
                    return (
                      <div
                        key={item.id || index}
                        className="relative animate-slide-up"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {/* Ponto na timeline */}
                        <div className={`absolute -left-[29px] top-2 w-4 h-4 rounded-full border-2 border-white ${actionInfo.color.split(' ')[1]} shadow-sm`} />

                        {/* Card do item */}
                        <div 
                          className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100/80 transition-colors cursor-pointer"
                          onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                        >
                          {/* Cabeçalho */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg border ${actionInfo.color}`}>
                                <ActionIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">
                                    {item.user_name}
                                  </span>
                                  {item.user_role && (
                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                                      {item.user_role}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {actionInfo.label}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDateTime(item.timestamp)}
                            </span>
                          </div>

                          {/* Detalhes expandidos */}
                          {selectedItem?.id === item.id && (
                            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 animate-slide-up">
                              {/* Informações do agendamento */}
                              {item.schedule_date && (
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>{item.schedule_date} • {item.schedule_time}</span>
                                  </div>
                                  {item.client_name && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Building2 className="w-4 h-4 text-gray-400" />
                                      <span>{item.client_name}</span>
                                    </div>
                                  )}
                                  {item.employee_names?.length > 0 && (
                                    <div className="flex items-center gap-2 text-gray-600 col-span-2">
                                      <Users className="w-4 h-4 text-gray-400" />
                                      <span>{item.employee_names.join(', ')}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Valores alterados */}
                              {(item.old_value || item.new_value) && (
                                <div className="flex items-start gap-3 bg-white rounded-lg p-3">
                                  {item.old_value && (
                                    <div className="flex-1">
                                      <p className="text-xs text-gray-500 mb-0.5">Anterior</p>
                                      <p className="text-sm text-gray-700 line-through">
                                        {item.old_value}
                                      </p>
                                    </div>
                                  )}
                                  {item.old_value && item.new_value && (
                                    <div className="text-gray-400 pt-4">
                                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M6 10h8M10 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </div>
                                  )}
                                  {item.new_value && (
                                    <div className="flex-1">
                                      <p className="text-xs text-gray-500 mb-0.5">Novo</p>
                                      <p className="text-sm text-gray-900 font-medium">
                                        {item.new_value}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* ID do agendamento */}
                              {item.schedule_id && (
                                <p className="text-xs text-gray-400">
                                  Agendamento #{item.schedule_id}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Resumo rápido (quando não expandido) */}
                          {selectedItem?.id !== item.id && (item.old_value || item.new_value) && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {item.old_value && `${item.old_value} → `}
                              {item.new_value}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500">
              Nenhum registro encontrado
            </p>
            <p className="text-sm text-gray-400 mt-1">
              As alterações no sistema aparecerão aqui
            </p>
          </div>
        )}
      </div>
    </div>
  );
}