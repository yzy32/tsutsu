const path = require("path");
const {
  searchIngredient,
  searchRecipe,
  getRecipeById,
  insertReview,
  getReviewByRecipeId,
  getRecipeByUserId,
  getFavorite,
  setPublic,
  searchRecipeByName,
  searchFavoriteByName,
  createRecipeinES,
  getFollowingRecipe,
} = require("../models/recipe_model");
const {
  isFollow,
  isFavorite,
  getFollowing,
  getFavoriteRecipeId,
} = require("../models/user_model");

const { storeKeywords } = require("../models/keyword_model");
const {
  arrayToString,
  removeRecipePrivateInfo,
  removeRedundantInfo,
  cleanRecipeForDB,
} = require("../../utils/util.js");
const { Recipe, Review } = require("../../utils/mongo");
const mongoose = require("mongoose");
const es = require("../../utils/es");
const validator = require("../../utils/validator");
const pageSize = 10; //search
const userPageSize = 10; //need to be the same as user contoller's
const desiredReviewQty = 5;

const getSearchRecipe = async (req, res) => {
  // console.log("user in search: ", req.user);
  // console.log("login status in search: ", req.loginStatus);
  let { q, ingrIncl, ingrExcl, otherKeyword, cookTime, sort, myrecipe, page } =
    req.query;
  page = parseInt(page) || 1;
  cookTime = parseInt(cookTime);
  // ingrIncl = arrayToString(ingrIncl);
  // ingrExcl = arrayToString(ingrExcl);
  // otherKeyword = arrayToString(otherKeyword);
  console.log(
    "search requirement: ",
    q,
    ingrIncl,
    ingrExcl,
    otherKeyword,
    cookTime,
    sort,
    myrecipe,
    page
  );
  let result;
  if (q) {
    console.log("home page");
    let qArray = q.split(" ");
    const keywords = await categorizeKeywords(qArray);
    console.log("cagegorize keywords: ", keywords);
    ingrIncl = keywords.ingrIncl;
    otherKeyword = keywords.otherKeywords;
    ingrExcl = "";
  }

  if (myrecipe && req.loginStatus) {
    myrecipe = req.user.userId;
  }
  result = await searchRecipe(
    ingrIncl,
    ingrExcl,
    otherKeyword,
    cookTime,
    sort,
    myrecipe,
    page,
    pageSize
  );
  // console.log(result);
  let recipes = [];
  for (let i = 0; i < result.hits.length; i++) {
    if (!result.hits[i].highlight) {
      result.hits[i].highlight = {
        ingredients: [],
      };
    }
    recipe = {
      recipeId: result.hits[i]._id,
      recipeName: result.hits[i]._source.recipeName,
      recipeImage: result.hits[i]._source.recipeImage || null,
      authorId: result.hits[i]._source.authorId,
      author: result.hits[i]._source.author,
      cookTime: result.hits[i]._source.cookTime,
      favoriteCount: result.hits[i]._source.favoriteCount || 0,
      ingredients: result.hits[i]._source.ingredients,
      tags: result.hits[i]._source.tags,
      ingrMatchedCount: result.hits[i].highlight.ingredients.length,
    };

    recipes.push(recipe);
  }
  //record keyword (eliminate await)
  keywordsToMongo(req);

  //pagination
  let totalPage = Math.ceil(result.total.value / pageSize);
  res.status(200).json({
    recipes: recipes,
    recipeCount: result.total.value,
    filter: {
      ingrIncl: ingrIncl,
      ingrExcl: ingrExcl,
      otherKeyword: otherKeyword,
      cookTime: cookTime,
    },
    totalPage: totalPage,
    loginStatus: req.loginStatus,
  });
};

const categorizeKeywords = async (keywords) => {
  let ingredients = [];
  let otherKeywords = [];
  for (let i = 0; i < keywords.length; i++) {
    let isIngredient = await searchIngredient(keywords[i]);
    if (isIngredient > 0) {
      ingredients.push(keywords[i]);
    } else {
      otherKeywords.push(keywords[i]);
    }
  }
  let keywordsCategory = {
    ingrIncl: ingredients.join(" "),
    otherKeywords: otherKeywords.join(" "),
  };
  return keywordsCategory;
};

const keywordsToMongo = async (req) => {
  try {
    delete req.query.cookTime;
    delete req.query.myrecipe;
    delete req.query.sort;
    delete req.query.page;
    delete req.query.ingrExcl;
    let documents = Object.keys(req.query).map((key) => {
      let document = { queryField: key, keyword: req.query[key].split(" ") };
      if (req.user) {
        document.userId = req.user.userId;
      }
      return document;
    });
    await storeKeywords(documents);
  } catch (error) {
    console.log(error);
  }
};

const createRecipe = async (req, res) => {
  if (!req.body.recipeImage) {
    return res.status(400).json({ error: "Recipe image is required" });
  }
  let recipe = cleanRecipeForDB(req);
  let { recipeName, description, cookTime, servings, ingredients } = recipe;
  // data validation
  const validate = await validator.createRecipe.validateAsync({
    recipeName,
    description,
    cookTime,
    servings,
    ingredients,
  });
  let recipeInserted = await Recipe.create(recipe);
  let result = await recipeInserted.save();
  console.log("recipe", recipe);
  console.log("mongo result for saving: ", result);
  let recipeES = recipe; //shallow copy
  recipeES.favoriteCount = 0;
  delete recipeES.servings;
  delete recipeES.recipeSteps;
  createRecipeinES(result.id, recipeES, "create");
  res.status(200).json({ msg: "success" });
  return;
};

const getRecipePage = async (req, res) => {
  const isId = mongoose.isValidObjectId(req.params.id);
  if (!isId) {
    res.status(404).json({ error: "Recipe Not Found" });
    return;
  }
  let recipeResult = await getRecipeById(req.params.id);
  //if not a valid recipeId, return 404
  if (!recipeResult || recipeResult.length == 0) {
    res.status(404).json({ error: "Recipe Not Found" });
    return;
  }
  //get recent 5 reviews
  const reviewResult = await getReviewByRecipeId(
    req.params.id,
    0,
    desiredReviewQty
  );
  recipeResult.reviewList = reviewResult;

  //if user not sign in and the recipe is public, then return isFollow and isFavorite = false
  if (!req.user && recipeResult.isPublic) {
    recipeResult.isFollow = false;
    recipeResult.isFavorite = false;
    res.status(200).json({ recipe: recipeResult });
    return;
  }
  //if user not sign in and the recipe is private, then return 403 forbidden
  if (!req.user && !recipeResult.isPublic) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  //if user sign in and recipe is public, then check if user has follow this author and keep this recipe from user table
  if (req.user && recipeResult.isPublic) {
    // if user = author
    if (req.user.userId == recipeResult.authorId) {
      recipeResult.isFollow = null;
      recipeResult.isFavorite = null;
      res.status(200).json({ recipe: recipeResult });
      return;
    }
    // if user != author, check if user has followed this author
    const followResult = await isFollow(req.user.userId, recipeResult.authorId);
    if (followResult.length == 0) {
      recipeResult.isFollow = false;
    } else {
      recipeResult.isFollow = true;
    }
    const favoriteResult = await isFavorite(req.user.userId, req.params.id);
    if (favoriteResult.length == 0) {
      recipeResult.isFavorite = false;
    } else {
      recipeResult.isFavorite = true;
    }
    res.status(200).json({ recipe: recipeResult });
    return;
  }
  //if user sign in and recipe is private, then check if userid = author id
  if (req.user && !recipeResult.isPublic) {
    if (req.user.userId == recipeResult.authorId) {
      recipeResult.isFollow = null;
      recipeResult.isFavorite = null;
      res.status(200).json({ recipe: recipeResult });
      return;
    } else {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }
};

const createReview = async (req, res) => {
  let recipeReview = {
    userId: req.user.userId,
    review: req.body.review,
    recipeId: req.body.recipeId,
  };
  const result = await insertReview(recipeReview);
  res.status(200).json({ msg: "success" });
  return;
};

const getReview = async (req, res) => {
  let id = req.params.id;
  let page = req.query.page;
  let skip = desiredReviewQty * (page - 1);
  let result = await getReviewByRecipeId(id, skip, desiredReviewQty);
  res.status(200).json({ review: result });
  return;
};

const getUserRecipe = async (req, res) => {
  let authorId = req.params.id;
  let page = req.query.page ? req.query.page : 1;
  let userId = req.user ? req.user.userId : null;
  let result = null;
  if (authorId == userId) {
    let publicOnly = false;
    result = await getRecipeByUserId(authorId, publicOnly, page, userPageSize);
    result.setPublic = true;
  } else {
    let publicOnly = true;
    result = await getRecipeByUserId(authorId, publicOnly, page, userPageSize);
    result.setPublic = false;
  }
  //return 10pcs of recipe: recipeName, recipeId, recipeImage, ingredients, isPublic, totalPage
  res.status(200).json({ recipe: result });
  return;
};

const getUserFavorite = async (req, res) => {
  let authorId = req.params.id;
  let page = req.query.page ? req.query.page : 1;
  let { favoriteCount, favoriteId } = await getFavoriteRecipeId(
    authorId,
    page,
    userPageSize
  );
  const total = favoriteCount;
  let result = [];
  for (let i = 0; i < total; i++) {
    let recipe = await getRecipeById(favoriteId[i]);
    if (recipe.isPublic) {
      recipe = removeRedundantInfo(recipe);
      result.push(recipe);
      continue;
    }
    if (!recipe.isPublic) {
      recipe = removeRecipePrivateInfo(recipe);
      result.push(recipe);
    }
  }
  res.status(200).json({ favorite: { total, result } });
  return;
};

const setRecipePublic = async (req, res) => {
  let { recipeId, toPublic } = req.body;
  const result = await setPublic(recipeId, toPublic);
  res.status(200).json({ msg: "success" });
  return;
};

const searchUserRecipe = async (req, res) => {
  if (!req.params.id) {
    console.log("search user recipe need to has authorId");
    return res.status(404).json({ error: "Page Not Found" });
  }
  let keyword = req.query.q;
  let page = req.query.page ? req.query.page : 1;
  let userId = req.user ? req.user.userId : null;
  let authorId = req.params.id;

  let result = await searchRecipeByName(
    authorId,
    userId,
    keyword,
    page,
    userPageSize
  );
  result.setPublic = false;
  if (authorId == userId) {
    result.setPublic = true;
  }
  res.status(200).json({ recipe: result });
  return;
};

const searchUserFavorite = async (req, res) => {
  if (!req.params.id) {
    console.log("search user favorite need to has authorId");
    return res.status(404).json({ error: "Page Not Found" });
  }
  let keyword = req.query.q;
  let page = req.query.page ? req.query.page : 1;
  let authorId = req.params.id;

  let result = await searchFavoriteByName(
    authorId,
    keyword,
    page,
    userPageSize
  );
  res.status(200).json({ favorite: result });
  return;
};

const getFollowingNewRecipe = async (req, res) => {
  let userId = req.user ? req.user.userId : null;
  let result = await getFollowingRecipe(userId);
  res.status(200).json({ recipes: result });
};

const addViewCount = async (req, res) => {
  //add view count in mongo
  let { recipeId } = req.body;
  let result = await Recipe.findOneAndUpdate(
    {
      _id: mongoose.Types.ObjectId(recipeId),
    },
    { $inc: { viewCount: 1 } }
  );
  res.status(200).json({ msg: "success" });
};

const getPopularRecipe = async (req, res) => {
  let result = await Recipe.aggregate([
    { $match: { isPublic: true } },
    { $sort: { viewCount: -1 } },
    { $limit: 6 },
    { $sample: { size: 3 } },
  ]);
  res.status(200).json({ recipes: result });
};

const updateRecipe = async (req, res) => {
  let recipeId = req.params.id;
  if (!req.body.recipeImage) {
    return res.status(400).json({ error: "Recipe image is required" });
  }
  let recipe = cleanRecipeForDB(req);
  let { recipeName, description, cookTime, servings, ingredients } = recipe;
  // data validation
  const validate = await validator.createRecipe.validateAsync({
    recipeName,
    description,
    cookTime,
    servings,
    ingredients,
  });
  const result = await Recipe.findOneAndUpdate(
    {
      _id: mongoose.Types.ObjectId(recipeId),
    },
    recipe,
    { new: true }
  );
  console.log("update recipe result: ", result);
  let recipeES = recipe; //shallow copy
  delete recipeES.servings;
  delete recipeES.recipeSteps;
  createRecipeinES(recipeId, recipeES, "update");
  res.status(200).json({ msg: recipe });
};

module.exports = {
  getSearchRecipe,
  createRecipe,
  getRecipePage,
  createReview,
  getReview,
  getUserRecipe,
  getUserFavorite,
  setRecipePublic,
  searchUserRecipe,
  searchUserFavorite,
  getFollowingNewRecipe,
  addViewCount,
  getPopularRecipe,
  updateRecipe,
};
