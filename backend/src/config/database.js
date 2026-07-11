const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://casacleanlimpezaecuidados_db_user:QXZxdOPjynmzsdUz@casa-clean.ofmuscx.mongodb.net/casa-clean?retryWrites=true&w=majority&appName=casa-clean';

let isConnected = false;

async function connectDatabase() {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB conectado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error.message);
    throw error;
  }
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'auxiliar' },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

const addressSchema = new mongoose.Schema({
  street: String,
  neighborhood: String,
  city: String,
  state: { type: String, default: 'MG' },
  reference: String,
  daysOfWeek: [String]
});

const clientSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  address: String,
  neighborhood: String,
  city: String,
  state: { type: String, default: 'MG' },
  notes: String,
  addresses: [addressSchema],
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const employeeSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  role: { type: String, default: 'auxiliar' },
  type: { type: String, default: 'clt', enum: ['clt', 'diarista'] },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const scheduleSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  employee_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  date: String,
  start_time: String,
  end_time: String,
  service: String,
  address: String,
  notes: String,
  status: { type: String, default: 'pendente' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  recurring_template_id: mongoose.Schema.Types.ObjectId
});

const historySchema = new mongoose.Schema({
  schedule_id: mongoose.Schema.Types.ObjectId,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  old_value: String,
  new_value: String,
  timestamp: { type: Date, default: Date.now }
});

const confirmationSchema = new mongoose.Schema({
  schedule_id: mongoose.Schema.Types.ObjectId,
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  status: String,
  confirmed_at: { type: Date, default: Date.now },
  notes: String
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);
const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);
const History = mongoose.models.History || mongoose.model('History', historySchema);
const Confirmation = mongoose.models.Confirmation || mongoose.model('Confirmation', confirmationSchema);

async function initializeDatabase() {
  try {
    await connectDatabase();
    const adminExists = await User.findOne({ email: 'admin@casaclean.com' });
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Administrador',
        email: 'admin@casaclean.com',
        password: hashedPassword,
        role: 'admin',
        active: true
      });
      console.log('✅ Usuário admin criado');
    }
    console.log('✅ Banco de dados inicializado');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    throw error;
  }
}

module.exports = {
  connectDatabase, initializeDatabase,
  User, Client, Employee, Schedule, History, Confirmation
};