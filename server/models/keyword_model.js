const { Keyword } = require("../../utils/mongo");

const storeKeywords = async (documents) => {
  try {
    const result = await Keyword.insertMany(documents);
    // console.log("insert keyword result: ", result);
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getTrendingKeyword = async (pastDatetime, currentDatetime, limit) => {
  try {
    const result = await Keyword.aggregate([
      {
        $match: {
          timeCreated: {
            $gte: new Date(pastDatetime),
            $lt: new Date(currentDatetime),
          },
        },
      },
      { $match: { queryField: "ingrIncl" } },
      { $unwind: "$keyword" },
      { $group: { _id: "$keyword", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: limit },
    ]);
    // console.log(result);
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  storeKeywords,
  getTrendingKeyword,
};
