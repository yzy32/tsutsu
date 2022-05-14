const { getTrendingKeyword } = require("../models/keyword_model");
const { searchRecipe } = require("../models/recipe_model");

const selectTrendingKeyword = async (req, res) => {
  try {
    let hour = 24;
    let limit = 3;
    let currentTime = Date.now();
    let past = currentTime - 60 * 60 * 1000 * hour;
    let currentDatetime = new Date().toISOString();
    let pastDatetime = new Date(past).toISOString();
    // console.log("currentTime: ", currentTime);
    // console.log("currentDatetime: ", currentDatetime);
    // console.log(`${hour} hour ago: `, past);
    // console.log(`${hour} hour ago (Datetime): `, pastDatetime);
    let keywords = await getTrendingKeyword(
      pastDatetime,
      currentDatetime,
      limit
    );
    if (keywords.length < 3) {
      hour = hour * 30;
      past = currentTime - 60 * 60 * 1000 * hour;
      pastDatetime = new Date(past).toISOString();
      keywords = await getTrendingKeyword(pastDatetime, currentDatetime, limit);
    }
    //search keyword
    let keywordsRecipes = [];
    let start = Math.floor(Math.random() * 10 + 1);
    for (let i = 0; i < keywords.length; i++) {
      let result = await searchRecipe(
        keywords[i]._id,
        null,
        null,
        null,
        null,
        null,
        start,
        3
      );
      let recipes = result.hits.map((obj) => {
        let recipe = {
          recipeId: obj._id,
          recipeName: obj._source.recipeName,
          description: obj._source.description,
          authorId: obj._source.authorId,
          author: obj._source.author,
          recipeImage: obj._source.recipeImage
            ? obj._source.recipeImage
            : "https://s23209.pcdn.co/wp-content/uploads/2018/06/211129_DAMN-DELICIOUS_Lemon-Herb-Roasted-Chx_068.jpg",
        };
        return recipe;
      });
      let keywordRecipes = { keyword: keywords[i]._id, recipes: recipes };
      keywordsRecipes.push(keywordRecipes);
    }
    //return imgurl, recipename, recipeauthor to frontend
    res.status(200).send(keywordsRecipes);
    return;
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  selectTrendingKeyword,
};
