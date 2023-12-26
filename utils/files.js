import { ObjectId } from 'mongodb';
import dbClient from './db';

const fileUtils = {
  async fetchFileById(id) {
    try {
      const objectId = new ObjectId(id);
      const result = await dbClient.db.collection('files').findOne({ _id: objectId });
      return result;
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  async insertFileDocument(document) {
    try {
      const result = await dbClient.db.collection('files').insertOne(document);
      if (result.insertedId) {
        return result;
      }
      throw new Error('Document insertion failed');
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async fetchFileByIdAndUserId(fileId, userId) {
    try {
      const objectId = new ObjectId(fileId);
      const userObjectId = new ObjectId(userId);
      const result = await dbClient.db.collection('files').findOne({ _id: objectId, userId: userObjectId });
      return result;
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  async fetchFilesByParentIdAndUserId(parentId, userId, page) {
    try {
      const query = { userId };

      if (parentId !== '0') {
        query.parentId = parentId;
      }

      const pipeline = [
        { $match: query },
        { $skip: page * 20 },
        { $limit: 20 },
      ];

      const files = await dbClient.db.collection('files')
        .aggregate(pipeline)
        .toArray();

      return files;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
};

export default fileUtils;
