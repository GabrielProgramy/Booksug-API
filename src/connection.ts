import { MongoClient, MongoClientOptions } from 'mongodb'

export default async function connection(options?: MongoClientOptions) {
	const client = await MongoClient.connect(process.env.MONGO_URI as string, options);

	return client.db('booksug')
}
