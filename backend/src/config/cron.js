const cron = require('node-cron');
const { database } = require('./database');

function startAutoCloseCron() {
  // Executa todos os dias às 18:01
  cron.schedule('1 18 * * *', async () => {
    console.log('🕐 [CRON] Iniciando fechamento automático dos agendamentos do dia...');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await database.read();
      
      const schedulesToClose = data.schedules.filter(schedule => 
        schedule.date === today && 
        ['pendente', 'confirmado', 'em_andamento'].includes(schedule.status)
      );

      for (const schedule of schedulesToClose) {
        schedule.status = 'concluido';
        schedule.closed_automatically = true;
        schedule.closed_at = new Date().toISOString();

        // Registrar no histórico
        data.history.push({
          id: data.history.length + 1,
          schedule_id: schedule.id,
          user_id: 0, // Sistema
          action: 'fechamento_automatico',
          old_value: schedule.status,
          new_value: 'concluido',
          timestamp: new Date().toISOString()
        });
      }

      await database.write(data);
      console.log(`✅ [CRON] ${schedulesToClose.length} agendamentos fechados automaticamente`);
    } catch (error) {
      console.error('❌ [CRON] Erro no fechamento automático:', error);
    }
  });

  console.log('⏰ Cron jobs configurados:');
  console.log('   - Fechamento automático: Todo dia às 18:01');
}

module.exports = { startAutoCloseCron };