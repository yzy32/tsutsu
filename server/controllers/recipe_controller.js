const path = require("path");
const {
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
} = require("../models/recipe_model");
const { isFollow, isFavorite } = require("../models/user_model");

const { storeKeywords } = require("../models/keyword_model");
const { arrayToString } = require("../../utils/util.js");
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
  let recipe = {
    recipeImage: req.files.recipeImage[0].location,
    servings: req.body.servings,
    recipeSteps: [],
    recipeName: req.body.recipeName,
    description: req.body.description,
    cookTime: req.body.cookTime,
    ingredients: req.body.ingredients,
    author: req.user.userName,
    authorId: req.user.userId,
  };
  for (let i = 0; i < req.body.recipeSteps.length; i++) {
    let recipeStep = {
      step: req.body.recipeSteps[i],
      image: req.files.recipeStepImage[i].location,
    };
    recipe.recipeSteps.push(recipeStep);
  }
  if (req.body.isPublic) {
    recipe.isPublic = "false";
  }
  if (req.body.tags) {
    let tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
    recipe.tags = tags;
  }
  //FIXME: test time
  console.log(
    "2.recipte creation in controller before data validation: ",
    new Date()
  );
  // data validation
  let { recipeName, description, cookTime, servings, ingredients } = recipe;
  const validate = await validator.createRecipe.validateAsync({
    recipeName,
    description,
    cookTime,
    servings,
    ingredients,
  });
  console.log("input", recipe);
  //FIXME: test time
  console.log("3.recipte creation in controller before mongo: ", new Date());
  let recipeInserted = await Recipe.create(recipe);
  let result = await recipeInserted.save();
  //FIXME: test time
  console.log("4.recipte creation in controller after mongo: ", new Date());
  console.log("recipe", recipe);
  console.log("mongo result for saving: ", result);
  let recipeES = recipe; //shallow copy
  recipeES.favoriteCount = 0;
  delete recipeES.servings;
  delete recipeES.recipeSteps;
  //FIXME: test time
  console.log("5.recipte creation in controller before es: ", new Date());
  let esResult = await es.index({
    index: "recipes",
    id: result.id,
    document: recipeES,
  });
  //FIXME: test time
  console.log("6.recipte creation in controller after es: ", new Date());
  console.log("es result for saving: ", esResult);
  res.status(200).json({ msg: "success" });
  return;
};

const getRecipePage = async (req, res) => {
  const isId = mongoose.isValidObjectId(req.params.id);
  let recipeResult = await getRecipeById(req.params.id);
  //if not a valid recipeId, return 404
  if (!recipeResult || !isId) {
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
  //find recipe from recipe based on userid and authorid
  let result = null;
  if (authorId == userId) {
    result = await getRecipeByUserId(userId, page, userPageSize);
    result.setPublic = true;
  } else {
    result = await getPublicRecipeByUserId(authorId, page, userPageSize);
    result.setPublic = false;
  }
  if (result.error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
  // console.log(result);
  //return 10pcs of recipe: recipeName, recipeId, recipeImage, ingredients, isPublic, totalPage
  res.status(200).json({ recipe: result });
  return;
};

const getUserFavorite = async (req, res) => {
  let authorId = req.params.id;
  let page = req.query.page ? req.query.page : 1;
  //find recipe from recipe based on userid and authorid
  let result = await getFavorite(authorId, page, userPageSize);
  if (result.error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
  res.status(200).json({ favorite: result });
  return;
};

const setRecipePublic = async (req, res) => {
  let { recipeId, toPublic } = req.body;
  const result = await setPublic(recipeId, toPublic);
  res.status(200).json({ msg: "success" });
  return;
};

const searchUserRecipe = async (req, res) => {
  // if (!req.query.q) {
  //   return res.status(400).json({ error: "Search input cannot be empty" });
  // }
  if (!req.params.id) {
    console.log("search user recipe need to has authorId");
    return res.status(500).json({ error: "Internal Server Error" });
  }
  let keyword = req.query.q;
  let page = req.query.page ? req.query.page : 1;
  let userId = req.user ? req.user.userId : null;
  let authorId = req.params.id;

  let result = await searchMongoRecipe(
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
    return res.status(500).json({ error: "Internal Server Error" });
  }
  let keyword = req.query.q;
  let page = req.query.page ? req.query.page : 1;
  let authorId = req.params.id;

  let result = await searchMongoFavorite(authorId, keyword, page, userPageSize);
  res.status(200).json({ favorite: result });
  return;
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
};
