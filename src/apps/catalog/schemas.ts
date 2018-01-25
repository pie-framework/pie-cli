import { statSync, readJsonSync, readdirSync, existsSync } from 'fs-extra';
import { join } from 'path';
import * as _ from 'lodash';

export function buildSchemas(filePath: string): any[] {

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    const files = readdirSync(filePath);

    const mapped = files.map(f => {
      const p = join(filePath, f);
      const stat = statSync(p);
      if (stat.isFile()) {
        return { name: f, json: readJsonSync(p) };
      }
    });

    return _.compact(mapped);

  } else {
    return [];
  }
}
