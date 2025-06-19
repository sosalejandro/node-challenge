import { IProductRepository } from "../domain/product-interfaces";
import { $Enums, Product, PrismaClient } from "../generated/prisma";

export class ProductRepository implements IProductRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async createProduct(name: string, description: string, price: number, stockAmount: number): Promise<Product> {
        return this.prisma.product.create({
            data: { name, description, price, stockAmount, state: $Enums.ProductState.active },
        });
    }

    async getProductById(id: string): Promise<Product | null> {
        return this.prisma.product.findUnique({ where: { id } });
    }

    async updateProduct(id: string, data: Partial<Omit<Product, 'id'>>): Promise<Product> {
        return this.prisma.product.update({
            where: { id }, data: {
                ...data,
                updatedAt: new Date()
            }
        });
    }

    async deleteProduct(id: string): Promise<Product> {
        return this.prisma.product.delete({ where: { id } });
    }

    async listProducts(): Promise<Product[]> {
        return this.prisma.product.findMany();
    }

    async listProductsByState(state: $Enums.ProductState, skip = 0, take = 10): Promise<Product[]> {
        return this.prisma.product.findMany({
            where: { state },
            skip,
            take
        });
    }

    async countProductsByState(state: $Enums.ProductState): Promise<number> {
        return this.prisma.product.count({ where: { state } });
    }
}
