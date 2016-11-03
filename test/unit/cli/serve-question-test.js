import {expect} from 'chai';
import proxyquire from 'proxyquire';

describe('ServeQuestionOpts', () => {

  let ServeQuestionOpts;

  beforeEach(() => {
    ServeQuestionOpts = proxyquire(
      '../../../src/cli/serve-question', {}).ServeQuestionOpts;
  });

  it('build defaults', () => {
    expect(ServeQuestionOpts.build()).to.eql({
      dir: process.cwd(),
      clean: false,
      port: 4000
    });
  });
});
