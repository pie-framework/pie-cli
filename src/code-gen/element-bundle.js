import path from 'path';
import webpack from 'webpack';
import _ from 'lodash';
import { fileLogger } from '../log-factory';
import {configToJsString, writeConfig} from './webpack-write-config';
import resolve from 'resolve';
import {removeFiles} from '../file-helper';
import fs from 'fs-extra';

const logger = fileLogger(__filename);

let baseConfig = (root) => {
  return {
    module: {
      loaders: [
        {
          test: /.(js|jsx)?$/,
          loader: 'babel-loader',
          query: {
            presets: [
              /** 
               * Note: using resolved modules due to issues w/ symlinking and webpack/babel-loader
               * @see: https://github.com/webpack/webpack/issues/1866
               * @see: https://github.com/babel/babel-loader/issues/149
               */
              resolve.sync('babel-preset-es2015', {basedir: root}), 
              resolve.sync('babel-preset-react', {basedir: root})
            ]
          }
        },
        {
          test: /\.less$/,
          loader: "style!css!less"
        }
      ]
    },
    resolveLoader: {
      root: path.join(root, 'node_modules')
    },
    resolve: {
      extensions: ['', '.js', '.jsx']
    }
  }
};

const ENTRY_JS = 'entry.js';

function writeEntryJs(root, pies){

    let pieRegistrationSrc = _.map(pies, (p, index) => `
import comp${index} from '${p}';
document.registerElement('${p}', comp${index});`).join('\n')
  
  let js = `
import PiePlayer from 'pie-player';
document.registerElement('pie-player', PiePlayer);
${pieRegistrationSrc}

import ClientSideController from 'pie-client-side-controller';
window.pie = window.pie || {};
window.pie.ClientSideController = ClientSideController;
`;

  return new Promise((resolve, reject) => {
    let entryPath = path.join(root, ENTRY_JS);
    fs.writeFile(path.join(root, ENTRY_JS), js, {encoding: 'utf8'}, (err) => {
      if(err){
        reject(err);
      } else {
        resolve(entryPath);
      }
    });
  });
}


function webpackBundle(root, entryJs, pies) {

  logger.info('bundle, root', root, 'entryJs', entryJs, 'pies', pies);

  let config = _.extend({
    context: root,
    entry: path.join(root, entryJs),
    output: { filename: 'bundle.js', path: root }
  }, baseConfig(root));

  config.module.loaders = _.map(config.module.loaders, (l) => {
    let orNames = ['pie-client-side-controller','pie-player'].concat(pies).join('|');
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
    webpack(config, (err, stats) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else if ((stats.compilation.errors || []).length > 0) {
        _.forEach(stats.compilation.errors, (e) => logger.error(e));
        reject(new Error('Webpack build errors - see the logs'));
      } else {
        logger.debug('webpack compile done!');
        resolve(config.output.filename);
      }
    });
  });
}

export function build(root,pies){
  return writeEntryJs(root, pies)
    .then( (entryJsPath) => webpackBundle(root, path.basename(entryJsPath), pies));
}

export function clean(root){
  return removeFiles(root, ['bundle.js', 'bundle.js.map', ENTRY_JS]);
}
