import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';  // Ensure you have redisClient setup
import dbClient from '../utils/db';

const AuthController = {
  async getConnect(req, res) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

      const [scheme, credentials] = authHeader.split(' ');
      if (scheme !== 'Basic') return res.status(401).json({ error: 'Unauthorized' });

      const [email, password] = Buffer.from(credentials, 'base64').toString().split(':');
      if (!email || !password) return res.status(401).json({ error: 'Unauthorized' });

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });

      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const token = uuidv4();
      await redisClient.set(`auth_${token}`, user._id.toString(), 'EX', 24 * 60 * 60); // 24 hours

      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getDisconnect(req, res) {
    try {
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      await redisClient.del(key);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default AuthController;
