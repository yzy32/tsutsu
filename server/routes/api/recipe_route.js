const router = require("express").Router();
const { getRecipe } = require("../../controllers/recipe_controller");
const { errorHandler } = require("../../../utils/util");

router.get("/recipe/search", errorHandler(getRecipe));

module.exports = router;
