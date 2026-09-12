const express = require("express");
const { authenticate } = require("../middlewares/auth");
const { getTransactionHistory, getTransactionStatusController } = require("../controllers/transactionController");
const router = express.Router();

router.get("/history", authenticate, getTransactionHistory);
router.get("/status/:id", authenticate, getTransactionStatusController);

module.exports = router;