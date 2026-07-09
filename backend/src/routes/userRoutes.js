const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const database = require('../config/database');
const bcrypt = require('bcryptjs');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Listar usuários
router.get('/', (req, res) => {
  const users = database.findAll('users').map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt
  }));
  return res.json(users);
});

// Criar usuário
router.post('/', (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }
  
  const existingUser = database.findOne('users', { email });
  if (existingUser) {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const user = database.create('users', {
    name,
    email,
    password: hashedPassword,
    role: role || 'supervisor',
    active: true
  });
  
  const { password: _, ...userWithoutPassword } = user;
  return res.status(201).json(userWithoutPassword);
});

// Atualizar usuário
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { password, ...data } = req.body;
  
  if (password) {
    data.password = bcrypt.hashSync(password, 10);
  }
  
  const user = database.update('users', parseInt(id), data);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  return res.json(userWithoutPassword);
});

// Desativar usuário
router.delete('/:id', (req, res) => {
  const user = database.update('users', parseInt(req.params.id), { active: false });
  
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  return res.json({ message: 'Usuário desativado com sucesso' });
});

module.exports = router;