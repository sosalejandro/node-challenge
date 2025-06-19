import { PrismaClient } from "../generated/prisma";
import { UserRepository, OrderRepository, ProductRepository } from "./";
import { OrderService, ProductService, UserService } from "../services";
import { Argon2PasswordService, JwtService, logger, RedisService } from "../shared";
import { TransactionService } from "../services/transaction-service";


const redisUrl = process.env.REDIS_URL!;
const jwtSecret = process.env.JWT_SECRET!;

const prismaClient = new PrismaClient();
// repositories
const userRepository = new UserRepository(prismaClient);
const orderRepository = new OrderRepository(prismaClient);
const productRepository = new ProductRepository(prismaClient);

// services shared
export const passwordService = new Argon2PasswordService();
export const redisService = new RedisService(redisUrl);
export const jwtService = new JwtService(jwtSecret);

// services
export const userService = new UserService(
    userRepository,
    passwordService,
    redisService,
    logger
);
export const orderService = new OrderService(orderRepository, redisService);
export const productService = new ProductService(productRepository, redisService);
export const transactionService = new TransactionService(orderService, productService);