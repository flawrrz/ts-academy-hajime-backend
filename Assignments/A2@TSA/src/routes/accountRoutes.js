const express = require("express");
const { authenticate } = require("../middlewares/auth");
const {
  insertKyc,
  verifyKyc,
  createBankAccount,
  getBalance,
  nameEnquiryController,
  transfer
} = require("../controllers/accountController");
const router = express.Router();

router.post("/kyc/insert", authenticate, insertKyc);
router.post("/kyc/verify", authenticate, verifyKyc);
router.post("/create", authenticate, createBankAccount);
router.get("/balance/:accountnumber", authenticate, getBalance);
router.get("/nameenquiry/:accountnumber", authenticate, nameEnquiryController);
router.post("/moneytransfer", authenticate, transfer);

module.exports = router;