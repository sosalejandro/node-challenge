import { Request, Response } from "express";
import { IUserService, UserResultDto } from "../domain";
import { userSchema, loginSchema } from "./";
import { IJwtService, logger } from "../shared";


export class UserController {
    constructor(private userService: IUserService, private jwtService: IJwtService) { }

    async register(req: Request, res: Response) {
        logger.info("Register endpoint called", { body: req.body });
        const { error, value } = userSchema.validate(req.body);
        if (error) {
            logger.warn("Validation failed during registration", { error: error.details[0].message });
            return res.status(400).json({ error: error.details[0].message });
        }
        const { firstName, lastName, email, password } = value;
        logger.info("Retrieved value data", { value })
        try {
            logger.info("Attempting to register user", { email });
            const result = await this.userService.registerUser(
                firstName,
                lastName,
                email,
                password
            );
            logger.info("User registered successfully", { email });
            return res.status(201).json({ data: result, message: "Registration successful" });
        } catch (error) {
            if (error instanceof Error && error.message === 'User already exists') {
                logger.warn("User registration failed: user already exists", { email });
                return res.status(409).json({ error: "Unable to register user" });
            }
            logger.debug(error);
            logger.error("Error during user registration", { error });
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    async login(req: Request, res: Response) {
        logger.info("Login endpoint called", { body: req.body });
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            logger.warn("Validation failed during login", { error: error.details[0].message });
            return res.status(400).json({ error: error.details[0].message });
        }
        const { email, password } = value;

        try {
            logger.info("Attempting to authenticate user", { email });
            const authenticated = await this.userService.authenticateUser(email, password);
            if (!authenticated) {
                logger.warn("Authentication failed", { email });
                // Use a generic error message to avoid leaking information
                return res.status(401).json({ error: "Invalid email or password" });
            }

            const user = await this.userService.getUserByEmail(email);
            if (!user) {
                logger.error("User not found after authentication", { email });
                // Use the same generic error message
                return res.status(401).json({ error: "Invalid email or password" });
            }

            const { passwordHash, ...userPayload } = user;
            const jwt = this.jwtService.generateToken(userPayload);

            logger.info("User logged in successfully", { email });
            return res.status(200).json({ data: jwt, message: "Login successful" });
        } catch (error) {
            logger.error("Error during user login", { error });
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    async getUser(req: Request, res: Response) {
        const email = req.query.email as string;
        logger.info("GetUser endpoint called", { email });
        if (!email) {
            logger.warn("Email parameter missing in getUser");
            return res.status(400).json({ error: "Email is required" });
        }
        try {
            logger.info("Fetching user by email", { email });
            const user = await this.userService.getUserByEmail(email);
            if (!user) {
                logger.warn("User not found", { email });
                return res.status(404).json({ error: "User not found" });
            }
            logger.info("User found", { email });
            const result: UserResultDto = {
                 id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            };
            return res.status(200).json({ data: result, message: "User found" });
        } catch (error) {
            logger.error("Error during getUser", { error });
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}