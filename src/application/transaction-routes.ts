import { Router } from 'express';
import { TransactionController } from './transaction-controller';
import { authenticateJWT } from '../shared/jwt-middleware';
import { jwtService, transactionService } from '../infrastructure/di-container';

const transactionController = new TransactionController(transactionService, jwtService);

const router = Router();

// Create order (transactional)
router.post(
    '/orders',
    authenticateJWT,
    transactionController.createOrder.bind(transactionController)
);

// Delete order (transactional)
router.delete(
    '/orders/:orderId',
    authenticateJWT,
    transactionController.deleteOrder.bind(transactionController)
);

// Cancel order (transactional)
router.post(
    '/orders/:orderId/cancel',
    authenticateJWT,
    transactionController.cancelOrder.bind(transactionController)
);

// Complete order (transactional)
router.post(
    '/orders/:orderId/complete',
    authenticateJWT,
    transactionController.completeOrder.bind(transactionController)
);

// Update order items (transactional)
router.put(
    '/orders/:orderId/items',
    authenticateJWT,
    transactionController.updateOrderItems.bind(transactionController)
);

// Get order (transactional)
router.get(
    '/orders/:orderId',
    authenticateJWT,
    transactionController.getOrder.bind(transactionController)
);

export default router;
