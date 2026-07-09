const { database } = require('../config/database');

const scheduleController = {
  // Listar agendamentos
  async list(req, res) {
    try {
      const { month, year, date, client_id, employee_id, status } = req.query;
      const data = await database.read();
      let schedules = data.schedules || [];

      // Filtro por mês/ano
      if (month && year) {
        schedules = schedules.filter(s => {
          if (!s.date) return false;
          const scheduleDate = new Date(s.date + 'T00:00:00');
          return scheduleDate.getMonth() + 1 === parseInt(month) && 
                 scheduleDate.getFullYear() === parseInt(year);
        });
      }

      // Filtro por data específica
      if (date) {
        schedules = schedules.filter(s => s.date === date);
      }

      // Filtro por cliente
      if (client_id) {
        schedules = schedules.filter(s => s.client_id === parseInt(client_id));
      }

      // Filtro por funcionário
      if (employee_id) {
        schedules = schedules.filter(s => 
          s.employee_ids && s.employee_ids.includes(parseInt(employee_id))
        );
      }

      // Filtro por status
      if (status) {
        schedules = schedules.filter(s => s.status === status);
      }

      // Enriquece com dados de cliente e funcionários
      const enrichedSchedules = schedules.map(schedule => {
        const client = data.clients?.find(c => c.id === schedule.client_id);
        const employees = data.employees?.filter(e => 
          schedule.employee_ids && schedule.employee_ids.includes(e.id)
        ) || [];

        return {
          ...schedule,
          client_name: client ? client.name : 'Cliente não encontrado',
          client_phone: client ? client.phone : '',
          employee_names: employees.map(e => e.name),
          employee_details: employees.map(e => ({ id: e.id, name: e.name, role: e.role }))
        };
      });

      // Ordenar por data e horário
      enrichedSchedules.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.start_time || '').localeCompare(b.start_time || '');
      });

      return res.json(enrichedSchedules);
    } catch (error) {
      console.error('❌ Erro ao listar agendamentos:', error);
      return res.status(500).json({ error: 'Erro ao listar: ' + error.message });
    }
  },

  // Criar agendamento único
  async create(req, res) {
    try {
      console.log('📝 Dados recebidos:', JSON.stringify(req.body, null, 2));

      const { 
        client_id, 
        employee_ids, 
        date, 
        start_time, 
        end_time, 
        service, 
        address,
        notes 
      } = req.body;

      // Validações
      if (!client_id) {
        return res.status(400).json({ error: 'Cliente é obrigatório' });
      }
      if (!date) {
        return res.status(400).json({ error: 'Data é obrigatória' });
      }
      if (!start_time || !end_time) {
        return res.status(400).json({ error: 'Horário é obrigatório' });
      }
      if (!service) {
        return res.status(400).json({ error: 'Serviço é obrigatório' });
      }

      // Garantir que client_id é número
      const clientIdNum = parseInt(client_id);
      
      // Processar employee_ids
      let finalEmployeeIds = [];
      if (employee_ids) {
        if (Array.isArray(employee_ids)) {
          finalEmployeeIds = employee_ids.map(id => parseInt(id));
        } else if (typeof employee_ids === 'string') {
          try {
            const parsed = JSON.parse(employee_ids);
            finalEmployeeIds = Array.isArray(parsed) ? parsed.map(id => parseInt(id)) : [parseInt(parsed)];
          } catch {
            finalEmployeeIds = [parseInt(employee_ids)];
          }
        } else {
          finalEmployeeIds = [parseInt(employee_ids)];
        }
      }

      if (!finalEmployeeIds.length) {
        return res.status(400).json({ error: 'É necessário atribuir pelo menos um funcionário' });
      }

      // Ler dados atuais
      const data = await database.read();
      
      // Verificar se cliente existe
      const client = data.clients?.find(c => c.id === clientIdNum);
      if (!client) {
        return res.status(404).json({ error: `Cliente ID ${clientIdNum} não encontrado` });
      }

      // Verificar se funcionários existem
      for (const empId of finalEmployeeIds) {
        const employee = data.employees?.find(e => e.id === empId);
        if (!employee) {
          return res.status(404).json({ error: `Funcionário ID ${empId} não encontrado` });
        }
      }

      // ==========================================
      // VERIFICAÇÃO DE DUPLICIDADE DE AGENDAMENTO
      // ==========================================
      const finalAddress = address || '';
      const duplicateSchedule = (data.schedules || []).find(s => 
        s.client_id === clientIdNum &&
        s.date === date &&
        s.start_time === start_time &&
        (s.address || '') === finalAddress &&
        ['pendente', 'confirmado', 'em_andamento'].includes(s.status)
      );

      if (duplicateSchedule) {
        console.log('⚠️ Agendamento duplicado detectado!');
        return res.status(409).json({ 
          error: 'Já existe um agendamento para este cliente na mesma data, horário e endereço',
          duplicate_id: duplicateSchedule.id,
          duplicate_date: duplicateSchedule.date,
          duplicate_time: `${duplicateSchedule.start_time} - ${duplicateSchedule.end_time}`,
          duplicate_status: duplicateSchedule.status,
          message: 'Verifique se este agendamento já não foi criado anteriormente.'
        });
      }
      // ==========================================

      // Criar objeto do agendamento
      const scheduleData = {
        client_id: clientIdNum,
        employee_ids: finalEmployeeIds,
        date: date,
        start_time: start_time,
        end_time: end_time,
        service: service,
        address: finalAddress,
        notes: notes || '',
        status: 'pendente',
        created_by: req.user.id,
        created_at: new Date().toISOString(),
        recurring_template_id: null
      };

      console.log('💾 Salvando agendamento...');

      // Inserir no banco
      if (!data.schedules) data.schedules = [];
      const newId = data.schedules.length > 0 
        ? Math.max(...data.schedules.map(s => s.id)) + 1 
        : 1;
      
      const schedule = { id: newId, ...scheduleData };
      data.schedules.push(schedule);

      // Registrar no histórico
      if (!data.history) data.history = [];
      data.history.push({
        id: data.history.length + 1,
        schedule_id: schedule.id,
        user_id: req.user.id,
        action: 'criou_agendamento',
        old_value: '',
        new_value: `${date} - ${start_time} - ${client.name}`,
        timestamp: new Date().toISOString()
      });

      await database.write(data);
      console.log('✅ Agendamento criado com ID:', schedule.id);

      // Tentar enviar notificação WhatsApp (não bloquear se falhar)
      try {
        const { sendScheduleNotification } = require('../services/whatsappService');
        const { formatScheduleMessage } = require('../services/messageService');
        if (client.phone) {
          const message = formatScheduleMessage(schedule, client, 'novo');
          await sendScheduleNotification(client.phone, message);
        }
      } catch (notifError) {
        console.log('⚠️ WhatsApp não disponível:', notifError.message);
      }

      return res.status(201).json(schedule);
    } catch (error) {
      console.error('❌ ERRO DETALHADO:', error.stack);
      return res.status(500).json({ 
        error: 'Erro interno do servidor', 
        details: error.message
      });
    }
  },

  // Criar recorrência
  async createRecurring(req, res) {
    try {
      console.log('📝 Dados recebidos (recorrência):', JSON.stringify(req.body, null, 2));

      const {
        client_id,
        employee_ids,
        start_date,
        end_date,
        frequency,
        days_of_week,
        start_time,
        end_time,
        service,
        address,
        notes
      } = req.body;

      if (!client_id || !start_date || !end_date || !frequency || !days_of_week || !start_time || !end_time || !service) {
        return res.status(400).json({ 
          error: 'Campos obrigatórios faltando',
          required: ['client_id', 'start_date', 'end_date', 'frequency', 'days_of_week', 'start_time', 'end_time', 'service']
        });
      }

      let finalEmployeeIds = [];
      if (employee_ids) {
        if (Array.isArray(employee_ids)) {
          finalEmployeeIds = employee_ids.map(id => parseInt(id));
        } else {
          finalEmployeeIds = [parseInt(employee_ids)];
        }
      }

      if (!finalEmployeeIds.length) {
        return res.status(400).json({ error: 'É necessário atribuir pelo menos um funcionário' });
      }

      const data = await database.read();
      const client = data.clients?.find(c => c.id === parseInt(client_id));
      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const generatedDates = generateRecurringDates(start_date, end_date, frequency, days_of_week);
      console.log(`📅 ${generatedDates.length} datas geradas`);

      if (generatedDates.length === 0) {
        return res.status(400).json({ error: 'Nenhuma data gerada. Verifique o período e dias selecionados.' });
      }

      // Criar template
      if (!data.recurringTemplates) data.recurringTemplates = [];
      const templateId = data.recurringTemplates.length > 0 
        ? Math.max(...data.recurringTemplates.map(t => t.id)) + 1 
        : 1;

      const template = {
        id: templateId,
        client_id: parseInt(client_id),
        employee_ids: finalEmployeeIds,
        start_date,
        end_date,
        frequency,
        days_of_week,
        start_time,
        end_time,
        service,
        address: address || '',
        notes: notes || '',
        active: true,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      };
      
      data.recurringTemplates.push(template);

      // Criar agendamentos
      const createdSchedules = [];
      if (!data.schedules) data.schedules = [];

      for (const date of generatedDates) {
        const scheduleId = data.schedules.length > 0 
          ? Math.max(...data.schedules.map(s => s.id)) + 1 
          : 1;
        
        const schedule = {
          id: scheduleId,
          client_id: parseInt(client_id),
          employee_ids: finalEmployeeIds,
          date,
          start_time,
          end_time,
          service,
          address: address || '',
          notes: notes || '',
          status: 'pendente',
          created_by: req.user.id,
          created_at: new Date().toISOString(),
          recurring_template_id: templateId
        };
        
        data.schedules.push(schedule);
        createdSchedules.push(schedule);
      }

      // Histórico
      if (!data.history) data.history = [];
      data.history.push({
        id: data.history.length + 1,
        user_id: req.user.id,
        action: 'criou_recorrencia',
        old_value: '',
        new_value: `${client.name} - ${frequency} - ${generatedDates.length} agendamentos`,
        timestamp: new Date().toISOString()
      });

      await database.write(data);
      console.log(`✅ ${createdSchedules.length} agendamentos recorrentes criados`);

      return res.status(201).json({
        template,
        schedules: createdSchedules,
        total_generated: createdSchedules.length
      });
    } catch (error) {
      console.error('❌ ERRO DETALHADO (recorrência):', error.stack);
      return res.status(500).json({ 
        error: 'Erro ao criar recorrência', 
        details: error.message 
      });
    }
  },

  // Atualizar status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = [
        'pendente', 'confirmado', 'em_andamento', 'concluido', 
        'concluido_ressalva', 'cancelado_cliente', 'funcionario_faltou'
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status inválido', valid_statuses: validStatuses });
      }

      const data = await database.read();
      const scheduleIndex = data.schedules?.findIndex(s => s.id === parseInt(id));
      
      if (scheduleIndex === -1 || scheduleIndex === undefined) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      const oldStatus = data.schedules[scheduleIndex].status;
      data.schedules[scheduleIndex].status = status;
      data.schedules[scheduleIndex].updated_by = req.user.id;
      data.schedules[scheduleIndex].updated_at = new Date().toISOString();

      // Histórico
      if (!data.history) data.history = [];
      data.history.push({
        id: data.history.length + 1,
        schedule_id: parseInt(id),
        user_id: req.user.id,
        action: 'alterou_status',
        old_value: oldStatus,
        new_value: status,
        timestamp: new Date().toISOString()
      });

      // Confirmações
      if (['concluido', 'concluido_ressalva'].includes(status)) {
        if (!data.confirmations) data.confirmations = [];
        data.confirmations.push({
          id: data.confirmations.length + 1,
          schedule_id: parseInt(id),
          employee_id: req.user.id,
          status: status,
          confirmed_at: new Date().toISOString()
        });
      }

      await database.write(data);
      return res.json(data.schedules[scheduleIndex]);
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      return res.status(500).json({ error: 'Erro ao atualizar status: ' + error.message });
    }
  },

  // Substituir funcionário
  async replaceEmployee(req, res) {
    try {
      const { old_employee_id, new_employee_id, start_date, end_date } = req.body;

      if (!old_employee_id || !new_employee_id) {
        return res.status(400).json({ error: 'old_employee_id e new_employee_id são obrigatórios' });
      }

      const data = await database.read();
      const oldId = parseInt(old_employee_id);
      const newId = parseInt(new_employee_id);
      
      const oldEmployee = data.employees?.find(e => e.id === oldId);
      const newEmployee = data.employees?.find(e => e.id === newId);

      if (!oldEmployee || !newEmployee) {
        return res.status(404).json({ error: 'Funcionário não encontrado' });
      }

      let updatedCount = 0;
      
      for (let i = 0; i < (data.schedules || []).length; i++) {
        const schedule = data.schedules[i];
        if (schedule.employee_ids && schedule.employee_ids.includes(oldId)) {
          if (start_date && end_date) {
            if (schedule.date < start_date || schedule.date > end_date) continue;
          }
          
          data.schedules[i].employee_ids = schedule.employee_ids.map(id => 
            id === oldId ? newId : id
          );
          updatedCount++;

          if (!data.history) data.history = [];
          data.history.push({
            id: data.history.length + 1,
            schedule_id: schedule.id,
            user_id: req.user.id,
            action: 'substituiu_funcionario',
            old_value: oldEmployee.name,
            new_value: newEmployee.name,
            timestamp: new Date().toISOString()
          });
        }
      }

      await database.write(data);

      return res.json({
        message: 'Substituição realizada com sucesso',
        old_employee: oldEmployee.name,
        new_employee: newEmployee.name,
        updated_schedules: updatedCount
      });
    } catch (error) {
      console.error('❌ Erro ao substituir funcionário:', error);
      return res.status(500).json({ error: 'Erro ao substituir: ' + error.message });
    }
  },

  // Relatório mensal
  async getReport(req, res) {
    try {
      const { client_id, month, year } = req.query;

      if (!client_id || !month || !year) {
        return res.status(400).json({ error: 'client_id, month e year são obrigatórios' });
      }

      const data = await database.read();
      const client = data.clients?.find(c => c.id === parseInt(client_id));

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const schedules = (data.schedules || []).filter(s => {
        if (!s.date) return false;
        const scheduleDate = new Date(s.date + 'T00:00:00');
        return s.client_id === parseInt(client_id) &&
               scheduleDate.getMonth() + 1 === parseInt(month) &&
               scheduleDate.getFullYear() === parseInt(year);
      });

      const summary = {
        total: schedules.length,
        concluido: schedules.filter(s => s.status === 'concluido').length,
        concluido_ressalva: schedules.filter(s => s.status === 'concluido_ressalva').length,
        cancelado_cliente: schedules.filter(s => s.status === 'cancelado_cliente').length,
        funcionario_faltou: schedules.filter(s => s.status === 'funcionario_faltou').length,
        outros: schedules.filter(s => ['pendente', 'confirmado', 'em_andamento'].includes(s.status)).length
      };

      const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const statusLabels = {
        pendente: 'Pendente', confirmado: 'Confirmado', em_andamento: 'Em Andamento',
        concluido: 'Concluído', concluido_ressalva: 'Concluído c/ Ressalva',
        cancelado_cliente: 'Cancelado pelo Cliente', funcionario_faltou: 'Funcionário Faltou'
      };

      const schedulesDetailed = schedules.map(schedule => {
        const employees = (data.employees || []).filter(e => 
          schedule.employee_ids && schedule.employee_ids.includes(e.id)
        );
        const scheduleDate = new Date(schedule.date + 'T00:00:00');
        
        return {
          date: schedule.date,
          weekday: weekdays[scheduleDate.getDay()] || '',
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          service: schedule.service,
          address: schedule.address,
          employees: employees.map(e => e.name),
          status: schedule.status,
          status_label: statusLabels[schedule.status] || schedule.status
        };
      });

      schedulesDetailed.sort((a, b) => new Date(a.date) - new Date(b.date));

      const csvHeader = 'Data,Dia,Horário,Serviço,Endereço,Funcionários,Status';
      const csvRows = schedulesDetailed.map(s => {
        const formattedDate = s.date.split('-').reverse().join('/');
        return `${formattedDate},${s.weekday},${s.start_time}-${s.end_time},${s.service},"${s.address}","${s.employees.join(', ')}",${s.status_label}`;
      });
      const exportCsv = [csvHeader, ...csvRows].join('\n');

      return res.json({
        client: { name: client.name, phone: client.phone },
        period: `${month.toString().padStart(2, '0')}/${year}`,
        summary,
        schedules: schedulesDetailed,
        export_csv: exportCsv
      });
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      return res.status(500).json({ error: 'Erro ao gerar relatório: ' + error.message });
    }
  },

  // Buscar por ID
  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const data = await database.read();
      const schedule = data.schedules?.find(s => s.id === id);

      if (!schedule) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      const client = data.clients?.find(c => c.id === schedule.client_id);
      const employees = (data.employees || []).filter(e => 
        schedule.employee_ids && schedule.employee_ids.includes(e.id)
      );

      return res.json({ ...schedule, client_details: client, employee_details: employees });
    } catch (error) {
      console.error('❌ Erro ao buscar agendamento:', error);
      return res.status(500).json({ error: 'Erro ao buscar: ' + error.message });
    }
  },

  // Atualizar agendamento
  async update(req, res) {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      delete updates.id;

      const data = await database.read();
      const index = data.schedules?.findIndex(s => s.id === id);

      if (index === -1 || index === undefined) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      data.schedules[index] = { ...data.schedules[index], ...updates, id };

      if (!data.history) data.history = [];
      data.history.push({
        id: data.history.length + 1,
        schedule_id: id,
        user_id: req.user.id,
        action: 'atualizou_agendamento',
        old_value: '',
        new_value: `${data.schedules[index].date} - ${data.schedules[index].start_time}`,
        timestamp: new Date().toISOString()
      });

      await database.write(data);
      return res.json(data.schedules[index]);
    } catch (error) {
      console.error('❌ Erro ao atualizar agendamento:', error);
      return res.status(500).json({ error: 'Erro ao atualizar: ' + error.message });
    }
  },

  // Remover agendamento
  async remove(req, res) {
    try {
      const id = parseInt(req.params.id);
      const data = await database.read();
      const schedule = data.schedules?.find(s => s.id === id);

      if (!schedule) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      const client = data.clients?.find(c => c.id === schedule.client_id);
      const clientName = client ? client.name : 'Cliente desconhecido';
      const scheduleInfo = `${schedule.date} - ${schedule.start_time} - ${clientName}`;

      data.schedules = (data.schedules || []).filter(s => s.id !== id);

      if (!data.history) data.history = [];
      data.history.push({
        id: data.history.length + 1,
        schedule_id: id,
        user_id: req.user.id,
        action: 'removeu_agendamento',
        old_value: scheduleInfo,
        new_value: 'Agendamento excluído',
        timestamp: new Date().toISOString()
      });

      await database.write(data);
      return res.json({ message: 'Agendamento removido com sucesso' });
    } catch (error) {
      console.error('❌ Erro ao remover agendamento:', error);
      return res.status(500).json({ error: 'Erro ao remover: ' + error.message });
    }
  }
};

// Função auxiliar para gerar datas recorrentes
function generateRecurringDates(startDate, endDate, frequency, daysOfWeek) {
  const dates = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  
  const dayMap = {
    'Dom': 0, 'Seg': 1, 'Ter': 2, 'Qua': 3,
    'Qui': 4, 'Sex': 5, 'Sab': 6,
    'Segunda': 1, 'Terça': 2, 'Quarta': 3,
    'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Domingo': 0
  };
  
  const targetDays = daysOfWeek.map(d => dayMap[d] !== undefined ? dayMap[d] : parseInt(d));

  if (frequency === 'semanal') {
    let current = new Date(start);
    while (current <= end) {
      if (targetDays.includes(current.getDay())) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }
  } else if (frequency === 'quinzenal') {
    let current = new Date(start);
    let weekCount = 0;
    while (current <= end) {
      if (weekCount % 2 === 0 && targetDays.includes(current.getDay())) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
      if (current.getDay() === 0) weekCount++;
    }
  } else if (frequency === 'mensal') {
    const dayOfMonth = start.getDate();
    let current = new Date(start.getFullYear(), start.getMonth(), dayOfMonth);
    while (current <= end) {
      if (current >= start && current <= end) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setMonth(current.getMonth() + 1);
    }
  }

  return dates;
}

module.exports = scheduleController;