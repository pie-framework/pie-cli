import {expect} from 'chai';
import buildControllerMap from '../../../src/bundler/controller-map';
import os from 'os';
import temp from 'temp';
import fs from 'fs-extra';
import path from 'path';

describe('controller-map', () => {

  describe('buildControllerMap', () => {
    
    let bundlePath;

    before((done) => {

      let tmpPath = temp.mkdirSync('controller-map-test');
      console.log('tmpPath: ', tmpPath);
      let projectPath = path.join(__dirname, 'controller-map-project');
      fs.copySync(projectPath, tmpPath);
      console.log(buildControllerMap);
      buildControllerMap( tmpPath, 'config.json')
        .then((result) => {
          bundlePath = result.path;
          console.log('bundlePath:', bundlePath);
          console.log(fs.readFileSync(bundlePath, {encoding: 'utf8'}));
          done();
        })
        .catch((e) => {
          console.log('error: ', e);
          done(e);
        });
    });

    it('builds the js file', () => {
      expect(fs.existsSync(bundlePath)).to.eql(true);
    });
  });
});