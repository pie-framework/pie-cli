# manifest

Get a unique hash built from the pie names + versions defined in this question. The last line from the command is a json string.

## Options

`--outfile` - file path to write out manifest to. default: not set (no file is written).
`--dir` - the directory of the question default: the current working directory. 

## Examples 

`pie manifest --outfile my-manifest.json`

`pie manifest --dir some/dir --outfile my-manifest.json`