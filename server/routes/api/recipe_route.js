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
  updateRecipe,
} = require("../../controllers/recipe_controller");
const s3 = require("../../../utils/s3");
const { errorHandler } = require("../../../utils/util");
const {
  searchAuth,
  recipeAuth,
  auth,
} = require("../../../utils/authentication");
// const { upload } = require("../../../utils/s3");
const multer = require("multer");
const upload = multer();

router.get("/recipe/search", searchAuth, errorHandler(getSearchRecipe));
router.get("/recipe/popular", errorHandler(getPopularRecipe));
router.get(
  "/recipe/following",
  recipeAuth,
  errorHandler(getFollowingNewRecipe)
);
router.post("/recipe/viewCount", errorHandler(addViewCount));
router.post("/recipe/setPublic", auth, errorHandler(setRecipePublic));
router.get("/recipe/imgUploadUrl", auth, errorHandler(s3.generateUploadURL));
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
router.put("/recipe/:id/edit", auth, upload.none(), errorHandler(updateRecipe));
router.get("/recipe/:id/review", errorHandler(getReview));
router.post("/recipe/:id/review", auth, errorHandler(createReview));

module.exports = router;
