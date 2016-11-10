import { transform } from 'babel-core';
import resolve from 'resolve';
import { join } from 'path';
import { buildLogger } from '../log-factory';
import vm from 'vm';
import { readFileSync } from 'fs-extra';
import * as m from 'module';
import _ from 'lodash';
import request from 'request';

const logger = buildLogger();

/**
 * @param src - the js source code.
 * @return the module running in it's own sandbox
 */

class Sandbox {
  constructor() {
    this.module = {
      exports: {}
    }
  }
  get exports() {
    return this.module.exports;
  }
}

/** 
 * interprets a support module's logic in an isolated way so it doesnt come into conflict with this lib's module loader.
 * Note: We must run in *this* context to allow `instanceof` to continue to function. 
 * @see: https://github.com/nodejs/node-v0.x-archive/issues/1277
 */
export function mkFromSrc(src, path) {
  logger.debug('[mkFromSrc] path: ', path);

  let babelised = transform(src, {
    plugins: [resolve.sync('babel-plugin-transform-es2015-modules-commonjs', { basedir: join(__dirname, '../..') })]
  });

  logger.silly('[mkFromSrc] code: ', babelised.code);
  let wrapped = m.wrap(babelised.code);
  logger.silly('[mkFromSrc] wrapped: ', wrapped);

  let sandbox = new Sandbox();

  let script = new vm.Script(wrapped, {
    filename: path
  });

  let fn = script.runInThisContext();
  fn(sandbox.exports, () => null, sandbox.module, path);
  logger.silly('[mkFromSrc] sandbox: ', JSON.stringify(sandbox));

  return sandbox.exports.default ? sandbox.exports.default : sandbox.exports;
}

export function mkFromPath(path) {
  logger.silly('[mkFromPath] path: ', path);
  let src = readFileSync(path, 'utf8');
  return mkFromSrc(src, path);
}

let installFromUrl = (urls) => {
  logger.silly(`[installFromUrl] urls: ${JSON.stringify(urls, null, '  ')}`);
  let promises = _.map(urls, u => {
    logger.silly(`[installFromUrl] u: ${u}`);
    return new Promise((resolve, reject) => {
      request(u, (err, response, body) => {
        if (err) {
          reject(err);
        } else {
          resolve({ id: u, src: body });
        }
      });
    })
  });
  return Promise.all(promises);
}

/**
 * @param dir the root dir 
 * @param ids : string[] - an array of either local paths or urls
 */

export function loadSupportModules(dir, ids) {
  logger.debug(`[loadSupportModules] dir: ${dir}, ${ids}`);

  let localSrc = _(ids).map(i => {
    try {
      let path = resolve.sync(i);
      logger.silly(`[loadSupportModules] resolved: ${i} -> ${path}`);
      return { id: i, src: readFileSync(path, 'utf8') };
    } catch (e) {
      return undefined;
    }
  }).compact().value();

  let remainingIds = _.difference(ids, _.map(localSrc, 'id'));
  logger.silly(`[loadSupportModules] remainingIds: ${JSON.stringify(remainingIds, null, '  ')}`);

  return installFromUrl(remainingIds)
    .then(urlSrc => {
      let rest = _.difference(remainingIds, _.map(urlSrc, 'id'));

      if (rest.length > 0) {
        throw new Error('unable to install the following support modules: ' + rest.join(', '));
      } else {
        return _(localSrc)
          .concat(urlSrc)
          .map(o => mkFromSrc(o.src, o.id))
          .value();
      }
    });
}
