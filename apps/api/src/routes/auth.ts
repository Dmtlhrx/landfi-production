import { FastifyInstance } from 'fastify';
import bcryptjs from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { zodToJsonSchema } from 'zod-to-json-schema'; // <-- ajout

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', {
    schema: {
      body: zodToJsonSchema(registerSchema, "registerSchema"), // <-- conversion ici
    },
  }, async (request, reply) => {
    const { email, password, displayName } = request.body as z.infer<typeof registerSchema>;

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      const passwordHash = await bcryptjs.hash(password, 12);

      const user = await prisma.user.create({
        data: { email, passwordHash, displayName },
        select: {
          id: true, email: true, displayName: true,
          walletHedera: true, role: true, did: true, createdAt: true,
        },
      });

      const accessToken = await reply.jwtSign({ userId: user.id });

      logger.info(`User registered: ${user.email}`);

      return { user, accessToken };
    } catch (error) {
      logger.error('Registration error:', error);
      return reply.code(500).send({ error: 'Registration failed' });
    }
  });

  // Login
  fastify.post('/login', {
    schema: {
      body: zodToJsonSchema(loginSchema, "loginSchema"), // <-- conversion ici aussi
    },
  }, async (request, reply) => {
    const { email, password } = request.body as z.infer<typeof loginSchema>;

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcryptjs.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const accessToken = await reply.jwtSign({ userId: user.id });

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          walletHedera: user.walletHedera,
          role: user.role,
          did: user.did,
          createdAt: user.createdAt,
        },
        accessToken,
      };
    } catch (error) {
      logger.error('Login error:', error);
      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  // Refresh
  fastify.post('/refresh', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userId = (request.user as any).userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          walletHedera: true,
          role: true,
          did: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const accessToken = await reply.jwtSign({ userId: user.id });

      return { user, accessToken };
    } catch (error) {
      logger.error('Token refresh error:', error);
      return reply.code(500).send({ error: 'Token refresh failed' });
    }
  });

  fastify.post('/user/wallet', {
    preHandler: [fastify.authenticate], // L’utilisateur doit être connecté
  }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const { walletHedera} = request.body as { walletHedera: string };
  
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { walletHedera },
        select: {
          id: true,
          email: true,
          displayName: true,
          walletHedera: true,
          role: true,
          did: true,
          createdAt: true,
        },
      });
  
      return reply.send({ user: updatedUser });
    } catch (error) {
      logger.error('Update wallet error:', error);
      return reply.code(500).send({ error: 'Failed to update wallet' });
    }
  });
  
}
