const redisClient = require("../../utils/redis");
const { getTrendingKeyword } = require("../models/keyword_model");
const { searchRecipe } = require("../models/recipe_model");

const selectTrendingKeyword = async (req, res) => {
  try {
    let keywords = [];
    if (!redisClient.ready) {
      keywords = await redisClient.LRANGE("keywords", 0, -1);
    } else {
      let hour = 24;
      let limit = 3;
      let currentTime = Date.now();
      let past = currentTime - 60 * 60 * 1000 * hour;
      let currentDatetime = new Date().toISOString();
      let pastDatetime = new Date(past).toISOString();
      keywords = await getTrendingKeyword(pastDatetime, currentDatetime, limit);
      if (keywords.length < 3) {
        hour = hour * 30;
        past = currentTime - 60 * 60 * 1000 * hour;
        pastDatetime = new Date(past).toISOString();
        keywords = await getTrendingKeyword(
          pastDatetime,
          currentDatetime,
          limit
        );
      }
      keywords = keywords.map((k) => {
        return k._id; //accumulate keyword based on _id field
      });
    }
    //search keyword
    let keywordsRecipes = [];
    let start = Math.floor(Math.random() * 10 + 1);
    for (let i = 0; i < keywords.length; i++) {
      let result = await searchRecipe(
        keywords[i],
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
      let keywordRecipes = { keyword: keywords[i], recipes: recipes };
      if (keywordRecipes.recipes.length < 3) {
        continue;
      }
      keywordsRecipes.push(keywordRecipes);
    }
    //return imgurl, recipename, recipeauthor to frontend
    console.log(keywordsRecipes);
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
