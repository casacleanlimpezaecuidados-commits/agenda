const { database } = require('../config/database');

class AutoCloseService {
  async closeDayAutomatically(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const data = await database.read();
      
      // Encontrar agendamentos do dia que não estão em status final
      const schedulesToClose = data.schedules.filter(schedule => 
        schedule.date === targetDate && 
        ['pendente', 'confirmado', 'em_andamento'].includes(schedule.status)
      );

      if (schedulesToClose.length === 0) {
        console.log(`📅 Nenhum agendamento para fechar em ${targetDate}`);
        return { closed: 0, message: 'Nenhum agendamento pendente' };
      }

      // Fechar cada agendamento
      const results = [];
      for (const schedule of schedulesToClose) {
        const previousStatus = schedule.status;
        
        // Atualizar para concluído
        const updatedSchedule = await database.update('schedules', schedule.id, {
          status: 'concluido',
          closed_automatically: true,
          closed_at: new Date().toISOString()
        });

        // Registrar no histórico
        data.history.push({
          id: data.history.length + 1,
          schedule_id: schedule.id,
          user_id: 0, // Sistema
          action: 'fechamento_automatico',
          old_value: previousStatus,
          new_value: 'concluido',
          timestamp: new Date().toISOString()
        });

        results.push({
          schedule_id: schedule.id,
          previous_status: previousStatus,
          new_status: 'concluido'
        });
      }

      await database.write(data);
      
      console.log(`✅ Fechamento automático concluído: ${results.length} agendamentos fechados em ${targetDate}`);
      
      return {
        closed: results.length,
        date: targetDate,
        details: results,
        message: `${results.length} agendamentos fechados automaticamente`
      };
    } catch (error) {
      console.error('❌ Erro no fechamento automático:', error);
      throw error;
    }
  }

  async getPendingSchedules(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const data = await database.read();
      
      const pendingSchedules = data.schedules.filter(schedule => 
        schedule.date === targetDate && 
        ['pendente', 'confirmado', 'em_andamento'].includes(schedule.status)
      );

      return {
        date: targetDate,
        total_pending: pendingSchedules.length,
        schedules: pendingSchedules.map(s => ({
          id: s.id,
          client_id: s.client_id,
          time: `${s.start_time} - ${s.end_time}`,
          service: s.service,
          status: s.status
        }))
      };
    } catch (error) {
      console.error('Erro ao buscar agendamentos pendentes:', error);
      throw error;
    }
  }

  async closeSpecificSchedule(scheduleId) {
    try {
      const schedule = await database.findById('schedules', scheduleId);
      
      if (!schedule) {
        throw new Error('Agendamento não encontrado');
      }

      if (['concluido', 'concluido_ressalva', 'cancelado_cliente', 'funcionario_faltou'].includes(schedule.status)) {
        throw new Error('Agendamento já está em status final');
      }

      const previousStatus = schedule.status;
      const updatedSchedule = await database.update('schedules', scheduleId, {
        status: 'concluido',
        closed_automatically: true,
        closed_at: new Date().toISOString()
      });

      // Registrar no histórico
      const data = await database.read();
      data.history.push({
        id: data.history.length + 1,
        schedule_id: scheduleId,
        user_id: 0,
        action: 'fechamento_manual_automatico',
        old_value: previousStatus,
        new_value: 'concluido',
        timestamp: new Date().toISOString()
      });
      await database.write(data);

      return {
        success: true,
        schedule_id: scheduleId,
        previous_status: previousStatus,
        new_status: 'concluido'
      };
    } catch (error) {
      console.error('Erro ao fechar agendamento específico:', error);
      throw error;
    }
  }
}

module.exports = new AutoCloseService();