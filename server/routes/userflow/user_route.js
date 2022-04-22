const router = require("express").Router();
const path = require("path");

router.get("/user/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../public/html/user/signup.html"));
});
router.get("/user/signin", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../public/html/user/signin.html"));
});
router.get("/user/recipe/edit", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-recipe-build.html")
  );
});
router.get("/user/:id/recipes", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-recipe.html")
  );
});
router.get("/user/:id/favorites", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-favorite.html")
  );
});
router.get("/user/:id/followings", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-following.html")
  );
});
router.get("/user/:id/followers", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-follower.html")
  );
});
router.get("/user/:id/setting", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-setting.html")
  );
});

module.exports = router;
