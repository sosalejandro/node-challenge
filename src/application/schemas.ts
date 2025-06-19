import Joi from 'joi';
import { join } from 'path';

export const userSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
});

export const emailOnlySchema = Joi.object({
    email: Joi.string().email().required()
})

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
})

export const productSchema = Joi.object({
    name: Joi.string().min(1).required(),
    description: Joi.string().min(1).required(),
    price: Joi.number().positive().precision(2).required(),
    stockAmount: Joi.number().integer().min(0).required()
})

export const idOnlySchema = Joi.object({
    id: Joi.string().min(1).required()
})

export const createOrderProductsSchema = Joi.array().items(
    Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required()
    })
).min(1).required();

export const updateOrderItemsSchema = Joi.array().items(
    Joi.object({
        productId: Joi.string().required(),
        newQuantity: Joi.number().integer().min(0).required()
    })
).min(1).required();