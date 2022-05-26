const retryES = require(`${__dirname}/./retryES`);
const getTrendingKeywords = require(`${__dirname}/./keyword`);

(() => {
  retryES();
  getTrendingKeywords();
})();
