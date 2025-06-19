import { IUserRepository, IUserService, RegistrationResultDto } from "../domain";
import { User } from "../generated/prisma";
import { ILogger, IPasswordService } from "../shared";
import { IRedisService, redisKeys } from '../shared';


export class UserService implements IUserService {
    private userRepository: IUserRepository;
    private passwordService: IPasswordService;
    private redis: IRedisService;
    private logger: ILogger;

    constructor(
        userRepository: IUserRepository,
        passwordService: IPasswordService,
        redis: IRedisService,
        logger: ILogger
    ) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.redis = redis;
        this.logger = logger;
    }

    async registerUser(firstName: string, lastName: string, email: string, password: string): Promise<RegistrationResultDto> {
        try {
            this.logger.info('Registering user', { email });
            UserService.validateEmail(email);

            const existingUser = await this.userRepository.getUserByEmail(email);
            if (existingUser) {
                this.logger.error('User already exists', { email });
                throw new Error('User already exists');
            }

            const passwordHash = await this.passwordService.hashPassword(password);
            const user = await this.userRepository.createUser(firstName, lastName, email, passwordHash);
            await this.redis.set(redisKeys.user(email), user, 3600);
            this.logger.info('User registered successfully', { email, userId: user.id });
            const result: RegistrationResultDto = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            };
            return result;
        } catch (error) {
            this.logger.error('Error registering user', { email, error });
            throw error;
        }
    }

    async authenticateUser(email: string, password: string): Promise<boolean> {
        this.logger.info('Authenticating user', { email });
        UserService.validateEmail(email);

        const user = await this.getUserByEmail(email);
        if (!user) {
            this.logger.error('Authentication failed: user not found', { email });
            return false;
        }
        const result = await this.passwordService.verifyPassword(user.passwordHash, password);
        this.logger.info('Authentication result', { email, success: result });
        return result;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        this.logger.info('Getting user by email', { email });
        UserService.validateEmail(email);
        const cacheKey = redisKeys.user(email);
        let user = await this.redis.get<User>(cacheKey);
        if (user) {
            this.logger.info('User found in cache', { email });
        } else {
            user = await this.userRepository.getUserByEmail(email);
            if (user) {
                await this.redis.set(cacheKey, user, 3600);
                this.logger.info('User loaded from DB and cached', { email });
            } else {
                this.logger.info('User not found', { email });
            }
        }
        return user;
    }

    static validateEmail(email: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
    }
}