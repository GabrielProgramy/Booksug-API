import express from 'express'
import connection from './connection'
import { UserRepository } from './repositories/UserRepository'
import UserController from './controller/UserController'
import { BookRepository } from './repositories/BookRepository'
import { expressjwt } from 'express-jwt'
import cors from 'cors'


const app = express()
app.use(express.json())
app.use(cors())

const validUser = expressjwt({
	secret: process.env.JWT_SECRET as string,
	algorithms: ['HS256'],
	audience: process.env.JWT_AUD,
	issuer: process.env.JWT_ISSUER
})


connection().then(connection => {
	const userRepository = new UserRepository(connection)
	const booksRepository = new BookRepository(connection)
	const userController = new UserController(userRepository, booksRepository)

	app.listen(3000, () => console.log('Server is running on port 3000'))

	app.post('/users', (req, res) => userController.createUser(req, res))

	app.post('/users/auth', (req, res) => userController.authenticate(req, res))

	app.get('/users/books/favorites', validUser, (req, res) => userController.getFavorites(req, res))
	app.post('/users/books/favorites/add', validUser, (req, res) => userController.addFavorite(req, res))
	app.get('/users/last-recommends', validUser, (req, res) => userController.getLastRecommendations(req, res))
	app.post('/users/recommends', validUser, (req, res) => userController.recomendation(req, res))
	app.patch('/users/books/:bookId/favorite', validUser, (req, res) => userController.favoriteOrUnfavorite(req, res))

	app.get('/books', validUser, (req, res) => userController.getAllBooks(req, res))
	app.get('/books/:bookId', (req, res) => userController.searchBooks(req, res))
})
