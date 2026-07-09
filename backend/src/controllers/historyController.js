const { Schedule, Client, Employee, History, Confirmation } = require('../config/database');

const historyController = {
  async list(req, res) {
    try {
      const { user_id, action, start_date, end_date, limit } = req.query;
      let query = {};

      if (user_id) query.user_id = parseInt(user_id);
      if (action) query.action = { $regex: action, $options: 'i' };
      if (start_date && end_date) {
        query.timestamp = { $gte: new Date(start_date), $lte: new Date(end_date + 'T23:59:59') };
      }

      const history = await History.find(query).sort({ timestamp: -1 }).limit(parseInt(limit) || 200);

      const enriched = await Promise.all(history.map(async (h) => {
        const user = await User.findById(h.user_id);
        return {
          ...h.toObject(),
          user_name: user ? user.name : 'Sistema',
          user_role: user ? user.role : 'sistema'
        };
      }));

      return res.json({ total: enriched.length, history: enriched });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

module.exports = historyController;