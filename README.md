# resourceful-elasticsearch

A pluggable engine for [Flatiron][2]'s [Resourceful][3] ODM layer that exposes [Elasticsearch][4] via [node-elastical][5]. 

So far this is mainly used by the [Couchelastic][6] hybrid engine so just contains search and configuration methods, rather than acting as a full data store.

## Installation

``` bash
	npm install resourceful-elasticsearch`
```

## Tests

All tests are written with [vows][0] and should be run with [npm][1]:

``` bash
  $ npm test
```

#### Author: Richard Marr
#### License: Apache 2.0


[0]: http://vowsjs.org
[1]: http://npmjs.org
[2]: http://flatironjs.org/
[3]: https://github.com/flatiron/resourceful/
[4]: http://www.elasticsearch.org
[5]: https://github.com/rgrove/node-elastical/
[6]: https://github.com/richmarr/resourceful-couchelastic/