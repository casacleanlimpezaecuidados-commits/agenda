const { database } = require('../config/database');

const clientController = {
  async list(req, res) {
    try {
      const { search, active } = req.query;
      const data = await database.read();
      let clients = data.clients || [];

      if (search) {
        const searchLower = search.toLowerCase();
        clients = clients.filter(client => 
          client.name.toLowerCase().includes(searchLower) ||
          client.phone.includes(search) ||
          (client.email && client.email.toLowerCase().includes(searchLower))
        );
      }

      if (active !== undefined) {
        const isActive = active === 'true';
        clients = clients.filter(client => client.active === isActive);
      }

      return res.json(clients);
    } catch (error) {
      console.error('❌ Erro ao listar clientes:', error);
      return res.status(500).json({ error: 'Erro ao listar clientes: ' + error.message });
    }
  },

  async create(req, res) {
    try {
      const { name, phone, email, address, neighborhood, city, state, notes } = req.body;

      console.log('📝 Criando cliente:', { name, phone, city });

      if (!name || !phone) {
        return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
      }

      const data = await database.read();
      if (!data.clients) data.clients = [];
      const clients = data.clients;

      // VERIFICAÇÃO DE DUPLICIDADE - NOME
      const duplicateName = clients.find(c => 
        c.name.toLowerCase().trim() === name.toLowerCase().trim() && c.active !== false
      );
      
      if (duplicateName) {
        return res.status(409).json({ 
          error: 'Já existe um cliente cadastrado com este nome',
          duplicate_id: duplicateName.id,
          duplicate_name: duplicateName.name,
          field: 'name'
        });
      }

      // VERIFICAÇÃO DE DUPLICIDADE - TELEFONE
      const cleanPhone = phone.replace(/\D/g, '');
      const duplicatePhone = clients.find(c => {
        if (!c.phone) return false;
        const existingPhone = c.phone.replace(/\D/g, '');
        return existingPhone === cleanPhone && c.active !== false;
      });

      if (duplicatePhone) {
        return res.status(409).json({ 
          error: 'Já existe um cliente cadastrado com este telefone',
          duplicate_id: duplicatePhone.id,
          duplicate_name: duplicatePhone.name,
          field: 'phone'
        });
      }

      // Criar cliente
      const newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
      
      const client = {
        id: newId,
        name: name.trim(),
        phone: phone.trim(),
        email: (email || '').trim(),
        address: (address || '').trim(),
        neighborhood: (neighborhood || '').trim(),
        city: (city || '').trim(),
        state: (state || 'MG').trim(),
        notes: (notes || '').trim(),
        addresses: [],  // INICIALIZA O ARRAY DE ENDEREÇOS
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Se tiver endereço principal, adicionar como primeiro endereço
      if (address && address.trim()) {
        client.addresses.push({
          id: 1,
          street: address.trim(),
          neighborhood: (neighborhood || '').trim(),
          city: (city || '').trim(),
          state: (state || 'MG').trim(),
          reference: '',
          daysOfWeek: []
        });
        console.log('📍 Endereço principal adicionado:', address.trim());
      }

      data.clients.push(client);

      // Registrar no histórico
      if (!data.history) data.history = [];
      data.history.push({
        id: data.history.length + 1,
        user_id: req.user.id,
        action: 'criou_cliente',
        old_value: '',
        new_value: `Cliente: ${client.name}`,
        timestamp: new Date().toISOString()
      });

      await database.write(data);

      console.log('✅ Cliente criado com sucesso:', {
        id: client.id,
        name: client.name,
        addresses_count: client.addresses.length
      });

      return res.status(201).json(client);
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      return res.status(500).json({ error: 'Erro ao criar cliente: ' + error.message });
    }
  },

  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const data = await database.read();
      const client = data.clients?.find(c => c.id === id);

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      return res.json(client);
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      return res.status(500).json({ error: 'Erro ao buscar cliente: ' + error.message });
    }
  },

  async update(req, res) {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      delete updates.id;
      
      const data = await database.read();
      const index = data.clients?.findIndex(c => c.id === id);

      if (index === -1 || index === undefined) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Verificar duplicidade de nome
      if (updates.name && updates.name.trim()) {
        const duplicateName = data.clients.find(c => 
          c.id !== id && 
          c.name.toLowerCase().trim() === updates.name.toLowerCase().trim() && 
          c.active !== false
        );
        
        if (duplicateName) {
          return res.status(409).json({ 
            error: 'Já existe outro cliente cadastrado com este nome',
            duplicate_name: duplicateName.name,
            field: 'name'
          });
        }
      }

      // Verificar duplicidade de telefone
      if (updates.phone && updates.phone.trim()) {
        const cleanPhone = updates.phone.replace(/\D/g, '');
        const duplicatePhone = data.clients.find(c => {
          if (c.id === id || !c.phone) return false;
          const existingPhone = c.phone.replace(/\D/g, '');
          return existingPhone === cleanPhone && c.active !== false;
        });

        if (duplicatePhone) {
          return res.status(409).json({ 
            error: 'Já existe outro cliente cadastrado com este telefone',
            duplicate_name: duplicatePhone.name,
            field: 'phone'
          });
        }
      }

      // Atualizar
      data.clients[index] = { 
        ...data.clients[index], 
        ...updates, 
        id,
        updated_at: new Date().toISOString()
      };

      if (!data.history) data.history = [];
      data.history.push({
        id: data.history.length + 1,
        user_id: req.user.id,
        action: 'atualizou_cliente',
        old_value: '',
        new_value: `Cliente: ${data.clients[index].name}`,
        timestamp: new Date().toISOString()
      });

      await database.write(data);
      return res.json(data.clients[index]);
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      return res.status(500).json({ error: 'Erro ao atualizar cliente: ' + error.message });
    }
  },

  async remove(req, res) {
    try {
      const id = parseInt(req.params.id);
      const data = await database.read();
      const client = data.clients?.find(c => c.id === id);

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      client.active = false;
      client.updated_at = new Date().toISOString();

      if (!data.history) data.history = [];
      data.history.push({
        id: data.history.length + 1,
        user_id: req.user.id,
        action: 'desativou_cliente',
        old_value: client.name,
        new_value: 'Cliente desativado',
        timestamp: new Date().toISOString()
      });

      await database.write(data);
      return res.json({ message: 'Cliente desativado com sucesso' });
    } catch (error) {
      console.error('❌ Erro ao remover cliente:', error);
      return res.status(500).json({ error: 'Erro ao remover cliente: ' + error.message });
    }
  },

  // ========== ENDEREÇOS ==========
  async getAddresses(req, res) {
    try {
      const id = parseInt(req.params.id);
      const data = await database.read();
      const client = data.clients?.find(c => c.id === id);

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      console.log(`📍 Endereços do cliente ${client.name}:`, client.addresses?.length || 0);
      return res.json(client.addresses || []);
    } catch (error) {
      console.error('❌ Erro ao buscar endereços:', error);
      return res.status(500).json({ error: 'Erro ao buscar endereços: ' + error.message });
    }
  },

  async addAddress(req, res) {
    try {
      const id = parseInt(req.params.id);
      const data = await database.read();
      const clientIndex = data.clients?.findIndex(c => c.id === id);

      if (clientIndex === -1 || clientIndex === undefined) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const client = data.clients[clientIndex];
      const { street, neighborhood, city, state, reference, daysOfWeek } = req.body;

      if (!street || !street.trim()) {
        return res.status(400).json({ error: 'Endereço é obrigatório' });
      }

      // Verificar duplicidade de endereço
      const duplicateAddress = (client.addresses || []).find(a => 
        a.street.toLowerCase().trim() === street.toLowerCase().trim() &&
        a.city.toLowerCase().trim() === (city || '').toLowerCase().trim()
      );

      if (duplicateAddress) {
        return res.status(409).json({ 
          error: 'Este endereço já está cadastrado para este cliente',
          duplicate_id: duplicateAddress.id
        });
      }

      // Inicializar array se não existir
      if (!client.addresses) {
        client.addresses = [];
      }
      
      const newId = client.addresses.length > 0 
        ? Math.max(...client.addresses.map(a => a.id)) + 1 
        : 1;

      const newAddress = {
        id: newId,
        street: street.trim(),
        neighborhood: (neighborhood || '').trim(),
        city: (city || '').trim(),
        state: (state || 'MG').trim(),
        reference: (reference || '').trim(),
        daysOfWeek: daysOfWeek || []
      };

      client.addresses.push(newAddress);
      client.updated_at = new Date().toISOString();

      // Atualizar no array principal
      data.clients[clientIndex] = client;

      await database.write(data);

      console.log(`✅ Endereço adicionado ao cliente ${client.name}:`, newAddress.street);
      console.log(`📍 Total de endereços: ${client.addresses.length}`);

      return res.status(201).json(newAddress);
    } catch (error) {
      console.error('❌ Erro ao adicionar endereço:', error);
      return res.status(500).json({ error: 'Erro ao adicionar endereço: ' + error.message });
    }
  },

  async updateAddress(req, res) {
    try {
      const { id, addressId } = req.params;
      const data = await database.read();
      const client = data.clients?.find(c => c.id === parseInt(id));

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const addressIndex = (client.addresses || []).findIndex(a => a.id === parseInt(addressId));
      
      if (addressIndex === -1) {
        return res.status(404).json({ error: 'Endereço não encontrado' });
      }

      client.addresses[addressIndex] = {
        ...client.addresses[addressIndex],
        ...req.body,
        id: parseInt(addressId)
      };

      client.updated_at = new Date().toISOString();
      await database.write(data);

      return res.json(client.addresses[addressIndex]);
    } catch (error) {
      console.error('❌ Erro ao atualizar endereço:', error);
      return res.status(500).json({ error: 'Erro ao atualizar endereço: ' + error.message });
    }
  },

  async removeAddress(req, res) {
    try {
      const { id, addressId } = req.params;
      const data = await database.read();
      const client = data.clients?.find(c => c.id === parseInt(id));

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      client.addresses = (client.addresses || []).filter(a => a.id !== parseInt(addressId));
      client.updated_at = new Date().toISOString();

      await database.write(data);

      return res.json({ message: 'Endereço removido com sucesso' });
    } catch (error) {
      console.error('❌ Erro ao remover endereço:', error);
      return res.status(500).json({ error: 'Erro ao remover endereço: ' + error.message });
    }
  },

  // Verificação de duplicidade
  async checkDuplicate(req, res) {
    try {
      const { name, phone, exclude_id } = req.query;
      const data = await database.read();
      const clients = data.clients || [];
      
      const result = {
        name_exists: false,
        phone_exists: false,
        name_duplicate: null,
        phone_duplicate: null
      };

      if (name) {
        const duplicate = clients.find(c => 
          c.name.toLowerCase().trim() === name.toLowerCase().trim() && 
          c.active !== false &&
          (!exclude_id || c.id !== parseInt(exclude_id))
        );
        if (duplicate) {
          result.name_exists = true;
          result.name_duplicate = { id: duplicate.id, name: duplicate.name };
        }
      }

      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const duplicate = clients.find(c => {
          if (!c.phone) return false;
          if (exclude_id && c.id === parseInt(exclude_id)) return false;
          const existingPhone = c.phone.replace(/\D/g, '');
          return existingPhone === cleanPhone && c.active !== false;
        });
        if (duplicate) {
          result.phone_exists = true;
          result.phone_duplicate = { id: duplicate.id, name: duplicate.name, phone: duplicate.phone };
        }
      }

      return res.json(result);
    } catch (error) {
      console.error('❌ Erro ao verificar duplicidade:', error);
      return res.status(500).json({ error: 'Erro ao verificar: ' + error.message });
    }
  }
};

module.exports = clientController;