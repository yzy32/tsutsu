const {
  getTrendingKeyword,
} = require(`${__dirname}/../server/models/keyword_model.js`);

const redisClient = require(`${__dirname}/../utils/redis.js`);

const getTrendingKeywords = async () => {
  try {
    let hour = 24;
    let limit = 3;
    let currentTime = Date.now();
    let past = currentTime - 60 * 60 * 1000 * hour;
    let currentDatetime = new Date().toISOString();
    let pastDatetime = new Date(past).toISOString();
    let keywords = await getTrendingKeyword(
      pastDatetime,
      currentDatetime,
      limit
    );
    if (keywords.length < 3) {
      hour = hour * 30;
      past = currentTime - 60 * 60 * 1000 * hour;
      pastDatetime = new Date(past).toISOString();
      keywords = await getTrendingKeyword(pastDatetime, currentDatetime, limit);
    }
    if (redisClient.ready) {
      await redisClient.del("keywords");
      let multi = await redisClient.multi();
      for (let i = 0; i < keywords.length; i++) {
        await multi.RPUSH("keywords", keywords[i]._id);
      }
      await multi.exec();
      console.log("success to set keywords in redis: ", keywords);
    }
    if (!redisClient.ready) {
      let error = new Error("redis is not ready");
      throw error;
    }
  } catch (error) {
    console.log("set trending keyword in redis error: ", error);
  }
};

// getTrendingKeywords();
module.exports = getTrendingKeywords;
