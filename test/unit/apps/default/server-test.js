import proxyquire from 'proxyquire';
import { expect } from 'chai';
import { assert, spy, stub } from 'sinon';

const LIB = `${__dirname}/../../../../lib`;

describe('DefaultAppServer', () => {

  let DefaultAppServer, instance, app, http, sockjs, httpInstance, sockInstance, sockHandlers;


  beforeEach(() => {
    app = {};

    sockHandlers = {};

    httpInstance = {
      on: stub(),
      listen: stub()
    };

    sockInstance = {
      on: spy((key, handler) => {
        sockHandlers[key] = handler;
      }),
      installHandlers: stub()
    }

    http = {
      createServer: stub().returns(httpInstance)
    }

    sockjs = {
      createServer: stub().returns(sockInstance)
    }
    DefaultAppServer = proxyquire(`${LIB}/apps/default/server`, {
      http: http,
      sockjs: sockjs
    }).default;
    instance = new DefaultAppServer(app);
  });

  describe('constructor', () => {

    it('constructs', () => {
      expect(instance).not.eql(undefined);
    });

    it('has httpServer', () => {
      expect(instance.httpServer).to.eql(httpInstance);
    });

    it('has _sockServer', () => {
      expect(instance._sockServer).to.eql(sockInstance);
    });
  });

  describe('reload', () => {
    let connection;

    beforeEach(() => {
      connection = {
        write: stub()
      }

      sockHandlers['connection'](connection);
      instance.reload('blah');
    });

    it('calls _connection.write', () => {
      assert.calledWith(connection.write, JSON.stringify({ type: 'reload' }));
    });
  });

  describe('error', () => {
    let connection, errors;

    beforeEach(() => {
      connection = {
        write: stub()
      }
      errors = [{ err: 'err' }];
      sockHandlers['connection'](connection);
      instance.error('blah', errors);
    });

    it('calls _connection.write', () => {
      assert.calledWith(connection.write, JSON.stringify({ type: 'error', errors: errors }));
    });
  });
});