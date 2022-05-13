const router = require("express").Router();
const path = require("path");

router.get("/recipe/search", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../public/html/search-v2.html"));
});

router.get("/recipe/create", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-recipe-build.html")
  );
});

router.get("/recipe/:id/edit", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-recipe-build.html")
  );
});

router.get("/recipe/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../public/html/recipe/recipe.html"));
});

module.exports = router;
