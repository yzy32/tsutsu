const router = require("express").Router();
const {
  getSearchRecipe,
  createRecipe,
  getRecipePage,
  createReview,
} = require("../../controllers/recipe_controller");
const { errorHandler } = require("../../../utils/util");
const { searchAuth, auth } = require("../../../utils/authentication");
const { upload } = require("../../../utils/s3");

router.get("/recipe/search", searchAuth, errorHandler(getSearchRecipe));
router.get("/recipe/:id", errorHandler(getRecipePage));
router.post(
  "/recipe",
  auth,
  upload.fields([
    { name: "recipeImage", maxCount: 1 },
    { name: "recipeStepImage" },
  ]),
  errorHandler(createRecipe)
);
router.post("/recipe/:id/review", auth, errorHandler(createReview));

module.exports = router;
