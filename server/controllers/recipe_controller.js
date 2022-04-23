const path = require("path");
const { searchIngredient, searchRecipe } = require("../models/recipe_model");
const { arrayToString } = require("../../utils/util.js");
const { nextTick } = require("process");
const pageSize = 10;

const getRecipe = async (req, res) => {
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
    ingrIncl = arrayToString(ingrIncl);
    ingrExcl = arrayToString(ingrExcl);
    otherKeyword = arrayToString(otherKeyword);
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
      const keywords = await categorizeKeywords([q]);
      console.log("cagegorize keywords: ", keywords);
      ingrIncl = keywords.ingrIncl;
      otherKeyword = keywords.otherKeywords;
      ingrExcl = "";
    }

    //TODO: wrong token, 403, redirect to sign in page
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
        mainImage: null,
        authorId: result.hits[i]._source.authorId,
        author: result.hits[i]._source.author,
        cookTime: result.hits[i]._source.cookTime,
        favoriteCount: result.hits[i]._source.favoriteCount,
        ingredients: result.hits[i]._source.ingredients,
        ingrMatchedCount: result.hits[i].highlight.ingredients.length,
      };

      recipes.push(recipe);
    }
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

async function categorizeKeywords(keywords) {
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
}

module.exports = { getRecipe };
