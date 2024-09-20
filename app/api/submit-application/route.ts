import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!dbName) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

export async function POST(req: Request) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('applications');

    const body = await req.json();
    const result = await collection.insertOne(body);

    return NextResponse.json({ message: 'Application submitted successfully', id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json({ message: 'Error submitting application' }, { status: 500 });
  } finally {
    await client.close();
  }
}