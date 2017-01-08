var SemanticReleaseError = require('@semantic-release/error');
var exec = require('child_process').exec;
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
      return cb(new Error("Couldn't find extension on marketplace"));
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

    /*
     * Now, we fetch the latest git tags,
     * This is necessary because the VS Marketplace doesn't store the `gitHead` of releases a la npm.
     * To get the list of commits between last release on marketplace and the current HEAD
     * the best way I've determined is fetching the tags, and prefixing `v` to current version to get
     * the nearest tag, and passing that as the ref in gitHead.
     *
     * Another (more stricter) way is to get the actual tag using 'git describe --tags --abbrev=0,
     * but since the version number and tag name are in-sync (thanks to semantic-release)
     * so, I'll just use the version number.
     */
    exec('git fetch', {}, function(err2, stdout2, stderr2) {
      if (err) {
        console.log('error while fetching git tags', err);
        return cb(err);
      }

      cb(null, {
        version,
        gitHead: `v${version}`,
        get tag () {
          npmlog.warn('deprecated', 'tag will be removed with the next major release')
          return npm.tag
        }
      });
    })
  });
}