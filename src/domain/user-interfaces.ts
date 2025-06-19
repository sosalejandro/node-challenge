import { User } from '../generated/prisma';
import { RegistrationResultDto } from './';

export interface IUserRepository {
    createUser(firstName: string, lastName: string, email: string, password: string): Promise<User>;
    getUserByEmail(email: string): Promise<User | null>;
}

export interface IUserService {
    registerUser(firstName: string, lastName: string, email: string, password: string): Promise<RegistrationResultDto>;
    authenticateUser(email: string, password: string): Promise<boolean>;
    getUserByEmail(email: string): Promise<User | null>;
}
