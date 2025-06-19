import { PrismaClient } from "@prisma/client";
import { IOrderRepository } from "../domain/order-interfaces";
import { Order, OrderItem } from "../generated/prisma";

export class OrderRepository implements IOrderRepository {
    private prisma: PrismaClient;

    constructor(
        prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }

    async createOrder(userId: string, items: { productId: string; quantity: number }[], status: string): Promise<(Order & { items: OrderItem[] })> {
        return this.prisma.order.create({
            data: {
                userId,
                status,
                items: {
                    create: items.map(item => ({ productId: item.productId, quantity: item.quantity }))
                }
            },
            include: { items: true }
        });
    }

    async getOrderById(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
        return this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    }

    async listOrdersByUser(userId: string, skip: number, take: number): Promise<(Order & { items: OrderItem[] })[]> {
        return this.prisma.order.findMany({ where: { userId }, include: { items: true }, skip, take });
    }

    async updateOrder(id: string, data: Partial<Omit<Order, 'id'>>): Promise<Order & { items: OrderItem[] }> {
        return this.prisma.order.update({
            where: { id },
            data,
            include: { items: true }
        });
    }

    async deleteOrder(id: string): Promise<Order> {
        return this.prisma.order.delete({ where: { id } });
    }

    async removeOrderItems(orderId: string, productIds: string[]): Promise<void> {
        await this.prisma.orderItem.deleteMany({
            where: {
                orderId,
                productId: { in: productIds },
            },
        });
    }

    async increaseItemsQuantity(orderId: string, items: { productId: string; amount: number }[]): Promise<void> {
        if (items.length === 0) return;

        await Promise.all(
            items.map(item =>
                this.prisma.orderItem.upsert({
                    where: {
                        orderId_productId: {
                            orderId,
                            productId: item.productId,
                        },
                    },
                    update: {
                        quantity: {
                            increment: item.amount,
                        },
                    },
                    create: {
                        orderId,
                        productId: item.productId,
                        quantity: item.amount,
                    },
                })
            )
        );
    }

    async countOrdersByUser(userId: string): Promise<number> {
        return this.prisma.order.count({ where: { userId } });
    }
}
