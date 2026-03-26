/**
 * TESTS DE RATING
 *
 * Testea el endpoint PATCH /api/movies/:id/rating
 * que actualiza el campo rating.
 */

const request = require('supertest');

// ============================================
// CONFIGURACION DE MOCKS
// ============================================
const mockPrisma = {
	user: {
		findUnique: jest.fn(),
		create: jest.fn(),
	},
	movie: {
		findMany: jest.fn(),
		findFirst: jest.fn(),
		findUnique: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		updateMany: jest.fn(),
		deleteMany: jest.fn(),
	},
};

jest.mock('../lib/prisma', () => mockPrisma);

jest.mock('../middleware/authMiddleware', () => {
	return (req, res, next) => {
		req.user = { userId: 'user-123' };
		next();
	};
});

const app = require('../server');
const prisma = require('../lib/prisma');

// ============================================
// SUITE DE TESTS: RATING
// ============================================
describe('API de Rating', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('PATCH /api/movies/:id/rating', () => {
		it('deberia actualizar el rating de una pelicula existente', async () => {
			// ARRANGE
			const peliculaMock = {
				id: 'movie-1',
				title: 'Inception',
				director: 'Christopher Nolan',
				year: 2010,
				posterUrl: 'https://example.com/inception.jpg',
				isFavorite: false,
				rating: 3,
				ownerId: 'user-123',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const peliculaActualizada = { ...peliculaMock, rating: 4 };

			prisma.movie.findFirst.mockResolvedValue(peliculaMock);
			prisma.movie.update.mockResolvedValue(peliculaActualizada);

			// ACT
			const response = await request(app)
				.patch('/api/movies/movie-1/rating')
				.set('Authorization', 'Bearer fake-token')
				.send({ rating: 4 });

			// ASSERT
			expect(response.status).toBe(200);
			expect(response.body.rating).toBe(4);
			expect(prisma.movie.findFirst).toHaveBeenCalledWith({
				where: { id: 'movie-1', ownerId: 'user-123' },
			});
			expect(prisma.movie.update).toHaveBeenCalledWith({
				where: { id: 'movie-1' },
				data: { rating: 4 },
			});
		});

		it('deberia devolver 400 para rating invalido mayor a 5 y no llamar a Prisma', async () => {
			// ACT
			const response = await request(app)
				.patch('/api/movies/movie-1/rating')
				.set('Authorization', 'Bearer fake-token')
				.send({ rating: 6 });

			// ASSERT
			expect(response.status).toBe(400);
			expect(prisma.movie.findFirst).not.toHaveBeenCalled();
			expect(prisma.movie.update).not.toHaveBeenCalled();
		});

		it('deberia devolver 400 para rating invalido menor a 0 y no llamar a Prisma', async () => {
			// ACT
			const response = await request(app)
				.patch('/api/movies/movie-1/rating')
				.set('Authorization', 'Bearer fake-token')
				.send({ rating: -1 });

			// ASSERT
			expect(response.status).toBe(400);
			expect(prisma.movie.findFirst).not.toHaveBeenCalled();
			expect(prisma.movie.update).not.toHaveBeenCalled();
		});

		it('deberia devolver 400 cuando no se envia body y no llamar a Prisma', async () => {
			// ACT
			const response = await request(app)
				.patch('/api/movies/movie-1/rating')
				.set('Authorization', 'Bearer fake-token');

			// ASSERT
			expect(response.status).toBe(400);
			expect(prisma.movie.findFirst).not.toHaveBeenCalled();
			expect(prisma.movie.update).not.toHaveBeenCalled();
		});
	});
});
