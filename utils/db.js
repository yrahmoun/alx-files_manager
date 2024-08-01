import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    this.db = null;
    this.usersCollection = null;
    this.filesCollection = null;
    this.connect();
  }

  async connect() {
    try {
      const client = await MongoClient.connect(url, { useUnifiedTopology: true });
      this.db = client.db(DB_DATABASE);
      this.usersCollection = this.db.collection('users');
      this.filesCollection = this.db.collection('files');
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err.message);
    }
  }

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    if (!this.isAlive()) throw new Error('Database not connected');
    return await this.usersCollection.countDocuments();
  }

  async nbFiles() {
    if (!this.isAlive()) throw new Error('Database not connected');
    return await this.filesCollection.countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
