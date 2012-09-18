/*
Crafty.init(Game.canvas.width * Game.canvas.blockSize, Game.canvas.height * Game.canvas.blockSize);

_.each(Game.scenes, function(scene) {
  Crafty.scene(scene.name, function() {

    var bg = _.find(scene.elements, function(element) {
      return element.type === "background-image";
    });

    Crafty.background(bg ? "url(" + bg.src + ")" : "#fff");

  });

}); // each scene
_.each(Game.audios, function(audio) {

  if (audio.type === "file") {
    var id = audio.id + "";
    Crafty.audio.add({
      "weight-up": ["/assets/audio/mp3/" + id + ".mp3"]
    }); //[ id + ".ogg", id + ".mp3", id + ".wav" ] });
  }

}); // each audio
// Sprites
_.each(Game.sprites, function(sprite) {

  if (sprite.type === "file") {
    var id = sprite.id,
      content = sprite.content,
      obj = {};

    obj[id] = [0, 0];

    Crafty.sprite(Game.canvas.blockSize, "/assets/img/" + content + ".png", obj);

  }

}); // each sprite
Crafty.scene(Game.scenes[1].name);

_.each(Game.elements, function(element) {

  var cel = Crafty.c(element.type, {
    init: function() {

      var self = this;

      self.addComponent("2D", "Canvas", "Keyboard", "SpriteAnimation");

      // register all the animations at once
      _.each(element.attr.events, function(event) {
        //
        if (_.isObject(event.animation)) {
          //
          var id = event.animation.id;
          //
          if (!self.has(id)) {
            //
            var sprite = _.find(Game.sprites, function(sprite) {
              return sprite.id === id;
            });
            //
            if (_.isObject(sprite)) {
              //
              self.addComponent(id);
              //
              var frameCount = 0; // get this from sprites[]
              //
              self.animate(id, 0, 0, frameCount);
            }
          }
        }
      });

      // image
      if (_.isObject(element.attr.image)) {
        //
        var id = element.attr.image.id;
        //
        self.addComponent(id);

      } // if image
      if (_.isObject(element.attr.controls)) {

        switch (element.attr.controls.method) {
        case "Twoway":
          self.addComponent("Controls, Gravity").Controls(element.attr.controls.speed || 2, element.attr.controls.jump || 4).gravity("Platform");
          break;
        case "Fourway":
          self.addComponent("Fourway").fourway(element.attr.controls.speed || 4);
          break;
        case "Multiway":
          self.addComponent("Multiway").multiway(element.attr.controls.speed || 4, {
            UP_ARROW: -90,
            DOWN_ARROW: 90,
            RIGHT_ARROW: 0,
            LEFT_ARROW: 180
          });
          break;
        } // switch
        // keep on canvas area
        if (element.attr.controls.keepOnCanvas) {
          this.bind('Moved', function(from) { // Dont allow to move the player out of Screen
            if (this.x + this.w > Crafty.viewport.width || this.x + this.w < this.w || this.y + this.h < this.h || this.y + this.h > Crafty.viewport.height) {
              this.attr({
                x: from.x,
                y: from.y
              });
            }
          });
        } // keep element (player) on canvas
        if (_.isArray(element.attr.events)) {

          self.bind('EnterFrame', function(frame) {

            var anim;

            if (this.isDown("LEFT_ARROW")) {
              // left
              anim = Parser.getAnimation(element.attr.events, "LEFT_ARROW");

              if (_.isObject(anim) && !self.isPlaying(anim.id)) {
                self = Parser.setAnimation(self, anim);
              }
            } else if (this.isDown("RIGHT_ARROW")) {
              // right
              anim = Parser.getAnimation(element.attr.events, "RIGHT_ARROW");

              if (_.isObject(anim) && !self.isPlaying(anim.id)) {
                self = Parser.setAnimation(self, anim);
              }
            } else if (this.isDown("DOWN_ARROW")) {
              // right
              anim = Parser.getAnimation(element.attr.events, "DOWN_ARROW");

              if (_.isObject(anim) && !self.isPlaying(anim.id)) {
                self = Parser.setAnimation(self, anim);
              }
            } else if (this.isDown("UP_ARROW")) {
              // right
              anim = Parser.getAnimation(element.attr.events, "UP_ARROW");

              if (_.isObject(anim) && !self.isPlaying(anim.id)) {
                self = Parser.setAnimation(self, anim);
              }
            } else {
              // default
              if (!self.isPlaying(element.attr.image.id)) {
                self = Parser.setAnimation(self, element.attr.image);
              }
            }

          });

        }

      } // if controls
      if (element.attr.gravitation) {

        // element with gravity
        if (element.attr.gravitation.on) {
          var dir = element.attr.gravitation.inverted ? -1 : 1;
          this.addComponent("Gravity").gravity("Platform").gravityConst(dir * (element.attr.gravitation.strength || 0.2));
        }

        // act as platform
        if (element.attr.gravitation.platform) {
          this.addComponent("Platform");
        }

      }

      if (element.attr.collisions) {

        this.addComponent("Collision");

        var self = this;

        _.each(element.attr.collisions, function(collision) {

          if (collision.action === "tgt-destroy") {
            // destroy other element
            self.onHit(collision.tgt, function(ent) {
              ent[0].obj.destroy();

              if (collision.audio) {
                // audio for event
                Crafty.audio.play(collision.audio.audio, collision.audio.repeatCount || 1, collision.audio.volume || 1);
              }

              if (collision.animation) {
                var id = collision.animation.id;
                // animation for event
                if (!self.has(id)) {
                  //self.addComponent(id);
                  //self.animate(id, 0, 0, 0); //collision.animation) //setup animation
                }

                if (!self.isPlaying(id)) {
                  //self.stop().animate(id, 15, 10) // start animation
                }

              }

            });
          } else if (collision.action === "self-destroy") {
            // destroy self (element)
            self.onHit(collision.tgt, function(ent) {
              this.destroy();
            });
          }

        });

        // element with gravity
        if (element.attr.gravitation.on) {
          var dir = element.attr.gravitation.inverted ? -1 : 1;
          this.addComponent("Gravity").gravity("Platform").gravityConst(dir * (element.attr.gravitation.strength || 0.2));
        }



      }
    }

  });
});

_.each(Game.canvas.elements, function(element) {
  var blockSize = Game.canvas.blockSize;
  Crafty.e(element.type).attr({
    x: element.position.x * blockSize,
    y: element.position.y * blockSize,
    w: blockSize,
    h: blockSize
  });

});

*/

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

var Parser = {
  game: null,
  socket: null,
  blockSize: null,

  parseGame: function(game) {
    // set global vars
    Parser.game = game;

    // init Crafty
    var init = Parser.initGame(game.canvas);
    console.log('init: ' + init);

    // load sprite assests
    var sprites = Parser.loadSprites(game.revision.gameComponents);
    console.log('sprites:' + sprites);

    // load audio assets
    var audios = Parser.loadAudios(game.revision.audios);
    console.log('audios:' + audios);

    // create game components
    var gameComps = Parser.createGameComponents(game.revision.gameComponents);

    // create scene components
    var sceneComps = Parser.createSceneComponents(game.revision.scenes);
    console.log('gameComps:' + sceneComps);

    // create scenes
    var scenes = Parser.createScenes(game.revision.scenes);
    console.log('scenes:' + scenes);

    Crafty.scene("intro");

  },
  initGame: function(canvas) {
    // {"blockSize":48,"rows":6,"columns":14};
    var height = canvas.blockSize * canvas.rows;
    var width = canvas.blockSize * canvas.columns;
    // set global var
    Parser.blockSize = canvas.blockSize;

    Crafty.init(width, height);
    // obj for some magos vars
    Crafty.magos = {};
    Crafty.magos.audio = true;

    return true;
  },
  loadAudios: function(audios) {
    // images path
    var path = '/static/game/audios';

    _.each(audios, function(audio) {
      var obj = {},
        array = [
        path + '/mp3/' + slug + '.mp3', path + '/ogg/' + slug + '.ogg', path + '/wav/' + slug + '.wav'];

      obj[slug] = array;

      Crafty.audio.add(obj);
    }); // each
    return true;
  },
  loadSprites: function(components) {
    // images path
    var path = '/static/game/sprites/',
      ext = '.png';

    _.each(components, function(component) {
      // vars
      var sprite = (!_.isUndefined(component.properties.sprite) && _.isString(component.properties.sprite)) ? component.properties.sprite : '';
      // if exists
      if (sprite.length) {
        var obj = {};
        obj[sprite + '-sprite'] = [0, 0];

        Crafty.sprite(Parser.blockSize, path + sprite + ext, obj);
      }
    }); // each
    return true;
  },
  createScenes: function(scenes) {

    _.each(scenes, function(scene) {

      // background
      var backgroundComp = _.find(scene.sceneComponents, function(comp) {
        return comp.slug === 'background-image';
      });

      var backgroundImage = null,
        path = '/static/game/sprites/',
        ext = '.png';

      if (_.isObject(backgroundComp) && _.isString(backgroundComp.sprite)) {
        backgroundImage = path + backgroundComp.sprite + ext;
      }

      // create Crafty scene
      Crafty.scene(scene.name, function() {
        // background
        if (!_.isNull(backgroundImage)) {
          Crafty.background("url(" + backgroundImage + ")");
        }

        // scene comps
        _.each(scene.sceneComponents, function(comp) {
          // position
          var x_ = comp.position.left;
          var y_ = comp.position.top;

          if (comp.slug === 'volume') {
            Crafty.e(comp.slug).attr({
              x: x_,
              y: y_
            });
          }

          if (comp.slug === 'time') {
            Crafty.e(comp.slug).attr({
              x: x_,
              y: y_
            });
          }

          if (comp.slug === 'play') {
            var ent = Crafty.e(comp.slug).attr({
              x: x_,
              y: y_
            })

            if (!_.isUndefined(comp.properties) && !_.isUndefined(comp.properties.font)) {
              var font = comp.properties.font;
              // font color
              if (!_.isUndefined(font.color)) {
                ent.css('color', font.color);
              }
              // font family
              if (!_.isUndefined(font.family)) {
                ent.css('font-family', font.family);
              }
              // font size
              if (!_.isUndefined(font.size)) {
                ent.css('font-size', font.size);
              }
              // text background
              if (!_.isUndefined(font.background)) {
                ent.css('background-color', font.background);
                ent.css('text-shadow', '1px 1px 1px ' + font.background);
                ent.css('border', '1px solid ' + font.background);
              }
            } // /font
          } // /play
          if (comp.slug === 'highscore') {

            var ent = Crafty.e(comp.slug).attr({
              x: x_,
              y: y_
            })

            if (!_.isUndefined(comp.properties) && !_.isUndefined(comp.properties.font)) {
              var font = comp.properties.font;
              // font color
              if (!_.isUndefined(font.color)) {
                ent.css('color', font.color);
              }
              // font family
              if (!_.isUndefined(font.family)) {
                ent.css('font-family', font.family);
              }
              // font size
              if (!_.isUndefined(font.size)) {
                ent.css('font-size', font.size);
              }
              // text background
              if (!_.isUndefined(font.background)) {
                ent.css('background-color', font.background);
                ent.css('text-shadow', '1px 1px 1px ' + font.background);
                ent.css('border', '1px solid ' + font.background);
              }
            } // /font
          } // /highscore
          if (comp.slug === 'title') {

            var ent = Crafty.e(comp.slug).attr({
              x: x_,
              y: y_
            })

            if (!_.isUndefined(comp.properties) && !_.isUndefined(comp.properties.font)) {
              var font = comp.properties.font;
              // font color
              if (!_.isUndefined(font.color)) {
                ent.css('color', font.color);
              }
              // font family
              if (!_.isUndefined(font.family)) {
                ent.css('font-family', font.family);
              }
              // font size
              if (!_.isUndefined(font.size)) {
                ent.css('font-size', font.size);
              }
              // text background
              if (!_.isUndefined(font.background)) {
                ent.css('background-color', font.background);
                ent.css('text-shadow', '1px 1px 1px ' + font.background);
                ent.css('border', '1px solid ' + font.background);
              }
            } // /font
          } // /title
        });

        // game comps
        _.each(scene.gameComponents, function(comp) {
          // position
          var x_ = comp.position.column * Parser.blockSize;
          var y_ = comp.position.row * Parser.blockSize;

          Crafty.e(comp.slug).attr({
            x: x_,
            y: y_,
            w: Parser.blockSize,
            h: Parser.blockSize
          });

        });

        // game on Yeah!
      });

    });

    return true;
  },
  createGameComponents: function(components) {

    _.each(components, function(component) {
      var props = component.properties;

      var sprite = _.isString(props.sprite) ? props.sprite : false;

      Crafty.c(component.slug, {
        init: function() {
          var this_ = this;

          // for all game comps
          this_.addComponent('2D', 'Canvas', 'Sprite');

          // sprite
          if (sprite) {
            this_.addComponent(sprite + "-sprite");
          }

          // gravity
          if (!_.isUndefined(props.gravity)) {
            var sign = props.gravity.direction ? 1 : -1;

            this_.gravity("platform");
            this_.gravityConst(sign * props.gravity.strength);
          }

          // controls
          if (!_.isUndefined(props.controls)) {
            var speed = _.isNumber(props.controls.speed) ? props.controls.speed : 4;

            // twoway === platform
            if (props.controls.method === 'Twoway') {
              var jumpHeight = _.isNumber(props.controls.jumpHeight) ? props.controls.jumpHeight : 12;

              this_.addComponent('Controls', 'Keyboard', 'Gravity');
              this_.Controls(speed, jumpHeight);
              this_.gravity('platform');
            }

            // fourway
            if(props.controls.method === 'Fourway') {
              this_.addComponent('Fourway', 'Keyboard');
              this_.speed(speed);
            }


          } else {
            this_.addComponent('platform');
          }

        } // /init
      });
    });

    return true;
  },
  createSceneComponents: function(scenes) {

    var path = '/static/img/components/',
      ext = '.png';

    _.each(scenes, function(scene) {
      _.each(scene.sceneComponents, function(comp) {

        // volume button
        if (comp.slug === 'volume') {
          Crafty.c(comp.slug, {
            init: function() {
              var this_ = this;
              var off = _.isUndefined(Crafty.magos.volume) || Crafty.magos.volume ? '' : '-off';

              this_.addComponent('2D', 'DOM', 'Image');
              this_.image(path + comp.slug + off + ext);
              this_.addComponent('volume-button'); // class for click event and styling
            }
          });
        }

        // time
        if (comp.slug === 'time') {
          Crafty.c(comp.slug, {
            init: function() {
              var this_ = this;

              this_.addComponent('2D', 'DOM', 'Image');
              this_.image(path + comp.slug + ext);
            }
          });
        }

        // start new game -button
        if (comp.slug === 'play') {
          Crafty.c(comp.slug, {
            init: function() {
              var this_ = this;

              this_.addComponent('2D', 'DOM', 'Text');
              this_.text('Start New Game')
              this_.addComponent('start-button'); // class for click event and styling
            }
          });
        }

        // highscore
        if (comp.slug === 'highscore') {
          Crafty.c(comp.slug, {
            init: function() {
              var this_ = this;

              this_.addComponent('2D', 'DOM');
              // trigger event to do more and append list in right place
              $(document).trigger('getHighscores');
            }
          });
        }

        // title
        if (comp.slug === 'title') {
          Crafty.c(comp.slug, {
            init: function() {
              var this_ = this;

              this_.addComponent('2D', 'DOM', 'Text');
              this_.text(Parser.game.title);
            }
          });
        }


      });
    });

    return true;
  },
  getGame: function(slug, webSocket) {
    socket = webSocket;

    socket.emit('joinGame', slug, function(data) {
      console.log('websocket getGame (game)');
      console.log(data);
      Parser.parseGame(data);
    });

  },
  getAnimation: function(events, key) {
    var event = _.find(events, function(event) {
      return event.key === key;
    });
    return event.animation;
  },
  setAnimation: function(self, animation) {
    self.addComponent(animation.id);
    self.animate(id, 0, 0, 0); //setup animation
    self.animate(id, 15, 1); // start animation
    return self;
  }

};
