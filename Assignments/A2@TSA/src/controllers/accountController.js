const { findAccountByUserId, findAccountByNumber, createAccount, updateBalance } = require("../services/accountService");
const { findUserById, updateKyc } = require("../services/userService");
const { insertBvn, insertNin, validateBvn, validateNin, createNibssAccount, nameEnquiry, getNibssBalance, transferNibss } = require("../services/nibssService");
const { createTransaction } = require("../services/transactionService");
const pool = require("../config/databaseConfig");

// Create KYC Id: BVN/NIN or both
async function insertKyc(req, res, next) {
  try {
    const { firstName, lastName, dob, phone, kycType, kycId } = req.body;
    if (!firstName || !lastName || !dob || !phone && kycType === "bvn" || !kycType || !kycId) {
      return res.status(400).json({error: "first name, last name, date of birth, phone number (if you're creating bvn), and id type (bvn/nin) are required"});
    }
    if (!["bvn", "nin"].includes(kycType.toLowerCase())) {
      return res.status(400).json({error: "kycType must be \"bvn\" or \"nin\""});
    }
    // const kycId = Math.floor(Math.random() * 9000000000) + 1000000000;
    if (kycType === "bvn") {
      const result = await insertBvn(kycId, firstName, lastName, dob, phone);
      if (result.success) {
        return res.status(201).json({message: "ID insertion was successful :)", result});
      }
      if (!result.success) {
        return res.status(409).json({message: "ID insertion was unsuccessful :(", result});
      }
    }
    else {
      const result = await insertNin(kycId, firstName, lastName, dob);
      if (result.message.includes("Successfully")) {
      return res.status(201).json({message: "ID insertion was successful :)", result});
      }
      else {
        return res.status(409).json({message: "ID insertion was unsuccessful :(", result});
      }
    }
  }
  catch (err) {
    next(err);
  }
}

// Verify KYC
async function verifyKyc(req, res, next) {
  try {
    const { kycType, kycId, dob } = req.body;
    if (!kycType || !kycId || !dob) {
      return res.status(400).json({error: "kycType: bvn/nin, kycId: bvn/nin no, dob are all required"});
    }
    if (!["bvn", "nin"].includes(kycType.toLowerCase())) {
      return res.status(400).json({error: "kycType must be \"bvn\" or \"nin\""});
    }

    const user = req.user;
    if (user.kyc_verified) {
      return res.status(400).json({error: "User is already verified (BVN/NIN already inserted)"});
    }

    let validKyc = false;
    if (kycType === "bvn") {
      const result = await validateBvn(kycId);
      validKyc = result.success && result.data.bvn === kycId && result.data.dob;
    }
    else {
      const result = await validateNin(kycId);
      validKyc = result.success && result.data.nin === kycId && result.data.dob;
    }
    if (!validKyc) {
      return res.status(400).json({error: "Invalid KYC details: BVN/NIN not found"});
    }

    const updatedUser = await updateKyc(user.id, kycType, kycId, dob);
    res.json({message: "KYC verification successful :)", user: updatedUser});
  }
  catch (err) {
    next(err);
  }
}

// Create account for verified users
async function createBankAccount(req, res, next) {
  try {
    const user = req.user;
    if (!user.kyc_verified) {
      return res.status(403).json({error: "KYC not verified. Verify KYC before attempting to create an account"});
    }

    // Check for existing account associated with user
    const existing = await findAccountByUserId(user.id);
    if (existing) {
      return res.status(409).json({error: "User already has an account. Only one can be created per user"});
    }

    // Whether to use BVN or NIN for account creation (prefer BVN if both availaible)
    const { kycType, kycId, dob } = req.body;
    // console.log(kycType, kycId, dob, "<a>");

    // Call NIBSS API to create account
    const account = await createNibssAccount(kycType, kycId, dob);
    console.log(account);
    const { accountNumber, bankCode, balance } = account.account;

    // Create entry for new account in narjis_bank database
    const newAccount = await createAccount(
      user.id,
      accountNumber,
      bankCode,
      "NAR Bank",
      balance
    );

    res.status(201).json({
      message: "Account successfully created :)",
      account: newAccount
    });
  }
  catch (err) {
    next(err);
  }
}

// Get account balance
async function getBalance(req, res, next) {
  try {
    const accountNumber = req.params.accountnumber;
    const account = await findAccountByNumber(accountNumber);

    if (!account) {
      return res.status(404).json({error: "Account not found :("});
    }
    const nibssAccount = await getNibssBalance(account.account_number);
    // console.log(nibssAccount);

    if (parseInt(account.balance) !== nibssAccount.balance) {
      const query = "UPDATE accounts SET balance = $1, updated_at = NOW() WHERE id = $2";
      await pool.query(query, [nibssAccount.balance, account.id]);
    }

    return res.status(200).json({
      message: "Balance enquiry request successful :)",
      accountNumber: account.account_number,
      balance: nibssAccount.balance
    });
  }
  catch (err) {
    console.error(err);
    next(err);
  }
}

// Name Enquiry
async function nameEnquiryController(req, res, next) {
  try {
    const accountNumber = req.params.accountnumber;
    if (!accountNumber) {
      return res.status(400).json({error: "Input an account number to search for"});
    }

    // Check if account number exists in narjis_bank database
    const internalAccount = await findAccountByNumber(accountNumber);
    if (internalAccount) {
      // Return details if true
      const user = await findUserById(internalAccount.user_id);
      return res.json({
        accountNumber: internalAccount.account_number,
        accountName: user.full_name,
        bankName: internalAccount.bankName
      });
    }

    // Else if number is from another bank
    const externalAccount = nameEnquiry(accountNumber);
    res.json(externalAccount);
  }
  catch (err) {
    next(err);
  }
}

// Transfer funds between both internal and external accounts
async function transfer(req, res, next) {
  const client = pool.connect();
  try {
    const { toAccountNumber, fromAccountNumber, amount, description } = req.body;
    if (!toAccountNumber || !fromAccountNumber || !amount || amount <= 0) {
      return res.status(400).json({error: "Valid receiving account and amount required"});
    }

    const fromAccount = await findAccountByNumber(fromAccountNumber);
    if (!fromAccount) {
      return res.status(404).json({error: "Your account was not found"});
    }

    if (fromAccount.balance < amount) {
      return res.status(400).json("Insufficient funds");
    }
    // Check if receiving account is internal (i.e. in narjis_bank db)
    destAccount = await findAccountByNumber(toAccountNumber);
    const isInternal = !!destAccount;

    // Initiate transaction
    (await client).query("BEGIN");

    let newTransaction;
    let updateBalance;

    if (isInternal) {
      // Update both balances in database
      // Lock both accounts (prevent each them from being modified by more than one transaction at a time)
      const lockQuery = "SELECT id, balance FROM accounts WHERE id IN ($1, $2) FOR UPDATE";
      const locked = await (await client).query(lockQuery, [fromAccount.id, destAccount.id]);
      console.log(locked.rows);
      if (locked.rows.length !== 2) {
        throw new Error("Destination account not found");
      }

      // Update balances
      await (await client).query(
        "UPDATE accounts SET balance = balance - $1, updated_at = NOW() WHERE id = $2",
        [amount, fromAccount.id]
      );
      await (await client).query(
        "UPDATE accounts SET balance = balance + $1, updated_at = NOW() where id = $2",
        [amount, destAccount.id]
      );

      // Record the transaction (for sender)
      const transactionResult = await (await client).query(
        `INSERT INTO transactions (account_id, from_account, to_account, amount, type, status, description, transfer_type)
        VALUES ($1, $2, $3, $4, $5, 'completed', $6, 'internal')
        RETURNING id, uuid, created_at`,
        [
          fromAccount.id,
          fromAccount.account_number,
          destAccount.account_number,
          amount,
          "transfer",
          description || "Internal transfer"
        ]
      );
      newTransaction = transactionResult.rows[0];
      updatedBalance = fromAccount.balance - amount;
    }
    else {
      // Call NIBSS API to make external transfer and destructure response to get txId and txStatus
      const { transactionId, status } = await transferNibss(
        fromAccount.account_number,
        toAccountNumber,
        amount
      );

      // Update balance
      await (await client).query(
        `UPDATE accounts SET balance = balance - $1, updated_at = NOW() WHERE id = $2`
        [amount, fromAccount.id]
      );

      // Record transaction
      const transactionResult = await (await client).query(
        `INSERT INTO transactions (account_id, from_account, to_account, amount, type, status, description, external_ref, transfer_type)
        VALUES ($1, $2. $3, $4, $5, $6, $7, $8, "external")
        RETURNING id, uuid, created_at`,
        [
          fromAccount.id,
          fromAccount.account_number,
          toAccountNumber,
          amount,
          "transfer",
          status === "SUCCESS" ? "success" : "pending",
          description || "External transfer",
          transactioinId
        ]
      );
      newTransaction = transactionResult.rows[0];
      updatedBalance = fromAccount.balance - amount;
    }

    await (await client).query("COMMIT");
    res.json({
      message: "Transfer successful :)",
      transaction: newTransaction,
      newBalance: updateBalance
    });
  }
  catch (err) {
    await (await client).query("ROLLBACK");
    next(err);
  }
  finally {
    await (await client).end();
  }
}

module.exports = {
  insertKyc,
  verifyKyc,
  createBankAccount,
  getBalance,
  nameEnquiryController,
  transfer
};
