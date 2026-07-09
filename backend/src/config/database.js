const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');
const SESSIONS_PATH = path.join(__dirname, '../data/sessions');

class Database {
  constructor() {
    this.data = null;
  }

  async initializeDatabase() {
    try {
      // Criar diretórios se não existirem
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      await fs.mkdir(SESSIONS_PATH, { recursive: true });

      // Verificar se o arquivo existe
      try {
        await fs.access(DB_PATH);
        const rawData = await fs.readFile(DB_PATH, 'utf8');
        this.data = JSON.parse(rawData);
      } catch {
        // Criar arquivo com estrutura inicial
        this.data = this.getInitialData();
        await this.save();
      }

      return true;
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
      throw error;
    }
  }

  getInitialData() {
    return {
      users: [
        {
          id: 1,
          name: "Administrador",
          email: "admin@casaclean.com",
          password: "$2a$10$XQxBj0gYK5VGhHzVzqJ8qOzM7Z5G7vLqY5n5GqK5qQ5vLqY5n5GqK", // admin123
          role: "admin",
          active: true,
          created_at: new Date().toISOString()
        }
      ],
      clients: [
        {
          id: 1,
          name: "Empresa Exemplo Ltda",
          phone: "11999999999",
          email: "contato@exemplo.com",
          address: "Rua Principal, 100",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          notes: "Cliente teste",
          addresses: [
            {
              id: 1,
              street: "Rua Principal, 100",
              neighborhood: "Centro",
              city: "São Paulo",
              state: "SP",
              reference: "Próximo ao metrô",
              daysOfWeek: ["Segunda", "Quarta", "Sexta"]
            }
          ],
          active: true,
          created_at: new Date().toISOString()
        }
      ],
      employees: [
        {
          id: 1,
          name: "Maria Silva",
          phone: "11988888888",
          email: "maria@casaclean.com",
          role: "auxiliar",
          active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: "João Santos",
          phone: "11977777777",
          email: "joao@casaclean.com",
          role: "supervisor",
          active: true,
          created_at: new Date().toISOString()
        }
      ],
      schedules: [
        {
          id: 1,
          client_id: 1,
          employee_ids: [1, 2],
          date: new Date().toISOString().split('T')[0],
          start_time: "07:00",
          end_time: "17:00",
          service: "Limpeza Comercial",
          address: "Rua Principal, 100 - Centro - SP",
          notes: "Limpeza completa do escritório",
          status: "pendente",
          created_by: 1,
          created_at: new Date().toISOString()
        }
      ],
      recurringTemplates: [],
      history: [],
      confirmations: []
    };
  }

  async read() {
    if (!this.data) {
      await this.initializeDatabase();
    }
    return this.data;
  }

  async write(data) {
    this.data = data;
    await this.save();
  }

  async save() {
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Erro ao salvar banco de dados:', error);
      throw error;
    }
  }

  // Métodos auxiliares para CRUD
  async findAll(collection) {
    const data = await this.read();
    return data[collection] || [];
  }

  async findById(collection, id) {
    const data = await this.read();
    return data[collection]?.find(item => item.id === id) || null;
  }

  async insert(collection, item) {
    const data = await this.read();
    const items = data[collection] || [];
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    const newItem = { id: newId, ...item };
    items.push(newItem);
    await this.write(data);
    return newItem;
  }

  async update(collection, id, updates) {
    const data = await this.read();
    const index = data[collection]?.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    data[collection][index] = { ...data[collection][index], ...updates, id };
    await this.write(data);
    return data[collection][index];
  }

  async delete(collection, id) {
    const data = await this.read();
    const index = data[collection]?.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    data[collection].splice(index, 1);
    await this.write(data);
    return true;
  }

  async query(collection, predicate) {
    const data = await this.read();
    return (data[collection] || []).filter(predicate);
  }
}

// Singleton
const database = new Database();

module.exports = { database, initializeDatabase: () => database.initializeDatabase() };