import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { Buffer } from 'node:buffer';
import redisClient from '../utils/redis';
import fileUtils from '../utils/files';

async function postUpload(req, res) {
  const fileType = ['folder', 'file', 'image'];
  let localPath = null;

  const authToken = req.header('X-Token');
  if (!authToken) return res.status(401).send({ error: 'Unauthorized' });

  const key = `auth_${authToken}`;
  const tokenExistance = await redisClient.get(key);
  if (!tokenExistance) return res.status(401).send({ error: 'Unauthorized' });

  const { name, type, parentId, isPublic, data } = req.body;

  if (!name) return res.status(400).send({ error: 'Missing name' });
  if (!type || !(fileType.includes(type))) return res.status(400).send({ error: 'Missing type' });
  if (!data && type != 'folder') return res.status(400).send({ error: 'Missing data' });
  if (parentId) {
    const result = await fileUtils.fetchFileByParentId(parentId);
    if (!result) return res.status(400).send({ error: 'Parent not found' });
    if (result.type != 'folder') return res.status(400).send({ error: 'Parent is not a folder' });
  }

  const fileDocument = {
    userId: tokenExistance,
    name,
    type,
    isPublic: isPublic || false,
    parentId: parentId || 0,
  };
  
  if (type === 'folder') {
    const insertResult = await fileUtils.insertFileDocument(fileDocument);
    fileDocument.id = insertResult.insertedId.toString();
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
   
    await fileUtils.insertFileDocument(fileDocument);
    delete fileDocument.localPath;
    return res.status(201).send(fileDocument);
  }
}

export { postUpload };