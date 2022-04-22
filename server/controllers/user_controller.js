const { createUser } = require("../models/user_model");

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
  console.log(result);
  res.status(200).send(result);
  return;
};

const signIn = async (req, res) => {
  const { type, email, password } = req.body;
  //TODO: validate, wrong format: return 400
  //TODO: get password from mongo based on type and email (model)
  //TODO: compare password and hased password
  //TODO: return 403, if password doesn't match
  //TODO: return token and redirect to user/:id/recipes
};

module.exports = { signUp, signIn };
