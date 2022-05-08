const es = require("../../utils/es");
const { Recipe, Review, User, esLog } = require("../../utils/mongo");
const mongoose = require("mongoose");
const { storeESLog } = require("./log_model");

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
    throw error;
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
    throw error;
  }
};

const getRecipeById = async (id) => {
  try {
    const result = await Recipe.findById(id).lean();
    return result;
  } catch (error) {
    console.log(error);
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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
            $slice: [
              { $reverseArray: "$userFavorites" },
              userPageSize * (page - 1),
              userPageSize,
            ],
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
    throw error;
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
    //TODO: test es error handling
    let count = 0;
    let errorMsg = null;
    let errorStatus = null;
    while (count < 4) {
      //retry 3 times (total: 4 times)
      count++;
      try {
        //set public in es
        const esResult = es.update({
          index: "recipes",
          id: recipeId,
          doc: { isPublic: toPublic },
        });
        console.log("es success for setting public: ", esResult);
        const test = await es.index({
          index: "testerror",
          body: {
            toPublic: toPublic,
            recipeName: "test11",
            favoriteCount: "string",
          },
        });
        console.log("es success result: ", test);
        break;
      } catch (error) {
        console.log(`es error ${count}: `, error);
        errorMsg = error;
        errorStatus = error.statusCode;
      }
    }
    if (count == 4) {
      //after retry 3 times, record error log into mongodb
      await storeESLog("setPublic", recipeId, errorMsg, errorStatus);
    }
    return true;
  } catch (error) {
    throw error;
  }
};

const searchMongoRecipe = async (
  authorId,
  userId,
  keyword,
  page,
  userPageSize
) => {
  try {
    let andOperation = [
      { authorId: authorId },
      { recipeName: { $regex: `${keyword}`, $options: "i" } },
    ];
    let isPublic = true;
    if (userId != authorId) {
      andOperation.push({ isPublic: isPublic });
    }
    let total = await Recipe.aggregate([
      {
        $match: {
          $and: andOperation,
        },
      },
      { $sort: { timeCreated: -1 } },
      {
        $project: {
          recipeImage: 1,
          recipeName: 1,
          ingredients: 1,
          isPublic: 1,
          total: 1,
        },
      },
      { $group: { _id: null, count: { $count: {} } } },
    ]);
    total = total[0] ? total[0].count : 0;
    const result = await Recipe.aggregate([
      {
        $match: {
          $and: andOperation,
        },
      },
      { $sort: { timeCreated: -1 } },
      {
        $project: {
          recipeImage: 1,
          recipeName: 1,
          ingredients: 1,
          isPublic: 1,
        },
      },
      { $skip: userPageSize * (page - 1) },
      { $limit: userPageSize },
    ]);
    return { total, result };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const searchMongoFavorite = async (authorId, keyword, page, userPageSize) => {
  try {
    const response = await User.aggregate([
      { $match: { userId: authorId } },
      {
        $lookup: {
          from: "recipes",
          localField: "userFavorites",
          foreignField: "_id",
          pipeline: [
            { $match: { recipeName: { $regex: `${keyword}`, $options: "i" } } },
            {
              $project: {
                recipeImage: 1,
                recipeName: 1,
                ingredients: 1,
                isPublic: 1,
              },
            },
          ],
          as: "recipe",
        },
      },
    ]);
    let total = response[0].recipe.length;
    //if isPublic is private, replace relevant field info
    let result = [];
    let start = userPageSize * (page - 1);
    let end = userPageSize * page > total ? total : userPageSize * page;
    for (let i = start; i < end; i++) {
      let recipe = response[0].recipe[i];
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
    throw error;
  }
};

const createRecipeinES = async (id, recipe) => {
  //TODO: test es error handling
  let count = 0;
  let errorMsg = null;
  let errorStatus = null;
  while (count < 4) {
    //retry 3 times (total: 4 times)
    count++;
    try {
      //FIXME: test time
      console.log("5.recipte creation before es: ", new Date());
      let esResult = await es.index({
        index: "recipes",
        id: id,
        document: recipe,
      });
      //FIXME: test time
      console.log("6.recipte creation after es: ", new Date());
      console.log("es success for creating recipe in ES: ", esResult);
      const test = await es.index({
        index: "testerror",
        body: {
          isPublic: toPublic,
          recipeName: "test11",
          favoriteCount: "string",
        },
      });
      console.log("es success result: ", test);
      break;
    } catch (error) {
      console.log(`es error ${count}: `, error);
      errorMsg = error;
      errorStatus = error.statusCode;
    }
  }
  if (count == 4) {
    //TODO: after retry 3 times, record error log into mongodb
    const mongoresult = await storeESLog(
      "createRecipe",
      id,
      errorMsg,
      errorStatus
    );
    // const mongoresult = await esLog.create({
    //   type: "createRecipe",
    //   recipeId: id,
    //   errorMsg: errorMsg,
    //   errorStatus: errorStatus,
    // });
    await mongoresult.save();
    console.log("store logs to mongo: ", mongoresult);
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
  searchMongoRecipe,
  searchMongoFavorite,
  createRecipeinES,
};
