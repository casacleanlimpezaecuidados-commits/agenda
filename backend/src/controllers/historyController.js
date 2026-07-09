const { database } = require('../config/database');

const historyController = {
  async list(req, res) {
    try {
      const { user_id, action, start_date, end_date, limit } = req.query;
      let history = await database.findAll('history');

      // Filtro por usuário
      if (user_id) {
        history = history.filter(h => h.user_id === parseInt(user_id));
      }

      // Filtro por ação
      if (action) {
        history = history.filter(h => h.action.includes(action));
      }

      // Filtro por período
      if (start_date && end_date) {
        history = history.filter(h => {
          const histDate = new Date(h.timestamp).toISOString().split('T')[0];
          return histDate >= start_date && histDate <= end_date;
        });
      }

      // Enriquece com dados de usuário
      const data = await database.read();
      history = history.map(h => {
        const user = data.users.find(u => u.id === h.user_id);
        return {
          ...h,
          user_name: user ? user.name : 'Sistema'
        };
      });

      // Ordenar por data (mais recentes primeiro)
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Limitar resultados
      const limit_num = parseInt(limit) || 100;
      history = history.slice(0, limit_num);

      return res.json(history);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = historyController;