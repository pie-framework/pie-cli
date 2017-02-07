import { App, BuildOpts, ManifestOpts, ServeOpts } from '../types';
import { JsonConfig } from '../../question/config';
import { buildLogger } from '../../log-factory';
import { join, resolve } from 'path';
import * as pug from 'pug';
import { existsSync, writeFile } from 'fs-extra';
import { getNames, Names } from '../base';
import { Manifest } from '../../question/config/manifest';
import * as http from 'http';
import AllInOneBuild, { ClientBuild, ControllersBuild, SupportConfig } from '../../question/build/all-in-one';
import * as _ from 'lodash';
import { build as buildWebpack, BuildResult } from '../../code-gen/webpack-builder';
import { createArchive, archiveIgnores } from '../create-archive';
import { promisify } from 'bluebird';

const logger = buildLogger();
const templatePath = join(__dirname, 'views/index.pug');

let clientDependencies = (args: any) => args.configuration.app.dependencies;

//TODO: seems like this could be re-used by others?
function mkConfig(
  context: string,
  entry: string,
  bundle: string,
  rules: any[],
  extensions: any): any {

  entry = entry.startsWith('./') ? entry : `./${entry}`;

  let out = _.merge({
    entry: entry,
    context: resolve(context),

    output: {
      path: resolve(context),
      filename: bundle
    },
    module: {
      rules: [
        { test: /\.css$/, use: ['style-loader', 'css-loader'] }
      ]
    }
  }, extensions);
  out.module.rules = _.concat(out.module.rules, rules);
  return out;
}

export default class CatalogApp implements App {

  static NAMES = {
    entry: '.catalog.entry.js',
    webpackConfig: '.catalog.webpack.config.js',
    bundle: 'pie-catalog.bundle.js'
  }

  static EXTERNALS = {
    'lodash': '_',
    'lodash/map': '_.map',
    'lodash/isEqual': '_.isEqual',
    'lodash/includes': '_.includes',
    'lodash/isEmpty': '_.isEmpty',
    'lodash/assign': '_.assign',
    'lodash/cloneDeep': '_.cloneDeep',
    'lodash/isArray': '_.isArray',
    'lodash/merge': '_.merge',
    'lodash.merge': '_.merge',
    'react': 'React',
    'react-dom': 'ReactDOM',
    'react-addons-transition-group': 'React.addons.TransitionGroup',
    'react/lib/ReactTransitionGroup': 'React.addons.TransitionGroup',
    'react/lib/ReactCSSTransitionGroup': 'React.addons.CSSTransitionGroup'
  };

  static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<App> {
    let dir = resolve(args.dir || process.cwd());
    if (!existsSync(join(dir, 'docs/demo'))) {
      throw new Error(`Can't find a 'docs/demo' directory in path: ${dir}. Is this a pie directory?`);
    }
    let config = new JsonConfig(join(dir, 'docs/demo'));
    return loadSupport(config)
      .then(s => {
        return new CatalogApp(args, dir, config, s, getNames(args));
      })
  }

  private template: pug.compileTemplate;
  private controllersBuild: ControllersBuild;
  private allInOneBuild: AllInOneBuild;

  constructor(readonly args: any,
    private pieRoot: string,
    readonly config: JsonConfig,
    readonly support: SupportConfig,
    readonly names: Names) {
    logger.debug('new CatalogApp..');
    this.template = pug.compileFile(templatePath, { pretty: true });

    this.allInOneBuild = new AllInOneBuild(
      config,
      support,
      this.names.build.entryFile,
      this.names.out.completeItemTag.path,
      this.args.writeWebpackConfig !== false);
    this.controllersBuild = new ControllersBuild(this.config, false);
  }

  protected async install(forceInstall: boolean): Promise<void> {
    await this.allInOneBuild.install({
      dependencies: clientDependencies(this.args),
      devDependencies: this.support.npmDependencies || {}
    }, forceInstall);
  }

  async build(opts: BuildOpts): Promise<string[]> {

    await this.install(opts.forceInstall);

    let deps = this.controllersBuild.controllerDependencies;

    let js = `
      //controllers
      let c = window.controllers = {};
    ${_.map(deps, (value, key) => `c['${key}'] = require('${key}-controller');`).join('\n')}
      
      //custom elements
      ${this.config.declarations.map(d => d.js).join('\n')}
    
    `;

    await promisify(writeFile.bind(null,
      join(this.config.dir, '.catalog.entry.js'),
      js,
      'utf8'))();

    let config = mkConfig(this.config.dir, CatalogApp.NAMES.entry, CatalogApp.NAMES.bundle, this.support.rules, {
      externals: CatalogApp.EXTERNALS,
      resolve: {
        modules: [
          'node_modules',
          resolve(join(this.config.dir, 'controllers/node_modules'))
        ],
        extensions: ['.js', '.jsx']
      }
    });

    logger.info('config: ', config);

    let buildResult = await buildWebpack(config, CatalogApp.NAMES.webpackConfig);
    return [CatalogApp.NAMES.bundle];
  }

  manifest(opts: ManifestOpts): Promise<Manifest> {
    return new Promise((resolve, reject) => {
      if (opts.outfile) {
        writeFile(opts.outfile, this.config.manifest, 'utf8', (e) => {
          if (e) {
            reject(e);
          } else {
            resolve(this.config.manifest);
          }
        });
      } else {
        resolve(this.config.manifest);
      }
    });
  }

  server(opts: ServeOpts): Promise<{ server: http.Server, reload: (string) => void }> {
    throw new Error('not supported');
  }

  clean(): Promise<any> {
    return null;
  }

  createArchive(): Promise<string> {
    let root = (name) => resolve(join(this.pieRoot, name));
    let archivePath = resolve(join(this.config.dir, this.names.out.archive));
    let addExtras = (archive) => {
      archive.file(root('package.json'), { name: 'pie-pkg/package.json' });
      archive.file(root('README.md'), { name: 'pie-pkg/README.md' });

      if (existsSync(root('docs/schemas'))) {
        archive.directory(root('docs/schemas'), 'schemas');
      }

      let externals = JSON.stringify(this.support.externals);
      archive.append(externals, { name: 'pie-pkg/externals.json' });
    }

    let ignores = archiveIgnores(this.config.dir);

    return createArchive(archivePath, this.config.dir, ignores, addExtras)
      .catch(e => {
        let msg = `Error creating the archive: ${e.message}`;
        logger.error(msg);
        throw new Error(msg);
      });
  }

}
