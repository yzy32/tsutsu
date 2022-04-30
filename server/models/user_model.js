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
    return error;
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
    return error;
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
    return error;
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
    return error;
  }
};

const addFollowing = async (followerId, followingId) => {
  try {
    const updateFollowing = await User.updateOne(
      { userId: followerId },
      { $addToSet: { following: followingId } }
    );
    const updateFollower = await User.updateOne(
      { userId: followingId },
      { $addToSet: { follower: followerId } }
    );
    console.log("update following: ", updateFollowing);
    console.log("update follower: ", updateFollower);
    return true;
  } catch (error) {
    return error;
  }
};

const removeFollowing = async (followerId, followingId) => {
  try {
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
    return true;
  } catch (error) {
    return error;
  }
};

const getUserProfile = async (userId) => {
  try {
    const result = await User.findOne(
      { userId: userId },
      "userId userName introduction userImage following follower"
    ).lean();
    return result;
  } catch (error) {
    return error;
  }
};

const getFollower = async (userId, authorId, page, followPageSize) => {
  try {
    // get author's follower
    const followerResult = await User.aggregate([
      { $match: { userId: authorId } },
      {
        $project: {
          followerCount: { $size: "$follower" },
          followerId: {
            $slice: ["$follower", followPageSize * (page - 1), followPageSize],
          },
        },
      },
    ]);
    const total = followerResult[0].followerCount;
    // get user's following list if authorId != userId
    let userFollowings = null;
    if (userId != authorId) {
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
      follower.isFollowing = true;
      if (
        userId != authorId &&
        !userFollowings.following.includes(follower.userId)
      ) {
        follower.isFollowing = false;
      }
      result.push(follower);
    }
    console.log(userFollowings);
    return { total, result };
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
};

//FIXME: transaction require replica or sharded cluster
// const addFollowing = async (followerId, followingId) => {
//   const session = await mongoose.startSession();
//   try {
//     const sessionRes = await session.withTransaction(async () => {
//       try {
//         console.log("start transaction");
//         const result = await User.updateOne(
//           { userId: followerId },
//           { $addToSet: { following: followingId } }
//         ).session(session);
//         console.log("follow transaction result: ", result);
//         throw new Error("test");
//       } catch (error) {
//         console.log("follow transaction error: ", error);
//         return error;
//       }
//     });
//     //TODO: insert followingId to followerId
//     console.log(sessionRes);
//     return sessionRes;
//   } catch (error) {
//     console.log("unfollow error: ", error);
//     return error;
//   } finally {
//     session.endSession();
//   }
// };

// const removeFollowing = async (followerId, unfollowingId) => {
//   const session = await mongoose.startSession();
//   try {
//     const sessionRes = await session.withTransaction(async () => {
//       try {
//         console.log("start transaction");
//         const result = await User.updateOne(
//           { userId: followerId },
//           { $pull: { following: unfollowingId } }
//         ).session(session);
//         console.log("unfollow transaction result: ", result);
//         throw new Error("test");
//       } catch (error) {
//         console.log("unfollow transaction error: ", error);
//         return error;
//       }
//     });
//     console.log(sessionRes);
//     //TODO: remove followingId to followerId
//   } catch (error) {
//     console.log("unfollow error: ", error);
//     return error;
//   } finally {
//     console.log("end session");
//     session.endSession();
//   }
// };
