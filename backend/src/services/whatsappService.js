const { getWhatsAppClient } = require('../config/whatsapp');

async function sendScheduleNotification(phone, message) {
  try {
    const client = getWhatsAppClient();
    
    if (!client) {
      console.log('⚠️ WhatsApp não está conectado. Notificação não enviada.');
      return { success: false, error: 'WhatsApp não conectado' };
    }

    // Formatar número de telefone (remover caracteres não numéricos e adicionar código do país)
    const formattedPhone = formatPhoneNumber(phone);
    
    // Verificar se o número é válido
    if (!formattedPhone || formattedPhone.length < 10) {
      console.log('⚠️ Número de telefone inválido:', phone);
      return { success: false, error: 'Número inválido' };
    }

    // Enviar mensagem
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
    
    // Pequeno delay entre envios para evitar bloqueio
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

function formatPhoneNumber(phone) {
  // Remove todos os caracteres não numéricos
  let numbers = phone.replace(/\D/g, '');
  
  // Se o número não tiver código do país, adiciona 55 (Brasil)
  if (numbers.length === 10 || numbers.length === 11) {
    numbers = '55' + numbers;
  }
  
  return numbers;
}

module.exports = {
  sendScheduleNotification,
  sendBulkNotifications,
  checkWhatsAppStatus,
  sendTestMessage
};