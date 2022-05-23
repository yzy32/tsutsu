require("dotenv").config({ path: __dirname + "../.env" });
const { assert, expect } = require("./set_up");
const {
  createUser,
  getUserInfo,
  getFollowDetails,
} = require("../server/models/user_model");
const bcrypt = require("bcrypt");
const tsutsuError = require("../utils/error");
const { User } = require("../utils/mongo");

describe("user", () => {
  it("normal sign up", async () => {
    const user = {
      userId: "chai",
      type: "native",
      email: "chai@gmail.com",
      password: "test",
    };
    const result = await createUser(
      user.userId,
      user.type,
      user.email,
      user.password
    );
    assert.hasAllKeys(
      result,
      ["user", "accessToken", "accessExpired", "error"],
      "result should have keys: user, accessToken, accessExpired, error"
    );
    assert.typeOf(result.error, "null", "error should be null");
  });

  it("sign up with existing userId", async () => {
    const user = {
      userId: "chai",
      type: "native",
      email: "chai02@gmail.com",
      password: "test",
    };
    const result = await createUser(
      user.userId,
      user.type,
      user.email,
      user.password
    );
    expect(result.error).haveOwnPropertyDescriptor("code", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: 11000,
    });
    expect(result.error.keyPattern).haveOwnPropertyDescriptor("userId");
  });

  it("sign up with existing userId", async () => {
    const user = {
      userId: "chai02",
      type: "native",
      email: "chai@gmail.com",
      password: "test",
    };
    const result = await createUser(
      user.userId,
      user.type,
      user.email,
      user.password
    );
    expect(result.error).haveOwnPropertyDescriptor("code", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: 11000,
    });
    expect(result.error.keyPattern).haveOwnPropertyDescriptor("email");
  });

  it("normal sign in", async () => {
    const user = { type: "native", email: "chai@gmail.com", password: "test" };
    const result = await getUserInfo(user.type, user.email);
    const decoded = await bcrypt.compare(user.password, result.password);
    expect(decoded).to.be.true;
  });

  it("sign in with wrong password", async () => {
    const user = { type: "native", email: "chai@gmail.com", password: "wrong" };
    const result = await getUserInfo(user.type, user.email);
    const decoded = await bcrypt.compare(user.password, result.password);
    expect(decoded).to.be.false;
  });

  it("sign in with non-existing email", async () => {
    const user = {
      type: "native",
      email: "chai_noExist@gmail.com",
      password: "test",
    };
    const result = await getUserInfo(user.type, user.email);
    expect(result).to.be.null;
  });

  it("get follower list", async () => {
    const authorFollower = {
      authorId: "yazhu",
      followField: "follower",
      page: 1,
      followPageSize: 20,
    };
    const result = await getFollowDetails(
      authorFollower.authorId,
      authorFollower.followField,
      authorFollower.page,
      authorFollower.followPageSize
    );
    assert.hasAllKeys(result, ["followDetailList"]);
  });

  it("get non-existing author's follower list", async () => {
    const authorFollower = {
      authorId: "not-exist",
      followField: "follower",
      page: 1,
      followPageSize: 20,
    };
    try {
      const result = await getFollowDetails(
        authorFollower.authorId,
        authorFollower.followField,
        authorFollower.page,
        authorFollower.followPageSize
      );
    } catch (error) {
      const err = new tsutsuError(404, "Author not found");
      expect(error.status).to.equal(err.status);
      expect(error.message).to.equal(err.message);
    }
  });

  after(async () => {
    try {
      await User.findOneAndDelete({ userId: "chai" });
    } catch (error) {
      console.log(error);
    }
  });
});
