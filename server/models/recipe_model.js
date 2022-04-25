const { resourceLimits } = require("worker_threads");
const es = require("../../utils/es");
const { Recipe, ObjectId } = require("../../utils/mongo");
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
    const result = await Recipe.findById(id);
    return result;
  } catch (error) {
    // console.log(error);
    return error;
  }
};

module.exports = {
  searchIngredient,
  searchRecipe,
  getRecipeById,
};
