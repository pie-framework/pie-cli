import { existsSync, readJson } from 'fs-extra';

import { PiePackage } from './../question/config/elements/index';
import { join } from 'path';

export type PieTarget = {
  pie: string,
  target: string
};

export async function pieToTarget(
  p: PiePackage,
  dir: (PiePackage) => string,
  required: boolean = true): Promise<PieTarget> {
  return getPkgName(dir(p))
    .then(n => ({ pie: p.key, target: n }))
    .catch(e => {
      if (required) {
        return e;
      } else {
        return null;
      }
    });
}

export let toKeyValue = (
  mappings: PieTarget[],
  dir: (PiePackage) => string,
  acc,
  p: PiePackage) => {
  const mapping = mappings.find(m => m.pie === p.key);

  if (mapping) {
    acc[mapping.target] = dir(p);
  }
  return acc;
};

export let getPkgName = (dir: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const p = join(dir, 'package.json');

    if (existsSync(p)) {
      readJson(p, (err, pkg) => {
        if (err) {
          reject(err);
        } else {
          resolve(pkg.name);
        }
      });
    } else {
      reject(new Error(`file: ${p} doesn't exist`));
    }
  });
};
