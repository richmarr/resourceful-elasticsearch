var Resource = require('resourceful').Resource;

exports.patch = function(){
	Resource.search = function(query,callback){
		return this.connection["search"].call(this.connection, query, this.resource, callback);
	};
};