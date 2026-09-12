const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const env = require("../config/envConfig");
const { validateBvn, validateNin, insertBvn, insertNin } = require("../services/nibssService");
const { createUser, findUserByEmail } = require("../services/userService");

async function register(req, res, next) {
  try {
    const { email, password, fullName, dob, nin, bvn, phone, id } = req.body;
    if (!email || !password || !fullName || !dob || !(bvn && nin) && (id === true)) {
      return res.status(400).json({error: "Missing required fields: email, password, full name, date of birth, and bvn and/or nin"});
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({error: "Email already registered"});
    }

    let bvnGenerated = 0, ninGenerated = 0;
    if (id === false) {
      bvnGenerated = (Math.floor(Math.random() * 90000000000) + 10000000000).toString();
      ninGenerated = (Math.floor(Math.random() * 90000000000) + 10000000000).toString();

      const bvnResult = await insertBvn(bvnGenerated, fullName.split(" ")[0], fullName.split(" ")[1], dob, phone);
      const ninResult = await insertNin(ninGenerated, fullName.split(" ")[0], fullName.split(" ")[1], dob);

      if (ninResult.message.includes("Successfully")) {
        // console.log(ninResult.response.nin);
        ninGenerated = ninResult.response.nin;
      }
      else return res.status(409).json({error: "Failed to create nin :(", ninResult});

      if (bvnResult.success) {
        // console.log(bvnResult.data.bvn);
        bvnGenerated = bvnResult.data.bvn;
      }
      else return res.status(409).json({error: "Failed to create bvn :(", bvnResult});
    }    

    const user = await createUser(email, password, fullName, dob, nin ? nin : ninGenerated, bvn ? bvn : bvnGenerated);
    res.status(201).json({message: "User created", user});
  }
  catch (err) {
    next(err);  
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({error: "Missing credentials: input your email and password"});
    }
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({error: "Invalid credentials: incorrect email or password"});
    }
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({error: "Invalid credentials: incorrect email or password"});
    }
    const token = jwt.sign(
      {id: user.id, email: user.email},
      env.jwtSecret,
      {expiresIn: "7d"}
    );
    res.json({token, user: {id: user.id, email: user.email, fullName: user.full_name}});
  }
  catch (err) {
    next(err);
  }
}

module.exports = { register, login };