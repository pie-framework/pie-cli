import * as _ from 'lodash';

import { KeyMap, NpmDir } from '../npm';
import { PieTarget, pieToTarget, toKeyValue } from './common';

import { PiePackage } from '../question/config';

export default class Controllers {

  private npm: NpmDir;

  constructor(readonly dir: string) {
    this.npm = new NpmDir(dir);
  }

  public async install(
    installedPies: PiePackage[],
    force: boolean): Promise<PieTarget[]> {

    const mappings: PieTarget[] = (await Promise.all(
      installedPies.map(p => pieToTarget(p, pt => pt.controllerDir))
    )).filter(m => m.target);

    const reduceFn = toKeyValue.bind(this, mappings, p => p.controllerDir);
    const deps: KeyMap = _.reduce(installedPies, reduceFn, {});

    return this.npm.install('controllers', deps, {}, force)
      .then(() => {
        return mappings;
      });
  }
}
