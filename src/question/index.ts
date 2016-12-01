import { ClientBuildable, BuildOpts as ClientBuildOpts } from './client';
import { ControllersBuildable, BuildOpts as ControllersBuildOpts } from './controllers';
import { JsonConfig, Config, FileNames } from './config';
import { removeSync } from 'fs-extra';
import { buildLogger } from '../log-factory';
import { BuildInfo } from './build-info';
import * as _ from 'lodash';
import { join } from 'path';
import { removeFilePaths } from '../file-helper';

const logger = buildLogger();

export enum CleanMode {
  BUILD_ONLY,
  ALL
}

export default class Question {

  static buildOpts(args) {
    return {
      client: ClientBuildOpts.build(args),
      controllers: ControllersBuildOpts.build(args),
      question: FileNames.build(args)
    }
  }

  readonly config: JsonConfig;
  readonly client: ClientBuildable;
  readonly controllers: ControllersBuildable;

  constructor(private dir, private opts, private clientFrameworkSupport, private app) {
    clientFrameworkSupport = clientFrameworkSupport || [];

    logger.silly('[constructor] opts: ', JSON.stringify(opts));

    this.config = new JsonConfig(dir, opts.question);
    this.client = new ClientBuildable(this.config, clientFrameworkSupport, opts.client, app);
    this.controllers = new ControllersBuildable(this.config, opts.controllers);
  }

  get externals() {
    return this.client ? this.client.externals : { js: [], css: [] };
  }

  clean(mode: CleanMode) {

    let info = [this.client.buildInfo, this.controllers.buildInfo];

    let mkDeletePaths = (i: BuildInfo): string[] => {
      let files = _.concat(i.buildOnly, mode == CleanMode.ALL ? i.output : []);
      return _.map(files, f => join(i.dir, f));
    }

    let filesToClean: string[][] = _(info).map(mkDeletePaths).value();

    logger.silly(`[clean] filesToClean: ${filesToClean}`);

    return removeFilePaths(_.flatten(filesToClean));
  }

  pack(clean = false) {
    let maybeClean = clean ? this.clean.bind(this, CleanMode.ALL) : () => Promise.resolve();
    return maybeClean()
      .then(() => this.client.pack())
      .then((client) => {
        return this.controllers.pack()
          .then((controllers) => {
            return { client: client, controllers: controllers };
          });
      });
  }

  prepareWebpackConfigs(clean = false) {
    let maybeClean = clean ? this.clean.bind(this, CleanMode.ALL) : () => Promise.resolve();
    return maybeClean()
      .then(() => this.client.prepareWebpackConfig())
      .then(clientConfig => {
        logger.debug('[prepareWebpackConfig] got clientConfig:', clientConfig);
        return this.controllers.prepareWebpackConfig()
          .then(controllersConfig => {
            logger.debug('[prepareWebpackConfig] got controllersConfig:', controllersConfig);
            return {
              client: clientConfig,
              controllers: controllersConfig
            }
          });
      });
  }
}