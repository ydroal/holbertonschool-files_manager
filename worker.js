import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  // ファイルを取得しサムネイル生成
  const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
  console.log(file);
  if (!file) {
    throw new Error('File not found');
  }

  const filePath = file.localPath;
  const thumbnailSizes = [500, 250, 100];

  for (const size of thumbnailSizes) {
    const thumbnail = await imageThumbnail(filePath, { width: size });
    fs.writeFileSync(`${filePath}_${size}`, thumbnail);
  }
  done();
});

fileQueue.on('completed', (job, result) => {
  console.log(`Job completed with result ${result}`);
});

fileQueue.on('failed', (job, err) => {
  console.log(`Job failed with error ${err.message}`);
});

export default fileQueue;
