import { Collection, Db, ObjectId, WithId } from "mongodb";
import Books from "../models/Books";

export class BookRepository {
	private connection: Db
	private collection: Collection

	constructor(connection: Db) {
		this.connection = connection
		this.collection = this.connection.collection('books')
	}

	async findOne(id: string): Promise<WithId<Books>> {
		return this.collection.findOne({ _id: new ObjectId(id) }) as Promise<WithId<Books>>
	}

	async findAll(): Promise<Books[]> {
		return this.collection.find().toArray() as Promise<Books[]>
	}
}
