const { Schedule, Client, Employee, History, Confirmation } = require('../config/database');

const clientController = {
  async list(req, res) {
    try {
      const { search, active } = req.query;
      let query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (active !== undefined) {
        query.active = active === 'true';
      } else {
        query.active = true;
      }

      const clients = await Client.find(query).sort({ created_at: -1 });
      return res.json(clients);
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const { name, phone } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
      }

      // Verificar duplicidade
      const duplicateName = await Client.findOne({ name: name.trim(), active: true });
      if (duplicateName) {
        return res.status(409).json({ error: 'Já existe um cliente com este nome', field: 'name' });
      }

      const duplicatePhone = await Client.findOne({ phone: phone.trim(), active: true });
      if (duplicatePhone) {
        return res.status(409).json({ error: 'Já existe um cliente com este telefone', field: 'phone' });
      }

      const client = await Client.create(req.body);

      await History.create({
        user_id: req.user.id,
        action: 'criou_cliente',
        new_value: `Cliente: ${client.name}`,
        timestamp: new Date()
      });

      return res.status(201).json(client);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Cliente já cadastrado' });
      }
      return res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const client = await Client.findById(req.params.id);
      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      return res.json(client);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      await History.create({
        user_id: req.user.id,
        action: 'atualizou_cliente',
        new_value: `Cliente: ${client.name}`,
        timestamp: new Date()
      });

      return res.json(client);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async remove(req, res) {
    try {
      const client = await Client.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      await History.create({
        user_id: req.user.id,
        action: 'desativou_cliente',
        old_value: client.name,
        new_value: 'Cliente desativado',
        timestamp: new Date()
      });

      return res.json({ message: 'Cliente desativado' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async getAddresses(req, res) {
    try {
      const client = await Client.findById(req.params.id);
      if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
      return res.json(client.addresses || []);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async addAddress(req, res) {
    try {
      const client = await Client.findById(req.params.id);
      if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

      client.addresses.push(req.body);
      await client.save();

      return res.status(201).json(req.body);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async updateAddress(req, res) {
    try {
      const client = await Client.findById(req.params.id);
      if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

      const addrIndex = client.addresses.findIndex(a => a._id.toString() === req.params.addressId);
      if (addrIndex === -1) return res.status(404).json({ error: 'Endereço não encontrado' });

      client.addresses[addrIndex] = { ...client.addresses[addrIndex].toObject(), ...req.body };
      await client.save();

      return res.json(client.addresses[addrIndex]);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async removeAddress(req, res) {
    try {
      const client = await Client.findById(req.params.id);
      if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

      client.addresses = client.addresses.filter(a => a._id.toString() !== req.params.addressId);
      await client.save();

      return res.json({ message: 'Endereço removido' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async checkDuplicate(req, res) {
    try {
      const { name, phone } = req.query;
      const result = { name_exists: false, phone_exists: false };

      if (name) {
        const dup = await Client.findOne({ name: name.trim(), active: true });
        if (dup) result.name_exists = true;
      }

      if (phone) {
        const dup = await Client.findOne({ phone: phone.trim(), active: true });
        if (dup) result.phone_exists = true;
      }

      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

module.exports = clientController;