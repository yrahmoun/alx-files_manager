import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export const xTokenAuthenticate = async (req, res, next) => {
  try {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = { _id: userId };
    next();
  } catch (error) {
    console.error('Error in xTokenAuthenticate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
