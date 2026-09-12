require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  nibssUrl: process.env.NIBSS_URL,
  nibssApiKey: process.env.NIBSS_API_KEY,
  nibssApiSecret: process.env.NIBSS_API_SECRET,
};