// pages/api/students.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, Db, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  if (!dbName) {
    throw new Error('Please define the MONGODB_DB environment variable');
  }

  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const students = await db.collection('students').find({}).toArray();
      res.status(200).json(students);
    } catch (error) {
      res.status(500).json({ error: 'Unable to fetch students' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { db } = await connectToDatabase();
      const { id, status } = req.body;
      await db.collection('students').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );
      res.status(200).json({ message: 'Student status updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Unable to update student status' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}