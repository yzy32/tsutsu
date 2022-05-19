const bcrypt = require("bcrypt");
const es = require("../../utils/es");
const { User, Recipe } = require("../../utils/mongo");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { storeESLog } = require("./log_model");

const createUser = async (userName, userId, type, email, password) => {
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT));
    const hashedPwd = await bcrypt.hash(password, salt);
    const user = {
      userName: userName,
      userId: userId,
      type: type,
      email: email,
      password: hashedPwd,
    };
    const accessToken = jwt.sign(
      {
        type: user.type,
        userName: user.userName,
        userId: user.userId,
        email: user.email,
      },
      process.env.TOKEN_SECRET
    );
    const accessExpired = process.env.TOKEN_EXPIRE;
    const userInserted = await User.create(user);
    await userInserted.save();
    let result = { user, accessToken, accessExpired, error: null };
    return result;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const getUserInfo = async (type, email) => {
  try {
    const result = await User.findOne({ type: type, email: email });
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const isFollow = async (userId, authorId) => {
  try {
    // if userId = null, the result will be empty array
    const result = await User.find({
      userId: userId,
      following: { $in: [authorId] },
    });
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const isFavorite = async (userId, recipeId) => {
  try {
    const result = await User.find({
      userId: userId,
      userFavorites: { $in: [recipeId] },
    });
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const addFavorite = async (userId, recipeId) => {
  try {
    const userMongo = await User.updateOne(
      { userId: userId },
      { $addToSet: { userFavorites: mongoose.Types.ObjectId(recipeId) } }
    );
    const recipeMongo = await Recipe.updateOne(
      { _id: mongoose.Types.ObjectId(recipeId) },
      { $inc: { favoriteCount: 1 } }
    );
    let count = 0;
    es.update({
      index: "recipes",
      id: recipeId,
      script: {
        source: "ctx._source.favoriteCount++",
      },
    })
      .then()
      .catch((error) => {
        count++;
        console.log(`es error ${count}: `, error);
        esUpateFavorite(count, recipeId, "addFavorite");
      });
    return true;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const removeFavorite = async (userId, recipeId) => {
  try {
    const result = await User.updateOne(
      { userId: userId },
      { $pull: { userFavorites: mongoose.Types.ObjectId(recipeId) } }
    );
    const recipeMongo = await Recipe.updateOne(
      { _id: mongoose.Types.ObjectId(recipeId) },
      { $inc: { favoriteCount: -1 } }
    );
    let count = 0;
    es.update({
      index: "recipes",
      id: recipeId,
      script: {
        source: "ctx._source.favoriteCount--",
      },
    })
      .then()
      .catch((error) => {
        count++;
        console.log(`es error ${count}: `, error);
        esUpateFavorite(count, recipeId, "removeFavorite");
      });
    return true;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const esUpateFavorite = async (count, recipeId, type) => {
  let errorMsg = null;
  let errorStatus = null;
  console.log(count, recipeId, type);
  let script = "ctx._source.favoriteCount++";
  if (type == "removeFavorite") {
    script = "ctx._source.favoriteCount--";
  }
  try {
    if (count < 4) {
      es.update({
        index: "recipes",
        id: recipeId,
        script: {
          source: script,
        },
      })
        .then()
        .catch((error) => {
          count++;
          console.log(`es error ${count}: `, error);
          errorMsg = error;
          errorStatus = error.statusCode;
          esUpateFavorite(count, recipeId, type);
        });
    }
    if (count == 4) {
      //after retry 3 times, record error log into mongodb
      await storeESLog(type, recipeId, errorMsg, errorStatus);
    }
    return;
  } catch (error) {
    console.log(error);
  }
};

const addFollowing = async (followerId, followingId) => {
  try {
    // console.log(followerId, followingId);
    const updateFollowing = await User.updateOne(
      { userId: followerId },
      { $addToSet: { following: followingId } }
    ).lean();
    const updateFollower = await User.updateOne(
      { userId: followingId },
      { $addToSet: { follower: followerId } }
    ).lean();
    console.log("update following: ", updateFollowing);
    console.log("update follower: ", updateFollower);
    //FIXME: what if one of db operation failed?
    if (!updateFollower.acknowledged || !updateFollowing.acknowledged) {
      console.log("follow failure, but backend hasn't handle");
    }
    return true;
  } catch (error) {
    throw error;
  }
};

const removeFollowing = async (followerId, followingId) => {
  try {
    // console.log(followerId, followingId);
    const removeFollowing = await User.updateOne(
      { userId: followerId },
      { $pull: { following: followingId } }
    );
    const removeFollower = await User.updateOne(
      { userId: followingId },
      { $pull: { follower: followerId } }
    );
    console.log("remove following: ", removeFollowing);
    console.log("remove follower: ", removeFollower);
    //FIXME: what if one of db operation failed?
    return true;
  } catch (error) {
    throw error;
  }
};

const getUserProfile = async (authorId, userId) => {
  try {
    const result = await User.findOne({ userId: authorId })
      .select({
        userId: 1,
        userName: 1,
        introduction: 1,
        userImage: 1,
        following: 1,
        follower: 1,
        email: 1,
        _id: 0,
      })
      .lean();
    if (!result || result.length == 0) {
      let error = new Error("User not Found");
      error.status = 404;
      throw error;
    }
    if (authorId == userId) {
      result.isFollowing = null;
      return result;
    }
    let isFollowResult = await isFollow(userId, authorId);
    if (isFollowResult.length > 0) {
      result.isFollowing = true;
    } else {
      result.isFollowing = false;
    }
    return result;
  } catch (error) {
    throw error;
  }
};

const getFollowDetails = async (userId, followField, page, followPageSize) => {
  try {
    // setting fetch field for follower/following's user info
    let selectField = {
      _id: 0,
      userId: 1,
      userImage: 1,
      introduction: 1,
    };
    // setting # result for pagination
    let sliceRange = [
      `$${followField}`,
      followPageSize * (page - 1),
      followPageSize,
    ];
    // get author's follower/following's detailed info
    let [authorFollow] = await User.aggregate([
      { $match: { userId: userId } },
      {
        $project: {
          followIdList: {
            $slice: sliceRange,
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followIdList",
          foreignField: "userId",
          pipeline: [
            { $project: selectField },
            { $addFields: { isFollowing: false } }, // set user didn't follow this author's follower/following
          ],
          as: "followDetailList",
        },
      },
      {
        $project: {
          _id: 0,
          followDetailList: 1,
        },
      },
    ]);
    return authorFollow;
  } catch (error) {
    throw error;
  }
};

const getFollowingId = async (userId) => {
  try {
    let { following } = await User.findOne({ userId: userId }).select({
      _id: 0,
      following: 1,
    });
    return following;
  } catch (error) {
    throw error;
  }
};

const updateUserProfile = async (userId, update) => {
  try {
    const userInserted = await User.findOneAndUpdate(
      { userId: userId },
      update,
      {
        new: true,
      }
    );
    if (!userInserted) {
      let error = new Error("No User Exists");
      error.status = 400;
      throw error;
    }
    const result = userInserted.save();
    return result;
  } catch (error) {
    throw error;
  }
};

const isInFollow = async (authorId, searchId, followField) => {
  try {
    let searchOperation = {
      isExist: {
        $in: [searchId, `$${followField}`],
      },
    };
    const [{ isExist }] = await User.aggregate([
      { $match: { userId: authorId } },
      { $project: searchOperation },
    ]);
    return isExist;
  } catch (error) {
    throw error;
  }
};

const getFavoriteRecipeId = async (authorId, page, userPageSize) => {
  try {
    const [result] = await User.aggregate([
      { $match: { userId: authorId } },
      {
        $project: {
          favoriteCount: { $size: "$userFavorites" },
          favoriteId: {
            $slice: [
              { $reverseArray: "$userFavorites" },
              userPageSize * (page - 1),
              userPageSize,
            ],
          },
        },
      },
    ]);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createUser,
  getUserInfo,
  isFollow,
  isFavorite,
  addFavorite,
  removeFavorite,
  addFollowing,
  removeFollowing,
  getUserProfile,
  getFollowDetails,
  getFollowingId,
  updateUserProfile,
  isInFollow,
  getFavoriteRecipeId,
};

const getFollower = async (userId, authorId, page, followPageSize) => {
  try {
    // get author's follower
    const followerResult = await User.aggregate([
      { $match: { userId: authorId } },
      {
        $project: {
          followerId: {
            $slice: ["$follower", followPageSize * (page - 1), followPageSize],
          },
        },
      },
    ]);

    // get signin user's following list
    let userFollowings = null;
    if (userId) {
      userFollowings = await User.findOne({ userId: userId })
        .select({ following: 1, _id: 0 })
        .lean();
      userFollowings.following.push(userId);
    }
    // get author follower's detail and check if user has followed these followers
    let result = [];
    for (let i = 0; i < followerResult[0].followerId.length; i++) {
      let follower = await User.findOne({
        userId: followerResult[0].followerId[i],
      })
        .select({
          userId: 1,
          userName: 1,
          userImage: 1,
          _id: 0,
          introduction: 1,
        })
        .lean();
      follower.isFollowing = false;
      // login user
      if (
        userFollowings &&
        userFollowings.following.includes(follower.userId)
      ) {
        follower.isFollowing = true;
      }
      result.push(follower);
    }
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getFollowing = async (userId, authorId, page, followPageSize) => {
  try {
    // get author's following list
    const followingResult = await User.aggregate([
      { $match: { userId: authorId } },
      {
        $project: {
          followingId: {
            $slice: ["$following", followPageSize * (page - 1), followPageSize],
          },
        },
      },
    ]);
    // get signin user's following list
    let userFollowings = null;
    if (userId) {
      userFollowings = await User.findOne({ userId: userId })
        .select({ following: 1, _id: 0 })
        .lean();
      userFollowings.following.push(userId);
    }
    // check if author's following is also user's follow
    // for non-login user: isFollowing = false
    // for author = user: isFollowing = true
    // get author's following detail
    let result = [];
    for (let i = 0; i < followingResult[0].followingId.length; i++) {
      let following = await User.findOne({
        userId: followingResult[0].followingId[i],
      })
        .select({
          userId: 1,
          userName: 1,
          userImage: 1,
          _id: 0,
          introduction: 1,
        })
        .lean();
      following.isFollowing = false;
      // login user
      if (userId == authorId) {
        following.isFollowing = true;
      } else if (
        userFollowings &&
        userFollowings.following.includes(following.userId)
      ) {
        following.isFollowing = true;
      }
      result.push(following);
    }
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const searchFollower = async (authorId, userId, searchId) => {
  try {
    // get author's follower
    const followerResult = await User.aggregate([
      { $match: { userId: authorId } },
      {
        $project: {
          search: {
            $in: [searchId, "$follower"],
          },
        },
      },
    ]);
    // get signin user's following list
    let userFollowings = null;
    if (userId) {
      userFollowings = await User.findOne({ userId: userId })
        .select({ following: 1, _id: 0 })
        .lean();
      userFollowings.following.push(userId);
    }
    let result = [];
    if (followerResult[0].search == true) {
      let follower = await User.findOne({
        userId: searchId,
      })
        .select({ userId: 1, userName: 1, userImage: 1, _id: 0 })
        .lean();
      follower.isFollowing = false;
      // login user
      if (
        userFollowings &&
        userFollowings.following.includes(follower.userId)
      ) {
        follower.isFollowing = true;
      }
      result.push(follower);
    }
    return result;
  } catch (error) {
    throw error;
  }
};

const searchFollowing = async (authorId, userId, searchId) => {
  try {
    // get author's following
    const followingResult = await User.aggregate([
      { $match: { userId: authorId } },
      {
        $project: {
          search: {
            $in: [searchId, "$following"],
          },
        },
      },
    ]);
    // get signin user's following list
    let userFollowings = null;
    if (userId) {
      userFollowings = await User.findOne({ userId: userId })
        .select({ following: 1, _id: 0 })
        .lean();
      userFollowings.following.push(userId);
    }
    let result = [];
    if (followingResult[0].search == true) {
      let following = await User.findOne({
        userId: searchId,
      })
        .select({ userId: 1, userName: 1, userImage: 1, _id: 0 })
        .lean();
      following.isFollowing = false;
      // login user
      if (userId == authorId) {
        following.isFollowing = true;
      } else if (
        userFollowings &&
        userFollowings.following.includes(following.userId)
      ) {
        following.isFollowing = true;
      }
      result.push(following);
    }
    return result;
  } catch (error) {
    throw error;
  }
};
