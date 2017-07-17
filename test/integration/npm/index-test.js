import NewNpm from '../../../lib/npm';
import { expect } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import temp from 'temp';

describe('index', function () {

  this.timeout(4000);

  let tmpPath, npmDir;
  beforeEach(() => {
    tmpPath = temp.mkdirSync('npm-dir-test');
    npmDir = new NewNpm(tmpPath);
    return npmDir.install(['lodash', 'log-factory']);
  });

  it('contains lodash in node_modules', () => {
    let lodashModule = path.join(tmpPath, 'node_modules/lodash');
    let stat = fs.statSync(lodashModule);
    expect(stat.isDirectory()).to.eql(true);
  });

  it('returns the install info', () => {
    return npmDir.installIfNeeded(['lodash', 'log-factory'])
      .then((result) => {
        console.log('>> result: ', result);
        expect(result.lodash.from.split('@')[0]).to.eql('lodash');
      });
  });
});