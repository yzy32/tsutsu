const Joi = require("joi");

const signup = Joi.object({
  userName: Joi.string().min(4).required(),
  userId: Joi.string().trim().min(4).required(),
  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: false } }),
  password: Joi.string().min(4).required(),
});

// const createRecipe = Joi.object({

// });

module.exports = {
  signup,
  // createRecipe,
};
