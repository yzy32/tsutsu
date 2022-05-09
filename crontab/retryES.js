const { Recipe, esLog } = require(`${__dirname}/../utils/mongo`);
const es = require(`${__dirname}/../utils/es`);

const retryES = async () => {
  try {
    let logs = await esLog.find({});
    // console.log(logs);
    for (let i = 0; i < logs.length; i++) {
      switch (logs[i].type) {
        case "setPublic": {
          const isPublic = await Recipe.findById(logs[i].recipeId).select(
            "isPublic"
          );
          console.log("public: ", isPublic);
          //TODO: es
          const test = await es.index({
            index: "testerror",
            id: logs[i].recipeId,
            body: {
              toPublic: isPublic.isPublic,
              recipeName: "test",
              favoriteCount: 0,
            },
          });
          console.log(test);
          // const esResult = es.update({
          //   index: "recipes",
          //   id: logs[i].recipeId,
          //   doc: { isPublic: isPublic.isPublic },
          // });
          // console.log(esResult);
          break;
        }
        case "addFavorite": {
          console.log("addFavorite: ", logs[i].recipeId);
          //TODO: es
          const test = await es.update({
            index: "testerror",
            id: logs[i].recipeId,
            script: {
              source: "ctx._source.favoriteCount++",
            },
          });
          console.log(test);
          // const esResult = await es.update({
          //   index: "recipes",
          //   id: logs[i].recipeId,
          //   script: {
          //     source: "ctx._source.favoriteCount++",
          //   },
          // });
          // console.log(esResult);
          break;
        }
        case "removeFavorite": {
          console.log("removeFavorite: ", logs[i].recipeId);
          //TODO: es
          const test = await es.index({
            index: "testerror",
            id: logs[i].recipeId,
            script: {
              source: "ctx._source.favoriteCount--",
            },
          });
          // const esResult = await es.update({
          //   index: "recipes",
          //   id: logs[i].recipeId,
          //   script: {
          //     source: "ctx._source.favoriteCount--",
          //   },
          // });
          // console.log(esResult);
          break;
        }
        case "createRecipe": {
          let recipe = await Recipe.findById(logs[i].recipeId).lean();
          delete recipe.servings;
          delete recipe.recipeSteps;
          console.log("createRecipe: ", recipe);
          //TODO: es
          const test = await es.index({
            index: "testerror",
            body: {
              id: logs[i].recipeId,
              toPublic: true,
              recipeName: "test",
              favoriteCount: 0,
            },
          });
          console.log(test);
          // const esResult = await es.index({
          //   index: "recipes",
          //   id: logs[i].recipeId,
          //   body: recipe,
          // });
          // console.log(esResult);
          break;
        }
      }
    }
  } catch (error) {
    console.log(error);
    //TODO: send mail/slack to notify
  }
};

retryES();
