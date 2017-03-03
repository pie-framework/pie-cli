import * as _ from 'lodash';
import * as pug from 'pug';

import AllInOneBuild, { ControllersBuild, SupportConfig } from '../../question/build/all-in-one';
import { App, Archivable, BuildOpts, Buildable } from '../types';
import { Names, getNames } from "../common";
import { archiveIgnores, createArchive } from '../create-archive';
import { existsSync, writeFile } from 'fs-extra';
import { join, resolve } from 'path';

import { JsonConfig } from '../../question/config';
import { ManifestOpts } from './../types';
import { buildLogger } from 'log-factory';
import { build as buildWebpack } from '../../code-gen/webpack-builder';
import { promisify } from 'bluebird';

const logger = buildLogger();
const templatePath = join(__dirname, 'views/index.pug');

const clientDependencies = (args: any) => args.configuration.app.dependencies;

// TODO: seems like this could be re-used by others?
function mkConfig(
  context: string,
  entry: string,
  bundle: string,
  rules: any[],
  extensions: any): any {

  entry = entry.startsWith('./') ? entry : `./${entry}`;

  const out = _.merge({
    context: resolve(context),
    entry,
    module: {
      rules: [
        { test: /\.css$/, use: ['style-loader', 'css-loader'] }
      ]
    },
    output: {
      filename: bundle,
      path: resolve(context)
    }
  }, extensions);
  out.module.rules = _.concat(out.module.rules, rules);
  return out;
}

export default class CatalogApp implements App, Archivable, Buildable {

  public static NAMES = {
    bundle: 'pie-catalog.bundle.js',
    entry: '.catalog.entry.js',
    webpackConfig: '.catalog.webpack.config.js'
  };

  public static EXTERNALS = {
    'lodash': '_',
    'lodash.merge': '_.merge',
    'lodash/assign': '_.assign',
    'lodash/cloneDeep': '_.cloneDeep',
    'lodash/includes': '_.includes',
    'lodash/isArray': '_.isArray',
    'lodash/isEmpty': '_.isEmpty',
    'lodash/isEqual': '_.isEqual',
    'lodash/map': '_.map',
    'lodash/merge': '_.merge',
    'react': 'React',
    'react-addons-transition-group': 'React.addons.TransitionGroup',
    'react-dom': 'ReactDOM',
    'react/lib/ReactCSSTransitionGroup': 'React.addons.CSSTransitionGroup',
    'react/lib/ReactTransitionGroup': 'React.addons.TransitionGroup'
  };

  public static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<App> {
    const dir = resolve(args.dir || process.cwd());
    if (!existsSync(join(dir, 'docs/demo'))) {
      throw new Error(`Can't find a 'docs/demo' directory in path: ${dir}. Is this a pie directory?`);
    }
    const config = new JsonConfig(join(dir, 'docs/demo'));
    return loadSupport(config)
      .then((s) => {
        return new CatalogApp(args, dir, config, s, getNames(args));
      });
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


  public async build(opts: BuildOpts): Promise<string[]> {

    await this.install(opts.forceInstall);

    let deps = this.controllersBuild.controllerDependencies;

    const js = `
      //controllers
      let c = window.controllers = {};
    ${_.map(deps, (value, key) => `c['${key}'] = require('${key}-controller');`).join('\n')}
      
      //custom elements
      ${this.config.declarations.map((d) => d.js).join('\n')}
    
    `;

    await promisify(writeFile.bind(null,
      join(this.config.dir, '.catalog.entry.js'),
      js,
      'utf8'))();

    const config = mkConfig(this.config.dir, CatalogApp.NAMES.entry, CatalogApp.NAMES.bundle, this.support.rules, {
      externals: CatalogApp.EXTERNALS,
      resolve: {
        extensions: ['.js', '.jsx'],
        modules: [
          'node_modules',
          resolve(join(this.config.dir, 'controllers/node_modules'))
        ]
      }
    });

    logger.info('config: ', config);

    await buildWebpack(config, CatalogApp.NAMES.webpackConfig);
    return [CatalogApp.NAMES.bundle];
  }

  public clean(): Promise<any> {
    return null;
  }

  public manifest(opts: ManifestOpts) {
    return null;
  }

  public createArchive(): Promise<string> {
    const root = (name) => resolve(join(this.pieRoot, name));
    const archivePath = resolve(join(this.config.dir, this.names.out.archive));
    const addExtras = (archive) => {
      archive.file(root('package.json'), { name: 'pie-pkg/package.json' });
      archive.file(root('README.md'), { name: 'pie-pkg/README.md' });

      if (existsSync(root('docs/schemas'))) {
        archive.directory(root('docs/schemas'), 'schemas');
      }

      const externals = JSON.stringify(this.support.externals);
      archive.append(externals, { name: 'pie-pkg/externals.json' });
    };

    const ignores = archiveIgnores(this.config.dir);

    return createArchive(archivePath, this.config.dir, ignores, addExtras)
      .catch((e) => {
        const msg = `Error creating the archive: ${e.message}`;
        logger.error(msg);
        throw new Error(msg);
      });
  }

  protected async install(forceInstall: boolean): Promise<void> {
    await this.allInOneBuild.install({
      dependencies: clientDependencies(this.args),
      devDependencies: this.support.npmDependencies || {}
    }, forceInstall);
  }
}
