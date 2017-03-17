import * as _ from 'lodash';

import { KeyMap, NpmDir } from '../npm';
import { PieTarget, pieToTarget, toKeyValue } from './common';

import { PiePackage } from '../question/config/elements/index';
import { buildLogger } from 'log-factory';

const logger = buildLogger();

export default class Configure {

  private npm: NpmDir;

  constructor(readonly dir: string) {
    this.npm = new NpmDir(dir);
  }

  public async install(installed: PiePackage[], force: boolean): Promise<PieTarget[]> {

    const mappings = (await Promise.all(
      installed.map(p => pieToTarget(p, pt => pt.configureDir, false))
    )).filter(m => m && m.target);

    const reduceFn = toKeyValue.bind(this, mappings, p => p.configureDir);
    const deps: KeyMap = _.reduce(installed, reduceFn, {});

    logger.silly('deps: ', deps);
    return this.npm.install('configure', deps, {}, force)
      .then(() => mappings);
  }
}
