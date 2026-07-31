const express = require("express");
const app = express();
const PORT = 8080;

// Middleware to parse JSON request bodies
app.use(express.json());

// In-memory database
const products = [];

// Create product
app.post("/products", (req, res) => {
    const { productName, productPrice, inStock } = req.body;

    const newProduct = {
        productId: Date.now(),
        productName,
        productPrice,
        inStock
    }

    products.push(newProduct);

    res.status(201).json(newProduct);
});

// Get all products
app.get("/products", (req, res) => {
    res.status(200).json(products);
});

// Get product by id
app.get("/products/:id", (req, res) => {
    const productId = Number(req.params.id);
    
    const index = products.findIndex(products => products.productId === productId);
    
    res.status(200).json(products[index]);
});

// Update product by id
app.put("/products/:id", (req, res) => {
    const productId = Number(req.params.id);

    const { productName, productPrice, inStock } = req.body;

    const index = products.findIndex(products => products.productId === productId);

    products[index] = {
        productId: productId,
        productName: productName,
        productPrice: productPrice,
        inStock: inStock
    }

    res.status(201).json({"message": `Product updated successfully :)`});
});

// Delete product
app.delete("/products/:id", (req, res) => {
    const productId = Number(req.params.id);
    
    const index = products.findIndex(products => products.productId === productId);
    
    products.splice(index, 1);

    res.status(201).json({"message": `Product deleted successfully :)`});
});

// Server connection
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});