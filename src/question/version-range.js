import _ from 'lodash';
import semver from 'semver';

/**
 * TODO - stub class looking at compatible version ranges.
 */
export default class VersionRange {
  constructor(r){
    this._ranges = _.isArray(r) ? r : [r];
  }

  /**
   * @returns a valid semver range string based on the ranges added.
   */
  get range(){
    return '???';
  }

  merge(r){
    return new VersionRange(this._ranges.concat(r));
  }

  /**
   * return true if the conflated range spans the major version number.
   * 
   * eg: 
   *   >=1.0.0 <3.0.0 => true
   *   >=1.2.0 <2.0.0 => false 
   */
  get rangeSpansMajorVersion(){
    return undefined;
  } 
}

