import * as argon2 from 'argon2';

export interface IPasswordService {
    hashPassword(password: string): Promise<string>;
    verifyPassword(hash: string, password: string): Promise<boolean>;
}

export class Argon2PasswordService implements IPasswordService {
    async hashPassword(password: string): Promise<string> {
        return argon2.hash(password);
    }

    async verifyPassword(hash: string, password: string): Promise<boolean> {
        return argon2.verify(hash, password);
    }
}