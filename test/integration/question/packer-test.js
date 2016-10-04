import { build, clean, DEFAULTS } from '../../../src/question/packer';
import { expect } from 'chai';
import { resolve } from 'path';
import fs from 'fs-extra';
import path from 'path';
import sinon from 'sinon';
import temp from 'temp';

describe('pack-question', () => {

  let rootDir = resolve('./test/integration/example-questions/one');
  let componentsDir = resolve('./test/integration/example-components');
  let questionPath;
  let frameworkSupport;
  
  before(function (done) {

    let tmpPath = temp.mkdirSync('packer-test');
    console.log('packer-test tmp: ', tmpPath);
    questionPath = path.join(tmpPath, 'example-questions', 'one');
    fs.copySync(rootDir, questionPath);
    fs.copySync(componentsDir, path.join(tmpPath, 'example-components'));

    frameworkSupport = {
      load: sinon.stub().returns({
        npmDependencies: {
          'babel-loader': '*',
          'babel-preset-react': '*'
        },
        webpackLoaders: (resolve) => {
          return [
            {
              test: /.(js|jsx)?$/,
              loader: 'babel-loader',
              query: {
                presets: [
                  resolve('babel-preset-es2015'),
                  resolve('babel-preset-react')
                ]
              }
            }
          ];
        }
      })
    }
    this.timeout(30000);

    build(questionPath, {}, frameworkSupport)
      .then(() => done())
      .catch((e) => done(e))
  });

  it('builds ' + DEFAULTS.pieJs, () => {
    expect(fs.existsSync(path.join(questionPath, DEFAULTS.pieJs))).to.eql(true);
  });

});