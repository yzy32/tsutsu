require("dotenv").config();
const mongoose = require("mongoose");

async function mongoConnection() {
  try {
    const options = {
      authSource: "admin",
      user: process.env.MONGO_USER,
      pass: process.env.MONGO_PWD,
    };
    const mongo = await mongoose.connect(
      `mongodb://${process.env.IP}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`,
      options
    );
    mongoose.connection.once("open", () => {
      console.log("mongo is connected");
    });
    mongoose.connection.on("error", (err) => {
      console.log(err);
    });
    // mongoose.connection.on("disconnected", () => {
    //   console.log("mongo is disconnected");
    // });
  } catch (error) {
    console.log(error);
  }
}
mongoConnection();

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  userName: { type: String, required: true },
  introduction: { type: String, default: null },
  userImage: {
    type: String,
    default:
      "https://tsutsu-s3.s3.ap-northeast-1.amazonaws.com/assets/default/user.png",
  },
  following: { type: [String], default: [] },
  follower: { type: [String], default: [] },
  userFavorites: { type: [mongoose.SchemaTypes.ObjectId], default: [] },
  // userRecipes: { type: [mongoose.SchemaTypes.ObjectId], default: [] },
});

// userSchema.index({ userId: 1 });

const recipeSchema = new mongoose.Schema({
  timeCreated: { type: Date, default: Date.now },
  timeEdited: { type: Date, default: null },
  recipeImage: { type: String, required: true },
  servings: { type: Number, required: true },
  recipeSteps: {
    type: [
      {
        step: { type: String, required: true },
        image: { type: String, default: null },
        _id: false,
      },
    ],
    required: true,
  },
  reviewCount: { type: Number, default: 0 },
  recipeName: { type: String, required: true },
  description: { type: String, default: null },
  cookTime: { type: Number, required: true },
  ingredients: [{ type: String, required: true }],
  isPublic: { type: Boolean, default: "true" },
  favoriteCount: { type: Number, default: 0 },
  tags: [{ type: String, default: [] }],
  author: { type: String, required: true },
  authorId: { type: String, required: true },
  viewCount: { type: Number, default: 0 },
});

// recipeSchema.index({ recipeName: "text" });

//change review schema (userid, documentid)
const reviewSchema = new mongoose.Schema({
  // userName: { type: String, required: true },
  userId: { type: String, required: true },
  review: { type: String, required: true },
  timeCreated: { type: Date, default: Date.now },
  recipeId: { type: mongoose.SchemaTypes.ObjectId, required: true },
});

const keywordSchema = new mongoose.Schema({
  timeCreated: { type: Date, default: Date.now },
  userId: { type: String, default: null },
  queryField: { type: String, default: null },
  keyword: [{ type: String, required: true }],
});

module.exports = {
  User: mongoose.model("user", userSchema),
  Recipe: mongoose.model("recipes", recipeSchema),
  Keyword: mongoose.model("keyword", keywordSchema),
  Review: mongoose.model("review", reviewSchema),
};

//mongo schema
// async function mongoIngredientSchema() {
//   await mongoConnection();
//   const ingredientSchema = new mongoose.Schema({
//     ingredient: [String],
//   });
//   const categorySchema = new mongoose.Schema({
//     category: ingredientSchema,
//   });
//   return mongoose.model("category", categorySchema);
// }
