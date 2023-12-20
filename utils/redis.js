import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.connected = false;

    this.client.on('error', (err) => console.log(err));
    this.client.on('connect', () => {
      this.connected = true;
    });
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);
    try {
      const reply = await getAsync(key);
      return reply;
    } catch (err) {
      console.log('Error:', err);
      return null;
    }
  }

  async set(key, value, duration) {
    const setAsync = promisify(this.client.set).bind(this.client);
    try {
      await setAsync(key, value, 'EX', duration);
    } catch (err) {
      console.log('Error:', err);
    }
  }

  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client);
    try {
      await delAsync(key);
    } catch (err) {
      console.log('Error:', err);
    }
  }
}

export default new RedisClient();
