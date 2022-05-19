const errorHandler = (cb) => {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

const arrayToString = (input) => {
  if (Array.isArray(input)) {
    input = input.join(" ");
  }
  return input;
};

const removeRecipePrivateInfo = (recipe) => {
  let privateRecipe = {
    _id: "",
    recipeName: recipe.recipeName,
    recipeImage: `https://tsutsu-s3.s3.ap-northeast-1.amazonaws.com/assets/default/private.jpeg`,
    ingredients: ["Top secret", "Top secret", "Top secret", "Top secret"],
  };
  // recipe._id = "";
  // recipe.recipeImage = `https://tsutsu-s3.s3.ap-northeast-1.amazonaws.com/assets/default/private.jpeg`;
  // recipe.ingredients = ["Top secret", "Top secret", "Top secret", "Top secret"];
  return privateRecipe;
};

const removeRedundantInfo = (recipe) => {
  let necesarryInfo = {
    _id: recipe._id,
    recipeName: recipe.recipeName,
    recipeImage: recipe.recipeImage,
    ingredients: recipe.ingredients,
    isPublic: recipe.isPublic,
  };
  return necesarryInfo;
};

const cleanRecipeForDB = (req) => {
  let recipe = {
    recipeImage: req.body.recipeImage,
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
      image: req.body.recipeStepImage[i],
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
  return recipe;
};

const mapFollowing = (authorFollowDetailList, userId, userFollowingIdList) => {
  let userFollowIdObj = {};
  // return the same element that authorFollowDetailList and userFollowingIdList contain
  // for better comparing performace, turn userFollowingIdList into obj
  if (userFollowingIdList) {
    userFollowIdObj = userFollowingIdList.reduce((accu, elem) => {
      accu[elem] = "";
      return accu;
    }, {});
  }
  // user itself should also be in the comparing scope, and return isFollowing = null
  let userObj = {};
  userObj[userId] = "";
  authorFollowDetailList.map((follow) => {
    if (userFollowIdObj.hasOwnProperty(follow.userId)) {
      follow.isFollowing = true;
      return;
    }
    if (userObj.hasOwnProperty(follow.userId)) {
      follow.isFollowing = null;
      return;
    }
  });
  return authorFollowDetailList;
};

module.exports = {
  errorHandler,
  arrayToString,
  removeRecipePrivateInfo,
  removeRedundantInfo,
  cleanRecipeForDB,
  mapFollowing,
};
