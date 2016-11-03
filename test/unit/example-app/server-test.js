import proxyquire from 'proxyquire';
import { expect } from 'chai';
import { assert, spy, stub } from 'sinon';

describe('ExampleAppServer', () => {

  let ExampleAppServer, instance, app, http, sockjs, httpInstance, sockInstance, sockHandlers;


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
    ExampleAppServer = proxyquire('../../../src/example-app/server', {
      http: http,
      sockjs: sockjs
    }).default;
    instance = new ExampleAppServer(app);
  });

  describe('constructor', () => {

    it('constructs', () => {
      expect(instance).not.eql(undefined);
    });

    it('has _httpServer', () => {
      expect(instance._httpServer).to.eql(httpInstance);
    });

    it('has _sockServer', () => {
      expect(instance._sockServer).to.eql(sockInstance);
    });
  });

  describe('on', () => {
    it('calls _httpServer.on', () => {
      let handler = stub()
      instance.on('a', handler);
      assert.calledWith(httpInstance.on, 'a', handler);
    })
  });

  describe('listen', () => {
    it('calls _httpServer.listen', () => {
      instance.listen(1111);
      assert.calledWith(httpInstance.listen, 1111);
    })
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