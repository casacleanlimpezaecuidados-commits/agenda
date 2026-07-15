const cron = require('node-cron');
const { Schedule, History } = require('./database');

function startAutoCloseCron() {
  
  // ========== CRON 1: INICIAR (10:00 UTC = 07:00 Brasil) ==========
  cron.schedule('0 10 * * *', async () => {
    console.log('🕐 [CRON 07:00 BRT] Iniciando agendamentos do dia...');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const schedulesToStart = await Schedule.find({
        date: today,
        status: { $in: ['pendente', 'confirmado'] }
      });

      let count = 0;
      for (const schedule of schedulesToStart) {
        schedule.status = 'em_andamento';
        await schedule.save();
        count++;

        await History.create({
          schedule_id: schedule._id,
          user_id: null,
          action: 'inicio_automatico',
          old_value: schedule.status === 'em_andamento' ? 'pendente' : schedule.status,
          new_value: 'em_andamento',
          timestamp: new Date()
        });
      }

      console.log(`✅ [CRON 07:00] ${count} agendamentos iniciados`);
    } catch (error) {
      console.error('❌ [CRON 07:00] Erro:', error.message);
    }
  });

  // ========== CRON 2: FECHAR (21:01 UTC = 18:01 Brasil) ==========
  cron.schedule('1 21 * * *', async () => {
    console.log('🕐 [CRON 18:01 BRT] Fechando agendamentos do dia...');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const schedulesToClose = await Schedule.find({
        date: today,
        status: 'em_andamento'
      });

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

      console.log(`✅ [CRON 18:01] ${count} agendamentos fechados`);
    } catch (error) {
      console.error('❌ [CRON 18:01] Erro:', error.message);
    }
  });

  console.log('⏰ Cron jobs configurados (horário Brasil):');
  console.log('   - Início automático: 07:00 (pendente/confirmado → em_andamento)');
  console.log('   - Fechamento automático: 18:01 (em_andamento → concluído)');
}

module.exports = { startAutoCloseCron };