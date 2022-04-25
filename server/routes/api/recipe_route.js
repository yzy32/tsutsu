const router = require("express").Router();
const {
  getSearchRecipe,
  createRecipe,
  getRecipe,
} = require("../../controllers/recipe_controller");
const { errorHandler } = require("../../../utils/util");
const { searchAuth, auth } = require("../../../utils/authentication");
const { upload } = require("../../../utils/s3");

router.get("/recipe/search", searchAuth, errorHandler(getSearchRecipe));
router.get("/recipe/:id", errorHandler(getRecipe));
router.post(
  "/recipe",
  auth,
  upload.fields([
    { name: "recipeImage", maxCount: 1 },
    { name: "recipeStepImage" },
  ]),
  errorHandler(createRecipe)
);

module.exports = router;
