const bcrypt = require('bcryptjs');
const { User, History } = require('../config/database');

const userController = {
  async list(req, res) {
    try {
      const users = await User.find().sort({ created_at: -1 });
      // Não enviar senha na resposta
      const safeUsers = users.map(u => {
        const userObj = u.toObject();
        delete userObj.password;
        return userObj;
      });
      return res.json(safeUsers);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const { name, email, password, role } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      // Verificar se email já existe
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ error: 'Este email já está cadastrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: role || 'auxiliar',
        active: true
      });

      await History.create({
        user_id: req.user.id,
        action: 'criou_usuario',
        new_value: `Usuário: ${user.name} (${user.role})`,
        timestamp: new Date()
      });

      const userObj = user.toObject();
      delete userObj.password;

      return res.status(201).json(userObj);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const { name, email, password, role, active } = req.body;
      const updateData = {};
      
      if (name) updateData.name = name.trim();
      if (email) updateData.email = email.trim().toLowerCase();
      if (role) updateData.role = role;
      if (active !== undefined) updateData.active = active;
      if (password && password.trim()) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await History.create({
        user_id: req.user.id,
        action: 'atualizou_usuario',
        new_value: `Usuário: ${user.name}`,
        timestamp: new Date()
      });

      const userObj = user.toObject();
      delete userObj.password;

      return res.json(userObj);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async remove(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id, 
        { active: false }, 
        { new: true }
      );
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await History.create({
        user_id: req.user.id,
        action: 'desativou_usuario',
        old_value: user.name,
        new_value: 'Usuário desativado',
        timestamp: new Date()
      });

      return res.json({ message: 'Usuário desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};

module.exports = userController;