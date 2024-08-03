import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = '0', isPublic = false, data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== '0') {
      const parentFile = await dbClient.filesCollection.findOne({ _id: new dbClient.ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileData = {
      userId: new dbClient.ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === '0' ? 0 : new dbClient.ObjectId(parentId),
    };

    if (type !== 'folder') {
      const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
      const filePath = path.join(FOLDER_PATH, uuidv4());
      await fs.mkdir(FOLDER_PATH, { recursive: true });
      await fs.writeFile(filePath, Buffer.from(data, 'base64'));

      fileData.localPath = filePath;
    }

    const result = await dbClient.filesCollection.insertOne(fileData);
    fileData.id = result.insertedId;

    return res.status(201).json(fileData);
  }
}

export default FilesController;
