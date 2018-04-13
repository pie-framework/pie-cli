import { assert, match, spy, stub, useFakeTimers } from "sinon";

import { expect } from "chai";
import proxyquire from "proxyquire";
import { resolve } from "path";

import { path as p } from "../../../lib/string-utils";

describe("watchers", () => {
  let watchers, baseWatch, chokidar, chokidarWatcher, fs;

  beforeEach(() => {
    class MockWatcher {
      constructor() {
        this.handlers = {};

        this.on = spy((key, handler) => {
          this.handlers[key] = handler;
          return this;
        });
      }

      run(key, path) {
        if (this.handlers[key]) {
          this.handlers[key](path);
        }
      }
    }

    chokidarWatcher = new MockWatcher();

    chokidar = {
      watch: stub().returns(chokidarWatcher)
    };

    fs = {
      copy: stub(),
      remove: stub(),
      statSync: stub(),
      existsSync: stub()
    };

    watchers = proxyquire("../../../lib/watch/watchers", {
      chokidar,
      "fs-extra": fs
    });
  });

  describe("BaseWatch", () => {
    beforeEach(() => {
      baseWatch = new watchers.BaseWatch([/ignore/]);
      baseWatch.srcRoot = "srcRoot";
      baseWatch.targetRoot = "targetRoot";
    });

    describe("constructor", () => {
      it("constructs", () => {
        expect(baseWatch).not.eql(undefined);
      });

      it("has ignores", () => {
        expect(baseWatch.ignores).to.eql([/ignore/]);
      });
    });

    describe("start", () => {
      let clock;
      before(() => {
        let date = new Date();
        clock = useFakeTimers(date.getTime());
      });

      after(() => {
        clock.restore();
      });

      beforeEach(() => {
        baseWatch.start();
      });

      it("calls chokidar.watch", () => {
        assert.calledWith(chokidar.watch, "srcRoot", match.any);
      });

      describe("changes", () => {
        it("add calls fs.copy", () => {
          chokidarWatcher.run("add", "path");
          assert.calledWith(fs.copy, "path");
        });

        it("does not call fs.copy if the targetRoot is a symlink", () => {
          fs.lstatSync = stub().returns({
            isSymbolicLink: stub().returns(true)
          });

          chokidarWatcher.run("change", "path");
          assert.notCalled(fs.copy);
        });

        it("change calls fs.copy", () => {
          chokidarWatcher.run("change", "path");
          assert.calledWith(fs.copy, "path");
        });

        it("unlink calls fs.remove", () => {
          chokidarWatcher.run("unlink", "path");
          assert.calledWith(fs.remove, "path");
        });

        let assertOnReady = (timeDiff, expectCopy) => {
          return () => {
            let srcMTime = new Date();
            let installedMTime = new Date(srcMTime.getTime() - timeDiff);

            baseWatch.getDestination = spy(function(a) {
              return p`destination/${a}`;
            });

            fs.existsSync.withArgs(p`path/file.js`).returns(true);
            fs.existsSync.withArgs(p`destination/path/file.js`).returns(true);

            fs.statSync.withArgs(p`destination/path/file.js`).returns({
              isFile: () => true,
              mtime: installedMTime
            });

            fs.statSync.withArgs(p`path/file.js`).returns({
              mtime: srcMTime,
              isFile: () => true
            });

            chokidarWatcher.getWatched = stub().returns({
              path: ["file.js"]
            });

            chokidarWatcher.run("ready");

            clock.tick(1100);

            if (expectCopy) {
              assert.calledWith(
                fs.copy,
                p`path/file.js`,
                p`destination/path/file.js`
              );
            } else {
              assert.notCalled(fs.copy);
            }
          };
        };

        it(
          "ready triggers a copy if the src more than 5 seconds newer",
          assertOnReady(5001, true)
        );

        it(
          "ready does not trigger a copy if the src is less than 5 seconds newer",
          assertOnReady(4999, false)
        );
      });
    });
  });

  describe("FileWatch", () => {
    let watch, onChange;

    beforeEach(() => {
      onChange = stub();
      watch = new watchers.FileWatch("path", onChange);
    });

    describe("constructor", () => {
      it("is not undefined", () => {
        expect(watch).not.to.be.undefined;
      });
    });

    describe("start", () => {
      beforeEach(() => {
        watch.start();
        chokidarWatcher.run("change", "path");
      });

      it("calls chokidar.watch", () => {
        assert.calledWith(chokidar.watch, "path", { ignoreInitial: true });
      });

      it("calls onChange handler", () => {
        assert.calledWith(onChange, "path");
      });
    });
  });

  describe("PackageWatch", () => {
    let watch;

    beforeEach(() => {
      watch = new watchers.PackageWatch("my-pie", "../../my-pie", "./.pie", []);
    });

    describe("constructor", () => {
      it("is not undefined", () => {
        expect(watch).not.eql(undefined);
      });

      it("has controllers in ignored", () => {
        expect(watch.ignores).to.eql([]);
      });
    });

    describe("srcRoot", () => {
      it("points to the pie controller dir", () => {
        expect(watch.srcRoot).to.eql("../../my-pie");
      });
    });

    describe("targetRoot", () => {
      it("points to the target", () => {
        expect(watch.targetRoot).to.eql(resolve("./.pie/node_modules/my-pie"));
      });
    });
  });

  describe("PieControllerWatch - localPkg", () => {
    let watch;

    beforeEach(() => {
      watch = new watchers.PieControllerWatch(
        "../../my-pie",
        {
          controllers: "./.pie/.controllers",
          root: "./.pie"
        },
        {
          isLocalPkg: true,
          moduleId: "my-pie-controller",
          tag: "my-pie-controller",
          dir: "../../my-pie-controller"
        }
      );
    });

    describe("constructor", () => {
      it("is not null", () => {
        expect(watch).not.eql(undefined);
      });
    });

    describe("srcRoot", () => {
      it("points to the pie controller dir", () => {
        expect(watch.srcRoot).to.eql(resolve(".", "../../my-pie-controller"));
      });
    });

    describe("targetRoot", () => {
      it("points to the target", () => {
        expect(watch.targetRoot).to.eql(
          resolve("./.pie/node_modules/my-pie-controller")
        );
      });
    });
  });

  describe("PieConfigureWatch - localPkg", () => {
    let watch;

    beforeEach(() => {
      watch = new watchers.PieConfigureWatch(
        "../../my-pie",
        {
          configure: "./.pie/.configure",
          root: "./.pie"
        },
        {
          moduleId: "my-pie-configure",
          isLocalPkg: true,
          dir: "../../my-pie-configure"
        }
      );
    });

    describe("constructor", () => {
      it("is not null", () => {
        expect(watch).not.eql(undefined);
      });
    });

    describe("srcRoot", () => {
      it("points to the pie controller dir", () => {
        expect(watch.srcRoot).to.eql(resolve(".", "../../my-pie-configure"));
      });
    });

    describe("targetRoot", () => {
      it("points to the target", () => {
        expect(watch.targetRoot).to.eql(
          resolve("./.pie/node_modules/my-pie-configure")
        );
      });
    });
  });

  describe("PieWatch", () => {
    let watch, dirs, controller, configure;

    beforeEach(() => {
      dirs = {
        root: ".pie",
        controllers: ".pie/.controllers",
        configure: ".pie/.configure"
      };

      controller = {
        moduleId: "module-id",
        key: "controller"
      };

      configure = {
        moduleId: "module-id",
        tag: "configure"
      };

      watch = new watchers.PieWatch(
        "my-pie",
        "my-pie",
        ".",
        "../../my-pie",
        dirs,
        controller,
        configure
      );
      watch.client = {
        start: stub()
      };
      watch.controller = {
        start: stub()
      };
      watch.configure = {
        start: stub()
      };
    });

    it("constructs", () => {
      expect(watch).not.eql(undefined);
    });

    describe("start", () => {
      beforeEach(() => {
        watch.start();
      });

      it("calls client.start", () => {
        assert.called(watch.client.start);
      });

      it("calls controller.start", () => {
        assert.called(watch.controller.start);
      });
      it("calls configure.start", () => {
        assert.called(watch.configure.start);
      });
    });
  });
});
