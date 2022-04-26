const jwt = require("jsonwebtoken");
const util = require("util");

async function searchAuth(req, res, next) {
  let accessToken = req.get("Authorization");
  if (!accessToken) {
    req.loginStatus = false;
    req.query.myrecipe = false;
    //FIXME: how to handle client side url (if myrecipe=true)
    return next();
  }
  accessToken = accessToken.replace("Bearer ", "");
  if (accessToken == "null") {
    req.loginStatus = false;
    req.query.myrecipe = false;
    //FIXME: how to handle client side url (if myrecipe=true)
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

    console.log("auth error: ", error);
    res.status(403).send({ error: "Forbidden", redirectUrl: "/user/signin" });
    return;
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
  auth,
};
