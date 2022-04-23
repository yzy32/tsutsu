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

module.exports = mongoose.model("user", userSchema);

//mongo schema
// async function mongoRecipeSchema() {
//   await mongoConnection();
//   const recipeSchema = new mongoose.Schema({
//     timeCreated: { type: Date, default: Date.now },
//     timeEdited: { type: Date, default: null },
//     recipeImage: { type: String, required: true },
//     servings: { type: Number, required: true },
//     recipeSteps: {
//       type: [
//         {
//           step: { type: String, required: true },
//           image: { type: String, default: null },
//           _id: false, //FIXME: how to quickly find the step and update it >> use step "x"
//         },
//       ],
//       required: true,
//     },
//     recipeReviews: {
//       type: [
//         {
//           userName: { type: String, required: true },
//           userId: { type: mongoose.SchemaTypes.ObjectId, required: true },
//           review: { type: String, required: true },
//           timeCreated: { type: Date, default: Date.now },
//           _id: false,
//         },
//       ],
//       default: [],
//     },
//     recipeName: { type: String, required: true },
//     description: { type: String, default: null },
//     cookTime: { type: Number, required: true },
//     ingredients: [{ type: String, required: true }],
//     isPublic: { type: Boolean, default: "true" },
//     favoriteCount: { type: Number, default: 0 },
//     tags: [{ type: String, default: [] }],
//     author: { type: String, required: true },
//     // authorId: { type: mongoose.SchemaTypes.ObjectId, required: true },
//     authorId: { type: String, required: true },
//   });
//   return mongoose.model("recipes", recipeSchema);
// }

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
