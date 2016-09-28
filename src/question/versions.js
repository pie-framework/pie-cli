import _ from 'lodash';
import semver from 'semver';

export default class Versions {
  constructor(v){
    this._versions = _.isArray(v) ? v : [v];
  }

  get versions(){
    return this._versions;
  }

  merge(v){
    return new Versions(this.versions.concat(v));
  }

  get rangeSpansMajorVersion(){
    console.log(this._versions);
    //1. all versions requested have the same major version
    //2. there is no >=
    //3. there is no *
    //4. there is no x

    // merge the ranges to a single range and check that the range doesn't include the major version.. 
    return true;
  } 
}

