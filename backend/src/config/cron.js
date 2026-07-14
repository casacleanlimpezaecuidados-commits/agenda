const cron = require('node-cron');
const { Schedule, History } = require('./database');

function startAutoCloseCron() {
  
  // ========== CRON 1: INICIAR AGENDAMENTOS DO DIA (07:00) ==========
  // Muda pendente/confirmado → em_andamento
  cron.schedule('0 7 * * *', async () => {
    console.log('🕐 [CRON 07:00] Iniciando agendamentos do dia...');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const schedulesToStart = await Schedule.find({
        date: today,
        status: { $in: ['pendente', 'confirmado'] }
      });

      if (schedulesToStart.length === 0) {
        console.log(`📅 Nenhum agendamento para iniciar em ${today}`);
        return;
      }

      let count = 0;
      for (const schedule of schedulesToStart) {
        const oldStatus = schedule.status;
        schedule.status = 'em_andamento';
        await schedule.save();
        count++;

        await History.create({
          schedule_id: schedule._id,
          user_id: null,
          action: 'inicio_automatico',
          old_value: oldStatus,
          new_value: 'em_andamento',
          timestamp: new Date()
        });
      }

      console.log(`✅ [CRON 07:00] ${count} agendamentos iniciados automaticamente`);
    } catch (error) {
      console.error('❌ [CRON 07:00] Erro:', error.message);
    }
  });

  // ========== CRON 2: FECHAR AGENDAMENTOS DO DIA (18:01) ==========
  // Muda em_andamento → concluido (só se não foi alterado manualmente)
  cron.schedule('1 18 * * *', async () => {
    console.log('🕐 [CRON 18:01] Fechando agendamentos do dia...');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const schedulesToClose = await Schedule.find({
        date: today,
        status: 'em_andamento'
      });

      if (schedulesToClose.length === 0) {
        console.log(`📅 Nenhum agendamento em andamento para fechar em ${today}`);
        return;
      }

      let count = 0;
      for (const schedule of schedulesToClose) {
        schedule.status = 'concluido';
        schedule.closed_automatically = true;
        schedule.closed_at = new Date().toISOString();
        await schedule.save();
        count++;

        await History.create({
          schedule_id: schedule._id,
          user_id: null,
          action: 'fechamento_automatico',
          old_value: 'em_andamento',
          new_value: 'concluido',
          timestamp: new Date()
        });
      }

      console.log(`✅ [CRON 18:01] ${count} agendamentos fechados automaticamente`);
    } catch (error) {
      console.error('❌ [CRON 18:01] Erro:', error.message);
    }
  });

  console.log('⏰ Cron jobs configurados:');
  console.log('   - Início automático: Todo dia às 07:00 (pendente/confirmado → em_andamento)');
  console.log('   - Fechamento automático: Todo dia às 18:01 (em_andamento → concluído)');
}

module.exports = { startAutoCloseCron };