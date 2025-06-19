import { Router } from 'express';
import { OrderController } from './order-controller';
import { orderService } from '../infrastructure';

const router = Router();
const orderController = new OrderController(orderService);

// router.post('/', orderController.createOrder.bind(orderController));
router.get('/:id', orderController.getOrderById.bind(orderController));
// router.get('/user/:userId', orderController.listOrdersByUser.bind(orderController));

export default router;
