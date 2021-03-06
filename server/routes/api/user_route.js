const router = require("express").Router();
const { errorHandler } = require("../../../utils/util");
const {
  signUp,
  signIn,
  favorite,
  following,
  unfollowing,
  unfavorite,
  getProfile,
  getUserFollower,
  getUserFollowing,
  updateProfile,
  searchUserFollower,
  searchUserFollowing,
} = require("../../controllers/user_controller");
const {
  getUserRecipe,
  getUserFavorite,
  searchUserRecipe,
  searchUserFavorite,
} = require("../../controllers/recipe_controller");
const { uploadProfile } = require("../../../utils/s3");
const { auth, recipeAuth } = require("../../../utils/authentication");

router.post("/user/signup", errorHandler(signUp));
router.post("/user/signin", errorHandler(signIn));

router.post("/user/favorite", auth, errorHandler(favorite));
router.delete("/user/favorite", auth, errorHandler(unfavorite));

router.post("/user/following", auth, errorHandler(following));
router.delete("/user/following", auth, errorHandler(unfollowing));

router.get("/user/:id/profile", recipeAuth, errorHandler(getProfile));
router.get("/user/:id/recipes", recipeAuth, errorHandler(getUserRecipe));
router.get("/user/:id/favorites", recipeAuth, errorHandler(getUserFavorite));
router.get("/user/:id/followers", recipeAuth, errorHandler(getUserFollower));
router.get("/user/:id/followings", recipeAuth, errorHandler(getUserFollowing));

router.put(
  "/user/profile",
  auth,
  uploadProfile.single("userImage"),
  errorHandler(updateProfile)
);

router.get(
  "/user/:id/search/recipes",
  recipeAuth,
  errorHandler(searchUserRecipe)
);
router.get(
  "/user/:id/search/favorites",
  recipeAuth,
  errorHandler(searchUserFavorite)
);

router.get(
  "/user/:id/search/followers",
  recipeAuth,
  errorHandler(searchUserFollower)
);

router.get(
  "/user/:id/search/followings",
  recipeAuth,
  errorHandler(searchUserFollowing)
);

module.exports = router;
