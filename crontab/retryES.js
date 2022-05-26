const { Recipe, esLog } = require(`${__dirname}/../utils/mongo`);
const es = require(`${__dirname}/../utils/es`);
const nodemailer = require("nodemailer");
require("dotenv").config({ path: `${__dirname}/../.env` });

const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAIL,
    pass: process.env.MAILPWD,
  },
});

const retryES = async () => {
  let logId = null;
  try {
    let logs = await esLog.find({});
    if (logs.length == 0) {
      console.log("no error log");
      return;
    }
    for (let i = 0; i < logs.length; i++) {
      logId = logs[i]._id;
      switch (logs[i].type) {
        case "setPublic": {
          const isPublic = await Recipe.findById(logs[i].recipeId).select(
            "isPublic"
          );
          console.log("public: ", isPublic);
          const esResult = await es.update({
            index: "recipes",
            id: logs[i].recipeId,
            doc: { isPublic: isPublic.isPublic },
          });
          console.log("success update in es: ", esResult);
          break;
        }
        case "addFavorite": {
          console.log("addFavorite: ", logs[i].recipeId);
          const esResult = await es.update({
            index: "recipes",
            id: logs[i].recipeId,
            script: {
              source: "ctx._source.favoriteCount++",
            },
          });
          console.log("success update in es: ", esResult);
          break;
        }
        case "removeFavorite": {
          console.log("removeFavorite: ", logs[i].recipeId);
          const esResult = await es.update({
            index: "recipes",
            id: logs[i].recipeId,
            script: {
              source: "ctx._source.favoriteCount--",
            },
          });
          console.log("success update in es: ", esResult);
          break;
        }
        case "createRecipe": {
          let recipe = await Recipe.findById(logs[i].recipeId)
            .select({
              _id: 0,
              recipeName: 1,
              recipeImage: 1,
              description: 1,
              cookTime: 1,
              ingredients: 1,
              isPublic: 1,
              favoriteCount: 1,
              tags: 1,
              author: 1,
              authorId: 1,
            })
            .lean();
          console.log("createRecipe: ", recipe);
          const esResult = await es.index({
            index: "recipes",
            id: logs[i].recipeId,
            body: recipe,
          });
          console.log("success update in es: ", esResult);
          break;
        }
        case "updateRecipe": {
          let recipe = await Recipe.findById(logs[i].recipeId)
            .select({
              _id: 0,
              recipeName: 1,
              recipeImage: 1,
              description: 1,
              cookTime: 1,
              ingredients: 1,
              isPublic: 1,
              favoriteCount: 1,
              tags: 1,
              author: 1,
              authorId: 1,
            })
            .lean();
          console.log("updateRecipe: ", recipe);
          const esResult = await es.update({
            index: "recipes",
            id: logs[i].recipeId,
            doc: recipe,
          });
          console.log("success update in es: ", esResult);
          break;
        }
      }
      //remove from mongo
      const result = await esLog.deleteOne({ _id: logs[i]._id });
      console.log("success delete log from mongo: ", result);
    }
  } catch (error) {
    console.log(error);
    //send mail/slack to notify
    let text = { logId: logId, error: JSON.stringify(error) };
    mailOptions = {
      from: "learn2021yy@gmail.com",
      to: "learn2021yy@gmail.com",
      subject: "[Alert] ES retry error",
      text: JSON.stringify(text),
    };
    mailTransport.sendMail(mailOptions, (mailError, info) => {
      if (mailError) {
        console.log("send mail error: ", mailError);
      } else {
        console.log("success sending mail: ", info);
      }
    });
  }
};

// retryES();
module.exports = retryES;
