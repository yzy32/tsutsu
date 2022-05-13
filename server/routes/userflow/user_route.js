const router = require("express").Router();
const path = require("path");
const { auth } = require("../../../utils/authentication");

router.get("/user/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../public/html/user/signup.html"));
});
router.get("/user/signin", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../public/html/user/signin.html"));
});

// router.get("/user/recipe/edit", (req, res) => {
//   res.sendFile(
//     path.join(__dirname, "../../../public/html/user/user-recipe-build.html")
//   );
// });

router.get("/user/:id/recipes", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-recipe.html")
  );
});
router.get("/user/:id/favorites", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-recipe.html")
  );
});
router.get("/user/:id/followings", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-follow.html")
  );
});
router.get("/user/:id/followers", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-follow.html")
  );
});
router.get("/user/:id/settings", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../public/html/user/user-recipe.html")
  );
});

module.exports = router;
