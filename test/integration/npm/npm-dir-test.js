import NpmDir from '../../../src/npm/npm-dir';
import temp from 'temp';
import fs from 'fs-extra';
import path from 'path';
import {expect} from 'chai'; 

describe('npm-dir', () => {

  let tmpPath, npmDir;
  beforeEach((done) => {
    tmpPath = temp.mkdirSync('npm-dir-test');
    npmDir = new NpmDir(tmpPath);
    npmDir.install({lodash: '*'})
      .then(() => done())
      .catch(done);
  });  

  describe('ls', () => {

    it('returns the dependency tree', (done) => {

      let npmDir = new NpmDir(tmpPath);

      npmDir.ls().then(
        (tree) => {
          expect(tree.dependencies.hasOwnProperty('lodash')).to.eql(true);
          done();
        })
        .catch(done);
    });
  });
});