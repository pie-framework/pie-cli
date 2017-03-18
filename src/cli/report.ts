import * as emoji from 'node-emoji';
import * as ora from 'ora';

import { blue, green, red } from 'chalk';

interface Instance {
  finish(e?: Error): boolean;
}

interface Handler {
  indeterminate(label: string): Instance;
}

class SpinnerInstance implements Instance {

  private spinner: any;

  constructor(private label: string) {
    this.spinner = ora({
      stream: process.stdout,
      text: label
    }).start();
  }

  public finish(e?: Error) {
    if (!e) {
      this.spinner.succeed(this.label);
    } else {
      this.spinner.fail(e.message);
    }

    return e === null;
  }
}

class DefaultHandler implements Handler {
  public indeterminate(label: string) {
    return new SpinnerInstance(label);
  }
}

class Report {

  private handler: Handler;

  public setHandler(h) {
    this.handler = h;
  }

  public info(s: string): void {
    process.stdout.write(blue(`${emoji.get('information_source')} ${s}\n`));
  }

  public success(s: string): void {
    process.stdout.write(green(`${emoji.get('heavy_check_mark')} ${s}\n`));
  }

  public failure(s: string): void {
    process.stdout.write(red(`${emoji.get('heavy_multiplication_x')} ${s}\n`));
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

const r = new Report();
r.setHandler(new DefaultHandler());
export default r;
