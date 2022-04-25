const router = require("express").Router();
const {
  selectTrendingKeyword,
} = require("../../controllers/keyword_controller");
const { errorHandler } = require("../../../utils/util");

router.get("/keyword/trending", errorHandler(selectTrendingKeyword));

module.exports = router;
