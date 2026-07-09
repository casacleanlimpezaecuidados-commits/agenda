const { Schedule, Employee, History, Confirmation } = require('../config/database');

const dashboardController = {
  async getDashboard(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const todaySchedules = await Schedule.find({ date: today });
      const activeEmployees = await Employee.countDocuments({ active: true });
      const recentHistory = await History.find().sort({ timestamp: -1 }).limit(10);
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

module.exports = dashboardController;