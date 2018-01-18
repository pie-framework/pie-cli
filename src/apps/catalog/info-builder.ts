import * as _ from 'lodash';
import * as hostedGitInfo from 'hosted-git-info';
import * as gitJs from 'simple-git';

function rawInfo(pkg: { repository: any }): any {

  if (!pkg || !pkg.repository) {
    return null;
  }

  if (_.isString(pkg.repository)) {
    return hostedGitInfo.fromUrl(pkg.repository);
  } else if (_.isObject(pkg.repository)) {
    if (pkg.repository.type === 'git') {
      return hostedGitInfo.fromUrl(pkg.repository.url);
    }
  }
}

export function gitInfo(pkg: { repository: any }): any {
  const raw = rawInfo(pkg);

  if (!raw) {
    return null;
  } else {
    return {
      domain: raw.domain,
      project: raw.project,
      ssh: raw.ssh(),
      type: raw.type,
      user: raw.user,
    };
  }
}

export function npmInfo(pkg: { name: string }): any {
  if (!pkg || !pkg.name) {
    return null;
  }
  const split = pkg.name.split('/');
  if (split.length === 1) {
    return {
      name: pkg.name
    };
  } else if (split.length === 2) {
    return {
      name: split[1],
      scope: split[0].replace('@', '')
    };
  }
}

export function gitHash(dir: string, short: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const repo = gitJs(dir);
      const opts = short ? ['--short', 'HEAD'] : ['HEAD'];
      repo.revparse(opts, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.trim());
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

export function gitTag(dir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const repo = gitJs(dir);

      repo.tag(['--points-at', 'HEAD'], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.trim());
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
