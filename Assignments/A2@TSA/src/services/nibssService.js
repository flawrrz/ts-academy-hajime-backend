// Service to integrate with the NIBSS by Phoenix API

const axios = require("axios");
const env = require("../config/envConfig");

let cachedToken = null;
let tokenExpiry = 0;

// Obtain fresh JWT token from NIBBS by Phoenix
async function getAccessToken() {
  if (cachedToken && (Date.now() < tokenExpiry)) {
    return cachedToken;
  }

  try {
    const response = await axios.post(`${env.nibssUrl}/auth/token`, {
      apiKey: env.nibssApiKey,
      apiSecret: env.nibssApiSecret
    });
    cachedToken = response.data.token;
    tokenExpiry = Date.now() + 60 * 60 * 1000;
    return cachedToken;
  }
  catch (error) {
    console.error("Failed to obtain NIBSS token:", error.response?.data || error.message);
    throw new Error("NIBSS authentication failed :(");
  }
}

// Fucntion to call NIBSS by Phoenix API
async function callNibssApi(method, endpoint, data = null) {
  const token = await getAccessToken();
  const url = `${env.nibssUrl}${endpoint}`;
  try {
    const request = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    };

    // Only attach a body for methods that support one
    if (data !== undefined && data !== null && method.toUpperCase() !== "GET") {
      request.data = data;
    }

    // console.log(request);
    const response = await axios(request);
    return response.data;
  }
  
  catch (error) {
    if (error.response) {
      console.error("NIBSS error:", error.response.status, error.response.data);
      console.error('Full NIBSS error:', error);
      throw new Error(
      `NIBSS API error (${error.response.status}): ${
        error.response.data?.message || error.response.statusText
      }`
      );
    }
    throw new Error("Could not reach NIBSS API :(");
  }
}

// Create NIBSS account
async function createNibssAccount(kycType, kycId, dob) {
  // console.log(kycType, kycId, dob, "<b>");
  return callNibssApi("POST", "/account/create", { 
    kycType, 
    kycID: kycId, 
    dob 
  });
}

// Validate NIN
async function validateNin(nin) {
  return callNibssApi("POST", "/validateNin", { nin });
}

// Validate BVN
async function validateBvn(bvn) {
  return callNibssApi("POST", "/validateBvn", { bvn });
}

// Insert BVN into NIBSS db
async function insertBvn(bvn, firstName, lastName, dob, phone) {
  return callNibssApi("POST", "/insertBvn", { bvn, firstName, lastName, dob, phone });
}

// Insert NIN into NIBSS db
async function insertNin(nin, firstName, lastName, dob) {
  return callNibssApi("POST", "/insertNin", { nin, firstName, lastName, dob });
}

// Account name enquiry
async function nameEnquiry(accountNumber) {
  return callNibssApi("GET", `/account/name-enquiry/${accountNumber}`);
}

// Get Account Balance from NIBSS
async function getNibssBalance(accountNumber) {
  // console.log(accountNumber);
  return callNibssApi("GET", `/account/balance/${accountNumber}`);
}

// NIBSS funds transfer
async function transferNibss(fromAccount, toAccount, amount) {
  return callNibssApi("POST", "/transfer", {
    from: fromAccount,
    to: toAccount,
    amount: amount.toString()
  });
}

// Transaction Status Query
async function getTransactionStatus(transactionId) {
  return callNibssApi("GET", `/transaction/${transactionId}`);
}

module.exports = {
  validateNin,
  validateBvn,
  insertBvn,
  insertNin,
  createNibssAccount,
  transferNibss,
  nameEnquiry,
  getNibssBalance,
  getTransactionStatus
};