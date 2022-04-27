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
    mongoose.connection.on("connected", () => {
      console.log("mongo is connected");
    });
    mongoose.connection.on("error", (err) => {
      console.log(err);
    });
    mongoose.connection.on("disconnected", () => {
      console.log("mongo is disconnected");
    });
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
  userImage: { type: String, default: null },
  following: { type: [mongoose.SchemaTypes.ObjectId], default: [] },
  follower: { type: [mongoose.SchemaTypes.ObjectId], default: [] },
  userFavorites: { type: [mongoose.SchemaTypes.ObjectId], default: [] },
  useRecipes: { type: [mongoose.SchemaTypes.ObjectId], default: [] },
});

userSchema.index({ userId: 1 });

//TODO:
// const followSchema = new mongoose.Schema({
//   follower: { type: String, required: true },
//   following: { type: String, required: true },
// });

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
  // recipeReviews: {
  //   type: [
  //     {
  //       userName: { type: String, required: true },
  //       userId: { type: mongoose.SchemaTypes.ObjectId, required: true },
  //       review: { type: String, required: true },
  //       timeCreated: { type: Date, default: Date.now },
  //       _id: false,
  //     },
  //   ],
  //   default: [],
  // },
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
});

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
