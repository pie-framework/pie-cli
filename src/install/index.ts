import * as _ from 'lodash';

import { JsonConfig, getInstalledPies } from '../question/config';
import { NpmDir, pathIsDir } from '../npm';
import { join, resolve } from 'path';

import Configure from './configure';
import Controllers from './controllers';
import { PieTarget } from './common';
import { buildLogger } from 'log-factory';
import report from '../cli/report';

const logger = buildLogger();

export { PieTarget }

export type Mappings = {
  controllers: PieTarget[],
  configure: PieTarget[]
};

export type Dirs = {
  configure: string,
  controllers: string,
  root: string
};


/**
 * Root level install - can be used for client only + all in one builds.
 */
export default class Install {

  readonly dir: string;
  private npm: NpmDir;
  private controllers: Controllers;
  private configure: Configure;

  constructor(private config: JsonConfig) {
    this.dir = join(config.dir, '.pie');
    this.npm = new NpmDir(this.dir);
    this.controllers = new Controllers(join(this.dir, '.controllers'));
    this.configure = new Configure(join(this.dir, '.configure'));
  }

  get dirs(): Dirs {
    return {
      configure: this.configure.dir,
      controllers: this.controllers.dir,
      root: this.dir
    };
  }

  public async install(force: boolean = false): Promise<Mappings> {
    const deps = _.mapValues(this.config.dependencies,
      v => pathIsDir(this.config.dir, v) ? resolve(this.config.dir, v) : v);

    logger.debug('resolved deps: ', deps);

    const rootInstall = this.npm.install('pie-root-install', deps, {}, force);
    await report.promise('installing root package', rootInstall);
    const installedPies = getInstalledPies(join(this.dir, 'node_modules'), this.config.elements.map(e => e.key));
    const normalElements = this.config.elements.filter(e => {
      return !_.some(installedPies, p => p.key === e.key);
    });
    logger.info('normalElements: ', normalElements);

    const normalElementsAsTargets = normalElements.map(ne => {
      return { pie: ne.key, target: 'pie-controller/lib/passthrough' };
    });

    logger.debug('installed pies: ', installedPies);
    const controllerMappings = await report.promise(
      'installing controllers',
      this.controllers.install(installedPies, force).then(m => m.concat(normalElementsAsTargets)));

    const configureMappings = await report.promise(
      'installing configure', this.configure.install(installedPies, force)
    );

    return {
      configure: configureMappings,
      controllers: controllerMappings,
    };
  }

  get installedPies() {
    return getInstalledPies(join(this.dir, 'node_modules'), this.config.elements.map(e => e.key));
  }

}

