const { getTransactionByAccountId, getTransactionByIdAndAccount } = require("../services/transactionService");
const { findAccountByUserId } = require("../services/accountService");
const { getTransactionStatus } = require("../services/nibssService");

async function getTransactionHistory(req, res, next) {
  try {
    // console.log(parseInt(req.user.id));
    const account = await findAccountByUserId(parseInt(req.user.id));
    // console.log(account);
    if (!account) {
      return res.status(404).json({error: "No account found"});
    }
    const transactions = await getTransactionByAccountId(account.id);
    res.json(transactions);
  }
  catch (err) {
    next(err);
  }
}

async function getTransactionStatusController(req, res, next) {
  try {
    const { id } = req.params;
    const account = await findAccountByUserId(req.user.id);
    if (!account) {
      return res.status(404).json({error: "No account found"});
    }

    const transaction = await getTransactionByIdAndAccount(id, account.id);
    if(!transaction) {
      return res.status(404).json({error: "Transaction not found"});
    }

    // If transfer is external and status is pending, query NIBSS for txStatus
    if (transaction.transfer_type === "external" && transaction.status === "pending" && transaction.external_ref) {
      try {
        const statusRes = await getTransactionStatus(transaction.external_ref);

        // Update status if there's a change
        if (statusRes.status !== transaction.status) {
          await pool.query(
            "UPDATE transactions SET status = $1, updated_at = NOW() WHERE id = $2",
            [statusRes.status.toLowerCase(), transaction.id]
          );
          transaction.status = statusRes.status.toLowerCase();
        }
      }
      catch (err) {
        // ignore error and return cached status
      }
    }

    res.json({
      transactionId: transaction.id,
      uuid: transaction.uuid,
      amount: transaction.amount,
      from: transaction.from_account,
      to: transaction.to_account,
      status:transaction.status,
      description: transaction.description,
      createdAt: transaction.created_at
    });
  }
  catch (err) {
    next(err);
  }
}

module.exports = { getTransactionHistory, getTransactionStatusController };