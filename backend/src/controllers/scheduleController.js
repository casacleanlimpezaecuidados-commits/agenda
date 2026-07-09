const { Schedule, Client, Employee, History, Confirmation } = require('../config/database');

const scheduleController = {
  // Listar agendamentos
  async list(req, res) {
    try {
      const { month, year, date, client_id, employee_id, status } = req.query;
      let query = {};

      if (month && year) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
        query.date = { $gte: startDate, $lte: endDate };
      }
      if (date) query.date = date;
      if (client_id) query.client_id = client_id;
      if (employee_id) query.employee_ids = employee_id;
      if (status) query.status = status;

      let schedules = await Schedule.find(query).sort({ date: 1, start_time: 1 });

      const enriched = await Promise.all(schedules.map(async (s) => {
        const client = await Client.findById(s.client_id);
        const employees = await Employee.find({ _id: { $in: s.employee_ids } });
        return {
          ...s.toObject(),
          client_name: client ? client.name : 'N/A',
          client_phone: client ? client.phone : '',
          employee_names: employees.map(e => e.name),
          employee_details: employees.map(e => ({ id: e._id, name: e.name, role: e.role }))
        };
      }));

      return res.json(enriched);
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar agendamento único
  async create(req, res) {
    try {
      const { client_id, employee_ids, date, start_time, end_time, service, address, notes } = req.body;

      if (!client_id || !date || !start_time || !end_time || !service) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      if (!employee_ids || !employee_ids.length) {
        return res.status(400).json({ error: 'Pelo menos um funcionário é necessário' });
      }

      // Verificar duplicidade
      const duplicate = await Schedule.findOne({
        client_id, date, start_time,
        address: address || '',
        status: { $in: ['pendente', 'confirmado', 'em_andamento'] }
      });

      if (duplicate) {
        return res.status(409).json({ 
          error: 'Já existe um agendamento para este cliente na mesma data, horário e endereço' 
        });
      }

      const schedule = await Schedule.create({
        client_id, employee_ids, date, start_time, end_time,
        service, address: address || '', notes: notes || '',
        status: 'pendente', created_by: req.user.id
      });

      const client = await Client.findById(client_id);

      await History.create({
        schedule_id: schedule._id,
        user_id: req.user.id,
        action: 'criou_agendamento',
        new_value: `${date} - ${start_time} - ${client?.name || 'N/A'}`,
        timestamp: new Date()
      });

      return res.status(201).json(schedule);
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar recorrência
  async createRecurring(req, res) {
    try {
      const { client_id, employee_ids, start_date, end_date, frequency, days_of_week, start_time, end_time, service, address, notes } = req.body;

      if (!client_id || !start_date || !end_date || !frequency || !days_of_week || !start_time || !end_time || !service) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      if (!employee_ids || !employee_ids.length) {
        return res.status(400).json({ error: 'Pelo menos um funcionário é necessário' });
      }

      const generatedDates = generateRecurringDates(start_date, end_date, frequency, days_of_week);
      
      if (generatedDates.length === 0) {
        return res.status(400).json({ error: 'Nenhuma data gerada' });
      }

      const createdSchedules = [];
      for (const date of generatedDates) {
        const schedule = await Schedule.create({
          client_id, employee_ids, date, start_time, end_time,
          service, address: address || '', notes: notes || '',
          status: 'pendente', created_by: req.user.id
        });
        createdSchedules.push(schedule);
      }

      const client = await Client.findById(client_id);

      await History.create({
        user_id: req.user.id,
        action: 'criou_recorrencia',
        new_value: `${client?.name || 'N/A'} - ${frequency} - ${createdSchedules.length} agendamentos`,
        timestamp: new Date()
      });

      return res.status(201).json({ 
        schedules: createdSchedules, 
        total_generated: createdSchedules.length 
      });
    } catch (error) {
      console.error('Erro ao criar recorrência:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar status
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const validStatuses = [
        'pendente', 'confirmado', 'em_andamento', 'concluido', 
        'concluido_ressalva', 'cancelado_cliente', 'funcionario_faltou'
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }

      const schedule = await Schedule.findById(req.params.id);
      if (!schedule) return res.status(404).json({ error: 'Agendamento não encontrado' });

      const oldStatus = schedule.status;
      schedule.status = status;
      await schedule.save();

      await History.create({
        schedule_id: schedule._id,
        user_id: req.user.id,
        action: 'alterou_status',
        old_value: oldStatus,
        new_value: status,
        timestamp: new Date()
      });

      if (['concluido', 'concluido_ressalva'].includes(status)) {
        await Confirmation.create({
          schedule_id: schedule._id,
          employee_id: req.user.id,
          status: status,
          confirmed_at: new Date()
        });
      }

      return res.json(schedule);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Substituir funcionário
  async replaceEmployee(req, res) {
    try {
      const { old_employee_id, new_employee_id, start_date, end_date } = req.body;

      if (!old_employee_id || !new_employee_id) {
        return res.status(400).json({ error: 'IDs obrigatórios' });
      }

      let query = { employee_ids: old_employee_id };
      if (start_date && end_date) {
        query.date = { $gte: start_date, $lte: end_date };
      }

      const schedules = await Schedule.find(query);
      let updatedCount = 0;

      for (const schedule of schedules) {
        schedule.employee_ids = schedule.employee_ids.map(id => 
          id.toString() === old_employee_id.toString() ? new_employee_id : id
        );
        await schedule.save();
        updatedCount++;
      }

      await History.create({
        user_id: req.user.id,
        action: 'substituiu_funcionario',
        old_value: old_employee_id,
        new_value: new_employee_id,
        timestamp: new Date()
      });

      return res.json({ 
        message: 'Substituição realizada com sucesso',
        updated_schedules: updatedCount 
      });
    } catch (error) {
      console.error('Erro ao substituir:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Relatório mensal
  async getReport(req, res) {
    try {
      const { client_id, month, year } = req.query;

      if (!client_id || !month || !year) {
        return res.status(400).json({ error: 'client_id, month e year são obrigatórios' });
      }

      const client = await Client.findById(client_id);
      if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      const schedules = await Schedule.find({
        client_id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const statusLabels = {
        pendente: 'Pendente', confirmado: 'Confirmado', em_andamento: 'Em Andamento',
        concluido: 'Concluído', concluido_ressalva: 'Concluído c/ Ressalva',
        cancelado_cliente: 'Cancelado pelo Cliente', funcionario_faltou: 'Funcionário Faltou'
      };

      const summary = {
        total: schedules.length,
        concluido: schedules.filter(s => s.status === 'concluido').length,
        concluido_ressalva: schedules.filter(s => s.status === 'concluido_ressalva').length,
        cancelado_cliente: schedules.filter(s => s.status === 'cancelado_cliente').length,
        funcionario_faltou: schedules.filter(s => s.status === 'funcionario_faltou').length,
        outros: schedules.filter(s => ['pendente', 'confirmado', 'em_andamento'].includes(s.status)).length
      };

      const schedulesDetailed = await Promise.all(schedules.map(async (s) => {
        const employees = await Employee.find({ _id: { $in: s.employee_ids } });
        const scheduleDate = new Date(s.date + 'T00:00:00');
        return {
          date: s.date,
          weekday: weekdays[scheduleDate.getDay()] || '',
          start_time: s.start_time,
          end_time: s.end_time,
          service: s.service,
          address: s.address,
          employees: employees.map(e => e.name),
          status: s.status,
          status_label: statusLabels[s.status] || s.status
        };
      }));

      const csvHeader = 'Data,Dia,Horário,Serviço,Endereço,Funcionários,Status';
      const csvRows = schedulesDetailed.map(s => {
        const formattedDate = s.date.split('-').reverse().join('/');
        return `${formattedDate},${s.weekday},${s.start_time}-${s.end_time},${s.service},"${s.address}","${s.employees.join(', ')}",${s.status_label}`;
      });
      const exportCsv = [csvHeader, ...csvRows].join('\n');

      return res.json({
        client: { name: client.name, phone: client.phone },
        period: `${month}/${year}`,
        summary,
        schedules: schedulesDetailed,
        export_csv: exportCsv
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar por ID
  async getById(req, res) {
    try {
      const schedule = await Schedule.findById(req.params.id);
      if (!schedule) return res.status(404).json({ error: 'Agendamento não encontrado' });

      const client = await Client.findById(schedule.client_id);
      const employees = await Employee.find({ _id: { $in: schedule.employee_ids } });

      return res.json({
        ...schedule.toObject(),
        client_details: client,
        employee_details: employees
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar agendamento
  async update(req, res) {
    try {
      const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!schedule) return res.status(404).json({ error: 'Agendamento não encontrado' });

      await History.create({
        schedule_id: schedule._id,
        user_id: req.user.id,
        action: 'atualizou_agendamento',
        new_value: `${schedule.date} - ${schedule.start_time}`,
        timestamp: new Date()
      });

      return res.json(schedule);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Remover agendamento
  async remove(req, res) {
    try {
      const schedule = await Schedule.findByIdAndDelete(req.params.id);
      if (!schedule) return res.status(404).json({ error: 'Agendamento não encontrado' });

      const client = await Client.findById(schedule.client_id);
      const clientName = client ? client.name : 'Cliente desconhecido';

      await History.create({
        schedule_id: req.params.id,
        user_id: req.user.id,
        action: 'removeu_agendamento',
        old_value: `${schedule.date} - ${schedule.start_time} - ${clientName}`,
        new_value: 'Agendamento excluído',
        timestamp: new Date()
      });

      return res.json({ message: 'Agendamento removido com sucesso' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
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