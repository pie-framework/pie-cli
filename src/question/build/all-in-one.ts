import { JsonConfig } from '../config';
import ClientBuild from './client';
import ControllersBuild from './controllers';
import { KeyMap } from '../../npm/types';
import { Declaration } from '../../code-gen/declaration';
import * as _ from 'lodash';
import { relative } from 'path';
import { writeFileSync } from 'fs-extra';
import { join, resolve } from 'path';
import { build as buildWebpack, BuildResult } from '../../code-gen/webpack-builder';
import baseConfig from './base-config';
import { SupportConfig } from '../../framework-support/index';
import { stripMargin } from '../../string-utils';
import { writeConfig } from '../../code-gen/webpack-write-config';

export { ClientBuild, ControllersBuild };
export { SupportConfig };

export default class AllInOne {

  readonly client: ClientBuild;
  readonly controllers: ControllersBuild;

  constructor(
    readonly config: JsonConfig,
    private supportConfig: SupportConfig,
    private entryPath: string,
    readonly fileout: string,
    private writeWebpackConfig: boolean) {
    this.client = new ClientBuild(config, supportConfig.webpackLoaders(p => p), writeWebpackConfig);
    this.controllers = new ControllersBuild(config, writeWebpackConfig);
  }

  async install(client: { dependencies: KeyMap, devDependencies: KeyMap }): Promise<any> {
    await this.client.install(client.dependencies, client.devDependencies);
    await this.controllers.install();
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
          resolve(join(this.config.dir, 'controllers/node_modules')),
          'node_modules',
        ],
        extensions: ['.js', '.jsx']
      }
    });
    let m = config.module as any;
    m.loaders = (m.loaders || []).concat(this.supportConfig.webpackLoaders(p => p));

    let out = updateConfig(config);
    if (this.writeWebpackConfig) {
      writeConfig(join(this.config.dir, '.all-in-one.webpack.config.js'), out);
    }

    return out;
  }
}