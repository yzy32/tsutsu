const router = require("express").Router();
const { errorHandler } = require("../../../utils/util");
const { signUp, signIn } = require("../../controllers/user_controller");

router.post("/user/signup", errorHandler(signUp));
router.post("/user/signin", errorHandler(signIn));

//TODO:
router.post("/user/:id/favorite", errorHandler());
router.post("/user/:id/follwoing", errorHandler());

module.exports = router;
