import { join } from 'path';
import { statSync } from 'fs-extra';

export interface Element {
  key: string;
  value: string;
}

const isLocalFile = (p: string): boolean => {
  try {
    return statSync(p).isFile();
  } catch (e) {
    return false;
  }
};

const isLocalDir = (p: string): boolean => {
  try {
    return statSync(p).isDirectory();
  } catch (e) {
    return false;
  }
};

export class LocalFile implements Element {

  public static build(key, value) {
    if (isLocalFile(value)) {
      return new LocalFile(key, value);
    }
  }

  constructor(readonly key: string, readonly value: string) { }

}

export class LocalPackage implements Element {

  public static build(key, value) {
    if (isLocalDir(value) &&
      isLocalFile(join(value, 'package.json'))
    ) {
      return new LocalPackage(key, value);
    }
  }

  constructor(readonly key: string, readonly value: string) { }
}

export class PiePackage implements Element {

  public static CONTROLLER = 'controller';
  public static CONFIGURE = 'configure';

  public static build(root: string, key: string, value: string) {

    const isLocal = isLocalDir(join(root, value)) &&
      isLocalFile(join(root, value, 'package.json')) &&
      isLocalFile(join(root, value, PiePackage.CONTROLLER, 'package.json'));

    if (isLocal) {
      return new PiePackage(key, value);
    }
  }

  constructor(readonly key: string, readonly value: string) { }

  get controllerDir() {
    return join(this.value, PiePackage.CONTROLLER);
  }

  get configureDir() {
    return join(this.value, PiePackage.CONFIGURE);
  }

  get schemasDir() {
    return join(this.value, 'docs/schemas');
  }

  get inNodeModulesDir(): boolean {
    return this.value.indexOf('/node_modules/') !== -1;
  }
}

export class NotInstalledPackage implements Element {
  constructor(readonly key: string, readonly value: string) { }
}
