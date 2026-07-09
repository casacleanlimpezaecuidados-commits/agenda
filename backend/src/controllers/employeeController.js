const { database } = require('../config/database');

const employeeController = {
  async list(req, res) {
    try {
      const { search, active, role } = req.query;
      let employees = await database.findAll('employees');

      // Filtro de busca
      if (search) {
        const searchLower = search.toLowerCase();
        employees = employees.filter(emp => 
          emp.name.toLowerCase().includes(searchLower) ||
          emp.phone.includes(search) ||
          (emp.email && emp.email.toLowerCase().includes(searchLower))
        );
      }

      // Filtro de ativos
      if (active !== undefined) {
        const isActive = active === 'true';
        employees = employees.filter(emp => emp.active === isActive);
      }

      // Filtro de cargo
      if (role) {
        employees = employees.filter(emp => emp.role === role);
      }

      // Adicionar contagem de agendamentos para cada funcionário
      const data = await database.read();
      employees = employees.map(emp => ({
        ...emp,
        total_schedules: data.schedules.filter(s => 
          s.employee_ids && s.employee_ids.includes(emp.id)
        ).length,
        today_schedules: data.schedules.filter(s => 
          s.employee_ids && 
          s.employee_ids.includes(emp.id) && 
          s.date === new Date().toISOString().split('T')[0]
        ).length
      }));

      return res.json(employees);
    } catch (error) {
      console.error('Erro ao listar funcionários:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async create(req, res) {
    try {
      const { name, phone, email, role } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
      }

      const employee = await database.insert('employees', {
        name,
        phone,
        email: email || '',
        role: role || 'auxiliar',
        active: true,
        created_at: new Date().toISOString()
      });

      // Registrar no histórico
      const data = await database.read();
      data.history.push({
        id: data.history.length + 1,
        user_id: req.user.id,
        action: 'criou_funcionario',
        old_value: '',
        new_value: `Funcionário: ${employee.name}`,
        timestamp: new Date().toISOString()
      });
      await database.write(data);

      return res.status(201).json(employee);
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const employee = await database.findById('employees', id);

      if (!employee) {
        return res.status(404).json({ error: 'Funcionário não encontrado' });
      }

      // Adicionar agenda do funcionário
      const data = await database.read();
      const schedules = data.schedules.filter(s => 
        s.employee_ids && s.employee_ids.includes(employee.id)
      );

      return res.json({
        ...employee,
        schedules: schedules.sort((a, b) => new Date(a.date) - new Date(b.date))
      });
    } catch (error) {
      console.error('Erro ao buscar funcionário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      delete updates.id;
      
      const employee = await database.update('employees', id, updates);

      if (!employee) {
        return res.status(404).json({ error: 'Funcionário não encontrado' });
      }

      return res.json(employee);
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async remove(req, res) {
    try {
      const id = parseInt(req.params.id);
      const employee = await database.findById('employees', id);

      if (!employee) {
        return res.status(404).json({ error: 'Funcionário não encontrado' });
      }

      // Soft delete
      await database.update('employees', id, { active: false });

      return res.json({ message: 'Funcionário desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao remover funcionário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async getSchedule(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { month, year } = req.query;
      
      const data = await database.read();
      let schedules = data.schedules.filter(s => 
        s.employee_ids && s.employee_ids.includes(id)
      );

      // Filtrar por mês/ano se fornecidos
      if (month && year) {
        schedules = schedules.filter(s => {
          const scheduleDate = new Date(s.date);
          return scheduleDate.getMonth() + 1 === parseInt(month) && 
                 scheduleDate.getFullYear() === parseInt(year);
        });
      }

      return res.json(schedules.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) {
      console.error('Erro ao buscar agenda do funcionário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = employeeController;