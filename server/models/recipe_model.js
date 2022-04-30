const es = require("../../utils/es");
const { Recipe, Review, User } = require("../../utils/mongo");
const mongoose = require("mongoose");

const searchIngredient = async (keyword) => {
  try {
    const result = await es.search({
      index: "ingredients",
      query: {
        match: {
          ingredient: {
            query: keyword,
            fuzziness: "auto",
            fuzzy_transpositions: true,
            max_expansions: 50,
            prefix_length: 3, //default: 0
          },
        },
      },
    });
    return result.hits.total.value;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const searchRecipe = async (
  ingrIncl,
  ingrExcl,
  otherKeyword,
  cookTime,
  sort,
  myrecipe,
  page,
  pageSize
) => {
  try {
    let recipeFrom = pageSize * (page - 1);
    // console.log("recipe from: ", recipeFrom);
    if (!cookTime) {
      cookTime = 1000000;
    }
    let sortQuery = [{ _score: { order: "desc" } }];
    if (sort === "favorite") {
      sortQuery = [
        { favoriteCount: { order: "desc" } },
        { _score: { order: "desc" } },
      ];
    } else if (sort === "time") {
      sortQuery = [
        { cookTime: { order: "asc" } },
        { _score: { order: "desc" } },
      ];
    } else if (sort === "ingredients") {
      sortQuery = [{ _score: { order: "desc" } }];
    }

    let searchInput = {
      index: "recipes",
      from: recipeFrom, //start from 0
      size: pageSize,
      query: {
        bool: {
          should: [],
          filter: [],
          must_not: [
            {
              match: {
                isPublic: { query: "false" },
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
      sort: sortQuery,
      // retrieve specific fields
      // fields: [
      //   "recipeName",
      //   "ingredients",
      //   "cookTime",
      //   "favoriteCount",
      //   "authodId",
      //   "author",
      // ],
      highlight: {
        order: "score",
        fields: {
          ingredients: {
            type: "unified",
          },
        },
      },
    };
    if (ingrIncl) {
      searchInput.query.bool.should.push({
        match: {
          ingredients: {
            query: ingrIncl,
            fuzziness: "auto",
            prefix_length: 3,
          },
        },
      });
    }
    if (ingrExcl) {
      searchInput.query.bool.must_not.push({
        match: {
          ingredients: {
            query: ingrExcl,
            fuzziness: "auto",
            prefix_length: 3,
          },
        },
      });
    }
    if (otherKeyword) {
      searchInput.query.bool.should.push({
        multi_match: {
          query: otherKeyword,
          fields: ["description", "recipeName", "tags"],
          fuzziness: "auto",
          prefix_length: 3,
        },
      });
    }
    if (cookTime) {
      searchInput.query.bool.filter.push({
        range: { cookTime: { lte: cookTime } },
      });
    }
    if (myrecipe) {
      //filter by user id
      searchInput.query.bool.filter.push({
        match: { authorId: { query: myrecipe } },
      });
      //remove must not (match: isPublic)
      searchInput.query.bool.must_not.shift();
    }
    const result = await es.search(searchInput);
    // console.log(searchInput);
    // console.log(result.hits.hits);
    // console.log(result.hits.total.value);
    return result.hits;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getRecipeById = async (id) => {
  try {
    const result = await Recipe.findById(id).lean();
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getReviewByRecipeId = async (id, skip, desiredQty) => {
  try {
    //get recent 5 reviews by recipeid
    const result = await Review.find({
      recipeId: id,
    })
      .sort({ timeCreated: -1 })
      .skip(skip)
      .limit(desiredQty)
      .lean();
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const insertReview = async (recipeReview) => {
  try {
    const reviewInserted = await Review.create(recipeReview);
    const recipeInserted = await Recipe.findOneAndUpdate(
      {
        _id: recipeReview.recipeId,
      },
      { $inc: { reviewCount: 1 } }
    );
    const reviewResult = await reviewInserted.save();
    recipeInserted.save();
    return true;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getRecipeByUserId = async (userId, page, userPageSize) => {
  try {
    const total = await Recipe.count({ authorId: userId });
    const result = await Recipe.find(
      { authorId: userId },
      "recipeImage recipeName ingredients isPublic"
    )
      .sort({
        timeCreated: -1,
      })
      .skip(userPageSize * (page - 1))
      .limit(userPageSize)
      .lean();
    return { total, result };
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const getPublicRecipeByUserId = async (authorId, page, userPageSize) => {
  try {
    const total = await Recipe.count({ authorId: authorId, isPublic: true });
    const result = await Recipe.find(
      { authorId: authorId, isPublic: true },
      "recipeImage recipeName ingredients isPublic"
    )
      .sort({
        timeCreated: -1,
      })
      .skip(userPageSize * (page - 1))
      .limit(userPageSize)
      .lean();
    return { total, result };
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const getFavorite = async (authorId, page, userPageSize) => {
  try {
    // get total count of favorite recipes
    // get specific array based on pagination (eg. 0-9, 10-19)
    const userResult = await User.aggregate([
      { $match: { userId: authorId } },
      {
        $project: {
          favoriteCount: { $size: "$userFavorites" },
          favoriteId: {
            $slice: ["$userFavorites", userPageSize * (page - 1), userPageSize],
          },
        },
      },
    ]);
    const total = userResult[0].favoriteCount;
    let result = [];
    for (let i = 0; i < userResult[0].favoriteId.length; i++) {
      let recipe = await Recipe.findOne(
        { _id: userResult[0].favoriteId[i] },
        "recipeImage recipeName ingredients isPublic"
      ).lean();
      //if recipe is private, remove all info except recipe name
      if (!recipe.isPublic) {
        recipe._id = "";
        recipe.recipeImage = `https://tsutsu-s3.s3.ap-northeast-1.amazonaws.com/assets/default/private.jpeg`;
        recipe.ingredients = [
          "Top secret",
          "Top secret",
          "Top secret",
          "Top secret",
        ];
      }
      result.push(recipe);
    }
    return { total, result };
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const setPublic = async (recipeId, toPublic) => {
  try {
    //set public in mongo
    console.log(toPublic);
    const mongoResult = await Recipe.findOneAndUpdate(
      { _id: recipeId },
      { isPublic: toPublic },
      { new: true }
    );
    //set public in es
    const esResult = await es.update({
      index: "recipes",
      id: recipeId,
      doc: { isPublic: toPublic },
    });
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  searchIngredient,
  searchRecipe,
  getRecipeById,
  insertReview,
  getReviewByRecipeId,
  getRecipeByUserId,
  getPublicRecipeByUserId,
  getFavorite,
  setPublic,
};
