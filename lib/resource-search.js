var Resource = require('resourceful').Resource;

exports.patch = function(){
	
	Resource.search = function(query,callback){
		return this.connection["search"].call(this.connection, query, this.resource, callback);
	};
	
	
	Resource.terms = function( /* field, size, query, callback */ ){
		var args = Array.prototype.slice.call( arguments, 0 ),
			callback = args.pop(),
			query = args.pop() || "",
			size = args.pop(),
			field = args.pop() || "_all",
			self = this;
	
		var body = {
			size : 0,
			facets : {}
		};
		body.facets[this.resource] = {
			terms : {
				field : field,
				size : size,
				regex : "\\b"+query+"[\\w]+",
				regex_flags : "DOTALL",
				order : "term"
			}
		};
		
		this.search.call( this, body, function( err, data, res ){
			callback( err, res.facets[self.resource].terms );
		});
	};
	
};