import { FileNames } from '../config';
import { fromPath } from '../config/types';
import { existsSync } from 'fs-extra';

export type SessionArray = { id: string }[];

export class Session {

  public static build(dir: string, args: any): Session {
    const filenames = FileNames.build(args);
    const sessionPath = filenames.resolveSession(dir);
    const session = new Session(sessionPath);
    session.reload();
    return session;
  }

  private arr: SessionArray;

  private constructor(private sessionPath: string) { }

  public reload(): void {
    this.arr = existsSync(this.sessionPath) ? fromPath<SessionArray>(this.sessionPath) : [];
  }

  get array() {
    return this.arr;
  }
}
