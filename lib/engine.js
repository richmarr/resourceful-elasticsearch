/*
 * elasticsearch/index.js: Elasticsearch engine wrapper
 *
 * (C) 2011 Richard Marr
 * MIT LICENCE
 *
 */

var resourceful = require('resourceful'),
    Cache = resourceful.Cache,
    elastical = require('elastical');

var Elasticsearch = resourceful.engines.Elasticsearch = function (config) {
  this.config = config = config || {};
  this.uri = config.uri;
  this.index = config.index || resourceful.env;

  this.client = new(elastical.Client)( config.host || config.uri || '127.0.0.1', {
    port:  config.port || 9200,
    timeout:   config.timeout || false
  });

  //this.index = new(elastical.Index)( client, config.index );

  this.cache = new resourceful.Cache();
};

// es mapping
// couch filter?

Elasticsearch.prototype.protocol = 'elasticsearch';

Elasticsearch.prototype.search = function( term, resource, callback ){

  var params = {}
  params.query = ( typeof term == 'string' ) ? {query_string:{query:term}} : term;
  params.filter = { term : { _type:resource } };
  params.index = this.index;

  this.client.search(params, function (err, results, res) {
      // `err` is an Error, or `null` on success.
      // `results` is an object containing search hits.
      // `res` is the full parsed ElasticSearch response data.
    if ( err ) return callback(err);

    var hits = results.hits, docs = [];
    for ( var i in hits ){
      hits[i]._source._score = hits[i]._score;
      docs.push(hits[i]._source);
    }
    callback(undefined,docs,results);
  });
};


Elasticsearch.prototype.find = function( terms, callback ){
	return Elasticsearch.prototype.search.apply( this, [ { term : terms }, '', callback ] );
};

// Just sync a mapping doc as that's the only meaningful schema here
Elasticsearch.prototype.sync = function (factory, callback) {
  var mapping = getMapping(factory);
  this.client.putMapping( this.index, factory.resource, mapping, callback );
};

// Creates a mapping object from the Resource schema
// See the Elasticsearch documentation on Mappings
function getMapping(factory){

  var name = factory.resource,
      result = {},
      mappings = {},
      props = factory.properties;

  for ( var propname in props ){
    var prop = props[propname];
    if ( prop.searchable === false || prop.type ){
      mappings[propname] = {};
      if ( prop.searchable === false ) mappings[propname].enabled = false;
      if ( prop.type ) mappings[propname].type = mapTypes(prop.arraytype || prop.type);
    }
  }
  result[name] = { properties:mappings }
  return result;
}

function mapTypes( jsType ){
	var javaTypes = { number:'integer' };
	return javaTypes[jsType] || jsType;
}