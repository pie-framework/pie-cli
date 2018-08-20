import * as _ from 'lodash';
import * as generators from './src-generators';
import * as pug from 'pug';

import {
  App,
  Buildable,
  DefaultOpts,
  MakeManifest,
  ManifestOpts,
  Archivable
} from '../types';
import { ElementDeclaration, buildWebpack, writeConfig } from '../../code-gen';
import Install, {
  Dirs,
  Pkg,
  configureDeclarations,
  controllerTargets,
  toDeclarations
} from '../../install';
import { JsonConfig, Manifest } from '../../question/config';
import { join, resolve } from 'path';

import { SupportConfig } from '../../framework-support';
import { promise as report } from '../../cli/report';
import { webpackConfig, Out } from '../common';
import { writeFileSync } from 'fs-extra';
import { archiveIgnores, createArchive } from '../create-archive';
import { addExtras } from '../catalog';
import { buildLogger } from 'log-factory';

const logger = buildLogger();
const basicExample = join(__dirname, 'views/example.pug');

const ENCODING = { encoding: 'utf8' };

const writeFile = (name: string, contents: string) =>
  writeFileSync(name, contents, ENCODING);

export default class DefaultApp
  implements
    Buildable<string[], DefaultOpts>,
    App,
    MakeManifest,
    Archivable<Pkg[]> {
  public static generatedFiles: string[] = [
    'pie-item.js',
    'pie-view.js',
    'pie-configure.js',
    'pie-controllers.js',
    'example.html'
  ];

  public static build(
    args: any,
    loadSupport: (JsonConfig) => Promise<SupportConfig>
  ): Promise<DefaultApp> {
    const dir = resolve(args.dir || args.d || process.cwd());
    const config = JsonConfig.build(dir, args);
    const outNames = Out.build(args);
    return loadSupport(config).then(s => new DefaultApp(config, s, outNames));
  }

  private static CONFIGURE_ENTRY = 'default.configure.entry.js';
  private static CONFIGURE_BUNDLE = 'pie-configure.js';
  private static CONFIGURE_WEBPACK_CONFIG =
    'default.configure.webpack.config.js';

  private template: pug.compileTemplate;
  private installer: Install;

  constructor(
    readonly config: JsonConfig,
    private support: SupportConfig,
    private outNames: Out
  ) {
    this.template = pug.compileFile(basicExample, { pretty: true });
    this.installer = new Install(config.dir, config.raw);
  }

  public buildOpts(args): DefaultOpts {
    return new DefaultOpts(args);
  }

  public async build(opts: DefaultOpts): Promise<string[]> {
    const forceInstall = opts ? opts.forceInstall : false;

    const { pkgs, dirs } = await this.installer.install(forceInstall);
    const client = await report(
      'building client',
      this.buildClient(dirs, pkgs, opts.addPlayerAndControlPanel)
    );
    const controllers = await report(
      'building controllers',
      this.buildControllers(dirs, opts.pieName, pkgs)
    );
    const configure = await report(
      'building configure',
      this.buildConfigure(dirs, pkgs)
    );
    const allInOne = opts.includeComplete
      ? await report(
          'building all-in-one',
          this.buildAllInOne(dirs, opts.pieName, pkgs)
        )
      : [];
    const example = opts.includeComplete
      ? await report('building example', this.buildExample())
      : [];

    return _.concat(client, controllers, configure, allInOne, example);
  }

  public manifest(opts: ManifestOpts): Promise<Manifest> {
    return Promise.reject(new Error('todo'));
  }

  public async createArchive(buildInfo: Pkg[]): Promise<string> {
    const archivePath = resolve(join(this.config.dir, this.outNames.archive));

    /* TODO: ignore config/markup? */
    const ignores = archiveIgnores(this.config.dir);

    logger.silly(
      'call createArchive',
      archivePath,
      this.config.dir,
      ignores,
      addExtras
    );

    logger.silly('callAddExtras...');

    return createArchive(archivePath, this.config.dir, ignores).catch(e => {
      const msg = `Error creating the archive: ${e.message}`;
      logger.error(msg);
      logger.info(e.stack);
      throw new Error(msg);
    });
  }

  private async buildConfigure(dirs: Dirs, pkgs: Pkg[]): Promise<string[]> {
    const js = configureDeclarations(pkgs)
      .map(e => e.js)
      .join('\n');

    writeFile(join(dirs.root, DefaultApp.CONFIGURE_ENTRY), js);

    const config = webpackConfig(
      dirs,
      this.support,
      DefaultApp.CONFIGURE_ENTRY,
      DefaultApp.CONFIGURE_BUNDLE,
      this.config.dir
    );

    await buildWebpack(config, DefaultApp.CONFIGURE_WEBPACK_CONFIG);
    return [DefaultApp.CONFIGURE_BUNDLE];
  }

  private async buildClient(
    dirs: Dirs,
    pkgs: Pkg[],
    addPlayerAndControlPanel: boolean
  ): Promise<string[]> {
    const js = generators.client(
      toDeclarations(pkgs).concat(
        addPlayerAndControlPanel
          ? [
              new ElementDeclaration('pie-player'),
              new ElementDeclaration('pie-control-panel')
            ]
          : []
      )
    );

    writeFile(join(dirs.root, 'client.entry.js'), js);
    const config = webpackConfig(
      dirs,
      this.support,
      'client.entry.js',
      'pie-view.js',
      this.config.dir
    );

    writeConfig(join(dirs.root, 'client.webpack.config.js'), config);
    await buildWebpack(config);
    return ['pie-view.js'];
  }

  private async buildControllers(
    dirs: Dirs,
    pieName: string,
    pkgs: Pkg[]
  ): Promise<string[]> {
    const controllers = controllerTargets(pkgs);

    const js = generators.controllers(controllers);
    writeFile(join(dirs.root, 'controllers.entry.js'), js);
    const config = webpackConfig(
      dirs,
      this.support,
      'controllers.entry.js',
      'pie-controllers.js',
      this.config.dir
    );

    config.output.library = `pie-controller-${pieName}`;
    config.output.libraryTarget = 'umd';

    writeConfig(join(dirs.root, 'controllers.webpack.config.js'), config);
    await buildWebpack(config);
    return ['pie-controllers.js'];
  }

  private async buildAllInOne(
    dirs: Dirs,
    pieName: string,
    pkgs: Pkg[]
  ): Promise<string[]> {
    if (!pieName) {
      throw new Error(
        'You must specify a `pieName` in the args when using `--includeComplete`'
      );
    }

    const controllerMap = controllerTargets(pkgs);

    const pieModels = this.config.models();

    const js = generators.allInOne(
      pieName,
      toDeclarations(pkgs),
      controllerMap,
      this.config.markup,
      pieModels,
      this.config.weights,
      this.config.langs
    );

    writeFile(join(dirs.root, 'all-in-one.entry.js'), js);
    const config = webpackConfig(
      dirs,
      this.support,
      'all-in-one.entry.js',
      'pie-item.js',
      this.config.dir
    );

    writeConfig(join(dirs.root, 'all-in-one.webpack.config.js'), config);
    await buildWebpack(config);
    return ['pie-item.js'];
  }

  private buildExample(): Promise<string[]> {
    const out: string = this.template({
      js: ['./pie-item.js'],
      markup: '<pie-item></pie-item>'
    });

    writeFile(join(this.config.dir, 'example.html'), out);

    return Promise.resolve(['example.html']);
  }
}
