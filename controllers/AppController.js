import redisClient from '../utils/redis';
import dbClient from '../utils/db';

async function getStatus(req, res) {
  const redisAlive = redisClient.isAlive();
  const dbAlive = dbClient.isAlive();
  return res.status(200).json({ redis: redisAlive, db: dbAlive });
}

async function getStats(req, res) {
  const users = await dbClient.nbUsers();
  const files = await dbClient.nbFiles();
  return res.status(200).json({ users, files });
}

export { getStatus, getStats };
