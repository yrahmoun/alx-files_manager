import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const UserController = {
  async getMe(req, res) {
    try {
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = await dbClient.db.collection('users').findOne({ _id: userId });

      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async postNew(req, res) {
  }
};

export default UserController;
