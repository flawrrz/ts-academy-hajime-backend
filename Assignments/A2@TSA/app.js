const express = require("express");
const env = require("./src/config/envConfig");
const authRoutes = require("./src/routes/authRoutes");
const accountRoutes = require("./src/routes/accountRoutes");
const transactionRoutes = require("./src/routes/transactionRoutes");
const errorHandler = require("./src/middlewares/errorHandler");

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/transaction", transactionRoutes);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});