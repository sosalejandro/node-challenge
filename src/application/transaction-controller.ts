import { Request, Response, NextFunction } from 'express';
import { ITransactionService } from '../services/transaction-service';
import { logger } from '../shared/logger';
import { IJwtService } from '../shared';
import { UserDto } from '../domain';
import Joi from 'joi';
import { createOrderProductsSchema, updateOrderItemsSchema } from './schemas';


export class TransactionController {
    private transactionService: ITransactionService;
    private jwtService: IJwtService;

    constructor(transactionService: ITransactionService, jwtService: IJwtService) {
        this.transactionService = transactionService;
        this.jwtService = jwtService;
    }

    extractUser(req: Request): UserDto | null {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.split(' ')[1];
        try {
            const user = this.jwtService.verifyToken<UserDto>(token);
            return user;
        } catch (error) {
            logger.error({ err: error }, 'Invalid JWT token');
            return null;
        }
    }

    async createOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const user = this.extractUser(req);
            if (!user) {
                return res.status(401).json({ message: 'Unauthorized: Invalid or missing token' });
            }
            // Joi validation for products array
            const { error } = createOrderProductsSchema.validate(req.body.products);
            if (error) {
                return res.status(400).json({ message: error.details[0].message });
            }
            const userId = user.id;
            const { products } = req.body;
            if (!userId || !Array.isArray(products)) {
                return res.status(400).json({ message: 'userId and products are required' });
            }
            const order = await this.transactionService.createOrder(userId, products);
            res.status(201).json({ data: order, message: 'Order created successfully' });
        } catch (error) {
            logger.error({ err: error }, 'Error in createOrder controller');
            next(error);
        }
    }

    async deleteOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { orderId } = req.params;
            await this.transactionService.deleteOrder(orderId);
            res.status(200).json({ data: null, message: 'Order deleted successfully' });
        } catch (error) {
            logger.error({ err: error }, 'Error in deleteOrder controller');
            next(error);
        }
    }

    async cancelOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { orderId } = req.params;
            const order = await this.transactionService.cancelOrder(orderId);
            res.status(200).json({ data: order, message: 'Order cancelled successfully' });
        } catch (error) {
            logger.error({ err: error }, 'Error in cancelOrder controller');
            next(error);
        }
    }

    async updateOrderItems(req: Request, res: Response, next: NextFunction) {
        try {
            const { orderId } = req.params;
            // Joi validation for updates array
            const { error } = updateOrderItemsSchema.validate(req.body.updates);
            if (error) {
                return res.status(400).json({ message: error.details[0].message });
            }
            const { updates } = req.body;
            const order = await this.transactionService.updateOrderItems(orderId, updates);
            res.status(200).json({ data: order, message: 'Order items updated successfully' });
        } catch (error) {
            logger.error({ err: error }, 'Error in updateOrderItems controller');
            next(error);
        }
    }

    async getOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { orderId } = req.params;
            const order = await this.transactionService.getOrder(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.status(200).json({ data: order, message: 'Order fetched successfully' });
        } catch (error) {
            logger.error({ err: error }, 'Error in getOrder controller');
            next(error);
        }
    }

    // async completeOrder(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const { orderId } = req.params;
    //         const order = await this.transactionService.completeOrder(orderId);
    //         if (!order) {
    //             return res.status(404).json({ message: 'Order not found' });
    //         }
    //         res.status(200).json({ data: order, message: 'Order completed successfully' });
    //     } catch (error) {
    //         logger.error({ err: error }, 'Error in completeOrder controller');
    //         next(error);
    //     }
    // }
}
