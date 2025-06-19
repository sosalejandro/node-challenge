import { IOrderRepository, IOrderService } from "../domain/order-interfaces";
import { $Enums, Order, OrderItem } from "../generated/prisma";
import { IRedisService, redisKeys } from '../shared';

export class OrderService implements IOrderService {
    private orderRepository: IOrderRepository;
    private redis: IRedisService;

    constructor(orderRepository: IOrderRepository, redis: IRedisService) {
        this.orderRepository = orderRepository;
        this.redis = redis;
    }

    async createOrder(userId: string, items: { productId: string; quantity: number }[], status: string): Promise<(Order & { items: OrderItem[] })> {
        if (!items || items.length === 0) {
            throw new Error("Order must contain at least one item.");
        }

        const validItems = items.filter(item => typeof item.quantity === "number" && item.quantity > 0);

        if (validItems.length === 0) {
            throw new Error("All items have invalid quantity. Order must contain at least one item with quantity > 0.");
        }

        const order = await this.orderRepository.createOrder(userId, items, status);
        await this.redis.set(redisKeys.order(order.id), order, 3600);
        return order;
    }

    async getOrderById(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
        const cacheKey = redisKeys.order(id);
        let order = await this.redis.get<(Order & { items: OrderItem[] })>(cacheKey);
        if (!order) {
            order = await this.orderRepository.getOrderById(id);
            if (order) await this.redis.set(cacheKey, order, 3600);
        }
        return order;
    }

    async listOrdersByUser(userId: string, skip: number, take: number): Promise<(Order & { items: OrderItem[] })[]> {
        return this.orderRepository.listOrdersByUser(userId, skip, take);
    }

    async countOrdersByUser(userId: string): Promise<number> {
        return this.orderRepository.countOrdersByUser(userId);
    }

    async updateOrder(id: string, data: Partial<Omit<Order, 'id' | 'status'>>): Promise<(Order & { items: OrderItem[] })> {
        const existingOrder = await this.orderRepository.getOrderById(id);
        if (!existingOrder) {
            throw new Error("Order not found.");
        }
        if (existingOrder.status !== $Enums.OrderStatus.pending) {
            throw new Error("Only orders with 'pending' status can be updated.");
        }        

        const updated = await this.orderRepository.updateOrder(id, data);
        await this.redis.set(redisKeys.order(id), updated, 3600);
        return updated;
    }

    async completeOrder(id: string): Promise<$Enums.OrderStatus> {
        const order = await this.orderRepository.getOrderById(id);
        if (!order) {
            throw new Error("Order not found.");
        }
        if (order.status !== $Enums.OrderStatus.pending) {
            throw new Error("Only pending orders can be completed.");
        }

        const updatedOrder = await this.orderRepository.updateOrder(id, { status: $Enums.OrderStatus.completed });
        await this.redis.set(redisKeys.order(id), updatedOrder, 3600);
        return updatedOrder.status;
    }

    async cancelOrder(id: string): Promise<$Enums.OrderStatus> {
        const order = await this.orderRepository.getOrderById(id);
        if (!order) {
            throw new Error("Order not found.");
        }
        if (order.status !== $Enums.OrderStatus.pending) {
            throw new Error("Only pending orders can be cancelled.");
        }
        const updatedOrder = await this.orderRepository.updateOrder(id, { status: $Enums.OrderStatus.cancelled });
        await this.redis.set(redisKeys.order(id), updatedOrder, 3600);
        return updatedOrder.status;
    }


    async deleteOrder(id: string): Promise<Order> {
        const deleted = await this.orderRepository.deleteOrder(id);
        await this.redis.del(redisKeys.order(id));
        return deleted;
    }

    async removeProductsFromOrder(orderId: string, productIds: string[]): Promise<(Order & { items: OrderItem[] })> {
        // Remove the order items with the given productIds
        await this.orderRepository.removeOrderItems(orderId, productIds);

        // Fetch and return the updated order
        const updatedOrder = await this.orderRepository.getOrderById(orderId);
        if (!updatedOrder) throw new Error('Order not found');
        await this.redis.set(redisKeys.order(orderId), updatedOrder, 3600);
        return updatedOrder;
    }

    async increaseItemsQuantity(orderId: string, items: { productId: string; amount: number; }[]): Promise<(Order & { items: OrderItem[] })> {
        const order = await this.orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.status !== $Enums.OrderStatus.pending) {
            throw new Error("Only pending orders can be updated.");
        }
        await this.orderRepository.increaseItemsQuantity(orderId, items);
        const updatedOrder = await this.orderRepository.getOrderById(orderId);
        if (!updatedOrder) throw new Error('Order not found after update');
        await this.redis.set(redisKeys.order(orderId), updatedOrder, 3600);
        return updatedOrder;
    }
}
