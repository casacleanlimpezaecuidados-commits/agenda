const { Schedule, Client, Employee, History, Confirmation } = require('../config/database');

const dashboardController = {
  async getDashboard(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Buscar agendamentos de hoje
      const todaySchedulesRaw = await Schedule.find({ date: today });
      
      // ENRIQUECER com dados de cliente e funcionários
      const todaySchedules = await Promise.all(todaySchedulesRaw.map(async (s) => {
        const client = await Client.findById(s.client_id);
        const employees = await Employee.find({ _id: { $in: s.employee_ids } });
        return {
          ...s.toObject(),
          client_name: client ? client.name : 'N/A',
          client_phone: client ? client.phone : '',
          employee_names: employees.map(e => e.name),
          employee_details: employees.map(e => ({ id: e._id, name: e.name, role: e.role }))
        };
      }));

      const activeEmployees = await Employee.countDocuments({ active: true });
      
      // Histórico enriquecido
      const recentHistoryRaw = await History.find().sort({ timestamp: -1 }).limit(10);
      const { User } = require('../config/database');
      const recentHistory = await Promise.all(recentHistoryRaw.map(async (h) => {
        const user = h.user_id ? await User.findById(h.user_id) : null;
        return {
          ...h.toObject(),
          user_name: user ? user.name : 'Sistema',
          time_ago: getTimeAgo(h.timestamp)
        };
      }));

      const todayConfirmations = await Confirmation.countDocuments({
        confirmed_at: { $gte: today + 'T00:00:00', $lte: today + 'T23:59:59' }
      });

      const monthSchedules = await Schedule.find({
        date: {
          $gte: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          $lte: `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`
        }
      });

      const stats = {
        total_hoje: todaySchedules.length,
        confirmados: todaySchedules.filter(s => s.status === 'confirmado').length,
        em_andamento: todaySchedules.filter(s => s.status === 'em_andamento').length,
        pendentes: todaySchedules.filter(s => s.status === 'pendente').length,
        concluidos: todaySchedules.filter(s => ['concluido', 'concluido_ressalva'].includes(s.status)).length,
        cancelados: todaySchedules.filter(s => ['cancelado_cliente', 'funcionario_faltou'].includes(s.status)).length,
        active_employees: activeEmployees
      };

      const monthSummary = {
        total: monthSchedules.length,
        concluidos: monthSchedules.filter(s => ['concluido', 'concluido_ressalva'].includes(s.status)).length,
        pendentes: monthSchedules.filter(s => ['pendente', 'confirmado', 'em_andamento'].includes(s.status)).length,
        cancelados: monthSchedules.filter(s => ['cancelado_cliente', 'funcionario_faltou'].includes(s.status)).length
      };

      return res.json({
        date: today,
        stats,
        today_schedules: todaySchedules,
        recent_history: recentHistory,
        today_confirmations: todayConfirmations,
        month_summary: monthSummary
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

function getTimeAgo(timestamp) {
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (seconds < 60) return 'agora mesmo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(timestamp).toLocaleDateString('pt-BR');
}

module.exports = dashboardController;