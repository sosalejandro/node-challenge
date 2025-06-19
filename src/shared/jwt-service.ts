import jwt, { Secret, SignOptions } from 'jsonwebtoken';

export interface IJwtService {
    generateToken(payload: object, expiresIn?: string): string;
    verifyToken<T = any>(token: string): T;
}

export class JwtService implements IJwtService {
    private secret: Secret;

    constructor(secret: Secret) {
        this.secret = secret;
    }

    generateToken(payload: Record<string, any>, expiresIn?: string | number): string {
        const options: SignOptions = { expiresIn: (expiresIn ?? '1h') as SignOptions['expiresIn'] };
        return jwt.sign(payload, this.secret, options);
    }

    verifyToken<T = any>(token: string): T {
        try {
            return jwt.verify(token, this.secret) as T;
        } catch (err) {
            throw new Error('Invalid or expired token');
        }
    }
}
