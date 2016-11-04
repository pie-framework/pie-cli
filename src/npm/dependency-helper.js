//@flow
import semver from 'semver';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import _ from 'lodash';

export let isGitUrl = (str) => {
  var re = /(?:git|ssh|https?|git@[\w\.]+):(?:\/\/)?[\w\.@:\/~_-]+\.git(?:\/?|\#[\d\w\.\-/_]+?)$/;
  return re.test(str);
};

export let isSemver = (str) => semver.validRange(str) !== null || semver.valid(str) !== null;

export let pathIsDir = (root, v) => {
  try {
    let resolved = path.resolve(root, v);
    let stat = fs.lstatSync(resolved);
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
};

export let dependenciesToHash = (dependencies) => {
  if (!dependencies || !_.isObject(dependencies) || _.isEmpty(dependencies)) {
    throw new Error('dependencies must be an non empty object');
  }

  let raw = _.reduce(dependencies, (acc, value, key) => {
    acc += `${key}:${value}`;
    return acc;
  }, '');

  return crypto.createHash('md5').update(raw).digest('hex');
};
