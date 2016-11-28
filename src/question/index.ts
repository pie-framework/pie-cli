import { ClientBuildable, BuildOpts as ClientBuildOpts } from './client';
import { ControllersBuildable, BuildOpts as ControllersBuildOpts } from './controllers';
import { QuestionConfig, BuildOpts as QuestionConfigBuildOpts } from './question-config';
import { removeSync } from 'fs-extra';
import { buildLogger } from '../log-factory';

const logger = buildLogger();

export default class Question {

  static buildOpts(args) {
    return {
      client: ClientBuildOpts.build(args),
      controllers: ControllersBuildOpts.build(args),
      question: QuestionConfigBuildOpts.build(args)
    }
  }


  readonly config;
  readonly client: ClientBuildable;
  readonly controllers;

  constructor(private dir, private opts, private clientFrameworkSupport, private app) {
    clientFrameworkSupport = clientFrameworkSupport || [];

    logger.silly('[constructor] opts: ', JSON.stringify(opts));

    // this.dir = dir;
    this.config = new QuestionConfig(dir, opts.question);
    this.client = new ClientBuildable(this.config, clientFrameworkSupport, opts.client, app);
    this.controllers = new ControllersBuildable(this.config, opts.controllers);
  }

  clean() {
    return this.client.clean()
      .then(() => this.controllers.clean())
      .then(() => removeSync(this.controllers.controllersDir));
  }

  pack(clean = false) {
    return this.client.pack(clean)
      .then((client) => {
        return this.controllers.pack(clean)
          .then((controllers) => {
            return { client: client, controllers: controllers };
          });
      });
  }

  prepareWebpackConfigs(clean = false) {
    return this.client.prepareWebpackConfig(clean)
      .then(clientConfig => {
        logger.debug('[prepareWebpackConfig] got clientConfig:', clientConfig);
        return this.controllers.prepareWebpackConfig(clean)
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