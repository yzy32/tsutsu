const path = require("path");
const {
  searchIngredient,
  searchRecipe,
  getRecipeById,
} = require("../models/recipe_model");
const { storeKeywords } = require("../models/keyword_model");
const { arrayToString } = require("../../utils/util.js");
const { Recipe } = require("../../utils/mongo");
const mongoose = require("mongoose");
const es = require("../../utils/es");
const pageSize = 10;

const getSearchRecipe = async (req, res) => {
  console.log("user in search: ", req.user);
  console.log("login status in search: ", req.loginStatus);
  try {
    let {
      q,
      ingrIncl,
      ingrExcl,
      otherKeyword,
      cookTime,
      sort,
      myrecipe,
      page,
    } = req.query;
    page = parseInt(page) || 1;
    cookTime = parseInt(cookTime);
    // ingrIncl = arrayToString(ingrIncl);
    // ingrExcl = arrayToString(ingrExcl);
    // otherKeyword = arrayToString(otherKeyword);
    console.log(
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
    //TODO: get image from mongo or s3 based on document_id
    for (let i = 0; i < result.hits.length; i++) {
      if (!result.hits[i].highlight) {
        result.hits[i].highlight = {
          ingredients: [],
        };
      }
      recipe = {
        recipeId: result.hits[i]._id,
        recipeName: result.hits[i]._source.recipeName,
        recipeImage: null,
        authorId: result.hits[i]._source.authorId,
        author: result.hits[i]._source.author,
        cookTime: result.hits[i]._source.cookTime,
        favoriteCount: result.hits[i]._source.favoriteCount,
        ingredients: result.hits[i]._source.ingredients,
        ingrMatchedCount: result.hits[i].highlight.ingredients.length,
      };

      recipes.push(recipe);
    }
    //record keyword
    await keywordsToMongo(req);

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
  } catch (error) {
    console.log(error);
    return error;
  }
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
    console.log(documents);
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
    recipe.isPublic = req.body.isPublic;
  }
  if (req.body.tags) {
    let tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
    recipe.tags = tags;
  }
  //TODO: split db operation to model
  let recipeInserted = await Recipe.create(recipe);
  let result = await recipeInserted.save();
  console.log("recipe", recipe);
  console.log("mongo result for saving: ", result);
  let recipeES = recipe; //shallow copy
  delete recipeES.servings;
  delete recipeES.recipeSteps;
  let esResult = await es.index({
    index: "recipes",
    id: result.id,
    document: recipeES,
  });
  console.log("es result for saving: ", esResult);
  res.status(200).json({ msg: "success" });
  return;
};

const getRecipe = async (req, res) => {
  //TODO: check if mongo has this recipe
  const isId = await mongoose.isValidObjectId(req.params.id);
  const result = await getRecipeById(req.params.id);
  console.log("is id? ", isId);
  console.log(result);
  //if not, return 404  //FIXME: how to catch non-12byte id (mongo return error instread of null)
  if (!result || !isId) {
    res.status(404).json({ error: "Recipe Not Found" });
    return;
  }
  //TODO: if yes, return recipe data
  res.status(200).json({ recipe: result });
  return;
};

module.exports = { getSearchRecipe, createRecipe, getRecipe };
