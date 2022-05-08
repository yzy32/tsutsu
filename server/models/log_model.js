const es = require("../../utils/es");
const { Recipe, Review, User, esLogTest } = require("../../utils/mongo");

const storeESLog = async (type, recipeId, errorMsg, errorStatus) => {
  try {
    const mongoresult = await esLogTest.create({
      type: type,
      //FIXME: change to recipeId
      documentId: recipeId,
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
