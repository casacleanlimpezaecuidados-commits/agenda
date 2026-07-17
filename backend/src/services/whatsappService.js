const { getWhatsAppClient } = require('../config/whatsapp');

async function sendScheduleNotification(phone, message) {
  try {
    const client = getWhatsAppClient();
    
    if (!client) {
      console.log('⚠️ WhatsApp não está conectado. Notificação não enviada.');
      return { success: false, error: 'WhatsApp não conectado' };
    }

    const formattedPhone = formatPhoneNumber(phone);
    
    if (!formattedPhone || formattedPhone.length < 10) {
      console.log('⚠️ Número de telefone inválido:', phone);
      return { success: false, error: 'Número inválido' };
    }

    const chat = await client.sendMessage(`${formattedPhone}@c.us`, message);
    
    console.log(`✅ Notificação enviada para ${formattedPhone}`);
    return { success: true, messageId: chat.id._serialized };
  } catch (error) {
    console.error('❌ Erro ao enviar notificação WhatsApp:', error);
    return { success: false, error: error.message };
  }
}

async function sendBulkNotifications(notifications) {
  const results = [];
  
  for (const notification of notifications) {
    const result = await sendScheduleNotification(notification.phone, notification.message);
    results.push({
      phone: notification.phone,
      ...result
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

async function checkWhatsAppStatus() {
  try {
    const client = getWhatsAppClient();
    
    if (!client) {
      return { connected: false, state: 'DISCONNECTED' };
    }

    const state = await client.getState();
    return { 
      connected: state === 'CONNECTED', 
      state,
      info: client.info || null
    };
  } catch (error) {
    return { connected: false, state: 'ERROR', error: error.message };
  }
}

async function sendTestMessage(phone) {
  try {
    const testMessage = `✅ *Casa & Clean - Teste de Notificação*\n\n` +
                       `Esta é uma mensagem de teste do sistema de agendamentos.\n\n` +
                       `🕐 ${new Date().toLocaleString('pt-BR')}\n\n` +
                       `Seu WhatsApp está configurado corretamente!`;
    
    return await sendScheduleNotification(phone, testMessage);
  } catch (error) {
    console.error('Erro ao enviar mensagem de teste:', error);
    return { success: false, error: error.message };
  }
}

// ========== NOVA FUNÇÃO ==========
async function sendDailySchedule(phone, date, schedules) {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  let message = `📅 *AGENDA DO DIA*\n`;
  message += `📆 ${formattedDate}\n`;
  message += `📋 ${schedules.length} atendimentos\n\n`;

  if (schedules.length === 0) {
    message += `✅ Nenhum atendimento agendado para hoje.\n\n`;
  } else {
    schedules.forEach((s, index) => {
      message += `━━━━━━━━━━━━━━━━\n`;
      message += `🔹 *${index + 1}.* ${s.client_name || 'N/D'}\n`;
      message += `🕐 ${s.start_time} às ${s.end_time}\n`;
      message += `👤 ${s.employee_names?.join(', ') || 'N/D'}\n`;
      message += `🔧 ${s.service || 'N/D'}\n`;
      message += `📍 ${s.address || 'N/D'}\n`;
      if (s.notes) message += `📝 ${s.notes}\n`;
      message += `📌 Status: ${getStatusLabel(s.status)}\n`;
    });
  }

  message += `\n━━━━━━━━━━━━━━━━\n`;
  message += `🏢 *Casa & Clean - Gestão Operacional*\n`;
  message += `🔗 agenda.casaeclean.com.br`;

  return await sendScheduleNotification(phone, message);
}

function getStatusLabel(status) {
  const labels = {
    pendente: '🟡 Pendente',
    confirmado: '🟢 Confirmado',
    em_andamento: '🔵 Em Andamento',
    concluido: '✅ Concluído',
    concluido_ressalva: '⚠️ Concluído c/ Ressalva',
    cancelado_cliente: '❌ Cancelado',
    funcionario_faltou: '🚫 Funcionário Faltou'
  };
  return labels[status] || status;
}
// ========== FIM NOVA FUNÇÃO ==========

function formatPhoneNumber(phone) {
  let numbers = phone.replace(/\D/g, '');
  if (numbers.length === 10 || numbers.length === 11) {
    numbers = '55' + numbers;
  }
  return numbers;
}

module.exports = {
  sendScheduleNotification,
  sendBulkNotifications,
  checkWhatsAppStatus,
  sendTestMessage,
  sendDailySchedule
};