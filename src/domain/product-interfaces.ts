import { Prisma, Product, $Enums } from '../generated/prisma';

export interface IProductRepository {
    createProduct(name: string, description: string, price: number, stockAmount: number): Promise<Product>;
    getProductById(id: string): Promise<Product | null>;
    updateProduct(id: string, data: Partial<Omit<Product, 'id'>>): Promise<Product>;
    deleteProduct(id: string): Promise<Product>;
    listProducts(): Promise<Product[]>;
    listProductsByState(state: $Enums.ProductState, skip: number, take: number): Promise<Product[]>;
    countProductsByState(state: $Enums.ProductState): Promise<number>;
    // increaseProductQuantities(updates: { id: string; incrementBy: number }[]): Promise<void>;
}

export interface IProductService {
    createProduct(name: string, description: string, price: number, stockAmount: number): Promise<Product>;
    getProductById(id: string): Promise<Product | null>;
    updateProduct(id: string, data: Partial<Omit<Product, 'id'>>): Promise<Product>;
    deleteProduct(id: string): Promise<Product>;
    listAvailableProducts(skip: number, take: number): Promise<Product[]>;
    listAllProducts(): Promise<Product[]>;
    countAvailableProducts(): Promise<number>;
}
