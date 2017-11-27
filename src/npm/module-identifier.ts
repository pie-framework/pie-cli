import * as _ from 'lodash';
import * as hostedGitInfo from 'hosted-git-info';
import * as semver from 'semver';

import { normalize, resolve } from 'path';

import { buildLogger } from 'log-factory';

const logger = buildLogger();

const trimFilePath = (f: string): string => (
  f.replace('/private', '')
    .replace('file:///', '/')
    .replace('file://', '')
);

const filePathMatches = (dir: string, path: string, value: string) => {
  const resolvedPath = resolve(dir, path);
  logger.silly('[moduleIdForPath] resolvedPath: ', resolvedPath, 'value: ', value);
  const out = trimFilePath(value) === trimFilePath(resolvedPath);
  logger.silly('[moduleIdForPath] v matches resolvedPath?', out);
  return out;
};

const gitUrlMatches = (path: string, value: string) => {
  logger.silly('[gitUrlMatches] path: ', path, 'value: ', value);
  const pathInfo = hostedGitInfo.fromUrl(path.toLowerCase());
  const shortcut = pathInfo ? pathInfo.shortcut() : '?';
  logger.silly('[gitUrlMatches] shortcut: ', shortcut);
  return shortcut === value;
};

const semverMatches = (path: string, value: string) => {
  const [base] = path.split('@');
  return base === value;
};

/**
 * Given a raw path/semver/git url
 * Return the moduleId that it matches in the package.json
 * @param pkg
 * @param path
 */
export function moduleIdForPath(dir: string, pkg: { dependencies: { [key: string]: any } }, path: string): string {
  logger.silly('[moduleIdForPath] path: ', path);

  if (!pkg || !dir || !path) {
    return;
  }

  logger.silly('[moduleIdForPath] this.pkg: ', JSON.stringify(pkg, null, '  '));
  const match = _(pkg.dependencies)
    .map((v, k) => ({ v, k }))
    .find(({ v, k }) => {
      return filePathMatches(dir, path, v) ||
        gitUrlMatches(path, v) ||
        semverMatches(path, k);
    });

  if (match) {
    return match.k;
  }
}

export const normalizeValue = (value: string): { name: string, semver: string } => {
  const tweaked = value.indexOf('@') === 0 ? value.substring(1) : value;
  const normalized = tweaked.indexOf('@') === -1 ? `${tweaked}@latest` : tweaked;
  const [name, ver] = normalized.split('@');
  return { name: value.indexOf('@') === 0 ? `@${name}` : name, semver: ver };
};

/**
 * Normalize file paths to be a/b/c
 * @param p
 */
export const normalizePath = (p: string): string => {
  if (typeof p !== 'string') {
    throw new TypeError('expected a string');
  }
  return normalize(p)
    .replace(/[\\\/]+/g, '/')
    .replace('file:', '');
};

/**
 * value used to install the dependency eg:
 * - x
 * - x@latest
 * - x@1.2.3
 * - x@~1.2.3
 * - github:org/pkg
 * - org/pkg
 * - local-path/to/pkg
 */
export function matchInstallDataToRequest(
  requested: string,
  dependencies: { [key: string]: any }): { moduleId: string, data: any } {

  const zipped: { moduleId: string, data: any }[] = _.map(
    dependencies,
    (data: any, moduleId) => ({ data, moduleId }));

  return _.find(zipped, ({ data, moduleId }) => {
    if (_.startsWith(data.resolved, 'file:')) {
      // it's a local file resolution
      return normalizePath(requested) === normalizePath(data.from);
    } else if (_.startsWith(data.resolved, 'git')) {
      // it's a git repo resolution
      const requestedGit = hostedGitInfo.fromUrl(requested);
      const fromGit = hostedGitInfo.fromUrl(data.from);
      return requestedGit && fromGit && requestedGit.shortcut().toLowerCase() === fromGit.shortcut().toLowerCase();
    } else {
      // it's an npm package resolution
      const requestedNormalized = normalizeValue(requested);
      const fromNormalized = normalizeValue(data.from);

      if (requestedNormalized.name === fromNormalized.name) {
        const range = semver.validRange(requestedNormalized.semver);

        if (range && semver.satisfies(data.version, range)) {
          return true;
        } else {
          if (requestedNormalized.semver === 'latest') {
            return true;
          } else {
            return semver.eq(requestedNormalized.semver, data.version);
          }
        }
      } else {
        return false;
      }
    }
  });
}
