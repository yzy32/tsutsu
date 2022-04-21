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

module.exports = { errorHandler, arrayToString };
