import * as emoji from 'node-emoji';
import * as ora from 'ora';

import { blue, green, red } from 'chalk';

type WritableStream = NodeJS.WritableStream;

interface Instance {
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
    this.stream.write(blue(`${emoji.get('information_source')} ${s}\n`));
  }

  public success(s: string): void {
    this.stream.write(green(`${emoji.get('heavy_check_mark')} ${s}\n`));
  }

  public failure(s: string): void {
    this.stream.write(red(`${emoji.get('heavy_multiplication_x')} ${s}\n`));
  }

  public indeterminate<A>(label: string, p: Promise<A>): Promise<A> {

    if (!this.handler) {
      return p;
    }

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
}

const r = new Report(process.stdout);

export default r;

export const indeterminate = r.indeterminate.bind(r);
