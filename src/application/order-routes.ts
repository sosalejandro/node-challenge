import { Router } from 'express';
import { OrderController } from './order-controller';
import { orderService } from '../infrastructure';
import { authenticateJWT } from '../shared/jwt-middleware';

const router = Router();
const orderController = new OrderController(orderService);

// router.post('/', orderController.createOrder.bind(orderController));
router.get('/:id', authenticateJWT, orderController.getOrderById.bind(orderController));
// router.get('/user/:userId', orderController.listOrdersByUser.bind(orderController));

export default router;
