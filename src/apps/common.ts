import * as webpack from 'webpack';
export type Compiler = webpack.compiler.Compiler;


export class Tag {

  constructor(readonly name: string, readonly path?: string) {
    this.path = this.path || `./${this.name}.js`;
  }

  get tag(): string {
    return `<${this.name}></${this.name}>`;
  }
}


export const clientDependencies = (args: any) => args.configuration.app.dependencies;

export class Out {

  public static build(args) {
    return new Out(
      args.questionItemTagName ? new Tag(args.questionItemTagName) : undefined,
      args.questionElements,
      args.questionControllers,
      args.questionExample,
      args.questionArchive
    );
  }

  constructor(
    readonly completeItemTag: Tag = new Tag('pie-item'),
    readonly viewElements: string = 'pie-view.js',
    readonly controllers: string = 'pie-controller.js',
    readonly example: string = 'example.html',
    readonly archive: string = 'pie-item.tar.gz') { }

}

export type Names = {
  build: BuildNames,
  out: Out
};

type BuildNames = {
  entryFile: string;
  bundledItem: Tag;
  controllersMap: string;
};


export let getNames = (args: any): Names => {
  return {
    build: {
      bundledItem: new Tag('bundled-item', './.bundled-item.js'),
      controllersMap: './.controllers-map.js',
      entryFile: './.all-in-one.entry.js'
    },
    out: Out.build(args)
  };
};

