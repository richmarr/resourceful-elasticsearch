var Resource = require('resourceful').Resource;

exports.patch = function(){
	Resource.search = function(query,callback){
		return this._request("search", query, this.resource, callback );
	};
};