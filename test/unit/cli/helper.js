import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import * as _ from 'lodash';

import * as _types from '../../../lib/apps/types';

export const types = _types;

export function loadStubApp(path, app, requireOpts, loadAppPath) {
  requireOpts = requireOpts || {};
  loadAppPath = loadAppPath || '../apps/load-app';

  let appRequires = {};

  let loadApp = stub().returns(Promise.resolve(app));

  appRequires[loadAppPath] = {
    default: loadApp
  }

  return {
    module: proxyquire(path, _.merge(appRequires, requireOpts)),
    loadApp: loadApp,
    app: app
  }
}

export function runCmd(cmd, args, done) {
  cmd.run(args)
    .then((result) => {
      cmd.result = result;
      done();
    })
    .catch(done);
}