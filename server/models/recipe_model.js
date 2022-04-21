const { resourceLimits } = require("worker_threads");
const es = require("../../utils/es");

async function searchIngredient(keyword) {
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
}

async function searchRecipe(
  ingrIncl,
  ingrExcl,
  otherKeyword,
  cookTime,
  sort,
  myrecipe,
  page,
  pageSize
) {
  let recipeFrom = pageSize * (page - 1);
  console.log("recipe from: ", recipeFrom);
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
    sortQuery = [{ cookTime: { order: "asc" } }, { _score: { order: "desc" } }];
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
    fields: [
      "recipeName",
      "ingredients",
      "cookTime",
      "favoriteCount",
      "authodId",
      "author",
    ],
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
    searchInput.query.bool.filter = [
      { range: { cookTime: { lte: cookTime } } },
    ];
  }

  const result = await es.search(searchInput);
  // console.log(result.hits.hits);
  // console.log(result.hits.total.value);
  return result.hits;
}

module.exports = {
  searchIngredient,
  searchRecipe,
};
