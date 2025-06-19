// routes/user-routes.ts
import { Router } from 'express';
import { UserController } from './';
import { jwtService, userService } from '../infrastructure';
import { authenticateJWT } from '../shared/jwt-middleware';

const router = Router();
const userController = new UserController(userService, jwtService);

router.get("/", authenticateJWT, userController.getUser.bind(userController));
router.post("/login", userController.login.bind(userController));
router.post("/register", userController.register.bind(userController));

export default router;