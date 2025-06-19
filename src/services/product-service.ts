import { IProductRepository, IProductService } from "../domain/product-interfaces";
import { $Enums, Product } from "../generated/prisma";
import { IRedisService, redisKeys } from '../shared';

export class ProductService implements IProductService {
    private productRepository: IProductRepository;
    private redis: IRedisService;

    constructor(productRepository: IProductRepository, redis: IRedisService) {
        this.productRepository = productRepository;
        this.redis = redis;
    }

    async createProduct(name: string, description: string, price: number, stockAmount: number): Promise<Product> {
        const product = await this.productRepository.createProduct(name, description, price, stockAmount);
        await this.redis.set(redisKeys.product(product.id), product, 3600);
        return product;
    }

    async getProductById(id: string): Promise<Product | null> {
        const cacheKey = redisKeys.product(id);
        let product = await this.redis.get<Product>(cacheKey);
        if (!product) {
            product = await this.productRepository.getProductById(id);
            if (product) await this.redis.set(cacheKey, product, 3600);
        }
        return product;
    }

    async updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'state'>>): Promise<Product> {
        const product = await this.productRepository.getProductById(id);
        if (!product) throw new Error('Product not found.');

        if (product.state === $Enums.ProductState.deleted) {
            throw new Error('Cannot update state of a deleted product.');
        }

        // Remove fields from data if they are undefined or have a value of 0,
        // except for the stockAmount field
        Object.keys(data).forEach((key) => {
            const value = (data as any)[key];
            if (key !== 'stockAmount' && (value === undefined || value === 0)) {
                delete (data as any)[key];
            }
        });

        const updated = await this.productRepository.updateProduct(id, data);
        await this.redis.set(redisKeys.product(id), { ...updated, id }, 3600);
        return updated;
    }

    async deleteProduct(id: string): Promise<Product> {
        const product = await this.productRepository.getProductById(id);
        if (!product) throw new Error('Product not found.');

        if (product.state === $Enums.ProductState.deleted) {
            throw new Error('Product not found.');
        }
        
        const deleted = await this.productRepository.updateProduct(id, {
            deletedAt: new Date(),
            state: $Enums.ProductState.deleted
        } as Partial<Product>);
        await this.redis.del(redisKeys.product(id));
        return deleted;
    }

    async listAvailableProducts(skip = 0, take = 10): Promise<Product[]> {
        return this.productRepository.listProductsByState($Enums.ProductState.active, skip, take);
    }

    async listAllProducts(): Promise<Product[]> {
        return this.productRepository.listProducts();
    }

    async countAvailableProducts(): Promise<number> {
        return this.productRepository.countProductsByState($Enums.ProductState.active);
    }
}
