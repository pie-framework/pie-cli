# Proposed alterations to architecture 

We need to evolve the architecture a bit to give us greater flexibility over the output of the pack/serve commands. Currently we have a `pack` and `serve` command that does alot of the grunt work but delegates some of the output definitions to the default `ExampleApp`.

Different use cases are emerging in what artifacts should be produced/served:

* current output - based on `ExampleApp`, builds an example page, adds controller, player and control-panel to pie.js. 
* thin output - create an output with only the pie's and their dependents are added.
* demo - create a demo page with a ui for the readme, schemas and a demo of the element running.

The proposal is: 

* maintain `pack` and `serve`
* add option to both to allow the *type* of app to pack/serve (with the default being `ExampleApp`).
* broaden the control that the *type* has on the output/endpoints that are created.


## Examples

### default 

```shell
pie pack 
```

Generates `example.html`, `pie.js` and `controller.js` and functions as it currently does.

### pie-demo 

```shell
pie pack --type pie-demo \
--pie-demo-readme ../../README.md \
--pie-demo-schemas ../schemas
```

Generates: `index.html`

```html
<head>
  <script src="./pie-demo-corespring-choice.js"></script>
  <body>
    <!-- pie-demo-corespring-choice is a custom element that has everything bundled into it -->
    <pie-demo-corespring-choice></pie-demo-corespring-choice>
  </body>
</head>
```

> `serve` would serve the above, but `pie-demo-corespring-choice.js` will be connected to webpack middleware and a `sockjs` connection would be added.