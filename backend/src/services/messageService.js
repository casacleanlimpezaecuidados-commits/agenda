const statusEmojis = {
  pendente: '🟡',
  confirmado: '🟢',
  em_andamento: '🔵',
  concluido: '✅',
  concluido_ressalva: '⚠️',
  cancelado_cliente: '❌',
  funcionario_faltou: '🚫'
};

const statusMessages = {
  pendente: 'Novo agendamento criado',
  confirmado: 'Agendamento confirmado',
  em_andamento: 'Agendamento em andamento',
  concluido: 'Atendimento concluído',
  concluido_ressalva: 'Atendimento concluído com ressalva',
  cancelado_cliente: 'Agendamento cancelado',
  funcionario_faltou: 'Funcionário não compareceu',
  alterado: 'Agendamento alterado',
  novo: 'Novo agendamento criado'
};

function formatScheduleMessage(schedule, client, type = 'novo') {
  const emoji = statusEmojis[schedule.status] || '📅';
  const statusMessage = statusMessages[type] || type;
  
  // Formatar data
  const scheduleDate = new Date(schedule.date);
  const formattedDate = scheduleDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Formatar endereço para Google Maps
  const mapsLink = generateGoogleMapsLink(schedule.address);

  const message = `*Casa & Clean - Limpeza e Cuidados* 🏠✨\n\n` +
                  `${emoji} *${statusMessage}*\n\n` +
                  `📋 *Cliente:* ${client.name}\n` +
                  `📅 *Data:* ${formattedDate}\n` +
                  `🕐 *Horário:* ${schedule.start_time} às ${schedule.end_time}\n` +
                  `🔧 *Serviço:* ${schedule.service}\n` +
                  `📍 *Endereço:* ${schedule.address}\n\n` +
                  `🗺️ *Ver no Google Maps:*\n${mapsLink}\n\n` +
                  `${schedule.notes ? `📝 *Observações:* ${schedule.notes}\n\n` : ''}` +
                  `📞 *Dúvidas?* Entre em contato conosco!\n` +
                  `_Mensagem automática do sistema Casa & Clean_`;

  return message;
}

function formatConfirmationMessage(schedule, client, employee) {
  const scheduleDate = new Date(schedule.date);
  const formattedDate = scheduleDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  });

  return `✅ *Atendimento Confirmado*\n\n` +
         `Olá ${client.name}!\n\n` +
         `Seu atendimento foi confirmado:\n\n` +
         `📅 *Data:* ${formattedDate}\n` +
         `🕐 *Horário:* ${schedule.start_time}\n` +
         `👤 *Profissional:* ${employee.name}\n` +
         `🔧 *Serviço:* ${schedule.service}\n\n` +
         `Agradecemos a preferência! 💙`;
}

function formatReminderMessage(schedule, client) {
  const scheduleDate = new Date(schedule.date);
  const formattedDate = scheduleDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  });

  return `🔔 *Lembrete de Agendamento*\n\n` +
         `Olá ${client.name}!\n\n` +
         `Não se esqueça do seu atendimento amanhã:\n\n` +
         `📅 *Data:* ${formattedDate}\n` +
         `🕐 *Horário:* ${schedule.start_time}\n` +
         `🔧 *Serviço:* ${schedule.service}\n` +
         `📍 *Local:* ${schedule.address}\n\n` +
         `Até logo! 💙`;
}

function formatMonthlyReportMessage(client, reportData) {
  const { period, summary } = reportData;
  
  return `📊 *Relatório Mensal - Casa & Clean*\n\n` +
         `👤 *Cliente:* ${client.name}\n` +
         `📅 *Período:* ${period}\n\n` +
         `📈 *Resumo:*\n` +
         `✅ Concluídos: ${summary.concluido}\n` +
         `⚠️ Com Ressalva: ${summary.concluido_ressalva}\n` +
         `❌ Cancelados: ${summary.cancelado_cliente}\n` +
         `🚫 Faltas: ${summary.funcionario_faltou}\n` +
         `📋 *Total:* ${summary.total} atendimentos\n\n` +
         `Para mais detalhes, acesse o sistema ou solicite o relatório completo.`;
}

function generateGoogleMapsLink(address) {
  if (!address) return '';
  
  // Codificar endereço para URL
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

function getStatusColor(status) {
  const colors = {
    pendente: '#EAB308',      // Amarelo
    confirmado: '#22C55E',    // Verde
    em_andamento: '#3B82F6',  // Azul
    concluido: '#10B981',     // Verde escuro
    concluido_ressalva: '#F59E0B', // Laranja
    cancelado_cliente: '#EF4444',  // Vermelho
    funcionario_faltou: '#DC2626'  // Vermelho escuro
  };
  return colors[status] || '#6B7280';
}

module.exports = {
  formatScheduleMessage,
  formatConfirmationMessage,
  formatReminderMessage,
  formatMonthlyReportMessage,
  generateGoogleMapsLink,
  getStatusColor
};