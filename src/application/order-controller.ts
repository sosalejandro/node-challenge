import { Request, Response } from "express";
import { IOrderService } from "../domain/order-interfaces";
import { logger } from "../shared/logger";
import Joi from "joi";

const orderCreateSchema = Joi.object({
    userId: Joi.string().required(),
    items: Joi.array().items(
        Joi.object({
            productId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required()
        })
    ).min(1).required(),
    status: Joi.string().valid('pending', 'completed', 'cancelled').default('pending')
});

export class OrderController {
    constructor(private orderService: IOrderService) {}

    async createOrder(req: Request, res: Response) {
        const { error, value } = orderCreateSchema.validate(req.body);
        if (error) {
            logger.error("Validation error creating order", { error: error.details });
            return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
        }
        const { userId, items, status } = value;
        logger.info("Creating order", { userId, items, status });
        try {
            const order = await this.orderService.createOrder(userId, items, status);
            logger.info("Order created", { id: order.id });
            return res.status(201).json({ data: order, message: "Order created" });
        } catch (error) {
            logger.error("Error creating order", { error });
            return res.status(400).json({ error: (error as Error).message });
        }
    }

    async getOrderById(req: Request, res: Response) {
        const { id } = req.params;
        logger.info("Getting order by id", { id });
        try {
            const order = await this.orderService.getOrderById(id);
            if (!order) {
                logger.info("Order not found", { id });
                return res.status(404).json({ error: "Order not found" });
            }
            logger.info("Order found", { id });
            return res.status(200).json({ data: order, message: "Order found" });
        } catch (error) {
            logger.error("Error getting order by id", { id, error });
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    async listOrdersByUser(req: Request, res: Response) {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const skip = (page - 1) * pageSize;
        logger.info("Listing orders by user", { userId, page, pageSize });
        try {
            const orders = await this.orderService.listOrdersByUser(userId, skip, pageSize);
            const total = await this.orderService.countOrdersByUser(userId);
            return res.status(200).json({
                data: orders,
                page,
                pageSize,
                count: orders.length,
                total,
                message: "Orders found"
            });
        } catch (error) {
            logger.error("Error listing orders by user", { userId, error });
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}
