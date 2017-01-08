const conventionalRecommendedBump = require('conventional-recommended-bump')

module.exports = (options, parserOpts, cb) => conventionalRecommendedBump(
  Object.assign({}, options, { preset: 'angular' }),
  parserOpts,
  (err, res) => cb(err, res != null ? res.releaseType : res)
);
