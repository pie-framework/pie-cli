import { transform } from 'babel-core';
import resolve from 'resolve';
import { join } from 'path';
import { buildLogger } from '../log-factory';
import vm from 'vm';
import { readFileSync } from 'fs-extra';

const logger = buildLogger();

/**
 * @param src - the js source code.
 * @return the module running in it's own sandbox
 */

export function mkFromSrc(src, path) {
  logger.debug('[mk] path: ', path);

  let babelised = transform(src, {
    plugins: [resolve.sync('babel-plugin-transform-es2015-modules-commonjs', { basedir: join(__dirname, '../..') })]
  });

  let sandboxedModule = {
    exports: {}
  };

  let sandbox = {
    module: sandboxedModule,
    exports: sandboxedModule.exports
  };

  var context = vm.createContext(sandbox);
  logger.debug('[mkFromSrc] code: ', babelised.code);

  let script = new vm.Script(babelised.code, {
    filename: path
  });

  script.runInContext(context);
  return sandboxedModule.exports;
}

export function mk(path) {
  logger.debug('[mk] path: ', path);
  let src = readFileSync(path, 'utf8');
  return mkFromSrc(src, path);
}