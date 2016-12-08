import { File } from './index';
import * as webpack from 'webpack';
import { build } from '../../code-gen/webpack-builder';

export default class Js implements File {

  constructor(readonly cfg: webpack.Configuration) { }

  get filename() {
    return this.cfg.output.filename;
  }

  get dir() {
    return this.cfg.output.path;
  }

  write() {
    return build(this.cfg)
      .then(({stats, duration}) => {
        return this.filename;
      })
  }
}