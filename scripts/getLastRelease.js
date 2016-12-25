var SemanticReleaseError = require('@semantic-release/error');
var request = require('request');
var npmlog = require('npmlog');
var _get = require('lodash.get');

function query(packageName, cb) {
  return request
    .post('https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery?api-version=3.0-preview.1', {
      accept: 'application/json',
      contentType: 'application/json',
      json: true,
      body: {"filters":[{"criteria":[{"filterType":8,"value":"Microsoft.VisualStudio.Code"},{"filterType":10,"value":packageName}],"pageNumber":1,"pageSize":50,"sortBy":0,"sortOrder":0}],"assetTypes":["Microsoft.VisualStudio.Services.Content.Details","Microsoft.VisualStudio.Services.VSIXPackage"],"flags":914},
    }, cb);
}

module.exports = function(pluginConfig, {pkg, npm, plugins, options}, cb) {
  npmlog.level = npm.loglevel || 'warn'
  let clientConfig = {log: npmlog}
  // disable retries for tests
  if (pluginConfig && pluginConfig.retry) clientConfig.retry = pluginConfig.retry

  query(pkg.author.name.replace(' ', '+'), function(err, res, body) {
    if (err) {
      console.log('error while retrieving', err);
      return cb(err);
    } else if (res.statusCode !== 200) {
      console.log('not found', res.body);
      return cb(null, {});
    }

    const list = _get(body, 'results[0].extensions')
    if (!list) {
      return;
    }
    const ext = list.find((extension) => extension.extensionName === pkg.name);
    let version = ext.versions[0].version;

    if (!version &&
      options &&
      options.fallbackTags) {
      version = options.fallbackTags
    }

    if (!version) {
      return cb(new SemanticReleaseError(
        `There is no release in the marketplace with the version "${npm.tag}" yet.
Tag a version manually or define "fallbackTags".`, 'ENODISTTAG'))
    }

    cb(null, {
      version,
      // gitHead: data.versions[version].gitHead,
      get tag () {
        npmlog.warn('deprecated', 'tag will be removed with the next major release')
        return npm.tag
      }
    });
  });
}