require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://casacleanlimpezaecuidados_db_user:QXZxdOPjynmzsdUz@casa-clean.ofmuscx.mongodb.net/casa-clean?retryWrites=true&w=majority&appName=casa-clean';

// Schemas
const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  role: { type: String, default: 'auxiliar' }, active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

const addressSchema = new mongoose.Schema({
  street: String, neighborhood: String, city: String,
  state: { type: String, default: 'MG' }, reference: String, daysOfWeek: [String]
});

const clientSchema = new mongoose.Schema({
  name: String, phone: String, email: String, address: String,
  neighborhood: String, city: String, state: { type: String, default: 'MG' },
  notes: String, addresses: [addressSchema], active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }, updated_at: { type: Date, default: Date.now }
});

const employeeSchema = new mongoose.Schema({
  name: String, phone: String, email: String,
  role: { type: String, default: 'auxiliar' }, active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }, updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Client = mongoose.model('Client', clientSchema);
const Employee = mongoose.model('Employee', employeeSchema);

// DADOS DOS FUNCIONÁRIOS
const employees = [
  { name: "Arlinda da Silva", phone: "(31) 8409-5244", role: "auxiliar" },
  { name: "Dione Geraldo Alexandre", phone: "(31) 9954-5727", role: "auxiliar" },
  { name: "Giselle Almeida", phone: "(31) 8372-7270", role: "auxiliar" },
  { name: "Julia de Jesus Carneiro", phone: "(31) 9861-0976", role: "auxiliar" },
  { name: "Maria do Carmo de Sena", phone: "(31) 8117-4399", role: "auxiliar" },
  { name: "Maria Pio Francisca", phone: "(31) 7159-6068", role: "auxiliar" },
  { name: "Sabrina Rosária de Freitas", phone: "(31) 8426-5895", role: "auxiliar" },
  { name: "Samila", phone: "(31) 9689-3239", role: "auxiliar" },
  { name: "Thamires Jordana", phone: "(31) 8430-3773", role: "auxiliar" },
];

// DADOS DOS CLIENTES
const clients = [
  {
    name: "3T Construções - Andreza / Leidiane",
    phone: "(31) 8709-1875",
    notes: "06x na semana Segunda a Sexta | 15 em 15 dias aos Sábado",
    addresses: [
      { street: "Rua Piauí, nº 338", neighborhood: "São Sebastião", city: "Mariana-MG", daysOfWeek: ["Segunda"] },
      { street: "Rua Cinco de Junho, nº 193", neighborhood: "Vila Maquiné", city: "Mariana-MG", daysOfWeek: ["Terça"] },
      { street: "Rua José Vicente de Souza, nº 508-A", neighborhood: "São Cristóvão", city: "Mariana-MG", daysOfWeek: ["Terça"] },
      { street: "Rua Amazonas, nº 130-A", neighborhood: "São Sebastião", city: "Mariana-MG", daysOfWeek: ["Quarta"] },
      { street: "Av. dos Pinheiros, nº 22-B", neighborhood: "Jardim dos Inconfidentes", city: "Mariana-MG", daysOfWeek: ["Quarta"] },
      { street: "Rua Lucy de Moraes, nº 175", neighborhood: "Santana", city: "Mariana-MG", daysOfWeek: ["Quinta"] },
      { street: "Rua São Jorge, nº 540", neighborhood: "São Sebastião", city: "Mariana-MG", daysOfWeek: ["Quinta"] },
      { street: "Rua Roraima, nº 55", neighborhood: "Colina", city: "Mariana-MG", daysOfWeek: ["Sexta"] },
    ]
  },
  {
    name: "3Geo Consultoria Élida Gomes",
    phone: "(31) 97121-7352",
    notes: "03x na semana Segunda, Quarta e Sexta",
    addresses: [
      { street: "Rua José Vicente de Souza, 81 - Apto 101", neighborhood: "São Cristóvão", city: "Mariana-MG", daysOfWeek: ["Segunda", "Quarta", "Sexta"] },
    ]
  },
  {
    name: "ALTTO ENGENHARIA LTDA/Gabriela",
    phone: "(31) 9975-5944",
    notes: "01x por Mês",
    addresses: [
      { street: "Rua Platina, 30", neighborhood: "Morro Santana", city: "Mariana-MG", daysOfWeek: [] },
    ]
  },
  {
    name: "Aposvale-Ana",
    phone: "(31) 98778-4326",
    notes: "Meia Diária",
    addresses: [
      { street: "Rua Jorge Marques, 187", neighborhood: "Colina", city: "Mariana-MG", daysOfWeek: [] },
    ]
  },
  {
    name: "Compasso - João Cândido",
    phone: "(31) 9589-7334",
    notes: "Atendimento à Tarde | Meia Diaria",
    addresses: [
      { street: "Rua Wenceslau Brás, 34", neighborhood: "Centro", city: "Mariana-MG", daysOfWeek: [] },
      { street: "Rua Ipanema, 3030 - Apto 202", neighborhood: "Nossa Senhora Aparecida", city: "Mariana-MG", daysOfWeek: [] },
    ]
  },
  {
    name: "Condominio - Jordana Souza",
    phone: "(31) 8720-3259",
    notes: "01 vez por Semana Quinta",
    addresses: [
      { street: "Rua Luciano Francisco Pereira 200", neighborhood: "Nossa Senhora de Lourdes", city: "Ouro Preto-MG", daysOfWeek: ["Quinta"] },
    ]
  },
  {
    name: "Ellen Boemme",
    phone: "(31) 9352-6543",
    notes: "Apartamento - 02x na semana Terça e Sexta | 15 em 15 dias na Loja",
    addresses: [
      { street: "Rua Pollux, 255 - Apto, 102", neighborhood: "Cruzeiro Do Sul", city: "Mariana-MG", daysOfWeek: ["Terça", "Sexta"] },
      { street: "Rua Direita, 19", neighborhood: "Centro", city: "Mariana-MG", daysOfWeek: [] },
    ]
  },
  {
    name: "GEOSOL - UNIDADE 1799 - Paulo Henrique ADM",
    phone: "(31) 9559-8670",
    notes: "Segunda a Sexta",
    addresses: [
      { street: "Rua da Lapa Queimada, 52", neighborhood: "Antônio Pereira", city: "Ouro Preto-MG", daysOfWeek: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    ]
  },
  {
    name: "CENTRO EDUCACIONAL ARTE DO SABER",
    phone: "(31) 8248-5252",
    notes: "03x na semana Segunda, Quarta e Sexta",
    addresses: [
      { street: "RUA DINAMARCA, 138", neighborhood: "FONTE DA SAUDADE", city: "MARIANA-MG", daysOfWeek: ["Segunda", "Quarta", "Sexta"] },
      { street: "RUA DOM VIÇOSO, 185", neighborhood: "CENTRO", city: "MARIANA-MG", daysOfWeek: ["Segunda", "Quarta", "Sexta"] },
    ]
  },
  {
    name: "HEXAGONO ENGENHARIA / Leandro",
    phone: "(31) 8957-1044",
    notes: "05 na semana Segunda a Sexta",
    addresses: [
      { street: "Rua Teófolo Otoni, 90", neighborhood: "Centro", city: "Mariana-MG", daysOfWeek: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
      { street: "Rua Sabará, 92", neighborhood: "Cabanas", city: "Mariana-MG", daysOfWeek: [] },
      { street: "Rua Paraju, 226", neighborhood: "Rosario", city: "Mariana-MG", daysOfWeek: [] },
      { street: "Rua Da Gloria, 149", neighborhood: "São Gonçalo", city: "Mariana-MG", daysOfWeek: [] },
    ]
  },
  {
    name: "TECLIT SERVICOS LTDA - Alice Adm",
    phone: "(31) 8419-8306",
    notes: "05x na semana Segunda a Sexta",
    addresses: [
      { street: "Rua Timbopeba, 147", neighborhood: "Antonio Pereira", city: "Ouro Preto-MG", daysOfWeek: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    ]
  },
  {
    name: "Progen Engenharia - Jarbas",
    phone: "(31) 9514-5105",
    notes: "05x na semana Segunda a Sexta | Meia Diária - Manha",
    addresses: [
      { street: "Rua Bom Jesus, 190", neighborhood: "Barro Preto", city: "Mariana-MG", daysOfWeek: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    ]
  },
];

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Criar admin se não existir
    const adminExists = await User.findOne({ email: 'admin@casaclean.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Administrador',
        email: 'admin@casaclean.com',
        password: hashedPassword,
        role: 'admin',
        active: true
      });
      console.log('✅ Admin criado');
    }

    // Migrar funcionários
    console.log('\n📦 Migrando funcionários...');
    for (const emp of employees) {
      const exists = await Employee.findOne({ name: emp.name });
      if (!exists) {
        await Employee.create(emp);
        console.log(`  ✅ ${emp.name}`);
      } else {
        console.log(`  ⏭️ ${emp.name} (já existe)`);
      }
    }

    // Migrar clientes
    console.log('\n📦 Migrando clientes...');
    for (const client of clients) {
      const exists = await Client.findOne({ name: client.name });
      if (!exists) {
        await Client.create(client);
        console.log(`  ✅ ${client.name} (${client.addresses.length} end.)`);
      } else {
        console.log(`  ⏭️ ${client.name} (já existe)`);
      }
    }

    console.log('\n🎉 Migração concluída!');
    console.log(`👥 Funcionários: ${await Employee.countDocuments()}`);
    console.log(`🏢 Clientes: ${await Client.countDocuments()}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

migrate();