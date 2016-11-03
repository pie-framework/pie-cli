import _ from 'lodash';
import {camelCase} from 'change-case';

/**
 * Camelcase a minimist opts object.
 * Don't change the special _ property.
 */
export function normalizeOpts(opts){
  opts = opts || {};

  let rest = _(opts).keys().reduce((acc, k) => {
    if(k !== '_'){
      acc[camelCase(k)] = opts[k];
    } else {
      acc._ = opts._;
    }
    return acc;
  }, {});

  return rest;
}