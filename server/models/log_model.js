const es = require("../../utils/es");
const { Recipe, Review, User, esLog } = require("../../utils/mongo");

const storeESLog = async (type, recipeId, errorMsg, errorStatus) => {
  try {
    const mongoresult = await esLog.create({
      type: type,
      recipeId: recipeId,
      errorMsg: errorMsg,
      errorStatus: errorStatus,
    });
    await mongoresult.save();
    console.log("store logs to mongo: ", mongoresult);
  } catch (error) {
    console.log("failed to store logs to mongo: ", error);
  }
};

module.exports = { storeESLog };
