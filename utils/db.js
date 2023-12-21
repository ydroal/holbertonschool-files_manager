import { MongoClient } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';

const uri = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.connected = false;

    this.client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(database); // MongoDBのデータベースオブジェクトを保管
      this.connected = true;
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    try {
      return await this.db.collection('users').countDocuments();
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async nbFiles() {
    try {
      return await this.db.collection('files').countDocuments();
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}

export default new DBClient();
