import { expect } from 'chai';
import proxyquire from 'proxyquire'
import sinon from 'sinon';

describe('watchers', () => {

  describe('BaseWatcher', () => {
    let watchers;

    beforeEach(() => {

      watchers = proxyquire('../../../src/watch/watchers', {
        chokidar: {},
        'fs-extra': {}
      });
    });

    it('constructs', () => {

    });

  });

});