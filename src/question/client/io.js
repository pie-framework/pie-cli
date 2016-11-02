import { existsSync, writeFile } from 'fs-extra';

export function writeIfDoesntExist(path, src) {
  if (existsSync(path)) {
    return Promise.resolve(path);
  } else {
    return new Promise((resolve, reject) => {
      writeFile(path, src, 'utf8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(path);
        }
      });
    });
  }
}