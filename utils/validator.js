const Joi = require("joi");

const signup = Joi.object({
  userName: Joi.string().min(4).required(),
  userId: Joi.string().trim().min(4).required(),
  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: false } }),
  password: Joi.string().min(4).required(),
});

const createRecipe = Joi.object({
  recipeName: Joi.string().required(),
  description: Joi.string().required(),
  cookTime: Joi.number().required(),
  servings: Joi.number().required(),
  ingredients: Joi.array().items(Joi.string().required()),
});

module.exports = {
  signup,
  createRecipe,
};
