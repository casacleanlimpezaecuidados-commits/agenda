const bcrypt = require('bcryptjs');
const { database } = require('../config/database');
const { generateToken } = require('../config/jwt');

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const data = await database.read();
      const user = data.users.find(u => u.email === email && u.active);

      if (!user) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      const token = generateToken(user);

      // Registrar login no histórico
      data.history.push({
        id: data.history.length + 1,
        user_id: user.id,
        action: 'login',
        old_value: '',
        new_value: 'Login realizado',
        timestamp: new Date().toISOString()
      });
      await database.write(data);

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async me(req, res) {
    try {
      const data = await database.read();
      const user = data.users.find(u => u.id === req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const data = await database.read();
      const user = data.users.find(u => u.id === req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!validPassword) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;

      await database.write(data);

      return res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = authController;