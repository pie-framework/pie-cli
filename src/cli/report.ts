import * as ora from 'ora';
import { info, success, warning, error } from 'log-symbols';

import { blue, green, red, yellow } from 'chalk';

type WritableStream = NodeJS.WritableStream;

export interface Instance {
  finish(e?: Error): boolean;
}

interface Handler {
  indeterminate(label: string): Instance;
}

class SpinnerInstance implements Instance {

  private spinner: any;

  constructor(stream: WritableStream, private text: string) {
    this.spinner = ora({ stream, text }).start();
  }

  public finish(e?: Error) {
    if (!e) {
      this.spinner.succeed(this.text);
    } else {
      this.spinner.fail(e.message);
    }

    return e === null;
  }
}

class DefaultHandler implements Handler {

  constructor(private stream: WritableStream) {

  }
  public indeterminate(label: string) {
    return new SpinnerInstance(this.stream, label);
  }
}

export class Report {

  private handler: Handler;

  constructor(private stream: WritableStream) {
    this.handler = new DefaultHandler(stream);
  }

  public info(s: string): void {
    this.stream.write(info);
    this.stream.write(blue(` ${s}\n`));
  }

  public success(s: string): void {
    this.stream.write(success);
    this.stream.write(green(` ${s}\n`));
  }

  public failure(s: string): void {
    this.stream.write(error);
    this.stream.write(red(` ${s}\n`));
  }

  public warning(s: string): void {
    this.stream.write(warning);
    this.stream.write(yellow(`${s}\n`));
  }

  public promise<A>(label: string, p: Promise<A>): Promise<A> {

    const id = this.handler.indeterminate(label);
    return p
      .then(r => {
        id.finish();
        return r;
      })
      .catch(e => {
        id.finish(e);
      });
  }

  public instance(label: string): Instance {
    return this.handler.indeterminate(label);
  }
}

const r = new Report(process.stdout);

export default r;

export const promise = r.promise.bind(r);
