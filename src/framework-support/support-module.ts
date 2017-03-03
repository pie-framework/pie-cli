import { transform } from 'babel-core';
import * as resolve from 'resolve';
import { join } from 'path';
import { buildLogger } from 'log-factory';
import * as vm from 'vm';
import { readFileSync } from 'fs-extra';
import * as m from 'module';
import { SupportInfo } from './support-info';

const logger = buildLogger();

/**
 * @param src - the js source code.
 * @return the module running in it's own sandbox
 */

class Sandbox {
  readonly module;
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
export function mkFromSrc(src, path): SupportInfo {
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

export function mkFromPath(path): SupportInfo {
  logger.silly('[mkFromPath] path: ', path);
  let src = readFileSync(path, 'utf8');
  return mkFromSrc(src, path);
}