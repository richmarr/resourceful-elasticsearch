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

var Elasticsearch = exports.Elasticsearch = resourceful.engines.Elasticsearch = function (config) {
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

//
//	Performs a search and returns the results
//
Elasticsearch.prototype.search = function( /* query, resource (optional), callback */ ){

	var args = Array.prototype.slice.call(arguments, 0);
	var query = args.shift();   // first arg always query
	var callback = args.pop(); // last arg is always callback
	var resource = args.pop(); // second last arg may be undefined 

	var body = exports.generateQuery( query );
	if ( body === null ) callback(new Error("Could not generate search request for '"+query+"'"));
	  
	if ( resource ) body.filter = exports.addFilter( body.filter, "_type", resource );
	body.index = this.index;

	this.client.search( body, function (err, results, res) {
		if ( err ) return callback(err);
		callback( undefined, exports.getDocs(results), results );
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

exports.getDocs = function(results){
	var hits = results.hits, docs = [];
	for ( var i in hits ){
		var doc = hits[i]._source;
		doc._score = hits[i]._score;
		docs.push(doc);
	}
	return docs;
};

//
//	Turns a set of valid possible query types into a standard ES query object
//
exports.generateQuery = function( term ){
	
	// String-form queries
	if ( typeof term == 'string' ) return {query:{query_string:{query:term}}};
	
	// Invalid
	if ( typeof term != 'object' ) return null;
	
	// Looks like a complete ES request so leave alone
	if ( term.query || term.filter || term.facets ) return term;
	
	// Probably just a query so wrap it
	return {query:{term:term}}; // Assume this is a valid 
};

exports.addFilter = function( filter, field, resource ){
	filter = filter || {};
	filter.term = filter.term || {};
	filter.term[field] = resource;
	return filter;
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