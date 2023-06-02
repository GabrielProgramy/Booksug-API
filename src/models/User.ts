import { ObjectId } from "mongodb";

export default interface User {
	_id?: string | ObjectId;
	name?: string;
	email?: string;
	password?: string;
	booksSug?: Array<string>
	booksFavorites?: Array<string>
}
