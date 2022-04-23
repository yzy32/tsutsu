const router = require("express").Router();
const { getRecipe } = require("../../controllers/recipe_controller");
const { errorHandler } = require("../../../utils/util");
const { searchAuth } = require("../../../utils/authentication");

router.get("/recipe/search", searchAuth, errorHandler(getRecipe));

module.exports = router;
