import { UserService } from '../services';
import { IUserRepository } from '../domain';
import { ILogger, IPasswordService, IRedisService } from '../shared';
import { User } from '../generated/prisma';
import { RegistrationResultDto } from '../domain';

describe('UserService', () => {
    let userRepository: jest.Mocked<IUserRepository>;
    let passwordService: jest.Mocked<IPasswordService>;
    let redisService: jest.Mocked<IRedisService>;
    let logger: jest.Mocked<ILogger>;
    let userService: UserService;
    const mockUser: User = {
        id: '1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        passwordHash: 'hashed'
    };

    beforeEach(() => {
        userRepository = {
            createUser: jest.fn(),
            getUserByEmail: jest.fn(),
        } as unknown as jest.Mocked<IUserRepository>;
        passwordService = {
            hashPassword: jest.fn(),
            verifyPassword: jest.fn(),
        } as unknown as jest.Mocked<IPasswordService>;
        redisService = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        } as unknown as jest.Mocked<IRedisService>;
        logger = {
            info: jest.fn(),
            error: jest.fn()
        }
        userService = new UserService(userRepository, passwordService, redisService, logger);
    });

    it('should register a new user', async () => {
        userRepository.getUserByEmail.mockResolvedValue(null);
        passwordService.hashPassword.mockResolvedValue('hashed');
        userRepository.createUser.mockResolvedValue(mockUser);
        const result = await userService.registerUser('Test', 'User', 'test@example.com', 'password');
        expect(userRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
        expect(passwordService.hashPassword).toHaveBeenCalledWith('password');
        expect(userRepository.createUser).toHaveBeenCalledWith('Test', 'User', 'test@example.com', 'hashed');
        const expected: RegistrationResultDto = {
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            email: mockUser.email
        };
        expect(result).toEqual(expected);
    });

    it('should throw error if user already exists on register', async () => {
        userRepository.getUserByEmail.mockResolvedValue(mockUser);
        await expect(userService.registerUser('Test', 'User', 'test@example.com', 'password'))
            .rejects
            .toThrow('User already exists');
        expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    it('should authenticate user with correct password', async () => {
        userRepository.getUserByEmail.mockResolvedValue(mockUser);
        passwordService.verifyPassword.mockResolvedValue(true);
        const result = await userService.authenticateUser('test@example.com', 'password');
        expect(userRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
        expect(passwordService.verifyPassword).toHaveBeenCalledWith('hashed', 'password');
        expect(result).toBe(true);
    });

    it('should not authenticate user with incorrect password', async () => {
        userRepository.getUserByEmail.mockResolvedValue(mockUser);
        passwordService.verifyPassword.mockResolvedValue(false);
        const result = await userService.authenticateUser('test@example.com', 'wrongpassword');
        expect(result).toBe(false);
    });

    it('should not authenticate non-existent user', async () => {
        userRepository.getUserByEmail.mockResolvedValue(null);
        const result = await userService.authenticateUser('notfound@example.com', 'password');
        expect(result).toBe(false);
    });

    it('should get user by email', async () => {
        userRepository.getUserByEmail.mockResolvedValue(mockUser);
        const result = await userService.getUserByEmail('test@example.com');
        expect(userRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
        expect(result).toBe(mockUser);
    });

    it('should throw error if email format is invalid on register', async () => {
        await expect(
            userService.registerUser('Test', 'User', 'invalid-email', 'password')
        ).rejects.toThrow('Invalid email format');
        expect(userRepository.getUserByEmail).not.toHaveBeenCalled();
        expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    it('should throw error if email format is invalid on authenticateUser', async () => {
        await expect(
            userService.authenticateUser('invalid-email', 'password')
        ).rejects.toThrow('Invalid email format');
        expect(userRepository.getUserByEmail).not.toHaveBeenCalled();
        expect(passwordService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw error if email format is invalid on getUserByEmail', async () => {
        await expect(
            userService.getUserByEmail('invalid-email')
        ).rejects.toThrow('Invalid email format');
        expect(userRepository.getUserByEmail).not.toHaveBeenCalled();
    });
});
