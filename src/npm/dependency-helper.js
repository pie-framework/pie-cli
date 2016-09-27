import semver from 'semver';
import fs from 'fs-extra';
import path from 'path';

export let isGitUrl = (str) => {
  var re = /(?:git|ssh|https?|git@[\w\.]+):(?:\/\/)?[\w\.@:\/~_-]+\.git(?:\/?|\#[\d\w\.\-/_]+?)$/;
  return re.test(str);
};

export let isSemver = (str) => semver.valid(str) !== null;

export let pathIsDir = (root, v) => {
  try {
    let resolved = path.resolve(root, v);
    let stat = fs.lstatSync(resolved);
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
};
