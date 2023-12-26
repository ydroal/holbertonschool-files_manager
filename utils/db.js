import { MongoClient, ObjectId } from 'mongodb';

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
      console.log('Successfully connected to MongoDB');
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

  async fetchUser(email) {
    try {
      const result = await this.db.collection('users').find({ email }).toArray();
      return result;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async insertUser(email, password) {
    try {
      const newUser = {
        email,
        password,
      };
      const result = await this.db.collection('users').insertOne(newUser);
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async fetchUserByEmailAndPassword(email, hashedPassword) {
    try {
      const result = await this.db.collection('users').findOne({ email, password: hashedPassword });
      console.log(result);
      return result;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async fetchUserByUserId(userId) {
    try {
      const objectId = new ObjectId(userId);
      const result = await this.db.collection('users').findOne({ _id: objectId });
      return result;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}

export default new DBClient();
