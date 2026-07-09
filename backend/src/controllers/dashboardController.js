const { database } = require('../config/database');

const dashboardController = {
  async getDashboard(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await database.read();

      // Agendamentos de hoje
      const todaySchedules = data.schedules.filter(s => s.date === today);
      
      // Estatísticas de hoje
      const stats = {
        total_hoje: todaySchedules.length,
        confirmados: todaySchedules.filter(s => s.status === 'confirmado').length,
        em_andamento: todaySchedules.filter(s => s.status === 'em_andamento').length,
        pendentes: todaySchedules.filter(s => s.status === 'pendente').length,
        concluidos: todaySchedules.filter(s => 
          ['concluido', 'concluido_ressalva'].includes(s.status)
        ).length,
        cancelados: todaySchedules.filter(s => 
          ['cancelado_cliente', 'funcionario_faltou'].includes(s.status)
        ).length
      };

      // Funcionários ativos
      const activeEmployees = data.employees.filter(e => e.active).length;

      // Agenda de hoje detalhada
      const todayScheduleDetails = todaySchedules.map(schedule => {
        const client = data.clients.find(c => c.id === schedule.client_id);
        const employees = data.employees.filter(e => 
          schedule.employee_ids && schedule.employee_ids.includes(e.id)
        );

        return {
          id: schedule.id,
          time: `${schedule.start_time} - ${schedule.end_time}`,
          client_name: client ? client.name : 'N/A',
          client_phone: client ? client.phone : '',
          employees: employees.map(e => e.name),
          address: schedule.address,
          service: schedule.service,
          status: schedule.status,
          status_label: getStatusLabel(schedule.status)
        };
      });

      // Ordenar por horário
      todayScheduleDetails.sort((a, b) => a.time.localeCompare(b.time));

      // Últimas alterações (histórico recente)
      const recentHistory = data.history
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)
        .map(h => {
          const user = data.users.find(u => u.id === h.user_id);
          return {
            ...h,
            user_name: user ? user.name : 'Sistema',
            time_ago: getTimeAgo(new Date(h.timestamp))
          };
        });

      // Confirmações de hoje
      const todayConfirmations = data.confirmations.filter(c => {
        const confirmationDate = new Date(c.confirmed_at).toISOString().split('T')[0];
        return confirmationDate === today;
      });

      // Resumo do mês
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const monthSchedules = data.schedules.filter(s => {
        const scheduleDate = new Date(s.date);
        return scheduleDate.getMonth() + 1 === currentMonth && 
               scheduleDate.getFullYear() === currentYear;
      });

      const monthSummary = {
        total: monthSchedules.length,
        concluidos: monthSchedules.filter(s => 
          ['concluido', 'concluido_ressalva'].includes(s.status)
        ).length,
        pendentes: monthSchedules.filter(s => 
          ['pendente', 'confirmado', 'em_andamento'].includes(s.status)
        ).length,
        cancelados: monthSchedules.filter(s => 
          ['cancelado_cliente', 'funcionario_faltou'].includes(s.status)
        ).length
      };

      // Próximos agendamentos (7 dias)
      const next7Days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        next7Days.push(date.toISOString().split('T')[0]);
      }

      const upcomingSchedules = data.schedules
        .filter(s => next7Days.includes(s.date))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5)
        .map(schedule => {
          const client = data.clients.find(c => c.id === schedule.client_id);
          return {
            id: schedule.id,
            date: schedule.date,
            time: `${schedule.start_time} - ${schedule.end_time}`,
            client_name: client ? client.name : 'N/A',
            service: schedule.service,
            status: schedule.status
          };
        });

      return res.json({
        date: today,
        stats: {
          ...stats,
          active_employees: activeEmployees
        },
        today_schedules: todayScheduleDetails,
        recent_history: recentHistory,
        today_confirmations: todayConfirmations.length,
        month_summary: monthSummary,
        upcoming_schedules: upcomingSchedules,
        // Dados para gráficos
        chart_data: {
          status_distribution: {
            labels: ['Concluídos', 'Pendentes', 'Em Andamento', 'Cancelados'],
            values: [
              monthSummary.concluidos,
              monthSummary.pendentes - stats.em_andamento,
              stats.em_andamento,
              monthSummary.cancelados
            ]
          }
        }
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

// Funções auxiliares
function getStatusLabel(status) {
  const labels = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    concluido_ressalva: 'Concluído c/ Ressalva',
    cancelado_cliente: 'Cancelado pelo Cliente',
    funcionario_faltou: 'Funcionário Faltou'
  };
  return labels[status] || status;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' anos atrás';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' meses atrás';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' dias atrás';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' horas atrás';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutos atrás';
  
  return 'agora mesmo';
}

module.exports = dashboardController;