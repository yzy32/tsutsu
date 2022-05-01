const bcrypt = require("bcrypt");
const es = require("../../utils/es");
const { User, Recipe } = require("../../utils/mongo");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

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
      userImage: "default",
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
    return error;
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
    //update favorite count in ES recipe if success
    const recipeES = await es.update({
      index: "recipes",
      id: recipeId,
      script: {
        source: "ctx._source.favoriteCount++",
      },
    });
    console.log("update es for favoritecount++: ", recipeES);
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
    //update favorite count in ES recipe if success
    const recipeES = await es.update({
      index: "recipes",
      id: recipeId,
      script: {
        source: "ctx._source.favoriteCount--",
      },
    });
    console.log("update es for favoritecount--: ", recipeES);
    return true;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const addFollowing = async (followerId, followingId) => {
  try {
    console.log(followerId, followingId);
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
    console.log(followerId, followingId);
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
    const result = await User.findOne(
      { userId: authorId },
      "userId userName introduction userImage following follower email"
    ).lean();
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

const getFollower = async (userId, authorId, page, followPageSize) => {
  try {
    // get author's follower
    const followerResult = await User.aggregate([
      { $match: { userId: authorId } },
      {
        $project: {
          // followerCount: { $size: "$follower" },
          followerId: {
            $slice: ["$follower", followPageSize * (page - 1), followPageSize],
          },
        },
      },
    ]);
    // const total = followerResult[0].followerCount;

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
        .select({ userId: 1, userName: 1, userImage: 1, _id: 0 })
        .lean();
      follower.isFollowing = false;
      // login user
      if (userId && userFollowings.following.includes(follower.userId)) {
        follower.isFollowing = true;
      }
      result.push(follower);
    }
    // console.log("user is follow: ", userFollowings);
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
        .select({ userId: 1, userName: 1, userImage: 1, _id: 0 })
        .lean();
      console.log("followingId: ", followingResult[0].followingId[i]);
      console.log("following: ", following);
      following.isFollowing = false;
      // login user
      if (userId == authorId) {
        following.isFollowing = true;
      } else if (
        userId &&
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
    console.log(error);
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
  getFollower,
  getFollowing,
  updateUserProfile,
};
