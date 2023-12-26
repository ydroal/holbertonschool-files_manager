import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import { Buffer } from 'buffer';
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import fileUtils from '../utils/files';
import { getUserId } from './UsersController';

async function postUpload(req, res) {
  const fileType = ['folder', 'file', 'image'];
  let localPath = null;

  const authToken = req.header('X-Token');
  if (!authToken) return res.status(401).send({ error: 'Unauthorized' });

  const key = `auth_${authToken}`;
  const tokenExistance = await redisClient.get(key);
  if (!tokenExistance) return res.status(401).send({ error: 'Unauthorized' });

  const {
    name,
    type,
    parentId,
    isPublic,
    data,
  } = req.body;

  if (!name) return res.status(400).send({ error: 'Missing name' });
  if (!type || !(fileType.includes(type))) return res.status(400).send({ error: 'Missing type' });
  if (!data && type !== 'folder') return res.status(400).send({ error: 'Missing data' });
  if (parentId) {
    const result = await fileUtils.fetchFileById(parentId);
    if (!result) return res.status(400).send({ error: 'Parent not found' });
    if (result.type !== 'folder') return res.status(400).send({ error: 'Parent is not a folder' });
  }

  const fileDocument = {
    userId: new ObjectId(tokenExistance),
    name,
    type,
    isPublic: isPublic || false,
    parentId: parentId || 0,
  };

  if (type === 'folder') {
    const insertResult = await fileUtils.insertFileDocument(fileDocument);
    fileDocument.id = insertResult.insertedId.toString();
    delete fileDocument._id; // _id フィールドを削除
    return res.status(201).send(fileDocument);
  }

  if (type === 'file' || type === 'image') {
    const uuid = uuidv4();
    const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';

    // ディレクトリの存在確認と作成
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    localPath = `${filePath}/${uuid}`;

    const fileData = Buffer.from(data, 'base64');

    fs.writeFileSync(localPath, fileData);

    fileDocument.localPath = localPath;
    const insertResult = await fileUtils.insertFileDocument(fileDocument);
    fileDocument.id = insertResult.insertedId.toString();
    delete fileDocument._id;
    delete fileDocument.localPath;
    return res.status(201).send(fileDocument);
  }

  return res.status(400).send({ error: 'Invalid type' });
}

async function getShow(req, res) {
  const userId = await getUserId(req);
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });

  const fileId = req.params.id;
  const file = await fileUtils.fetchFileById(fileId);

  if (!file || file.userId !== new ObjectId(userId)) return res.status(404).send({ error: 'Not found' });

  file.id = file._id.toString();
  delete file._id;
  delete file.localPath;

  return res.status(200).send(file);
}

async function getIndex(req, res) {
  const userId = await getUserId(req);
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });

  const userObjectId = new ObjectId(userId);
  const parentId = req.query.parentId || '0';
  const page = parseInt(req.query.page, 10) || 0;

  const files = await fileUtils.fetchFilesByParentIdAndUserId(parentId, userObjectId, page);

  const response = files.map((file) => ({
    id: file._id.toString(),
    userId: file.userId.toString(),
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
  }));

  return res.status(200).send(response);
}

async function putPublish(req, res) {
  const userId = await getUserId(req);
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });

  const fileId = req.params.id;

  const updateResult = await dbClient.db.collection('files').findOneAndUpdate(
    { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
    { $set: { isPublic: true } },
    { returnOriginal: false },
  );

  if (!updateResult.value) {
    return res.status(404).send({ error: 'Not found' });
  }

  const response = {
    id: updateResult.value._id,
    userId: updateResult.value.userId,
    name: updateResult.value.name,
    type: updateResult.value.type,
    isPublic: updateResult.value.isPublic,
    parentId: updateResult.value.parentId,
  };

  return res.status(200).send(response);
}

async function putUnpublish(req, res) {
  const userId = await getUserId(req);
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });

  const fileId = req.params.id;

  const updateResult = await dbClient.db.collection('files').findOneAndUpdate(
    { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
    { $set: { isPublic: false } },
    { returnOriginal: false },
  );

  if (!updateResult.value) {
    return res.status(404).send({ error: 'Not found' });
  }

  const response = {
    id: updateResult.value._id,
    userId: updateResult.value.userId,
    name: updateResult.value.name,
    type: updateResult.value.type,
    isPublic: updateResult.value.isPublic,
    parentId: updateResult.value.parentId,
  };

  return res.status(200).send(response);
}

async function getFile(req, res) {
  const fileId = req.params.id;
  const userId = await getUserId(req);
  const file = await fileUtils.fetchFileById(fileId);

  if (!file) {
    return res.status(404).send({ error: 'Not found' });
  }

  if (!file.isPublic && (!userId || file.userId.toString() !== userId)) {
    return res.status(404).send({ error: 'Not found' });
  }

  if (file.type === 'folder') {
    return res.status(400).send({ error: "A folder doesn't have content" });
  }

  try {
    const fileContent = fs.readFileSync(file.localPath);
    const mimeType = mime.lookup(file.name);
    res.setHeader('Content-Type', mimeType);
    return res.send(fileContent);
  } catch (err) {
    return res.status(404).send({ error: 'Not found' });
  }
}

export {
  postUpload, getShow, getIndex, putPublish, putUnpublish, getFile,
};
