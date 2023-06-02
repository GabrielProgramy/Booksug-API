import { Response } from "express";
import User from "../models/User";
import { UserRepository } from "../repositories/UserRepository";
import { BookRepository } from "../repositories/BookRepository";
import { Request } from "express-jwt";
import { sign } from "jsonwebtoken";
import tf from '@tensorflow/tfjs-node'
import path from 'node:path'
import recommended from "../AI/recommend";


export default class UserController {
	private usersRepository: UserRepository
	private booksRepository: BookRepository

	constructor(usersRepository: UserRepository, booksRepository: BookRepository) {
		this.usersRepository = usersRepository
		this.booksRepository = booksRepository
	}


	private async findUser(userDataSearch: User): Promise<User> {
		const user = await this.usersRepository.findOne(userDataSearch)

		if (!user) throw new Error("User not found")

		return user
	}

	async createUser(req: Request, res: Response): Promise<any> {
		try {
			const user = req.body

			const userExists = await this.usersRepository.findOne({ email: user.email })

			if (userExists) throw new Error("User already exists")

			const newUser = await this.usersRepository.create(user)

			return res.status(201).json(newUser)

		} catch (err: any) {
			if (err.message === 'User already exists') return res.status(401).json({ message: err.message })

			return res.status(500).json({ message: err.message })
		}
	}


	async addFavorite(req: Request, res: Response): Promise<any> {
		try {
			const { sub } = req.auth as any
			const { booksFavorites } = req.body

			await this.findUser({ _id: sub })

			const user = await this.usersRepository.update(sub, { $set: { booksFavorites } })

			return res.status(200).json(user)

		} catch (err: any) {
			if (err.message === 'User not found') return res.status(404).json({ message: err.message })

			return res.status(500).json({ message: err.message })
		}
	}

	async authenticate(req: Request, res: Response) {
		try {
			const { email, password } = req.body

			const user = await this.findUser({ email })

			if (user?.password !== password) return res.status(422).json({ message: "Invalid password" })

			const jwt = sign({
				sub: user._id,
				name: user.name
			}, process.env.JWT_SECRET as string, {
				algorithm: 'HS256',
				audience: process.env.JWT_AUD,
				issuer: process.env.JWT_ISSUER,
			})

			return res.status(200).json({ token: jwt })
		} catch (err: any) {
			console.log(err)
			if (err.message === 'User not found') return res.status(404).json({ message: err.message })
			return res.status(500).json({ message: err.message })
		}
	}

	async getFavorites(req: Request, res: Response) {
		try {
			const { sub } = req.auth as any

			const user = await this.findUser({ _id: sub })

			if (!user.booksFavorites) return res.status(200).json([])

			const booksFavorites = await Promise.all(user.booksFavorites.map(async (id) => this.booksRepository.findOne(id)))

			return res.status(200).json(booksFavorites)
		} catch (err: any) {
			if (err.message === 'User not found') return res.status(404).json({ message: err.message })
			return res.status(500).json({ message: err.message })
		}
	}

	async getLastRecommendations(req: Request, res: Response) {
		try {
			const { sub } = req.auth as any

			const user = await this.findUser({ _id: sub })

			if (!user.booksSug) return res.status(200).json([])

			const booksFavorites = await Promise.all(user.booksSug.map(async (id) => this.booksRepository.findOne(id)))

			return res.status(200).json(booksFavorites)
		} catch (err: any) {
			if (err.message === 'User not found') return res.status(404).json({ message: err.message })
			return res.status(500).json({ message: err.message })
		}
	}

	async favoriteOrUnfavorite(req: Request, res: Response) {
		try {
			const { sub } = req.auth as any
			const { bookId } = req.params

			const user = await this.findUser({ _id: sub })

			const hasFavorite = user.booksFavorites?.includes(bookId)
			const hasRecommended = user.booksSug?.includes(bookId)

			if (hasFavorite) {
				await this.usersRepository.update(sub, {
					$pull: { booksFavorites: bookId }
				})

				return res.status(200).end()
			}

			if (hasRecommended) {
				await this.usersRepository.update(sub, {
					$pull: { booksSug: bookId },
					$push: { booksFavorites: bookId }
				})

				return res.status(200).end()
			}

			await this.usersRepository.update(sub, {
				$push: { booksFavorites: bookId }
			})

			return res.status(200).end()
		} catch (err: any) {
			console.log(err)
			return res.status(500).json({ message: err.message })
		}
	}


	async getAllBooks(req: Request, res: Response) {
		try {
			const books = await this.booksRepository.findAll()

			return res.status(200).json(books)
		} catch (err: any) {
			return res.status(500).json({ message: err.message })
		}
	}

	async searchBooks(req: Request, res: Response) {
		try {
			const bookId = req.params.bookId

			const book = await this.booksRepository.findOne(bookId)

			return res.status(200).json(book)
		} catch (err: any) {
			return res.status(500).json({ message: err.message })
		}
	}

	async recomendation(req: Request, res: Response) {
		try {
			const { sub } = req.auth as any

			const user = await this.findUser({ _id: sub })

			const recomendation = await recommended(user, this.usersRepository, this.booksRepository)

			if (recomendation) {
				if (user.booksSug && user?.booksSug.length < 10) {
					await this.usersRepository.update(sub, {
						$push: { booksSug: recomendation?._id.toString() }
					})

					return res.status(200).json(recomendation)
				}

				user.booksSug?.splice(0, 1)
				user.booksSug?.push(recomendation._id.toString())

				await this.usersRepository.update(sub, {
					$set: { booksSug: user.booksSug }
				})
			}

			return res.status(200).json(recomendation)

		} catch (err: any) {
			console.log(err)
			return res.status(500).json({ message: err.message })
		}
	}
}
