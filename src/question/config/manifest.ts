export type KeyMap = { [key: string]: string };

export type Manifest = {
  hash: string;
  src: {
    dependencies: KeyMap,
    locals: {
      [key: string]: {
        path: string,
        hash: string
      }
    }
  }
}
