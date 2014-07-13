
Crafty.c("Controls", {
  init: function() {
    this.requires('Twoway');
    this.enableControl();
  },

  Controls: function(speed, jump) {
    this.twoway(speed, jump);
    return this;
  }
});

Crafty.c("GameOver", {
  init: function() {
    this.requires('2D, DOM, Text, gameOver');
    this.attr({
      x: 10,
      y: 25,
      w: 300
    });
  }
});

Crafty.c("HitPoints", {
  init: function() {
    this.requires('2D, DOM, Text, hitPoints');
    this.attr({
      x: 10,
      y: 25,
      w: 300
    });
  }
});

Crafty.c("Score", {
  init: function() {
    this.requires('2D, DOM, Text, score');
    this.attr({
      x: 10,
      y: 25,
      w: 300
    });
  }
});

Crafty.c('Button', {
  init: function() {
    this.requires('2D, DOM, Mouse');
  },
  button: function(clickFunction) {
    this._clickFunction = clickFunction;

    this.bind('MouseDown', function() {
      if (!this.has('disabled')) {
        this._clickFunction(this);
      }
    });
    return this;
  },
  disable: function(on) {
    if (on) {
      this.addComponent('disabled');
      this.attr({
        alpha: 0.5
      });
    } else {
      this.removeComponent('disabled');
      this.attr({
        alpha: 1
      });
    }
    return this;
  },
  execute: function(alwaysExecute) {
    if (alwaysExecute || !this.has('disabled')) {
      this._clickFunction(this);
    }
  },
  hide: function(hide) {
    if (arguments.length === 0) hide = true;

    this.visible = !hide;

    for (var i in this._children) {
      this._children[i].visible = !hide;
    }
  },
  setMouseHover: function(hoverFunction) {
    this._hoverFunction = hoverFunction;

    this.bind('MouseOver', function() {
      this._hoverFunction(this, true);
    });
    this.bind('MouseOut', function() {
      this._hoverFunction(this, false);
    });
  }
});

Crafty.c('Text2', {
  init: function() {
    this.requires('2D, DOM, Text');
    this.unselectable();
  },
  setStyle: function(styleObject) {
    for (var property in styleObject) {
      var propertyFunctionName = 'set' + property.substr(0, 1).toUpperCase() + property.substr(1);

      this[propertyFunctionName](styleObject[property]);
    }
    return this;
  },
  setAlign: function(align) {
    this.css('text-align', align);
    return this;
  },
  setBorder: function(border) {
    var parameters = border.split(',');

    this.css('border-style', 'solid');

    switch (parameters.length) {
      case 4:
        this.css('border-style', parameters[3]);
        break;
      case 3:
        this.css('padding', parameters[2]);
        break;
      case 2:
        this.css('border-width', parameters[1]);
        break;
      case 1:
        this.css('border-color', parameters[0]);
        break;
      case 0:
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
    this.textFont('size', size + 'px');
    return this;
  },
  setType: function(type) {
    if (type === 'bold') {
      this.textFont('weight', 'bold');
    } else if (type === 'italic') {
      this.textFont('type', 'italic');
    }
    return this;
  },
  setWidth: function(width) {
    //this.css('width', width);
    this.w = width;
    return this;
  }
});