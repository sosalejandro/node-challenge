import { OrderService } from "../services/order-service";
import { IOrderRepository } from "../domain/order-interfaces";
import { $Enums, Order, OrderItem } from "../generated/prisma";
import { IRedisService } from "../shared";

const mockOrder: Order & { items: OrderItem[] } = {
    id: "order1",
    userId: "user1",
    status: $Enums.OrderStatus.pending,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
        { id: "item1", orderId: "order1", productId: "p1", quantity: 2 }
    ]
};

describe("OrderService", () => {
    let orderRepository: jest.Mocked<IOrderRepository>;
    let redisService: jest.Mocked<IRedisService>;
    let orderService: OrderService;

    beforeEach(() => {
        orderRepository = {
            createOrder: jest.fn(),
            getOrderById: jest.fn(),
            listOrdersByUser: jest.fn(),
            updateOrder: jest.fn(),
            deleteOrder: jest.fn(),
            removeOrderItems: jest.fn(),
            increaseItemsQuantity: jest.fn(),
            countOrdersByUser: jest.fn(),
        } as unknown as jest.Mocked<IOrderRepository>;
        redisService = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        } as unknown as jest.Mocked<IRedisService>;

        orderService = new OrderService(orderRepository, redisService);
    });

    it("should throw if creating an order with no items", async () => {
        await expect(orderService.createOrder("user1", [], "pending"))
            .rejects.toThrow("Order must contain at least one item.");
    });

    it("should throw if all items have invalid quantity", async () => {
        await expect(orderService.createOrder("user1", [{ productId: "p1", quantity: 0 }], "pending"))
            .rejects.toThrow("All items have invalid quantity. Order must contain at least one item with quantity > 0.");
    });

    it("should create an order with valid items", async () => {
        orderRepository.createOrder.mockResolvedValue(mockOrder);
        const result = await orderService.createOrder("user1", [{ productId: "p1", quantity: 2 }], "pending");
        expect(orderRepository.createOrder).toHaveBeenCalledWith("user1", [{ productId: "p1", quantity: 2 }], "pending");
        expect(result).toBe(mockOrder);
    });

    it("should get an order by id", async () => {
        orderRepository.getOrderById.mockResolvedValue(mockOrder);
        const result = await orderService.getOrderById("order1");
        expect(orderRepository.getOrderById).toHaveBeenCalledWith("order1");
        expect(result).toBe(mockOrder);
    });

    it("should list orders by user", async () => {
        orderRepository.listOrdersByUser.mockResolvedValue([mockOrder]);
        const result = await orderService.listOrdersByUser("user1", 0, 10);
        expect(orderRepository.listOrdersByUser).toHaveBeenCalledWith("user1", 0, 10);
        expect(result).toEqual([mockOrder]);
    });

    it("should count orders by user", async () => {
        orderRepository.countOrdersByUser.mockResolvedValue(5);
        const result = await orderService.countOrdersByUser("user1");
        expect(orderRepository.countOrdersByUser).toHaveBeenCalledWith("user1");
        expect(result).toBe(5);
    });

    it("should throw if updating a non-existent order", async () => {
        orderRepository.getOrderById.mockResolvedValue(null);
        await expect(orderService.updateOrder("order1", {}))
            .rejects.toThrow("Order not found.");
    });

    it("should throw if updating a non-pending order", async () => {
        orderRepository.getOrderById.mockResolvedValue({ ...mockOrder, status: $Enums.OrderStatus.completed });
        await expect(orderService.updateOrder("order1", {}))
            .rejects.toThrow("Only orders with 'pending' status can be updated.");
    });

    it("should update a pending order", async () => {
        orderRepository.getOrderById.mockResolvedValue(mockOrder);
        orderRepository.updateOrder.mockResolvedValue({ ...mockOrder, updatedAt: new Date() });
        const result = await orderService.updateOrder("order1", {});
        expect(orderRepository.updateOrder).toHaveBeenCalledWith("order1", {});
        expect(result).toBeDefined();
    });

    it("should throw if completing a non-existent order", async () => {
        orderRepository.getOrderById.mockResolvedValue(null);
        await expect(orderService.completeOrder("order1"))
            .rejects.toThrow("Order not found.");
    });

    it("should throw if completing a non-pending order", async () => {
        orderRepository.getOrderById.mockResolvedValue({ ...mockOrder, status: $Enums.OrderStatus.completed });
        await expect(orderService.completeOrder("order1"))
            .rejects.toThrow("Only pending orders can be completed.");
    });

    it("should complete a pending order", async () => {
        orderRepository.getOrderById.mockResolvedValue(mockOrder);
        orderRepository.updateOrder.mockResolvedValue({ ...mockOrder, status: $Enums.OrderStatus.completed });
        const result = await orderService.completeOrder("order1");
        expect(orderRepository.updateOrder).toHaveBeenCalledWith("order1", { status: $Enums.OrderStatus.completed });
        expect(result).toBe($Enums.OrderStatus.completed);
    });

    it("should throw if cancelling a non-existent order", async () => {
        orderRepository.getOrderById.mockResolvedValue(null);
        await expect(orderService.cancelOrder("order1"))
            .rejects.toThrow("Order not found.");
    });

    it("should throw if cancelling a non-pending order", async () => {
        orderRepository.getOrderById.mockResolvedValue({ ...mockOrder, status: $Enums.OrderStatus.completed });
        await expect(orderService.cancelOrder("order1"))
            .rejects.toThrow("Only pending orders can be cancelled.");
    });

    it("should cancel a pending order", async () => {
        orderRepository.getOrderById.mockResolvedValue(mockOrder);
        orderRepository.updateOrder.mockResolvedValue({ ...mockOrder, status: $Enums.OrderStatus.cancelled });
        const result = await orderService.cancelOrder("order1");
        expect(orderRepository.updateOrder).toHaveBeenCalledWith("order1", { status: $Enums.OrderStatus.cancelled });
        expect(result).toBe($Enums.OrderStatus.cancelled);
    });

    it("should delete an order", async () => {
        orderRepository.deleteOrder.mockResolvedValue(mockOrder);
        const result = await orderService.deleteOrder("order1");
        expect(orderRepository.deleteOrder).toHaveBeenCalledWith("order1");
        expect(result).toBe(mockOrder);
    });

    it("should remove products from order", async () => {
        orderRepository.getOrderById.mockResolvedValue(mockOrder);
        orderRepository.removeOrderItems.mockResolvedValue();
        orderRepository.getOrderById.mockResolvedValue({ ...mockOrder, items: [] });
        const result = await orderService.removeProductsFromOrder("order1", ["p1"]);
        expect(orderRepository.removeOrderItems).toHaveBeenCalledWith("order1", ["p1"]);
        expect(result.items).toEqual([]);
    });

    it("should increase items quantity", async () => {
        orderRepository.getOrderById.mockResolvedValue(mockOrder);
        orderRepository.increaseItemsQuantity.mockResolvedValue();
        orderRepository.getOrderById.mockResolvedValue({ ...mockOrder, items: [{ id: "item1", orderId: "order1", productId: "p1", quantity: 5 }] });
        const result = await orderService.increaseItemsQuantity("order1", [{ productId: "p1", amount: 3 }]);
        expect(orderRepository.increaseItemsQuantity).toHaveBeenCalledWith("order1", [{ productId: "p1", amount: 3 }]);
        expect(result.items[0].quantity).toBe(5);
    });
});