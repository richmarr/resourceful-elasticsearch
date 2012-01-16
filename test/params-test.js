var assert = require('assert'),
	events = require('events'),
	vows = require('vows'),
	resourceful = require('resourceful'),
	esEngine = require('../index'),
	Elasticsearch = esEngine.Elasticsearch;

resourceful.env = 'test';
resourceful.use('elasticsearch',{index:'resourceful-test'});

var Article; // Set this in module scope so we can refer to it a few times

vows.describe('Parameter parsing').addBatch({
	"Query param": {
		"String":{
			topic: function () {
				return esEngine.generateQuery("red fox");
			},
			"should result in a query_string query":function( obj ){
				assert.equal( obj.query.query_string.query, "red fox" );
			}
		},
		"Query definition only":{
			topic: function () {
				return esEngine.generateQuery({
					foo:"bar"
				});
			},
			"should result in a term query":function( obj ){
				assert.equal( obj.query.term.foo, "bar" );
			}
		},
		"Full ES query object":{
			topic: function () {
				return esEngine.generateQuery({
					query:{
						term:{
							foo:"bar"
						}
					},
					filter:{
						term:{ foo:'bar' }
					}
				});
			},
			"should contain a term query":function( obj ){
				assert.equal( obj.query.term.foo, "bar" );
			},
			"should still contain its filter":function( obj ){
				assert.equal( obj.filter.term.foo, "bar" );
			}
		}
	}
}).addBatch({
	"Response processing": {
		topic: function(){
			return esEngine.getDocs({
				total: 1,
				max_score: 0.081366636,
				hits:[
					{
						_index: 'resourceful-test',
						_type: 'Article',
						_id: 'mEB1nyFoTPu6tJi-FXL4Jg',
						_score: 0.081366636,
						_source: { title:'smeg', resource:'Article' }
					}
				]
			});
		},
		"should provide one hit":function( results ){
			assert.equal( results.length, 1 );
		},
		"hits should be valid Resource data":function( results ){
			assert.equal( results[0].resource, "Article" );
		}
	}
}).export(module);