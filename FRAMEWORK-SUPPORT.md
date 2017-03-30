# Framework Support

```javascript
{
  pie: {
    support: {
      name: package
    }
  }
}
```

`pie pack` ..  

1. load config.json
2. for each entry in `elements` check if a package.json is available (aka local/github/npm)
  * read `pie.support` field - build a map of support dependencies
  * install support dependencies to a user specific location aka `~/.pie/.support` (`cd ~/.pie/.support && npm install x`)
3. call `loadSupportModule` with the path to each installed module. 

> Requires a pre-build step to read in the metadata from each elements `package.pie` field.