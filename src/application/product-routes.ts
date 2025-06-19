import { Router } from 'express';
import { ProductController } from './product-controller';
import { productService } from '../infrastructure';
import { authenticateJWT } from '../shared/jwt-middleware';

const router = Router();
const productController = new ProductController(productService);

router.post('/', authenticateJWT, productController.createProduct.bind(productController));
router.get('/available', authenticateJWT, productController.listAvailableProducts.bind(productController));
router.get('/:id', authenticateJWT, productController.getProductById.bind(productController));
router.put('/:id', authenticateJWT, productController.updateProduct.bind(productController));
router.delete('/:id', authenticateJWT, productController.deleteProduct.bind(productController));

export default router;

