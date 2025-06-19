import { IOrderService, IProductService } from '../domain';
import { Order } from '../generated/prisma'
import { logger } from '../shared/logger';

export interface ITransactionService {
    createOrder(userId: string, products: { productId: string; quantity: number }[]): Promise<Order>;
    deleteOrder(orderId: string): Promise<void>;
    cancelOrder(orderId: string): Promise<Order>;
    updateOrderItems(
        orderId: string,
        updates: { productId: string; newQuantity: number }[]
    ): Promise<Order>;
    getOrder(orderId: string): Promise<Order | null>;
}

export class TransactionService implements ITransactionService {
    private orderService: IOrderService;
    private productService: IProductService;

    constructor(orderService: IOrderService, productService: IProductService) {
        this.orderService = orderService;
        this.productService = productService;
    }

    async createOrder(userId: string, products: { productId: string; quantity: number }[]): Promise<Order> {
        try {
            logger.info({ userId, products }, 'Creating order');
            // Validate all productIds exist
            for (const prod of products) {
                const product = await this.productService.getProductById(prod.productId);
                if (!product) {
                    throw new Error(`Product with id ${prod.productId} does not exist.`);
                }
            }
            // Use orderService to create the order
            const order = await this.orderService.createOrder(userId, products, 'pending');
            logger.info({ orderId: order.id }, 'Order created successfully');
            return order;
        } catch (error) {
            logger.error({ err: error }, 'Error in createOrder');
            throw error;
        }
    }

    async deleteOrder(orderId: string): Promise<void> {
        try {
            logger.info({ orderId }, 'Deleting order');
            await this.orderService.deleteOrder(orderId);
            logger.info({ orderId }, 'Order deleted successfully');
        } catch (error) {
            logger.error({ err: error }, 'Error in deleteOrder');
            throw error;
        }
    }

    async cancelOrder(orderId: string): Promise<Order> {
        try {
            logger.info({ orderId }, 'Cancelling order');
            await this.orderService.cancelOrder(orderId);
            const order = await this.orderService.getOrderById(orderId);
            if (!order) throw new Error('Order not found');
            logger.info({ orderId }, 'Order cancelled successfully');
            return order;
        } catch (error) {
            logger.error({ err: error }, 'Error in cancelOrder');
            throw error;
        }
    }

    async updateOrderItems(
        orderId: string,
        updates: { productId: string; newQuantity: number }[]
    ): Promise<Order> {
        try {
            logger.info({ orderId, updates }, 'Updating order items');

            // Fetch current order
            const order = await this.orderService.getOrderById(orderId);
            if (!order) throw new Error('Order not found');

            // Map current items for quick lookup
            const currentItemsMap = new Map<string, number>();
            for (const item of order.items ?? []) {
                currentItemsMap.set(item.productId, item.quantity);
            }

            // Prepare lists for update and deletion
            const toUpdate: { productId: string; amount: number }[] = [];
            const toDelete: string[] = [];

            for (const update of updates) {
                const currentQty = currentItemsMap.get(update.productId) ?? 0;
                if (update.newQuantity <= 0 && currentQty > 0) {
                    toDelete.push(update.productId);
                } else if (update.newQuantity > 0 && currentQty !== update.newQuantity) {
                    toUpdate.push({
                        productId: update.productId,
                        amount: update.newQuantity - currentQty,
                    });
                }
            }

            // Perform bulk updates
            if (toUpdate.length > 0) {
                await this.orderService.increaseItemsQuantity(orderId, toUpdate);
            }
            if (toDelete.length > 0) {
                await this.orderService.removeProductsFromOrder(orderId, toDelete);
            }

            const updatedOrder = await this.orderService.getOrderById(orderId);
            logger.info({ orderId }, 'Order items updated');
            return updatedOrder!;
        } catch (error) {
            logger.error({ err: error }, 'Error in updateOrderItems');
            throw error;
        }
    }

    async getOrder(orderId: string): Promise<Order | null> {
        try {
            logger.info({ orderId }, 'Fetching order');
            const order = await this.orderService.getOrderById(orderId);
            logger.info({ orderId, found: !!order }, 'Order fetch result');
            return order;
        } catch (error) {
            logger.error({ err: error }, 'Error in getOrder');
            throw error;
        }
    }
}