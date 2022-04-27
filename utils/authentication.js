const jwt = require("jsonwebtoken");
const util = require("util");

async function searchAuth(req, res, next) {
  let accessToken = req.get("Authorization");
  if (!accessToken) {
    req.loginStatus = false;
    req.query.myrecipe = false;
    return next();
  }
  accessToken = accessToken.replace("Bearer ", "");
  if (accessToken == "null") {
    req.loginStatus = false;
    req.query.myrecipe = false;
    return next();
  }
  try {
    const user = await util.promisify(jwt.verify)(
      accessToken,
      process.env.TOKEN_SECRET
    );
    req.user = user;
    req.loginStatus = true;
    return next();
  } catch (error) {
    //TODO: token refresh (option)
    //FIXME: what if they just have an expired token? continue to search but let login status = false
    console.log("auth error: ", error);
    res.status(403).send({ error: "Forbidden", redirectUrl: "/user/signin" });
    return;
  }
}

async function recipeAuth(req, res, next) {
  // only mark user with valid token has user properties
  let accessToken = req.get("Authorization");
  if (!accessToken) {
    return next();
  }
  accessToken = accessToken.replace("Bearer ", "");
  if (accessToken == "null") {
    return next();
  }
  try {
    const user = await util.promisify(jwt.verify)(
      accessToken,
      process.env.TOKEN_SECRET
    );
    req.user = user;
    return next();
  } catch (error) {
    return next();
  }
}

async function auth(req, res, next) {
  let accessToken = req.get("Authorization");
  if (!accessToken) {
    res
      .status(401)
      .send({ error: "Unauthorized", redirectUrl: "/user/signin" });
    return;
  }

  accessToken = accessToken.replace("Bearer ", "");
  if (accessToken == null) {
    res
      .status(401)
      .send({ error: "Unauthorized", redirectUrl: "/user/signin" });
    return;
  }

  try {
    const user = await util.promisify(jwt.verify)(
      accessToken,
      process.env.TOKEN_SECRET
    );
    req.user = user;
    next();
    return;
  } catch (error) {
    console.log("auth error: ", error);
    res.status(403).send({ error: "Forbidden", redirectUrl: "/user/signin" });
    return;
  }
}

module.exports = {
  searchAuth,
  recipeAuth,
  auth,
};
