import path from 'path';
import webpack from 'webpack';
import _ from 'lodash';
import { fileLogger } from '../log-factory';
import { configToJsString, writeConfig } from './webpack-write-config';
import resolve from 'resolve';
import { removeFiles } from '../file-helper';
import fs from 'fs-extra';

const logger = fileLogger(__filename);

let baseConfig = (root) => {
  return {
    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: resolve.sync('babel-loader', { basedir: root }),
          query: {
            babelrc: false,
            presets: [
              resolve.sync('babel-preset-es2015', { basedir: root })
            ]
          },
        }
      ]
    },
    resolveLoader: {
      root: path.resolve(path.join(root, 'node_modules')),
    },
    resolve: {
      root: path.resolve(path.join(root, 'node_modules')),
      extensions: ['', '.js', '.jsx']
    }
  }
};

const ENTRY_JS = 'entry.js';

function writeEntryJs(root, pies) {

  let registerElementSrc = (p, index) => `import comp${index} from '${p}';
document.registerElement('${p}', comp${index});
`;

  let init = (p, index) => {
    if (p.hasOwnProperty('initSrc')) {
      return p.initSrc;
    } else {
      return registerElementSrc(p, index);
    }
  };

  let js = _.map(pies, init).join('\n');

  return new Promise((resolve, reject) => {
    let entryPath = path.join(root, ENTRY_JS);
    fs.writeFile(path.join(root, ENTRY_JS), js, { encoding: 'utf8' }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(entryPath);
      }
    });
  });
}


/**
 * @param loaders {Array[{(resolve) => Object}]}
 */
function webpackBundle(root, entryJs, libraries, bundleName, getLoaders) {
  logger.debug('bundle, root', root, 'entryJs', entryJs, 'pies', libraries);

  let config = _.extend({
    context: root,
    entry: path.join(root, entryJs),
    output: { filename: bundleName, path: root }
  }, baseConfig(root));

  let frameworkLoaders = getLoaders((k) => resolve.sync(k, { basedir: root }));

  logger.silly(`frameworkLoaders: ${JSON.stringify(frameworkLoaders)}`);
  config.module.loaders = config.module.loaders.concat(frameworkLoaders);

  config.module.loaders = _.map(config.module.loaders, (l) => {
    let orNames = libraries.join('|');
    let str = `node_modules/(?!(${orNames})/).*`;
    logger.debug('regex string: ', str);
    l.exclude = new RegExp(str);
    return l;
  });

  logger.silly('webpack config', configToJsString(config));

  //TODO: Add a flag for this - can be useful for development.
  if (process.env.WRITE_WEBPACK_CONFIG) {
    writeConfig(path.join(root, 'webpack.config.js'), config);
  }

  return new Promise((resolve, reject) => {
    logger.info('compiling with webpack...');
    webpack(config, (err, stats) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else if ((stats.compilation.errors || []).length > 0) {
        _.forEach(stats.compilation.errors, (e) => logger.error(e));
        reject(new Error('Webpack build errors - see the logs'));
      } else {
        logger.info(`webpack compile done. duration (ms): ${stats.endTime - stats.startTime}`);
        resolve(config.output.filename);
      }
    });
  });
}

/**
 * 
 * @param libraries - String|{key: String, initSrc: String}
 */
export function build(root, libraries, bundleName, getLoaders) {
  return writeEntryJs(root, libraries)
    .then((entryJsPath) => {
      let toKey = (p) => _.isString(p) ? p : p.key;
      let keysOnly = _.map(libraries, toKey);
      return webpackBundle(root, path.basename(entryJsPath), keysOnly, bundleName, getLoaders);
    });
}

export function cleanBuildAssets(root) {
  return removeFiles(root, [ENTRY_JS]);
}

export function clean(root, bundleName) {
  return removeFiles(root, [bundleName, bundleName + '.map', ENTRY_JS]);
}
