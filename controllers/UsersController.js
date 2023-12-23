import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function postNew(req, res) {
  const { email, password } = req.body;

  if (!email) return res.status(400).send({ error: 'Missing email' });
  if (!password) return res.status(400).send({ error: 'Missing password' });

  const existingUsers = await dbClient.fetchUser(email);
  if (existingUsers.length > 0) {
    return res.status(400).send({ error: 'Already exist' });
  }

  const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

  try {
    const result = await dbClient.insertUser(email, hashedPassword);
    return res.status(201).json({ id: result.insertedId.toString(), email });
  } catch (err) {
    console.error(err);
    return res.status(400).send({ error: 'Error creating user' });
  }
}

async function getMe(req, res) {
  const authToken = req.header('X-Token');
  console.log(authToken);
  if (!authToken) return res.status(401).send({ error: 'Unauthorized' });

  const key = `auth_${authToken}`;

  const userId = await redisClient.get(key);
  console.log(userId);
  if (!userId) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const result = await dbClient.fetchUserByUserId(userId);
  return res.status(200).send({ id: userId, email: result.email });
}

export { postNew, getMe };
