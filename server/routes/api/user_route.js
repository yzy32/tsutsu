const router = require("express").Router();
const { errorHandler } = require("../../../utils/util");
const { signUp, signIn } = require("../../controllers/user_controller");

router.post("/user/signup", errorHandler(signUp));
router.post("/user/signin", errorHandler(signIn));

module.exports = router;
