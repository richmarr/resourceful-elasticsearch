var assert = require('assert'),
	elastical = require('elastical'),
	vows = require('vows'),
	resourceful = require('resourceful'),
	Elasticsearch = require('../index').Elasticsearch;

var testIndexName = 'resourceful-elasticsearch-schema-test';

resourceful.env = 'test';

var Author = resourceful.define('Author', function () {
	this.use('elasticsearch',{index:testIndexName});
	this.string('name',{search:{analyzer:'simple'}});
	this.string('bio',{search:{analyzer:'snowball'}});
	this.string('secret',{search:{index:'no'}});
	this.number('born');
});

var client = new(elastical.Client)('127.0.0.1', {port:9200});

vows.describe('Schema').addBatch({
	"mapping file and test data": {
		topic: function () {
			var self = this;
			
			// Clean up first
			client.deleteIndex( testIndexName, function () {
				client.createIndex( testIndexName, function () {
				
					// Push mappings to clean ES index
					Author.sync(function(){
						
						// Now push some data in via the bulk API
						client.bulk([
							{index:{ index:testIndexName, type:'Author', data:{ resource: 'Author', name: 'J.K. Rowling',       secret:'lmn', born:1965, bio: 'Rowling has led a "rags to riches" life story, in which she progressed from living on social security to multi-millionaire status within five years' }}},
							{index:{ index:testIndexName, type:'Author', data:{ resource: 'Author', name: 'Will Self',          secret:'ijk', born:1961, bio: 'His fictional style is known for being satirical, grotesque, and fantastical' }}},
							{index:{ index:testIndexName, type:'Author', data:{ resource: 'Author', name: 'Jerome K Jerome',    secret:'geh', born:1859, bio: 'Jerome Klapka Jerome was an English writer and humorist, best known for the humorous travelogue Three Men in a Boat.' }}},
							{index:{ index:testIndexName, type:'Author', data:{ resource: 'Author', name: 'Hunter S. Thompson', secret:'def', born:1920, bio: 'He is credited as the creator of Gonzo journalism, a style of reporting where reporters involve themselves in the action to such a degree that they become central figures of their stories' }}},
							{index:{ index:testIndexName, type:'Author', data:{ resource: 'Author', name: 'Frédéric Dard ',     secret:'abc', born:1921, bio: 'He is one of the most famous French crime novels writers of the second half of the 20th century' }}}
						], function (err,res) {
							self.callback( err );
						});
					});
			
				});
			});
		},
		"is persisted without error": function(){},
		"is returned ":{
			topic:function(){
				client.getMapping( testIndexName, 'Author', this.callback );
			},
			"without error":function( err, mapping ){
				assert.isObject(mapping.Author);
				assert.isObject(mapping.Author.properties);
			},
			"with correct types":function( err, mapping ){
				var props = mapping.Author.properties;
				assert.equal(props.born.type,'long');
				assert.equal(props.name.type,'string');
				assert.equal(props.bio.type,'string');
				assert.equal(props.secret.type,'string');
			},
			"with additional mapping config":function( err, mapping ){
				console.error(mapping.Author.properties)
				var props = mapping.Author.properties;
				assert.equal(props.name.analyzer,'simple');
				assert.equal(props.bio.analyzer,'snowball');
				assert.equal(props.secret.index,'no');
			}
		}
	}
}).export(module);