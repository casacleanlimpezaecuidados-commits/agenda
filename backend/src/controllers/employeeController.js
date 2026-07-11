const { Schedule, Client, Employee, History, Confirmation } = require('../config/database');

const employeeController = {
  async list(req, res) {
    try {
      const { search, active, role, type } = req.query;
      let query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      if (active !== undefined) query.active = active === 'true';
      else query.active = true;
      if (role) query.role = role;
      if (type) query.type = type;

      let employees = await Employee.find(query).sort({ created_at: -1 });

      const enriched = await Promise.all(employees.map(async (emp) => {
        const totalSchedules = await Schedule.countDocuments({ employee_ids: emp._id });
        const todaySchedules = await Schedule.countDocuments({
          employee_ids: emp._id,
          date: new Date().toISOString().split('T')[0]
        });
        return { 
          ...emp.toObject(), 
          total_schedules: totalSchedules, 
          today_schedules: todaySchedules 
        };
      }));

      return res.json(enriched);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const { name, phone } = req.body;
      if (!name || !phone) return res.status(400).json({ error: 'Nome e telefone obrigatórios' });

      const employee = await Employee.create({
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email || '',
        role: req.body.role || 'auxiliar',
        type: req.body.type || 'clt',
        active: true
      });

      await History.create({
        user_id: req.user.id,
        action: 'criou_funcionario',
        new_value: `Funcionário: ${employee.name} (${employee.type === 'clt' ? 'CLT' : employee.type === 'diarista' ? 'Diarista' : 'Fora de Folha'})`,
        timestamp: new Date()
      });

      return res.status(201).json(employee);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const employee = await Employee.findById(req.params.id);
      if (!employee) return res.status(404).json({ error: 'Funcionário não encontrado' });

      const schedules = await Schedule.find({ employee_ids: employee._id }).sort({ date: 1 });
      return res.json({ ...employee.toObject(), schedules });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const updateData = { ...req.body };
      
      // ✅ CORRIGIDO: adicionado 'fora_de_folha' na lista de tipos válidos
      if (updateData.type && !['clt', 'diarista', 'fora_de_folha'].includes(updateData.type)) {
        delete updateData.type;
      }

      const employee = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!employee) return res.status(404).json({ error: 'Funcionário não encontrado' });
      return res.json(employee);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async remove(req, res) {
    try {
      await Employee.findByIdAndUpdate(req.params.id, { active: false });
      return res.json({ message: 'Funcionário desativado' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async getSchedule(req, res) {
    try {
      const { month, year } = req.query;
      let query = { employee_ids: req.params.id };

      if (month && year) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
        query.date = { $gte: startDate, $lte: endDate };
      }

      const schedules = await Schedule.find(query).sort({ date: 1 });
      return res.json(schedules);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

module.exports = employeeController;