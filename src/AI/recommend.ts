import * as tf from '@tensorflow/tfjs-node'

import { BookRepository } from "../repositories/BookRepository"
import User from '../models/User'
import { UserRepository } from '../repositories/UserRepository'



export default async function recomendation(user: User, usersRepository: UserRepository, bookRepository: BookRepository) {
	const books = await bookRepository.findAll();
	const booksSug = user.booksSug

	const genreCounts: { [key: string]: number } = {};

	if (user.booksFavorites) {
		user.booksFavorites.forEach(favoriteId => {
			const favoriteBook = books.find(book => book._id.toString() === favoriteId);
			if (favoriteBook) {
				if (genreCounts[favoriteBook.gender]) {
					genreCounts[favoriteBook.gender]++;
				} else {
					genreCounts[favoriteBook.gender] = 1;
				}
			}
		});
	}

	const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);

	const model = tf.sequential();
	model.add(tf.layers.dense({ units: 1, inputShape: [sortedGenres.length] }));

	const genreInputs = sortedGenres.map(genre => (user.booksFavorites && user.booksFavorites.includes(genre) ? 1 : 0));
	const inputTensor = tf.tensor2d([genreInputs], [1, sortedGenres.length]);

	const recommendations = model.predict(inputTensor) as tf.Tensor;
	const recommendedIndex = tf.argMax(recommendations).dataSync()[0];
	const recommendedGenre = sortedGenres[recommendedIndex];

	const recommendedBooks = books.filter(book =>
		book.gender === recommendedGenre &&
		(!user.booksFavorites || !user.booksFavorites.includes(book._id.toString())) &&
		!booksSug?.find(bookSug => bookSug === book._id.toString())
	);

	if (recommendedBooks.length > 0) {
		const indiceAleatorio = Math.floor(Math.random() * recommendedBooks.length);
		return recommendedBooks[indiceAleatorio]

	} else {
		return
	}
}
