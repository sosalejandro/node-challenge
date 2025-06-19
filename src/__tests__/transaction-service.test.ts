import { TransactionService } from "../services/transaction-service";
import { IOrderService } from "../domain/order-interfaces";
import { IProductService } from "../domain/product-interfaces";
import { $Enums, Order, OrderItem, Product } from "../generated/prisma";
import { logger } from "../shared/logger";

jest.mock("../shared/logger");

describe("TransactionService", () => {
    let orderService: jest.Mocked<IOrderService>;
    let productService: jest.Mocked<IProductService>;
    let transactionService: TransactionService;

    const mockOrder: Order & { items: OrderItem[] } = {
        id: "order1",
        userId: "user1",
        status: $Enums.OrderStatus.pending,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
            { id: "item1", orderId: "order1", productId: "p1", quantity: 2 },
            { id: "item2", orderId: "order1", productId: "p2", quantity: 3 }
        ]
    };

    const mockProduct: Product = {
        id: "p1",
        name: "Test Product",
        description: "desc",
        price: 100,
        stockAmount: 10,
        state: $Enums.ProductState.active,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        orderService = {
            createOrder: jest.fn(),
            deleteOrder: jest.fn(),
            cancelOrder: jest.fn(),
            getOrderById: jest.fn(),
            increaseItemsQuantity: jest.fn(),
            removeProductsFromOrder: jest.fn(),
        } as unknown as jest.Mocked<IOrderService>;
        productService = {
            getProductById: jest.fn(),
        } as unknown as jest.Mocked<IProductService>;
        transactionService = new TransactionService(orderService, productService);
        jest.clearAllMocks();
    });

    describe("createOrder", () => {
        it("should create an order if all products exist", async () => {
            productService.getProductById.mockResolvedValue(mockProduct);
            orderService.createOrder.mockResolvedValue(mockOrder);
            const result = await transactionService.createOrder("user1", [{ productId: "p1", quantity: 2 }]);
            expect(productService.getProductById).toHaveBeenCalledWith("p1");
            expect(orderService.createOrder).toHaveBeenCalledWith("user1", [{ productId: "p1", quantity: 2 }], "pending");
            expect(result).toBe(mockOrder);
        });
        it("should throw if a product does not exist", async () => {
            productService.getProductById.mockResolvedValue(null);
            await expect(transactionService.createOrder("user1", [{ productId: "p2", quantity: 1 }]))
                .rejects.toThrow("Product with id p2 does not exist.");
        });
        it("should log errors on failure", async () => {
            productService.getProductById.mockRejectedValue(new Error("fail"));
            await expect(transactionService.createOrder("user1", [{ productId: "p1", quantity: 1 }]))
                .rejects.toThrow("fail");
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("deleteOrder", () => {
        it("should delete an order", async () => {
            orderService.deleteOrder.mockResolvedValue(mockOrder);
            await expect(transactionService.deleteOrder("order1")).resolves.toBeUndefined();
            expect(orderService.deleteOrder).toHaveBeenCalledWith("order1");
        });
        it("should log errors on failure", async () => {
            orderService.deleteOrder.mockRejectedValue(new Error("fail"));
            await expect(transactionService.deleteOrder("order1")).rejects.toThrow("fail");
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("cancelOrder", () => {
        it("should cancel an order and return its status", async () => {
            orderService.cancelOrder.mockResolvedValue($Enums.OrderStatus.cancelled);
            const result = await transactionService.cancelOrder("order1");
            expect(orderService.cancelOrder).toHaveBeenCalledWith("order1");
            expect(result).toBe($Enums.OrderStatus.cancelled);
        });
        it("should throw if order not found after cancel", async () => {
            orderService.cancelOrder.mockRejectedValue(new Error("Order not found"));
            await expect(transactionService.cancelOrder("order1")).rejects.toThrow("Order not found");
        });
        it("should log errors on failure", async () => {
            orderService.cancelOrder.mockRejectedValue(new Error("fail"));
            await expect(transactionService.cancelOrder("order1")).rejects.toThrow("fail");
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("updateOrderItems", () => {
        it("should update and delete order items as needed", async () => {
            orderService.getOrderById.mockResolvedValueOnce(mockOrder); // fetch current order
            orderService.increaseItemsQuantity.mockResolvedValue({ ...mockOrder, items: [
                { ...mockOrder.items[0], quantity: 5 },
                mockOrder.items[1]
            ] });
            orderService.removeProductsFromOrder.mockResolvedValue({ ...mockOrder, items: [
                { ...mockOrder.items[0], quantity: 5 }
            ] });
            // After both updates, only p1 remains
            orderService.getOrderById.mockResolvedValueOnce({ ...mockOrder, items: [
                { ...mockOrder.items[0], quantity: 5 }
            ] }); // after update
            const result: typeof mockOrder = await transactionService.updateOrderItems("order1", [
                { productId: "p1", newQuantity: 5 },
                { productId: "p2", newQuantity: 0 },
            ]) as any;
            expect(orderService.increaseItemsQuantity).toHaveBeenCalledWith("order1", [{ productId: "p1", amount: 3 }]);
            expect(orderService.removeProductsFromOrder).toHaveBeenCalledWith("order1", ["p2"]);
            expect(result.items[0].quantity).toBe(5);
            expect(result.items.length).toBe(1);
        });
        it("should throw if order not found", async () => {
            orderService.getOrderById.mockResolvedValue(null);
            await expect(transactionService.updateOrderItems("order1", [{ productId: "p1", newQuantity: 2 }]))
                .rejects.toThrow("Order not found");
        });
        it("should log errors on failure", async () => {
            orderService.getOrderById.mockRejectedValue(new Error("fail"));
            await expect(transactionService.updateOrderItems("order1", [{ productId: "p1", newQuantity: 2 }]))
                .rejects.toThrow("fail");
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("getOrder", () => {
        it("should fetch an order", async () => {
            orderService.getOrderById.mockResolvedValue(mockOrder);
            const result = await transactionService.getOrder("order1");
            expect(orderService.getOrderById).toHaveBeenCalledWith("order1");
            expect(result).toBe(mockOrder);
        });
        it("should log errors on failure", async () => {
            orderService.getOrderById.mockRejectedValue(new Error("fail"));
            await expect(transactionService.getOrder("order1")).rejects.toThrow("fail");
            expect(logger.error).toHaveBeenCalled();
        });
    });
});
