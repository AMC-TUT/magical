Crafty.c('Text2', {
	init: function() {
		this.requires('2D, DOM, Text');
		this.unselectable();

		this.setStyle({font: 'arial', size: 12});
	},
	setStyle: function(styleObject) {
		for(var property in styleObject) {
			var propertyFunctionName = 'set' + property.substr(0, 1).toUpperCase() + property.substr(1);
			
			this[propertyFunctionName](styleObject[property]);
		}
		return this;
	},
	setAlign: function(align) {
		/*var parameters = align.split(',');

		this.css('text-align', parameters[0]);

		if(parameters.length > 1) {
			console.log(parameters[1]);
			this.css('vertical-align', parameters[1]);
		}*/
		this.css('text-align', align);
		return this;
	},
	//Arguments should be in order 'backgroundColor, borderColor, borderWidth, padding, borderStyle' like '#FFFFFF, #FF0000, 5, 4px 2px, dashed'
	//No arguments clear the backgroundColor and border. borderStyle is considered 'solid' unless 4th argument is defined 
	setBackground: function(backgroundParams) {
		var parameters = backgroundParams.split(',');

		this.css('border-style', 'solid');

		switch(parameters.length) {
			case 5:
				this.css('border-style', parameters[4]);
			case 4:
				this.css('padding', parameters[3]);
			case 3:
				this.css('border-width', parameters[2]);
			case 2:
				this.css('border-color', parameters[1]);
			case 1:
				this.css('background-color', parameters[0] !== '' ? parameters[0] : 'transparent');
				break
			case 0:
				this.css('background-color', 'transparent');
				this.css('border-style', 'none');
		}
		return this;
	},
	setColor: function(color) {
		this.textColor(color);
		return this;
	},
	setFont: function(font) {
		this.textFont('family', font);
		return this;
	},
	setHeight: function(height) {
		//this.css('height', height);
		this.h = height;
		return this;
	},
	setSize: function(size) {
		this.textFont('size', size+'px');
		return this;
	},
	setType: function(type) {
		if(type === 'bold') {
			this.textFont('weight', 'bold');
		}
		else if(type === 'italic') {
			this.textFont('type', 'italic');
		}
		return this;
	},
	setWidth: function(width) {
		/*var tempDiv = $('<div>' + this + '</div>')
		.css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': this.textFont('size')+'px '+this.textFont('family')})
		.appendTo($('body')),
		w = tempDiv.width();

		tempDiv.remove();
		console.log(this, w);*/
		this.w = width;

		return this;
	},
	/*setHighlight: function() {
		text-shadow: 0 0 2px #000; // horizontal-offset vertical-offset 'blur' colour
		-moz-text-shadow: 0 0 2px #000;
		-webkit-text-shadow: 0 0 2px #000;
		return this;
	}*/
});

Crafty.c('Button', {
	init: function() {
		this.requires('2D, DOM, Mouse');
	},
	button: function(clickFunction) {
		this._clickFunction = clickFunction;

		this.bind('MouseDown', function() {
			if(!this.has('disabled')) {
				this._clickFunction(this);
			}
		});
		return this;
	},
	disable: function(on) {
		if(on) {
			this.addComponent('disabled');
			this.attr({alpha: 0.5});
			//this.addComponent('2D');
			//this.tint('#333333', 0.5);
		}
		else {
			this.removeComponent('disabled');
			this.attr({alpha: 1});
		}
		return this;
	},
	hide: function(hide) {
		if(arguments.length == 0) hide = true;

		this.visible = !hide;

		for(var i in this._children) {
			this._children[i].visible = !hide;
		}
	}
});

Crafty.c('Qr', {
	init: function() {
		this.requires('2D, DOM, Image, Mouse');
	},
	qr: function(url, size, buttonize, callback) {
		var qrSize = size || 150;
		
		this.image('https://chart.googleapis.com/chart?chs='+qrSize+'x'+qrSize+'&cht=qr&chl=' + url);
		
		if(buttonize) {
			//Possible to open a fake client by clicking the QR code
			this.addComponent('Button').button(function() {window.open(url, '_blank');});
		}

		if(callback) {
			this.bind('Change', function() {
				callback(this);
				//this.unbind('Change');
			});
		}
		return this;
	}
});

Crafty.c('StatusBar', {
	init: function() {
		this.requires('2D, DOM');
		/*this._background = Crafty.e('2D, DOM, healthBarBg').attr({x: settings.dimensions.healthBarX, y: settings.dimensions.healthBarY});
		this.addComponent('2D, DOM, healthBarFront').attr({x: settings.dimensions.healthBarX, y: settings.dimensions.healthBarY});
		this.maxValue(100);*/
	},
	statusBar: function(horizontal, maxValue, barImageId, backgroundImageId) {
		this._horizontal = horizontal;

		this.addComponent(backgroundImageId);
		
		this._bar = Crafty.e('2D, DOM, '+barImageId);
		this._barOrigSize = horizontal ? this._bar._w : this._bar._h;
		this.attach(this._bar);
		
		this.maxValue(maxValue);
		//this.changeValue(maxValue);

		return this;
	},
	maxValue: function(max) {
		this._maxValue = max;
		this._currentValue = max;
		this.setBar();

		return this;
	},
	addValue: function(valueAddition) {
		this._currentValue = Math.max(0, Math.min(this._currentValue + valueAddition, this._maxValue));
		this.setBar();

		return (this._currentValue <= 0);
	},
	changeValue: function(newValue) {
		this._currentValue = Math.max(0, Math.min(newValue, this._maxValue));
		this.setBar();

		return (this._currentValue <= 0);
	},
	setBar: function() {
		if(this._horizontal) {
			/*var barWidth = this._w * this._currentValue / this._maxValue;
			//console.log('barWidth: ',this._w,' * ',this._currentValue,' / ',this._maxValue,' === ', barWidth);
			this._bar.x = this._w - barWidth;
			this._bar.crop(this._w - barWidth, 0, barWidth, this._h);*/
		}
		else {
			var barHeight = this._barOrigSize * this._currentValue / this._maxValue;
			
			this._bar.crop(0, 0, this._bar._w, barHeight);
			this._bar.x = (this._w - this._bar._w) / 2 + this._x;
			this._bar.y = this._barOrigSize - barHeight + (this._h - this._barOrigSize) / 2 + this._y;
		}
		this._bar.z = this._z + 1;

		return this;
	}
});