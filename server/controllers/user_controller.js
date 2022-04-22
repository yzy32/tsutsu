const { createUser, getUserInfo } = require("../models/user_model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const signUp = async (req, res) => {
  //TODO: data validation
  const { userName, userId, email, password } = req.body;
  const type = "native";
  const result = await createUser(userName, userId, type, email, password);
  if (result.error) {
    // create user failed
    if (result.error.code === 11000) {
      res.status(403).send({ error: "TsuTsu ID is already in use" });
      return;
    } else {
      res.status(400).send({ error: "Failed to create TsuTsu account." });
      return;
    }
  }
  delete result.user.password;
  delete result.error;
  console.log("user sign up: ", result);
  res.status(200).send(result);
  return;
};

const signIn = async (req, res) => {
  const { type, email, password } = req.body;
  console.log(type, email, password);
  //TODO: validate, wrong format: return 400

  //get password from mongo based on type and email (model)
  const result = await getUserInfo(type, email);
  //compare password and hased password
  const decoded = await bcrypt.compare(password, result.password);
  let user;
  if (decoded) {
    user = {
      userName: result.userName,
      userId: result.userId,
      type: result.type,
      email: result.email,
    };
  } else {
    //return 403, if password doesn't match
    res.status(403).send({ error: "Wrong user info" });
    return;
  }
  //return token and redirect to user/:id/recipes
  const accessToken = jwt.sign(
    {
      type: result.type,
      userName: result.userName,
      email: result.email,
      userImage: result.userImage,
    },
    process.env.TOKEN_SECRET
  );
  const accessExpired = process.env.TOKEN_EXPIRE;
  console.log("user sign in: ", result);
  res.status(200).send({
    user: user,
    accessToken: accessToken,
    accessExpired: accessExpired,
  });
  return;
};

module.exports = { signUp, signIn };
