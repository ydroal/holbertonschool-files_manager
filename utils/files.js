import { ObjectId } from 'mongodb';
import dbClient from './db';

const fileUtils = {
  async fetchFileByParentId(id){
    try {
      const objectId = new ObjectId(id);
      const result = await dbClient.db.collection('files').findOne({ _id: objectId });
      return result;
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  async insertFileDocument(document){
    try {
      const result = await dbClient.db.collection('files').insertOne(document);
      return !!result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

export default fileUtils;