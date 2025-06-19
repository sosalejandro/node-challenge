import { PrismaClient } from "@prisma/client";
import { IUserRepository } from "../domain";
import { User } from "../generated/prisma";

export class UserRepository implements IUserRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async createUser(firstName: string, lastName: string, email: string, passwordHash: string): Promise<User> {
        try {
            return await this.prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                passwordHash,
            },
            });
        } catch (error: any) {
            // Prisma error code for unique constraint violation is 'P2002'
            if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            throw new Error('Email already exists');
            }
            throw error;
        }
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }
}