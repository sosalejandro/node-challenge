import { $Enums, Order, OrderItem } from '../generated/prisma';

export interface IOrderRepository {
    createOrder(userId: string, items: { productId: string; quantity: number }[], status: string): Promise<(Order & { items: OrderItem[] })>;
    getOrderById(id: string): Promise<(Order & { items: OrderItem[] }) | null>;
    listOrdersByUser(userId: string, skip: number, take: number): Promise<(Order & { items: OrderItem[] })[]>;
    updateOrder(id: string, data: Partial<Omit<Order, 'id'>>): Promise<(Order & { items: OrderItem[] })>;
    deleteOrder(id: string): Promise<Order>;
    removeOrderItems(orderId: string, productIds: string[]): Promise<void>;
    increaseItemsQuantity(orderId: string, items: { productId: string; amount: number }[]): Promise<void>;
    countOrdersByUser(userId: string): Promise<number>;
}

export interface IOrderService {
    createOrder(userId: string, items: { productId: string; quantity: number }[], status: string): Promise<(Order & { items: OrderItem[] })>;
    getOrderById(id: string): Promise<(Order & { items: OrderItem[] }) | null>;
    listOrdersByUser(userId: string, skip: number, take: number): Promise<(Order & { items: OrderItem[] })[]>;
    updateOrder(id: string, data: Partial<Omit<Order, 'id' | 'status'>>): Promise<(Order & { items: OrderItem[] })>;
    completeOrder(id: string): Promise<$Enums.OrderStatus>;
    cancelOrder(id: string): Promise<$Enums.OrderStatus>;
    deleteOrder(id: string): Promise<Order>;
    removeProductsFromOrder(orderId: string, productIds: string[]): Promise<(Order & { items: OrderItem[] })>;
    increaseItemsQuantity(orderId: string, items: { productId: string; amount: number }[]): Promise<(Order & { items: OrderItem[] })>;
    countOrdersByUser(userId: string): Promise<number>;
}
