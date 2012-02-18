# resourceful-elasticsearch [![Build Status](https://secure.travis-ci.org/richmarr/resourceful-elasticsearch.png)](http://travis-ci.org/richmarr/resourceful-elasticsearch)

A pluggable engine for [Flatiron][2]'s [Resourceful][3] ODM layer that exposes [Elasticsearch][4] via the [node-elastical][5] module.

Exposes new methods to Resourceful such as `search()` and `terms()` as well as implementing as many of the existing ones as possible.

### Examples

You can use Lucene query syntax to fetch resources:

``` js
	Creature.search("legs:4",function( err, creatures ){
		// creatures contains an array of matching records
	});
```

You can power autocomplete UI by looking up term frequencies:


``` js
	Creature.terms("description",function( err, term ){
		// creatures contains an array of matching records
	});
```


## Installation

``` bash
	npm install resourceful-elasticsearch
```

## Tests

All tests are written with [vows][0] and should be run with [npm][1]:

``` bash
  $ npm test
```

## Status

So far this is mainly used by the [Couchelastic][6] hybrid engine so just contains search and 
configuration methods, rather than acting as a full data store. I am working on making this a 
functioning stand-alone engine but that's not my focus right now. 

Pull requests welcome, please include tests.



#### Author: Richard Marr
#### License: Apache 2.0


[0]: http://vowsjs.org
[1]: http://npmjs.org
[2]: http://flatironjs.org/
[3]: https://github.com/flatiron/resourceful/
[4]: http://www.elasticsearch.org
[5]: https://github.com/rgrove/node-elastical/
[6]: https://github.com/richmarr/resourceful-couchelastic/