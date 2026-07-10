require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://casacleanlimpezaecuidados_db_user:QXZxdOPjynmzsdUz@casa-clean.ofmuscx.mongodb.net/casa-clean?retryWrites=true&w=majority&appName=casa-clean';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'auxiliar' },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createSupervisor() {
  await mongoose.connect(MONGODB_URI);
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // CRIE QUANTOS SUPERVISORES QUISER AQUI
  const supervisores = [
    { name: 'Antonio', email: 'liberatoa068@gmail.com' },
    { name: 'Cida', email: 'cida7181@gmail.com' },
    // Adicione mais aqui:
    // { name: 'Supervisor 2', email: 'supervisor2@casaclean.com' },
  ];
  
  for (const sup of supervisores) {
    const exists = await User.findOne({ email: sup.email });
    if (!exists) {
      await User.create({
        name: sup.name,
        email: sup.email,
        password: hashedPassword,
        role: 'supervisor',
        active: true
      });
      console.log(`✅ Criado: ${sup.name} (${sup.email})`);
    } else {
      console.log(`⏭️ Já existe: ${sup.email}`);
    }
  }
  
  console.log('\n🔑 Senha padrão para todos: admin123');
  await mongoose.disconnect();
  process.exit(0);
}

createSupervisor();