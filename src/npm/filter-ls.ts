import * as _ from 'lodash';

export let filterFirstLevelDependencies = (ls: any, keys: string[]): any => {
  let out = _(keys).map((k) => {
    let raw = ls.dependencies[k] ? (ls.dependencies[k].dependencies || {}) : null;
    return [k, raw];
  }).value();

  let [missing, ok] = _.partition(out, ([key, value]) => {
    return !value;
  });

  if (missing.length > 0) {
    let keys = _.map(missing, ([key, value]) => key);
    throw new Error('missing dependencies for: ' + keys.join(', '));
  }

  return _.fromPairs(ok);
}