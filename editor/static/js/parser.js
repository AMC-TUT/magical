function capitaliseFirstLetter(string) {
    string = string.toLowerCase();
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function handleCollision(collider, collides) {
    _.each(collider.collisions, function(collision) {
      if(collision.target.slug == collides.slug) {
        var eventName = collision.event.event;
        if(eventName === "destroySelf") {
            collider.destroy();
        } else if (eventName === "destroyTarget") {
            collides.destroy();
            Crafty.scene('outro'); // TODO reduce hitpoints, don't die immediately
        } else if (eventName === "startDialog") {
            console.log('Collision: Init dialog');
        } else if (eventName === "createElement") {
            console.log('Collision: Create element');
        }  
      }
    });
}


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
    this.attr({x:10, y:25, w: 300});
  }
});

var Parser = {
  game: null,
  socket: null,
  blockSize: null,
  settings: {
      djangoUri: 'http://localhost:8000/'
      //djangoUri: 'http://magos.pori.tut.fi/'
  },

  parseGame: function(game) {
    // set global vars
    Parser.game = game;

    // init Crafty
    var init = Parser.initGame(game.revision.canvas);
    console.log('init: ' + init);

    // load sprite assests
    var sprites = Parser.loadSprites(game.revision.gameComponents);
    console.log('sprites:' + sprites);

    // load audio assets
    var audios = Parser.loadAudios(game.revision.audios);
    console.log('audios:' + audios);

    // create game components
    var gameComps = Parser.createGameComponents(game.revision.gameComponents);
    console.log('gameComps:' + gameComps);

    // create scene components
    var sceneComps = Parser.createSceneComponents(game.revision.scenes);
    console.log('sceneComps:' + sceneComps);

    // create scenes
    var scenes = Parser.createScenes(game.revision.scenes);
    console.log('scenes:' + scenes);

    Crafty.scene("loading");

  },
  initGame: function(canvas) {
    // {"blockSize":48,"rows":6,"columns":14};
    var height = canvas.blockSize * canvas.rows;
    var width = canvas.blockSize * canvas.columns;
    // set global var
    Parser.blockSize = canvas.blockSize;
    console.log('BLOCK SIZE: ' + canvas.blockSize);
    Crafty.init(width, height);
    // obj for some magos vars
    Crafty.magos = {};
    Crafty.magos.audio = {}; // = true;
    Crafty.magos.audio.mute = false;

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
    //var path = '/editor/',
    var path = Parser.settings.djangoUri + 'game/image/',
      //ext = '.png',
      spriteSize = '_' + Parser.blockSize + 'x' + Parser.blockSize;

    _.each(components, function(component) {
      // vars
      var ext = '.' + component.properties.ext;
      //var sprite = (!_.isUndefined(component.properties.sprite) && _.isString(component.properties.sprite)) ? component.properties.sprite : '';
      var sprite = (!_.isUndefined(component.properties.file) && _.isString(component.properties.file)) ? component.properties.file : '';
      console.log(sprite);
      // if exists
      if (sprite.length) {
        //console.log(Parser.settings.djangoUri + 'game/image/' + sprite + '/' + Parser.blockSize + 'x' + Parser.blockSize);
        var obj = {};
        obj[sprite + '-sprite'] = [0, 0];
        Crafty.sprite(Parser.blockSize, path + sprite + spriteSize + ext, obj);
      }
    }); // each
    return true;
  },
  createScenes: function(scenes) {

    _.each(scenes, function(scene) {

      // background
      var backgroundComp = _.find(scene.sceneComponents, function(comp) {
        return comp.slug === 'background';
      });

      var backgroundImage = null,
        path = '/editor/user-media/images/',
        ext = '.png';

      if (_.isObject(backgroundComp) && _.isObject(backgroundComp.properties) && _.isString(backgroundComp.properties.sprite)) {
        backgroundImage = path + backgroundComp.properties.sprite + ext;
      }

      // create Crafty scene
      Crafty.scene(scene.name, function() {
        // background
        if (!_.isNull(backgroundImage)) {
          Crafty.background("url(" + backgroundImage + ")");
        }

        if(scene.name == 'outro') {
            Crafty.e('GameOver').attr({
              x: 100,
              y: 100,
              w: 400,
              h: 100
            }).text("Game Over");
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

            if (_.isObject(comp.properties) && _.isObject(comp.properties.font)) {
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
            });

            if (_.isObject(comp.properties) && _.isObject(comp.properties.font)) {
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
            });

            if (_.isObject(comp.properties) && _.isObject(comp.properties.font)) {
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

        // create game component entities
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

    // static magos loader scene
    Crafty.scene("loading", function() {

      $('#cr-stage').css('background', '#111');

      // canvas size
      var width = Parser.game.revision.canvas.columns * Parser.game.revision.canvas.blockSize;

      Crafty.e("HTML").append('<div style="width:' + width + 'px;" class="loader">' + ' <img src="' + Parser.settings.djangoUri + 'static/img/magos-m-black.png" class="loader-logo" />' + ' <p class="loader-procent">0%</p>' + ' </div>');

      var assets = [],
        componentsPath = '/editor/',
        path = '/editor/user-media/images/',
        ext = '.png';

      // game comps
      _.each(Parser.game.revision.gameComponents, function(comp) {
        if (!_.isUndefined(comp.properties.file) && _.isString(comp.properties.file)) {
          //assets.push(componentsPath + comp.properties.file);
          assets.push(Parser.settings.djangoUri + 'game/image/' + comp.properties.file + '_' + Parser.blockSize + 'x' + Parser.blockSize + '.' + comp.properties.ext);
        }
      });
      // scene comps
      _.each(scenes, function(scene) {
        console.log('SCENE COMPS:');
        console.log(scene.sceneComponents);
        _.each(scene.sceneComponents, function(comp) {
          if (!_.isUndefined(comp.sprite) && _.isString(comp.sprite)) {
            assets.push(path + comp.sprite + ext);
          }
        });
      });
      console.log(assets);
      // TODO audio assets
      //Crafty.scene("intro");

      Crafty.load(
        assets, 
        function() {
          setTimeout(function() {
            Crafty.scene("intro");
          }, 700);
        },
        function(e) {
          $('.loader-procent').text(Math.round(e.percent) + "%");
        }, 
        function(e) {
          //console.log(e)
          //console.log('Error loading ' + e.src + ' while loading game assets (loaded ' + e.loaded + ' of ' + e.total + ')');
          alert('Error loading ' + e.src + ' while loading game assets (loaded ' + e.loaded + ' of ' + e.total + ')');
        }
      );

      
    });

    return true;
  },
  createGameComponents: function(components) {
    _.each(components, function(component) {
      console.log(component);
      var props = component.properties;
      console.log(props);
      var sprite = _.isString(props.file) ? props.file : false;

      var gcComp = Crafty.c(component.slug, {
        init: function() {
          var this_ = this;
          // for all game comps
          this_.addComponent('2D', 'Canvas', 'Image');
          //this_.addComponent('2D', 'DOM', 'Image');
          this_.slug = component.slug;
          var cTitle = capitaliseFirstLetter(component.slug);
          this_.addComponent(cTitle);

          // sprite
          if (sprite && !sprite.match(/^empty/)) {
            this_.addComponent(sprite + "-sprite");
            // sprite impl. exists and works. uncomment previous
            // line and comment out next line to use sprite impl.
            //this_.image('/editor/' + sprite);
          }

          // controls
          if (!_.isUndefined(props.controls)) {
            var speed = _.isNumber(props.controls.speed) ? props.controls.speed : 4;

            // if controllapble then place on top in z-level
            this_.attr({
              z: 100
            });
            console.log(props.controls.method);
            // twoway === platform
            if (props.controls.method.toLowerCase() === 'twoway') {
              var jumpHeight = !_.isNull(props.controls.jumpHeight) ? parseInt(props.controls.jumpHeight) : 12;              
              this_.addComponent('Twoway', 'Keyboard', 'Gravity', 'Collision');
              this_.twoway(speed, jumpHeight);
              this_.gravity('platform');
            }

            // fourway
            if (props.controls.method.toLowerCase() === 'fourway') {
              this_.addComponent('Fourway', 'Keyboard');
              this_.fourway(speed);
            }

            // multiway
            if (props.controls.method.toLowerCase() === 'multiway') {
              this_.addComponent('Multiway', 'Keyboard');
              this_.multiway(speed, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
            }

          }

          // component type
          if (_.isString(props.type)) {
            this_.addComponent(props.type);

            if(props.type.toLowerCase() === "platform") {
              this_.addComponent('platform');
            }

            if(props.type.toLowerCase() === 'block') {
              this_.addComponent('platform');
              this_.addComponent('Solid');
              this_.addComponent("Collision");
            }

            if(props.type.toLowerCase() === "pushable") {
              this_.addComponent('platform');
              this_.addComponent('Solid');
              this_.addComponent("Collision");
              this_.addComponent("Pushable");
            }

            if(props.type.toLowerCase() === "player") {
              this_.addComponent('Player');
              this_.addComponent("Collision");

              this_.direction = '';

            }
          }

          // gravity
          if (!_.isUndefined(props.gravitation)) {
            //var sign = props.gravitation.direction ? 1 : -1; // gravity direction
            this_.addComponent("Gravity");
            this_.gravity("platform");
            this_.gravityConst(parseFloat(props.gravitation.strength));
          }

          // bind events
          this_.bind("EnterFrame", function(frame) {

              //destroy if it goes out of bounds
              if (this._x > Crafty.viewport.width || this._x < 0 || this._y > Crafty.viewport.height || this._y < 0) {
                
                /*
                this.destroy();

                if(this.has('Player')) {
                  setTimeout(function() {
                    Crafty.scene('outro');
                  }, 500);
                }
                */
              }


              // stop item on viewport bounds
              if(this._x > Crafty.viewport.width - Parser.blockSize) {
                  this.x = Crafty.viewport.width - Parser.blockSize;
              }
              if(this._x < 0) {
                  this.x =  0;
              }
              if(this._y > Crafty.viewport.height - Parser.blockSize) {
                  this.y = Crafty.viewport.height - Parser.blockSize;
              }
              if(this._y < 0) {
                  this.y = 0;
              }

              // TODO: move item to the opposite side of viewport
              /*
              if(this._x > Crafty.viewport.width) {
                  this.x = 0;
              }
              if(this._x < 0) {
                  this.x =  Crafty.viewport.width;
              }
              if(this._y > Crafty.viewport.height) {
                  this.y = 0;
              }
              if(this._y < 0) {
                  this.y = Crafty.viewport.height;
              }
              */





          });

          // TODO implement startDialog and createElement
          // TODO handle scores
          if(_.isArray(props.collisions)) {
            console.log(props.collisions);
            this_.addComponent('Collision');
            this_.collisions = props.collisions;
            _.each(props.collisions, function(collision) {
                if (_.isObject(props.collisions[0]) ) {
                  var col_target = collision.target;
                  var col_event = collision.event;
                  this_.onHit(col_target.slug, function(ent) {
                    var target = ent[0].obj;
                    console.log(col_target.slug + ' HIT ' + this_.slug);
                    handleCollision(this_, target);
                  });
                }
            });

            /*
            this_.onHit("Player", function(ent) {
              console.log('SOMEONE HIT PLAYER!');
              console.log(ent);

              var target = ent[0].obj;
              _.each(props.collisions, function(collision) {
                  if (_.isObject(props.collisions[0]) ) {
                    var col_event = collision.event;
                    //var col_score = collision.score;
                    if(col_event === "destroySelf") {
                        this_.destroy();
                    } else if (col_event === "destroyTarget") {
                        target.destroy();
                        Crafty.scene('outro'); // TODO reduce hitpoints, don't die immediately
                    } else if (col_event === "startDialog") {
                        console.log('Collision: Init dialog');
                    } else if (col_event === "createElement") {
                        console.log('Collision: Create element');
                    }

                    // handle score
                    if(col_score) {
                        col_score = parseInt(col_score);
                        console.log('Score: ' + col_score);
                    }
             
                  }

              });

            });
            */

          }

          this_.bind('Moved', function(from) {

            if (this.has('Collision')) {

              var hitPushable = this.hit('Pushable');

              // hit pushable
              if(hitPushable) {
                // platformer
                var dir = this._x > from.x ? 'left' : 'right';
                //console.log(dir);
                var leftX = this._x;
                var widthThis = this._w;
                var rightX = leftX + widthThis;

                _.each(hitPushable, function(pushable) {
                    var tgt = pushable.obj;
                    if(dir == 'left') {
                        // push from left to right
                        var posObj = rightX - tgt._x;
                        tgt.attr({ x: tgt._x + posObj });
                    } else {
                        // push from right to left
                        var posObj = (tgt._x + tgt._w) - leftX;
                        tgt.attr({ x: tgt._x - posObj });
                    }
                    // TODO: push top/down?
                });

              } 

              // hit solid
              if(this.hit('Solid')) {
                  console.log("HIT SOLID");
                  /*
                  var target = this.hit('Solid')[0].obj;
                  console.log(target);
                  */
                  this.attr({
                    x: from.x,
                    y: from.y
                  });
              }


            } // if collision


          });

        } // /init
      });
    });

    return true;
  },

  createSceneComponents: function(scenes) {

    var path = '/static/img/icons/',
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
              this_.image(path + 'icon-' + comp.slug + off + ext);
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
              this_.image(path + 'icon-' + comp.slug + ext);
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
              //$(document).trigger('getHighscores');
              Parser.getHighscores();
            }
          });
        }

        // title
        if (comp.slug === 'title') {
          Crafty.c(comp.slug, {
            init: function() {
              var this_ = this;

              this_.addComponent('2D', 'DOM', 'Text', 'gameTitle');
              this_.text(Parser.game.title);
            }
          });
        }


      });
    });

    return true;
  },
  getHighscores: function() {
    var slug = Parser.game.slug;

    socket.emit('getHighscore', slug, function(data) {

      if (_.isObject(data)) {

        var el = '<h2>TOP5</h2>';
        el += '<ol>';

        _.each(data.results, function(result) {
          el += '<li>' + result.score + ' ' + result.firstName + ' ' + result.lastName + '</li>';
        });

        el += '</ol>';

        $('#cr-stage').find('.highscore').empty().append(el);

      }

    });
  },
  getGame: function(slug, webSocket) {
    console.log('GET GAME:' +slug);
    socket = webSocket;
    socket.emit('joinGame', function(data) {
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
