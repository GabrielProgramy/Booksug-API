import { ObjectId } from "mongodb";

export default interface Books {
	_id: string | ObjectId;
	name: string;
	authors: string;
	gender: string;
	cover: string;
	pages: number;
	release: number;
	publishing: string;
	synopsis: string;
}
