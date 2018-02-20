import * as _ from 'lodash';

import { App, Archivable, BuildOpts, Buildable } from '../types';
import Install, { Pkg, configureDeclarations, pieToConfigureMap, toDeclarations } from '../../install';
import { Names, getNames, webpackConfig } from '../common';
import { archiveIgnores, createArchive } from '../create-archive';
import { existsSync, writeFileSync, readFileSync, readJsonSync } from 'fs-extra';
import { join, resolve } from 'path';
import { JsonConfig } from '../../question/config';
import { SupportConfig } from '../../framework-support';
import { buildLogger } from 'log-factory';
import { buildWebpack } from '../../code-gen';
import { controllerDependency } from '../src-snippets';
import report from '../../cli/report';
import { buildSchemas } from './schemas';
import { gitInfo, npmInfo, gitTag, gitHash } from './info-builder';

const logger = buildLogger();

/**
 * Builds a bundle that is compatible with the pie-catalog web app.
 * Used for publishing pie archives to the catalog. See PieLabs/pie-catalog@2.0.0 or higher.
 */
export default class CatalogApp
  implements App, Archivable<Pkg[]>, Buildable<Pkg[], BuildOpts> {

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

  private installer: Install;

  constructor(readonly args: any,
    private pieRoot: string,
    readonly config: JsonConfig,
    readonly support: SupportConfig,
    readonly names: Names) {
    this.installer = new Install(config.dir, config.raw);
  }

  public buildOpts(args: any): BuildOpts {
    return BuildOpts.build(args);
  }

  public async build(opts: BuildOpts): Promise<Pkg[]> {

    const { dirs, pkgs } = await this.installer.install(opts.forceInstall);

    const js = `
      //controllers
      let controllers = window.controllers = {};
      ${ pkgs.map(bi => controllerDependency(bi.element.tag, bi.controller.moduleId)).join('\n')}
      //custom elements
      ${toDeclarations(pkgs).map((d) => d.js).join('\n')}

      //configure elements
      ${configureDeclarations(pkgs).map(e => e.js).join('\n')}
    `;

    writeFileSync(join(dirs.root, CatalogApp.ENTRY), js, 'utf8');

    const config = _.merge(webpackConfig(
      dirs,
      this.support,
      CatalogApp.ENTRY,
      CatalogApp.BUNDLE,
      this.config.dir), {
        externals: CatalogApp.EXTERNALS
      });

    logger.silly('config: ', config);

    config.module.rules = [
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000
            }
          }
        ]
      }
    ].concat(config.module.rules);

    await report.promise('building webpack', buildWebpack(config, CatalogApp.WEBPACK_CONFIG));

    return pkgs;
  }

  public async createArchive(buildInfo: Pkg[]): Promise<string> {
    const root = (name) => resolve(join(this.pieRoot, name));
    const archivePath = resolve(join(this.config.dir, this.names.out.archive));
    const pkg = readJsonSync(root('package.json'));

    const repository = gitInfo(pkg);
    const npm = npmInfo(pkg);

    const tag = await gitTag(root('.')).catch(e => '');
    const hash = await gitHash(root('.')).catch(e => '');
    const shortHash = await gitHash(root('.'), true).catch(e => '');

    logger.silly('tag', tag, 'hash', hash, 'shorthash', shortHash);

    if (!repository || !npm) {
      return Promise.reject(new Error('The package.json is missing `repository` and `name` fields'));
    }

    /* TODO: ignore config/markup? */
    const ignores = archiveIgnores(this.config.dir);

    logger.silly('call createArchive', archivePath, this.config.dir, ignores, addExtras);
    const readme = existsSync(root('README.md')) ? readFileSync(root('README.md'), 'utf8') : '';

    const git = {
      hash,
      short: shortHash,
      tag
    };
    const schemas = buildSchemas(root('docs/schemas'));
    logger.silly('callAddExtras...');
    const ae = addExtras(this.config.raw, this.config.markup, this.support,
      buildInfo, pkg, npm, readme, repository, git, schemas);
    return createArchive(archivePath, this.config.dir, ignores, ae)
      .catch((e) => {
        const msg = `Error creating the archive: ${e.message}`;
        logger.error(msg);
        logger.info(e.stack);
        throw new Error(msg);
      });
  }
}

export const addExtras = (
  config: any,
  markup: string,
  support: SupportConfig,
  pkgs: Pkg[],
  pkg: { version: string },
  npm: any,
  readme: string,
  repository: any,
  git: any,
  schemas: any[]) => (archive: any): void => {

    const catalog = {
      demo: {
        config,
        configureMap: pieToConfigureMap(pkgs),
        externals: support.externals,
        markup,
      },
      npm,
      package: pkg,
      readme,
      repository,
      schemas,
      version: {
        git,
        pkg: pkg.version,
      }
    };

    const catalogString = JSON.stringify(catalog, null, '  ');
    logger.silly('catalog json: ', catalogString);
    logger.silly('archive: ', archive);
    /**
     * It is important that the catalog json is the first entry in the tar,
     * so that the upload stream will consume this entry first.
     */
    archive.append(catalogString, { name: 'pie-catalog-data.json' });
  };
