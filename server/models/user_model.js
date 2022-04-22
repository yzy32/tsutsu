const bcrypt = require("bcrypt");
const User = require("../../utils/mongo");
const jwt = require("jsonwebtoken");

const createUser = async (userName, userId, type, email, password) => {
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT));
    const hashedPwd = await bcrypt.hash(password, salt);
    const user = {
      userName: userName,
      userId: userId,
      type: type,
      email: email,
      password: hashedPwd,
      userImage: "default",
    };
    const accessToken = jwt.sign(
      {
        type: user.type,
        userName: user.userName,
        email: user.email,
        userImage: user.userImage,
      },
      process.env.TOKEN_SECRET
    );
    const accessExpired = process.env.TOKEN_EXPIRE;
    const userInserted = await User.create(user);
    await userInserted.save();
    let result = { user, accessToken, accessExpired, error: null };
    return result;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const getUserInfo = async (type, email, password) => {
  try {
    User.get;
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = { createUser };
