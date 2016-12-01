import { statSync } from 'fs-extra';
import { join } from 'path';

export interface Element {
  key: string;
  value: string;
}

let isLocalFile = (p: string): boolean => {
  try {
    return statSync(p).isFile();
  } catch (e) {
    return false
  }
}

let isLocalDir = (p: string): boolean => {
  try {
    return statSync(p).isDirectory();
  } catch (e) {
    return false
  }
}

export class LocalFile implements Element {
  constructor(readonly key: string, readonly value: string) { }

  static build(key, value) {
    if (isLocalFile(value)) {
      return new LocalFile(key, value);
    }
  }
}

export class LocalPackage implements Element {
  constructor(readonly key: string, readonly value: string) { }

  static build(key, value) {
    if (isLocalDir(value) &&
      isLocalFile(join(value, 'package.json'))
    ) {
      return new LocalPackage(key, value);
    }
  }
}

export class PiePackage implements Element {

  constructor(readonly key: string, readonly value: string) { }

  static CONTROLLER = 'controller';

  get controllerDir() {
    return join(this.value, PiePackage.CONTROLLER);
  }

  get schemasDir() {
    return join(this.value, 'docs/schemas');
  }

  get inNodeModulesDir(): boolean {
    return this.value.indexOf('/node_modules/') !== -1;
  }

  static build(key, value) {

    let isLocal = isLocalDir(value) &&
      isLocalFile(join(value, 'package.json')) &&
      isLocalFile(join(value, PiePackage.CONTROLLER, 'package.json'));

    if (isLocal) {
      return new PiePackage(key, value);
    }
  }

}

export class NotInstalledPackage implements Element {
  constructor(readonly key: string, readonly value: string) { }
}
