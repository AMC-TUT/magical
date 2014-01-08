function MediaLoader() {
	this._loadArray = new Array();
	this._parameterMap = {};
	this._loadingInProgress = false;
	this._soundType = null;
}

MediaLoader.prototype.addImage = function(id, url) {
	this._parameterMap[id] = {type: 'image', url: url};
	//console.log(id, this._parameterMap[id]);
	this.addToLoader(url);
}

MediaLoader.prototype.addImages = function(imagesNode) {
	for(var imageId in imagesNode) {
		//console.log(imageId, imagesNode[imageId]);
		this.addImage(imageId, imagesNode[imageId]);
	}
}

MediaLoader.prototype.addSprite = function(id, spriteObject, overrideUrl) {
	spriteObject.type = 'sprite';
	spriteObject.url = overrideUrl ? overrideUrl : spriteObject.image.url;
	this._parameterMap[id] = spriteObject;
	//console.log(id, this._parameterMap[id]);
	this.addToLoader(spriteObject.url);
}

MediaLoader.prototype.addSprites = function(spritesNode) {
	for(var spriteId in spritesNode) {
		this.addSprite(spriteId, spritesNode[spriteId]);
	}
}

MediaLoader.prototype.addSound = function(id, soundObject) {
	/*if(this._soundType === null) {
		try {
			this._soundType = 'webkitAudio';
			var audioContext = new webkitAudioContext();
		}
		catch(evt) {
			this._soundType = 'other';
			alert('Web Audio API is not supported in this browser');
		}
	}*/
	//console.log(id, soundObject);
	var urlParts = soundObject.url.split('.'); 

	this._parameterMap[id] = {type: 'sound', url: urlParts[0], formats: urlParts[1].split('|')};
	//console.log(id, this._parameterMap[id]);
	this.addToLoader(soundObject.url);
}

MediaLoader.prototype.addSounds = function(soundsNode) {
	for(var soundId in soundsNode) {
		if(soundsNode[soundId] instanceof Object) {
			this.addSound(soundId, soundsNode[soundId]);
		}
		else {
			this.addSound(soundId, {'url': soundsNode[soundId]});
		}
	}
}

MediaLoader.prototype.load = function(callback) {
	var _this = this;

	this._loadingInProgress = true;
	
	if(this._loadArray.length > 0) {
		Crafty.load(this._loadArray, function() {
			for(var id in _this._parameterMap) {
				var assetObject = _this._parameterMap[id];
				var asset = Crafty.assets[assetObject.url];
				var spriteObject = {};
				//console.log(assetObject);
				switch(assetObject.type) {
					case 'image':
						spriteObject[id] = [0, 0];
						Crafty.sprite(asset.width, asset.height, assetObject.url, spriteObject);
						break;
					case 'sprite':
						spriteObject[id] = [0, 0];
						Crafty.sprite(assetObject.image.frameWidth, assetObject.image.frameHeight, assetObject.url, spriteObject);
						break;
					case 'sound':
						var audioType = 'mp3'; //Use only mp3 for now...

						Crafty.audio.add(id, assetObject.url+'.'+audioType);
						break;
				}
				//console.log(id, assetObject.url, '('+assetObject.type+')');
			}
			_this._loadArray = new Array();
			_this._parameterMap = {};
			_this._loadingInProgress = false;
			
			//console.log(Crafty.assets);
			callback(true);
		},
		function(evt) {
			//console.log('Progress: ', evt);
		},
		function(evt) {
			console.log('ImageLoader error: ', evt);
			callback(false);
		});
	}
	else {
		callback(true);
	}
}

//Add an url to _loadArray unless the url is there already or the asset has already been loaded earlier (as Crafty cannot handle that properly)
MediaLoader.prototype.addToLoader = function(url) {
	//MediaLoader is already executing a load operation. Do not accept further media to load until the current load finishes
	if(this._loadingInProgress) {
		console.log('loading in progress!');
		return false;
	}
	//console.log(url);
	for(var index in this._loadArray) {
		if(url === this._loadArray[index]) {
			return false;
		}
	}
	for(var asset in Crafty.assets) {
		if(url === asset) {
			return false;
		}
	}
	this._loadArray.push(url);
	return true;
}
