import * as _ from 'lodash';

import { JsonConfig } from './../question/config';
import { Rule } from 'webpack';
import { buildLogger } from 'log-factory';
import { join } from 'path';

export { Rule }

const logger = buildLogger();

export interface SupportConfig {
  externals: { js: string[], css: string[] };
  modules: string[];
  rules: Rule[];
}


/**
 * Read in a support module.
 * A support module will consist of a package.json, node_modules dir and a main script.
 * The main script is expected to contain: `rules` and `externals`.
 */
export function load(config: JsonConfig, path: string): Promise<SupportConfig> {
  logger.debug('[load] path: ', path);
  const mod = require(path);

  if (_.isFunction(mod.support) && !mod.support(config.dependencies)) {
    return Promise.resolve(null);
  } else {
    const modules = [join(path, 'node_modules')];
    const out = {
      externals: {
        css: mod.externals ? mod.externals.css : [],
        js: mod.externals ? mod.externals.js : []
      },
      modules,
      rules: mod.rules
    };
    logger.silly('[load] out: ', out);
    return Promise.resolve(out);
  }
};

export class MultiConfig implements SupportConfig {

  private configs: SupportConfig[];

  constructor(...c: SupportConfig[]) {
    this.configs = c;
  }

  get externals(): { js: string[]; css: string[]; } {
    return this.configs.reduce((acc, c) => {
      acc.js = acc.js.concat(c.externals && Array.isArray(c.externals.js) ? _.compact(c.externals.js) : []);
      acc.css = acc.css.concat(c.externals && Array.isArray(c.externals.css) ? _.compact(c.externals.css) : []);
      return acc;
    }, { js: [], css: [] });
  }

  get modules(): string[] {
    return this.configs.reduce((acc, c) => {
      return acc.concat(c.modules || []);
    }, []);
  }

  get rules(): Rule[] {
    return this.configs.reduce((acc, c) => {
      return acc.concat(c.rules || []);
    }, []);
  }
}
