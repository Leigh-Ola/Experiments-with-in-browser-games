var PixiDetector = (function(){

	function addClicker(app, exposed){
		var wid = app.view.offsetWidth;
		var hei = app.view.offsetHeight;
		
		var clickCover = document.createElement("div");
		clickCover.style.opacity = "0";
		clickCover.style["zIndex"] = "99";
		clickCover.style.display = "block";
		clickCover.style.position = "absolute";
		clickCover.style.width = wid+"px";
		clickCover.style.height = hei+"px";
		clickCover.style.left = app.view.style.left;
		clickCover.style.top = app.view.style.top;

		app.view.parentElement.insertBefore(clickCover, app.view);
		
		
		for(var i in data.events){
			new addListener(data.events[i]);
		}
		function addListener(eventName){
			this.eventName = eventName;
			var self = this;
			clickCover.addEventListener(self.eventName, function(e){
				try{
					var ids = Object.keys(data.listeners[self.eventName]);
					for(var i in ids){
						data.listeners[self.eventName][ids[i]].call(this, e);
					}
				}catch(e){}
			});
		}
		
		return clickCover;
	}
	
	
	function fixAxis(sprite){
		var x = sprite.x, y = sprite.y;
		if(sprite.anchor.x){
			x = (sprite.x - (sprite.width * sprite.anchor.x));
		}
		if(sprite.anchor.y){
			y = (sprite.y - (sprite.width * sprite.anchor.y));
		}
		return { x : x, y : y, width : sprite.width, height : sprite.height };
	}
	
	function contain(el, box, noFix){
		var noFix = (noFix === true);
		var results = (function(){
			var arr = [], self = this;
			this.length = 0;
			this.toString = function(){
				return arr.toString();
			}
			this.has = function(x){
				return (arr.indexOf(x) > -1);
			}
			this.push = function(x){
				arr.push(x);
				this.length++;
			}
			return this;
		})();
		if(el.x < box.x){
			results.push("left");
			if(!noFix){
				el.x = box.x;
			}
		}
		if(el.y < box.y){
			results.push("top");
			if(!noFix){
				el.y = box.y;
			}
		}
		if(el.x + el.width > box.width){
			results.push("right");
			if(!noFix){
				el.x = (box.width -el.width);
			}
		}
		if(el.y + el.height >box.height){
			results.push("bottom");
			if(!noFix){
				el.y = (box.height - el.height);
			}
		}
		if(!results.length){
			return undefined;
		}
		return results;
	}
	
	function detectHit(el2, el1_bak, isRepeat){
		if(arguments.length > 1){
			var el1 = el2;
			var el2 = el1_bak;
		}else{
			var el1 = fixAxis(this.sprite);
			var el2 = el2;
		}
		function le(el){ return el.x; }
		function re(el){
			return (el.x + el.width);
		}
		function te(el){ return el.y; }
		function be(el){
			return (el.y + el.height);
		}
		
		var xAxis_hit = ( ((le(el1) < re(el2)) && (le(el1) > le(el2))) || ((re(el1) > le(el2)) && (re(el1) < re(el2))) );
		var yAxis_hit = ( ((te(el1) < be(el2)) && (te(el1) > te(el2))) || ((be(el1) > te(el2)) && (be(el1) < be(el2))) );
		if(xAxis_hit && yAxis_hit){
			return true;
		}else{
			if(!isRepeat){
				return detectHit(el2, el1, true);
			}
			return false;
		}
	}
	
	function on(eventName, callback){
		this.callback = callback;
		var self = this, clicker = this.clicker;
		var id = (new Date()).getTime();
		if(!data.listeners.hasOwnProperty(eventName)){
			data.listeners[eventName] = {};
		}
		function execute(e){
			if(self.spriteIsCover){
				callback(e);
				return;
			}
			if(e.hasOwnProperty("changedTouches")){
				var el1 = { x : e.changedTouches[0].pageX, y : e.changedTouches[0].pageY, width : 0, height : 0 };
			}else{
				var el1 = { x : e.pageX, y : e.pageY, width : 0, height : 0 };
			}
			var el2 = fixAxis(self.sprite);
			if(detectHit(el1, el2)){
				callback.call(self.sprite, e);
			}
		}
		data.listeners[eventName][id] = execute;
		return { "eventName" : eventName, "id" : id };
	}
	
	function one(eventName, callback){
		var id = on.call(this, eventName, function(event, spriteEvent){
			callback.call(this, event, spriteEvent);
			remove();
		});
		function remove(){
			delete data.listeners[eventName][id];
		}
	}
	
	function off(id){
		if(typeof id == "object"){
			delete data.listeners[id.eventName][id.id];
		}else if(typeof id == "string"){
			data.listeners[id] = {};
		}
	}

var data = {
	isSet : false,
	listeners : {},
	events : ["click","touchend", "touchmove", "touchstart", "mousedown", "mousemove"],
	methods : {
		on : on,
		one : one,
		off : off,
		detectHit : detectHit,
		contain : contain
	}
};

return function(a){
	function selectSprite(sprite, app){
		function expose(s, app){
		 	var obj = function(){
				this.sprite = s;
				this.app = app;
				this.cover = "";
				this.spriteIsCover = false;
			}
			obj.prototype = data.methods;
			return new obj();
		}
		
		var obj = expose(sprite, app);
		if(!data.isSet){
			var clickCover = addClicker.call(obj, app);
			obj.cover = clickCover;
			data.isSet = true;
		}
		
		if(!sprite || (String(sprite.constructor).indexOf("bject") < 0) || (String(Object.keys(sprite)) == String(Object.keys(app)))){
			obj.spriteIsCover = true;
		}
		return obj; 
	}
	
	return function(s){
		return selectSprite(s, a);
	}
}
})();