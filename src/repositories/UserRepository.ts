import { Collection, Db, ObjectId, UpdateFilter, WithId } from "mongodb";
import User from "../models/User";

export class UserRepository {
	private connection: Db
	private collection: Collection

	constructor(connection: Db) {
		this.connection = connection
		this.collection = this.connection.collection('users')
	}

	async create({ _id, ...user }: User) {
		const { insertedId } = await this.collection.insertOne(user)

		return this.findOne({ _id: new ObjectId(insertedId) })
	}

	async update(id: string, updatedData: UpdateFilter<User>) {
		return this.collection.updateOne({ _id: new ObjectId(id) }, updatedData)

	}

	async findOne({ _id, ...user }: User) {
		let filters: any = { ...user }

		if (_id) filters = { ...filters, _id: new ObjectId(_id) }

		return this.collection.findOne(filters)
	}

	async findAll() {
		return this.collection.find().toArray()
	}
}
