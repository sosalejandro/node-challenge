import express from 'express';
import userRoutes from './application/user-routes';
import productRoutes from './application/product-routes';
import orderRoutes from './application/order-routes'
import transactionsRoutes from './application/transaction-routes'

const app = express();

app.use(express.json());

// Register user routes
app.use('/users', userRoutes);
app.use('/products', productRoutes)
app.use('/orders', orderRoutes)
app.use('/transactions', transactionsRoutes)

// Example route
app.get('/', (_req, res) => {
  res.send('Hello, Express + TypeScript!');
});

export default app;
