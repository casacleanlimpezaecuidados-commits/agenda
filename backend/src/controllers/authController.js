const bcrypt = require('bcryptjs');
const { Schedule, Client, Employee, History, Confirmation } = require('../config/database');
const { generateToken } = require('../config/jwt');

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const user = await User.findOne({ email, active: true });

      if (!user) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      const token = generateToken(user);

      await History.create({
        user_id: user.id,
        action: 'login',
        new_value: 'Login realizado',
        timestamp: new Date()
      });

      return res.json({
        user: {
          id: user._id,
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
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json({
        id: user._id,
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
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!validPassword) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = authController;