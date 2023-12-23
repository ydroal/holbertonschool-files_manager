import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

async function getConnect(req, res) {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).send({ error: 'Unauthorized' });

  const auth = authHeader.split(' ')[1];
  const credentials = Buffer.from(auth, 'base64').toString('utf-8');
  const [email, password] = credentials.split(':');

  if (!email || !password) return res.status(401).send({ error: 'Unauthorized' });

  const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
  const user = await dbClient.fetchUserByEmailAndPassword(email, hashedPassword);

  if (!user) return res.status(401).send({ error: 'Unauthorized' });

  const token = uuidv4();
  const key = `auth_${token}`;
  const expiration = 24 * 3600;

  await redisClient.set(key, user._id.toString(), expiration);
  return res.status(200).send({ token });
}

async function getDisconnect(req, res) {
  const authToken = req.header('X-Token');
  if (!authToken) return res.status(401).send({ error: 'Unauthorized' });

  const key = `auth_${authToken}`;

  const tokenExistance = await redisClient.get(key);

  if (!tokenExistance) return res.status(401).send({ error: 'Unauthorized' });
  await redisClient.del(key);
  return res.status(204);
}

export { getConnect, getDisconnect };
