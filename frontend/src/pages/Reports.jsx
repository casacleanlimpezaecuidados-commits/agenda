import { useState } from 'react';
import api from '../services/api';
import {
  FileText,
  Download,
  Copy,
  Check,
  BarChart3,
  Calendar,
  Building2,
} from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Reports() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients', { params: { active: true } });
      setClients(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  useState(() => {
    loadClients();
  }, []);

  const generateReport = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      const response = await api.get('/schedules/report', {
        params: {
          client_id: selectedClient,
          month: selectedMonth,
          year: selectedYear
        }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (reportData?.export_csv) {
      navigator.clipboard.writeText(reportData.export_csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadCSV = () => {
    if (reportData?.export_csv) {
      const blob = new Blob([reportData.export_csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio_${reportData.client.name}_${selectedMonth}_${selectedYear}.csv`;
      link.click();
    }
  };

  const years = [];
  for (let y = 2024; y <= 2030; y++) {
    years.push(y);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 mt-1">Gere relatórios detalhados por cliente e período</p>
      </div>

      <div className="card-premium p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Gerar Relatório</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label-premium">Cliente</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="select-premium pl-9"
                onClick={loadClients}
              >
                <option value="">Selecionar cliente...</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-premium">Mês</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="select-premium pl-9">
                {MONTHS.map((month, idx) => (<option key={idx} value={idx + 1}>{month}</option>))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-premium">Ano</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="select-premium pl-9">
                {years.map(year => (<option key={year} value={year}>{year}</option>))}
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <button onClick={generateReport} disabled={!selectedClient || loading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FileText className="w-4 h-4" /> Gerar Relatório</>}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card-premium p-5 bg-gradient-to-br from-primary-50 to-white"><p className="text-sm text-gray-500 mb-1">Total</p><p className="text-3xl font-bold text-gray-900">{reportData.summary.total}</p></div>
            <div className="card-premium p-5 bg-gradient-to-br from-success/5 to-white"><p className="text-sm text-gray-500 mb-1">Concluídos</p><p className="text-3xl font-bold text-success">{reportData.summary.concluido + reportData.summary.concluido_ressalva}</p></div>
            <div className="card-premium p-5 bg-gradient-to-br from-danger/5 to-white"><p className="text-sm text-gray-500 mb-1">Cancelados</p><p className="text-3xl font-bold text-danger">{reportData.summary.cancelado_cliente}</p></div>
            <div className="card-premium p-5 bg-gradient-to-br from-warning/5 to-white"><p className="text-sm text-gray-500 mb-1">Faltas</p><p className="text-3xl font-bold text-warning">{reportData.summary.funcionario_faltou}</p></div>
          </div>

          <div className="card-premium p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div><h3 className="text-lg font-bold text-gray-900">{reportData.client.name}</h3><p className="text-sm text-gray-500">Período: {reportData.period} • {reportData.summary.total} atendimentos</p></div>
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="btn-secondary flex items-center gap-2 text-sm">{copied ? <><Check className="w-4 h-4 text-success" />Copiado!</> : <><Copy className="w-4 h-4" />Copiar para Excel</>}</button>
                <button onClick={downloadCSV} className="btn-primary flex items-center gap-2 text-sm"><Download className="w-4 h-4" />Baixar CSV</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100"><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Dia</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Horário</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Serviço</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Endereço</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Funcionários</th><th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {reportData.schedules.map((schedule, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm text-gray-900">{new Date(schedule.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{schedule.weekday}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{schedule.start_time} - {schedule.end_time}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.service}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{schedule.address}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{schedule.employees?.join(', ')}</td>
                      <td className="px-4 py-3 text-center"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${schedule.status === 'concluido' ? 'bg-success-light text-success' : schedule.status === 'concluido_ressalva' ? 'bg-warning-light text-warning' : schedule.status === 'cancelado_cliente' ? 'bg-danger-light text-danger' : 'bg-gray-100 text-gray-600'}`}>{schedule.status_label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}