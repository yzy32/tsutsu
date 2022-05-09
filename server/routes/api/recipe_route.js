const router = require("express").Router();
const {
  getSearchRecipe,
  createRecipe,
  getRecipePage,
  createReview,
  getReview,
  setRecipePublic,
  getFollowingNewRecipe,
  addViewCount,
  getPopularRecipe,
} = require("../../controllers/recipe_controller");
const { errorHandler } = require("../../../utils/util");
const {
  searchAuth,
  recipeAuth,
  auth,
} = require("../../../utils/authentication");
const { upload } = require("../../../utils/s3");

router.get("/recipe/search", searchAuth, errorHandler(getSearchRecipe));
router.get("/recipe/popular", errorHandler(getPopularRecipe));
router.get(
  "/recipe/following",
  recipeAuth,
  errorHandler(getFollowingNewRecipe)
);
router.post("/recipe/viewCount", errorHandler(addViewCount));
router.get("/recipe/:id", recipeAuth, errorHandler(getRecipePage));
router.post(
  "/recipe",
  auth,
  upload.fields([
    { name: "recipeImage", maxCount: 1 },
    { name: "recipeStepImage" },
  ]),
  errorHandler(createRecipe)
);
router.get("/recipe/:id/review", errorHandler(getReview));
router.post("/recipe/:id/review", auth, errorHandler(createReview));

router.post("/recipe/setPublic", auth, errorHandler(setRecipePublic));

module.exports = router;
