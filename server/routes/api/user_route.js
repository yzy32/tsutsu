const router = require("express").Router();
const { errorHandler } = require("../../../utils/util");
const {
  signUp,
  signIn,
  favorite,
  following,
  unfollowing,
  unfavorite,
} = require("../../controllers/user_controller");
const { auth } = require("../../../utils/authentication");

router.post("/user/signup", errorHandler(signUp));
router.post("/user/signin", errorHandler(signIn));

router.post("/user/favorite", auth, errorHandler(favorite));
router.delete("/user/favorite", auth, errorHandler(unfavorite));

router.post("/user/following", auth, errorHandler(following));
router.delete("/user/following", auth, errorHandler(unfollowing));

module.exports = router;
