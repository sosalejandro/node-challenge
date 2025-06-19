import { Request, Response } from "express";
import { IProductService } from "../domain";
import { logger } from "../shared/logger";
import { productSchema, idOnlySchema } from "./";

export class ProductController {
    constructor(private productService: IProductService) { }

    async createProduct(req: Request, res: Response) {
        // Validate request body
        const { error, value } = productSchema.validate(req.body);
        if (error) {
            logger.error("Validation error creating product", { error: error.details });
            return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
        }

        const { name, description, price, stockAmount } = value;
        logger.info("Creating product", { name, description, price, stockAmount });

        try {
            const product = await this.productService.createProduct(name, description, price, stockAmount);
            logger.info("Product created", { id: product.id });
            return res.status(201).json({ data: product, message: "Product created" });
        } catch (error) {
            logger.error("Error creating product", { error });
            return res.status(400).json({ error: (error as Error).message });
        }
    }

    async getProductById(req: Request, res: Response) {
        const { id } = req.params;
        const { error } = idOnlySchema.validate({ id });
        if (error) {
            logger.error("Invalid product id", { id, error: error.details });
            return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
        }
        logger.info("Getting product by id", { id });
        try {
            const product = await this.productService.getProductById(id);
            if (!product) {
                logger.info("Product not found", { id });
                return res.status(404).json({ error: "Product not found" });
            }
            logger.info("Product found", { id });
            return res.status(200).json({ data: product, message: "Product found" });
        } catch (error) {
            logger.error("Error getting product by id", { id, error });
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateProduct(req: Request, res: Response) {
        const { id } = req.params;
        const { error, value } = productSchema.validate(req.body);
        if (error) {
            logger.error("Validation error creating product", { error: error.details });
            return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
        }

        logger.info("Updating product", { id, value });
        try {
            const product = await this.productService.updateProduct(id, value);
            logger.info("Product updated", { id });
            return res.status(200).json({ data: product, message: "Product updated" });
        } catch (error) {
            logger.error("Error updating product", { id, error });
            return res.status(400).json({ error: (error as Error).message });
        }
    }

    async deleteProduct(req: Request, res: Response) {
        const { id } = req.params;
        logger.info("Deleting product", { id });
        try {
            const product = await this.productService.deleteProduct(id);
            logger.info("Product deleted", { id });
            return res.status(200).json({ data: product });
        } catch (error) {
            if ((error as Error).message === "Product not found.") {
                logger.info("Product not found", { id });
                return res.status(404).json({ error: "Product not found." });
            }
            logger.error("Error deleting product", { id, error });
            return res.status(400).json({ error: (error as Error).message });
        }
    }

    async listAvailableProducts(req: Request, res: Response) {
        logger.info("Listing available products");
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const skip = (page - 1) * pageSize;
        try {
            // Get paginated products
            const products = await this.productService.listAvailableProducts(skip, pageSize);
            // Get total count for pagination
            const total = await this.productService.countAvailableProducts();
            logger.info("Available products listed", { count: products.length, page, pageSize, total });
            return res.status(200).json({
                data: products,
                page,
                pageSize,
                count: products.length,
                total,
                message: "Products found"
            });
        } catch (error) {
            logger.error("Error listing available products", { error });
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}