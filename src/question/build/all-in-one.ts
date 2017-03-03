import * as _ from 'lodash';

import { BuildResult, build as buildWebpack } from '../../code-gen/webpack-builder';
import { join, resolve } from 'path';

import ClientBuild from './client';
import ControllersBuild from './controllers';
import { Declaration } from '../../code-gen/declaration';
import { JsonConfig } from '../config';
import { KeyMap } from '../../npm/types';
import { SupportConfig } from '../../framework-support/index';
import baseConfig from './base-config';
import { relative } from 'path';
import { stripMargin } from '../../string-utils';
import { writeConfig } from '../../code-gen/webpack-write-config';
import { writeFileSync } from 'fs-extra';

export { ClientBuild, ControllersBuild };
export { SupportConfig };

export default class AllInOne {

  readonly client: ClientBuild;
  readonly controllers: ControllersBuild;
  readonly writtenWebpackConfig: string;

  constructor(
    readonly config: JsonConfig,
    private supportConfig: SupportConfig,
    private entryPath: string,
    readonly fileout: string,
    private writeWebpackConfig: boolean) {
    this.client = new ClientBuild(config, supportConfig.rules, writeWebpackConfig);
    this.controllers = new ControllersBuild(config, writeWebpackConfig);
    this.writtenWebpackConfig = '.all-in-one.webpack.config.js';
  }

  async install(client: { dependencies: KeyMap, devDependencies: KeyMap }, force: boolean): Promise<any> {
    await this.client.install(client.dependencies, client.devDependencies, force);
    await this.controllers.install(force);
  }


  js(declarations: Declaration[]): string {
    return stripMargin`
      |//All In One Build --
      |if(!customElements){
      |   throw new Error('custom elements is not supported');
      |} 
      |
      |//Add declarations
      |${ _.map(declarations, d => d.js).join('\n\n')}`;
  }

  get controllerMapSrc() {
    return this.controllers.entryJs;
  }

  webpackConfig(js: string) {
    writeFileSync(join(this.config.dir, this.entryPath), js, 'utf8');
    return this._config();
  }

  async build(js: string, updateConfig: (any) => any = (c) => c): Promise<{ file: string }> {
    writeFileSync(join(this.config.dir, this.entryPath), js, 'utf8');
    let config = this._config(updateConfig);
    let buildResult = await buildWebpack(config);
    return {
      file: this.fileout
    }
  }

  private _config(updateConfig: (any) => any = c => c) {

    //TODO: shouldn't resolveLoader be looking in pie-cli's node_modules instead of config.dir?
    let config = _.extend(baseConfig(this.config.dir), {
      context: this.config.dir,
      entry: this.entryPath,
      output: {
        filename: this.fileout, path: this.config.dir
      },
      resolve: {
        modules: [
          //Note: the order is important here - always look in the regular node_modules dir first.
          'node_modules',
          resolve(join(this.config.dir, 'controllers/node_modules'))
        ],
        extensions: ['.js', '.jsx']
      }
    });
    config.module.rules = (config.module.rules || []).concat(this.supportConfig.rules);

    let out = updateConfig(config);
    if (this.writeWebpackConfig) {
      writeConfig(join(this.config.dir, this.writtenWebpackConfig), out);
    }

    return out;
  }
}