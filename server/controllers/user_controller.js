const {
  createUser,
  getUserInfo,
  addFavorite,
  removeFavorite,
  addFollowing,
  removeFollowing,
  getUserProfile,
  getFollower,
  getFollowing,
  updateUserProfile,
  searchFollower,
  searchFollowing,
} = require("../models/user_model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("../../utils/validator");
const followPageSize = 20;

const signUp = async (req, res) => {
  const { userName, userId, email, password } = req.body;
  //data validation
  await validator.signup.validateAsync({
    userName,
    userId,
    email,
    password,
  });
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
  console.log("User signin", type, email, password);

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
      userId: result.userId,
      email: result.email,
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

const favorite = async (req, res) => {
  const result = await addFavorite(req.user.userId, req.body.recipeId);
  res.status(200).json({ msg: "success" });
  return;
};

const unfavorite = async (req, res) => {
  const result = await removeFavorite(req.user.userId, req.body.recipeId);
  res.status(200).json({ msg: "success" });
  return;
};

const following = async (req, res) => {
  const result = await addFollowing(req.user.userId, req.body.followingId);
  res.status(200).json({ msg: "success" });
  return;
};

const unfollowing = async (req, res) => {
  const result = await removeFollowing(req.user.userId, req.body.unfollowingId);
  res.status(200).json({ msg: "success" });
  return;
};

const getProfile = async (req, res) => {
  let userId = req.user ? req.user.userId : null;
  const result = await getUserProfile(req.params.id, userId);
  delete result._id;
  if ((result.userImage = "default")) {
    result.userImage =
      "https://tsutsu-s3.s3.ap-northeast-1.amazonaws.com/assets/default/user.png";
  }
  res.status(200).json({ user: result });
  return;
};

const getUserFollower = async (req, res) => {
  if (!req.params.id) {
    console.log("get follower need to has authorId");
    return res.status(500).json({ error: "Internal Server Error" });
  }
  let page = req.query.page ? req.query.page : 1;
  let userId = req.user ? req.user.userId : null;
  const result = await getFollower(userId, req.params.id, page, followPageSize);
  res.status(200).json({ follow: result });
  return;
};

const getUserFollowing = async (req, res) => {
  if (!req.params.id) {
    console.log("get following need to has authorId");
    return res.status(500).json({ error: "Internal Server Error" });
  }
  let page = req.query.page ? req.query.page : 1;
  let userId = req.user ? req.user.userId : null;
  const result = await getFollowing(
    userId,
    req.params.id,
    page,
    followPageSize
  );
  res.status(200).json({ follow: result });
  return;
};

const updateProfile = async (req, res) => {
  let update = {};
  let userId = req.user.userId;
  if (req.file) {
    update.userImage = req.file.location;
  }
  if (req.body.introduction) {
    update.introduction = req.body.introduction;
  }
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "User must have input" });
  }
  // console.log(update);
  const result = await updateUserProfile(userId, update);
  let user = {
    userId: userId,
    userImage: result.userImage,
    introduction: result.introduction,
  };
  // console.log(user);
  res.status(200).json({ update: user });
  return;
};

const searchUserFollower = async (req, res) => {
  if (!req.params.id) {
    console.log("search follower need to has authorId");
    return res.status(500).json({ error: "Internal Server Error" });
  }
  let authorId = req.params.id;
  let userId = req.user ? req.user.userId : null;
  let searchId = req.query.q;
  const result = await searchFollower(authorId, userId, searchId);
  res.status(200).json({ follow: result });
  return;
};

const searchUserFollowing = async (req, res) => {
  //TODO:
  if (!req.params.id) {
    console.log("search follower need to has authorId");
    return res.status(500).json({ error: "Internal Server Error" });
  }
  let authorId = req.params.id;
  let userId = req.user ? req.user.userId : null;
  let searchId = req.query.q;
  const result = await searchFollowing(authorId, userId, searchId);
  res.status(200).json({ follow: result });
  return;
};

module.exports = {
  signUp,
  signIn,
  favorite,
  unfavorite,
  following,
  unfollowing,
  getProfile,
  getUserFollower,
  getUserFollowing,
  updateProfile,
  searchUserFollower,
  searchUserFollowing,
};
