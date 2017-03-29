import * as _ from 'lodash';
import * as pug from 'pug';

import { App, Archivable, BuildOpts, Buildable } from '../types';
import Install, { Mappings } from '../../install';
import { Names, getNames, webpackConfig } from '../common';
import { archiveIgnores, createArchive } from '../create-archive';
import { controllerDependency, targetsToElements, targetsToKeyMap } from '../src-snippets';
import { existsSync, writeFileSync } from 'fs-extra';
import { join, resolve } from 'path';

import { JsonConfig } from '../../question/config';
import { SupportConfig } from '../../framework-support';
import { buildLogger } from 'log-factory';
import { buildWebpack } from '../../code-gen';
import report from '../../cli/report';

const logger = buildLogger();
const templatePath = join(__dirname, 'views/index.pug');

/**
 * Builds a bundle that is compatible with the pie-catalog web app.
 * Used for publishing pie archives to the catalog.
 */
export default class CatalogApp
  implements App, Archivable<Mappings>, Buildable<Mappings> {

  public static generatedFiles: string[] = ['pie-item.tar.gz', 'pie-catalog.bundle.js'];

  public static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<App> {
    const dir = resolve(args.dir || process.cwd());
    if (!existsSync(join(dir, 'docs/demo'))) {
      throw new Error(`Can't find a 'docs/demo' directory in path: ${dir}. Is this a pie directory?`);
    }

    const config = JsonConfig.build(join(dir, 'docs/demo'), args);

    return loadSupport(config)
      .then((s) => {
        return new CatalogApp(args, dir, config, s, getNames(args));
      });
  }

  private static ENTRY = 'catalog.entry.js';
  private static BUNDLE = 'pie-catalog.bundle.js';
  private static WEBPACK_CONFIG = 'catalog.webpack.config.js';

  private static EXTERNALS = {
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

  private template: pug.compileTemplate;

  private installer: Install;

  constructor(readonly args: any,
    private pieRoot: string,
    readonly config: JsonConfig,
    readonly support: SupportConfig,
    readonly names: Names) {
    logger.debug('new CatalogApp..');
    this.template = pug.compileFile(templatePath, { pretty: true });
    this.installer = new Install(config);
  }

  public async build(opts: BuildOpts): Promise<Mappings> {

    const mappings = await this.installer.install(opts.forceInstall);

    const js = `
      //controllers
      let controllers = window.controllers = {};
      ${ mappings.controllers.map(controllerDependency).join('\n')}
      
      //custom elements
      ${this.config.declarations.map((d) => d.js).join('\n')}

      //configure elements
      ${targetsToElements(mappings.configure)}
    `;

    writeFileSync(join(this.installer.dir, CatalogApp.ENTRY), js, 'utf8');

    const config = _.merge(webpackConfig(
      this.installer,
      this.support,
      CatalogApp.ENTRY,
      CatalogApp.BUNDLE,
      this.config.dir), {
        externals: CatalogApp.EXTERNALS
      });

    logger.info('config: ', config);

    await report.indeterminate('building webpack', buildWebpack(config, CatalogApp.WEBPACK_CONFIG));

    return mappings;
  }

  public createArchive(mappings: Mappings): Promise<string> {
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

      const configureMap = JSON.stringify(targetsToKeyMap(mappings.configure));
      archive.append(configureMap, { name: 'pie-pkg/configure-map.json' });
    };

    const ignores = archiveIgnores(this.config.dir);

    return createArchive(archivePath, this.config.dir, ignores, addExtras)
      .catch((e) => {
        const msg = `Error creating the archive: ${e.message}`;
        logger.error(msg);
        throw new Error(msg);
      });
  }
}
