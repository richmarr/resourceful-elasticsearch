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
		timeout:   config.timeout || false,
		basePath: config.basePath || ''
	});

	//this.index = new(elastical.Index)( client, config.index );
	this.cache = new resourceful.Cache();
};

Elasticsearch.prototype.protocol = 'elasticsearch';

//
//	Performs a search and returns the results
//
Elasticsearch.prototype.search = function( /* query, resource (optional), config (optional), callback */ ){

	var args = Array.prototype.slice.call(arguments, 0);
	var query = args.shift();   // first arg always query
	var callback = args.pop(); // last arg is always callback
	var config = args.pop(); // second last arg may be undefined 
	var resource = ( typeof config == "string" ) ? config : args.pop(); // second last arg may be undefined 
	if ( typeof config != "object" ) config = { score:true };
	
	var body = exports.generateQuery( query );
	if ( body === null ) callback(new Error("Could not generate search request for '"+query+"'"));
	  
	if ( resource ) body.filter = exports.addFilter( body.filter, "_type", resource );
	body.index = this.index;

	this.client.search( body, function (err, results, res) {
		if ( err ) return callback(err);
		callback( undefined, exports.getDocs( results, config.score ), res );
	});
};

//
// Parametric search filters, e.g. { type:'Movie', director:'scorsese', cast:'dicaprio', oscars:0 }
//
Elasticsearch.prototype.find = function( terms, callback ){
	var query = {filter:{query:{query_string:{}}}};
	var filter = [];
	for ( var field in terms ) filter.push(field+":"+terms[field]);
	query.filter.query.query_string.query = filter.join(" AND ");
	
	return Elasticsearch.prototype.search.apply( this, [ query, '', {score:false}, callback ] );
};

//
// Pushes any necessary schema data into the ES cluster, at the moment just Mapping config
//
Elasticsearch.prototype.sync = function (factory, callback) {
	var mapping = exports.getMapping(factory);
	this.client.putMapping( this.index, factory.resource, mapping, function(err,data){
		if ( err ) return callback(err);
		if ( typeof data == "string" ) {
			// Some ES clients pass back a string
			try {
				data = JSON.parse(data);
			} catch(e){
				return callback(err);
			}
		}
		if ( !data.acknowledged || !data.ok ) return callback(new Error(data.error));
		callback( undefined, data );
	});
};

//
//	Save an individual doc (with an ID) 	// TODO: open up more indexing options here
//
Elasticsearch.prototype.save = function ( /* id (optional), doc, callback */ ) {
	var args = Array.prototype.slice.call(arguments, 0),
		callback = args.pop(),
		doc = args.pop(),
		id = args.pop(),
		options = {};
	if ( id ) options.id = id; 
	this.client.index( this.index, doc.type, doc, options, callback );
};

//
//	Gets an individual doc by ID
//
Elasticsearch.prototype.get =  function (key, callback) {
	this.client( this.index, key, {}, callback);
};

//
//	Deletes the entire index
//
Elasticsearch.prototype.destroy = function (key, callback) {
	this.client.deleteIndex( this.index, callback );
}


//////////////////////////////////////////////////////////////////////////////////////
//	Methods not in the Resourceful Engine API follow, these are exported for testing
//////////////////////////////////////////////////////////////////////////////////////


//
//	Converts ES response JSON into a Resourceful-friendly array
//
exports.getDocs = function( results, score ){
	var hits = results.hits, docs = [];
	for ( var i in hits ){
		var doc = hits[i]._source;
		if ( score ) doc._score = hits[i]._score;
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
exports.getMapping = function(factory){

	var name = factory.resource,
		result = {},
		mappings = {},
		props = factory.properties;

	for ( var propname in props ){
		var prop = props[propname];
		if ( prop.search || prop.type ){
			mappings[propname] = {};
			for ( var param in prop.search ) mappings[propname][param] = prop.search[param];
			if ( prop.type ) mappings[propname].type = mapTypes(prop.arraytype || prop.type);
		}
	}
	result[name] = { properties:mappings }
	return result;
}

function mapTypes( jsType ){
	var javaTypes = { number:'long', object:'object', string:'string' };
	return javaTypes[jsType];
}