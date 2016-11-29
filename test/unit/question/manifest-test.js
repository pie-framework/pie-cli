import proxyquire from 'proxyquire';
import { assert, stub } from 'sinon';
import { expect } from 'chai';

describe('manifest', () => {
  let make, questionConfig, questionInstance, dependencyHelper, makeResult;

  beforeEach(() => {

    questionInstance = {
      npmDependencies: {
        a: '1.0.0'
      }
    }

    questionConfig = {
      QuestionConfig: stub().returns(questionInstance)
    }

    dependencyHelper = {
      dependenciesToHashAndSrc: stub().returns({ hash: 'hash', src: 'src' })
    }

    make = proxyquire('../../../lib/question/manifest', {
      './question-config': questionConfig,
      '../npm/dependency-helper': dependencyHelper
    }).make;
  });

  describe('make', () => {

    beforeEach(() => {
      makeResult = make('dir');
    });

    it('calls dependenciesToHashAndSrc', () => {
      assert.calledWith(dependencyHelper.dependenciesToHashAndSrc, questionInstance.npmDependencies);
    });

    it('returns the result', () => {
      expect(makeResult).to.eql({ hash: 'hash', src: 'src', dependencies: { a: '1.0.0' } });
    });
  });
});