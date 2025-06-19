import { ProductService } from "../services";
import { IProductRepository } from "../domain";
import { $Enums, Product } from "../generated/prisma";
import { IRedisService } from "../shared/redis-service";

const mockProduct: Product = {
    id: "1",
    name: "Test Product",
    description: "A product for testing",
    price: 100,
    stockAmount: 10,
    state: $Enums.ProductState.active,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe("ProductService", () => {
    let productRepository: jest.Mocked<IProductRepository>;
    let redisService: jest.Mocked<IRedisService>;
    let productService: ProductService;

    beforeEach(() => {
        productRepository = {
            createProduct: jest.fn(),
            getProductById: jest.fn(),
            updateProduct: jest.fn(),
            listProductsByState: jest.fn(),
            listProducts: jest.fn(),
            countProductsByState: jest.fn(),
        } as unknown as jest.Mocked<IProductRepository>;
        redisService = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        } as unknown as jest.Mocked<IRedisService>;
        productService = new ProductService(productRepository, redisService);
    });

    it("should create a product", async () => {
        productRepository.createProduct.mockResolvedValue(mockProduct);
        const result = await productService.createProduct(
            mockProduct.name,
            mockProduct.description,
            mockProduct.price,
            mockProduct.stockAmount
        );
        expect(productRepository.createProduct).toHaveBeenCalledWith(
            mockProduct.name,
            mockProduct.description,
            mockProduct.price,
            mockProduct.stockAmount
        );
        expect(result).toBe(mockProduct);
    });

    it("should get a product by id", async () => {
        productRepository.getProductById.mockResolvedValue(mockProduct);
        const result = await productService.getProductById("1");
        expect(productRepository.getProductById).toHaveBeenCalledWith("1");
        expect(result).toBe(mockProduct);
    });

    it("should update a product", async () => {
        const updatedProduct = { ...mockProduct, name: "Updated" };
        productRepository.updateProduct.mockResolvedValue(updatedProduct);
        productRepository.getProductById.mockResolvedValue(mockProduct);
        const result = await productService.updateProduct("1", { name: "Updated" });
        expect(productRepository.updateProduct).toHaveBeenCalledWith("1", { name: "Updated" });
        expect(result).toBe(updatedProduct);
    });

    it("should update stockAmount even if it is 0", async () => {
        const updatedProduct = { ...mockProduct, stockAmount: 0 };
        productRepository.updateProduct.mockResolvedValue(updatedProduct);
        productRepository.getProductById.mockResolvedValue(mockProduct);
        const result = await productService.updateProduct("1", { stockAmount: 0 });
        expect(productRepository.updateProduct).toHaveBeenCalledWith("1", { stockAmount: 0 });
        expect(result).toBe(updatedProduct);
    });

    it("should soft delete a product", async () => {
        const deletedProduct = { ...mockProduct, state: $Enums.ProductState.deleted, deletedAt: new Date() };
        productRepository.getProductById.mockResolvedValue(mockProduct);
        productRepository.updateProduct.mockResolvedValue(deletedProduct);
        const result = await productService.deleteProduct("1");
        expect(productRepository.updateProduct).toHaveBeenCalledWith(
            "1",
            expect.objectContaining({
                state: $Enums.ProductState.deleted,
                deletedAt: expect.any(Date),
            })
        );
        expect(result).toBe(deletedProduct);
    });

    it("should list available products", async () => {
        productRepository.listProductsByState.mockResolvedValue([mockProduct]);
        const result = await productService.listAvailableProducts(0, 10);
        expect(productRepository.listProductsByState).toHaveBeenCalledWith($Enums.ProductState.active, 0, 10);
        expect(result).toEqual([mockProduct]);
    });

    it("should count available products", async () => {
        productRepository.countProductsByState.mockResolvedValue(42);
        const result = await productService.countAvailableProducts();
        expect(productRepository.countProductsByState).toHaveBeenCalledWith($Enums.ProductState.active);
        expect(result).toBe(42);
    });

    it("should list all products", async () => {
        productRepository.listProducts.mockResolvedValue([mockProduct]);
        const result = await productService.listAllProducts();
        expect(productRepository.listProducts).toHaveBeenCalled();
        expect(result).toEqual([mockProduct]);
    });

    it("should throw an error when updating a deleted product", async () => {
        productRepository.getProductById.mockResolvedValue({ ...mockProduct, state: $Enums.ProductState.deleted });
        await expect(productService.updateProduct("1", { name: "Updated" }))
            .rejects
            .toThrow("Cannot update state of a deleted product.");
        expect(productRepository.updateProduct).not.toHaveBeenCalled();
    })
});