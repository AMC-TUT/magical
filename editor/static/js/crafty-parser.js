var isiPad = navigator.userAgent.match(/iPad/i) !== null;

function capitaliseFirstLetter(string) {
  string = string.toLowerCase();
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function changeScore(amount) {
  Parser.settings.score += amount;
  Crafty("score").each(function() {
    this.text('Score: ' + Parser.settings.score);
  });
}

function handleCollision(collider, collides, score) {
  _.each(collider.collisions, function(collision) {
    if (collision.target.slug == collides.slug) {
      var eventName = collision.event.event;
      var col_score = (!_.isNull(collision.score) && !_.isUndefined(collision.score)) ? parseInt(collision.score, 10) : 0;
      if (eventName === "destroySelf") {
        collider.destroy();
      } else if (eventName === "destroyTarget") {
        collides.destroy();
      }
      // handle score
      if (col_score) changeScore(col_score);
    }
  });
}

var fontStyleTitle = {
  font: 'Architects Daughter',
  size: 30,
  color: '#111111'
};

var fontStyleGame = {
  font: 'Architects Daughter',
  size: 20,
  color: '#3276b1'
};

var fontStyleOutro = {
  font: 'Architects Daughter',
  size: 30,
  color: '#3276b1'
};

var fontStyleDescription = {
  font: 'Open Sans',
  size: 14,
  color: '#111111'
};

var Parser = {
  game: null,
  socket: null,
  blockSize: null,
  settings: {
    djangoUri: 'http://192.168.43.232/',
    //djangoUri: 'http://magos.pori.tut.fi/',
    score: 0
  },

  parseGame: function(game) {
    Parser.game = game;

    // init Crafty
    var init = Parser.initGame(game.revision.canvas);

    // create sprites
    var sprites = Parser.loadSprites(game.revision.gameComponents);

    // create components
    var gameComps = Parser.createGameComponents(game.revision.gameComponents);

    // create scenes
    var scenes = Parser.createScenes(game.revision.scenes);

    // show first scene
    Crafty.scene("loading");
  },
  initGame: function(canvas) {
    var height = canvas.blockSize * canvas.rows;
    var width = canvas.blockSize * canvas.columns;

    Parser.blockSize = canvas.blockSize;

    Crafty.init(width, height).canvas.init();
    Crafty.background("#FFF");

    Crafty.magos = {};
    Crafty.magos.width = width;
    Crafty.magos.height = height;

    Crafty.viewport.bounds = {
      min: {
        x: 0,
        y: 0
      },
      max: {
        x: width,
        y: height
      }
    };

    return true;
  },
  loadSprites: function(components) {
    var path = Parser.settings.djangoUri + 'game/image/',
      spriteSize = '_' + Parser.blockSize + 'x' + Parser.blockSize;

    _.each(components, function(component) {
      var ext = '.' + component.properties.ext;
      var sprite = (!_.isUndefined(component.properties.file) && _.isString(component.properties.file)) ? component.properties.file : '';

      if (sprite.length) {
        var obj = {};
        obj[component.slug + 'Sprite'] = [0, 0];
        Crafty.sprite(Parser.blockSize, path + sprite + spriteSize + ext, obj);
      }
    });

    return true;
  },
  createScenes: function(scenes) {
    _.each(scenes, function(scene) {
      Crafty.scene(scene.name, function() {
        if (scene.name == 'intro') {
          Crafty.background("#F2F2F2");

          Parser.settings.score = 0;

          var title = Crafty.e('2D, DOM, Text2, TitleText')
            .text(Parser.game.title)
            .setStyle(fontStyleTitle)
            .setAlign('center')
            .attr({
              x: 0,
              y: 30,
              w: Crafty.magos.width
            });

          var description = Crafty.e('2D, DOM, Text2')
            .text(Parser.game.description ? Parser.game.description : '')
            .setStyle(fontStyleDescription)
            .setAlign('center')
            .attr({
              x: 20,
              y: 100,
              w: Crafty.magos.width - 40,
            });

          var startButton = Crafty.e('Button, Text2, StartButton')
            .text('Start')
            .setStyle(fontStyleTitle)
            .setAlign('center')
            .button(function() {
              Crafty.scene("game");
            })
            .attr({
              w: 200,
              h: 50,
              x: (Crafty.magos.width / 2) - 100,
              y: Crafty.magos.height - 80
            });
        } // intro

        if (scene.name == 'outro') {
          Crafty.background("#F2F2F2");

          var gameOver = Crafty.e('2D, DOM, Text2, TitleText')
            .text('Game Over')
            .setStyle(fontStyleTitle)
            .setAlign('center')
            .attr({
              x: 0,
              y: 30,
              w: Crafty.magos.width
            });

          var scores = Crafty.e('2D, DOM, Text2, ScorePoints, OutroText')
            .text('Score: ' + Parser.settings.score)
            .setStyle(fontStyleOutro)
            .setAlign('center')
            .attr({
              h: 30,
              x: 20,
              y: 100,
              w: Crafty.magos.width - 40,
            });

          var backButton = Crafty.e('Button, Text2, StartButton, BackButton')
            .text('Back')
            .setStyle(fontStyleTitle)
            .setAlign('center')
            .button(function() {
              Crafty.scene("intro");
            })
            .attr({
              w: 200,
              h: 50,
              x: (Crafty.magos.width / 2) - 100,
              y: Crafty.magos.height - 80
            });
        }

        if (scene.name == 'game') {
          Crafty.background("#222222");

          var tmpButton = Crafty.e('Button, Text2, StartButton, XButton')
            .text('x')
            .setStyle(fontStyleGame)
            .setAlign('center')
            .button(function() {
              Crafty.scene("outro");
            })
            .attr({
              w: 20,
              h: 20,
              x: Crafty.magos.width - 22,
              y: 2
            });

          var scorePoints = Crafty.e('2D, DOM, Text2, ScorePoints, GameText')
            .text('Score: ' + Parser.settings.score)
            .setStyle(fontStyleGame)
            .attr({
              h: 20,
              w: 150,
              x: 5,
              y: 2
            });
        }

        // create game component entities
        _.each(scene.gameComponents, function(comp) {
          Crafty.e(comp.slug).attr({
            x: comp.position.column * Parser.blockSize,
            y: comp.position.row * Parser.blockSize,
            w: Parser.blockSize,
            h: Parser.blockSize
          });
        });
      });
    });

    // run loading scene to show user something while loading assets
    Crafty.scene("loading", function() {
      Crafty.background("#F2F2F2");

      Crafty.e("HTML").append('<div style="width:' + Crafty.magos.width + 'px;" class="loader">' + ' <img src="' + Parser.settings.djangoUri + 'static/img/magos-m-black.png" class="loader-logo" />' + ' <p class="loader-procent" style="color: #000;">0%</p>' + ' </div>');

      var assets = [],
        components = Parser.game.revision.gameComponents,
        path = Parser.settings.djangoUri + 'game/image/',
        spriteSize = '_' + Parser.blockSize + 'x' + Parser.blockSize;

      _.each(components, function(component) {
        var ext = '.' + component.properties.ext;
        var sprite = (!_.isUndefined(component.properties.file) && _.isString(component.properties.file)) ? component.properties.file : '';

        assets.push(path + sprite + spriteSize + ext);
      });

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
          alert('Error loading ' + e.src + ' while loading game assets (loaded ' + e.loaded + ' of ' + e.total + ')');
        }
      );
    });

    return true;
  },
  createGameComponents: function(components) {
    _.each(components, function(component) {
      var props = component.properties,
        sprite = _.isString(props.file) ? props.file : false;

      var comp = Crafty.c(component.slug, {
        init: function() {
          var _this = this;

          // basic comps
          _this.addComponent('2D', 'Canvas', 'SpriteAnimation');
          // helper
          _this.slug = component.slug;
          // component name
          _this.addComponent(capitaliseFirstLetter(component.slug));
          // sprite as comp image
          _this.addComponent(_this.slug + "Sprite");

          // controls
          if (!_.isUndefined(props.controls)) {
            // speed and jump
            var jump = _.isNumber(props.controls.jumpHeight) ? props.controls.jumpHeight : 12;
            var speed = _.isNumber(props.controls.speed) ? props.controls.speed : 4;

            // set on top
            _this.z = 100;

            if (/^twoway$/i.test(props.controls.method)) {
              _this.addComponent('Twoway', 'Keyboard', 'Collision');
              _this.twoway(speed, jump);
              _this.gravity('Platform');
            } else if (/^fourway$/i.test(props.controls.method)) {
              _this.addComponent('Fourway', 'Keyboard');
              _this.fourway(speed);
            } else if (/^multiway$/i.test(props.controls.method)) {
              _this.addComponent('Multiway', 'Keyboard');
              _this.multiway(speed, {
                UP_ARROW: -90,
                DOWN_ARROW: 90,
                RIGHT_ARROW: 0,
                LEFT_ARROW: 180
              });
            }
          }

          // type
          if (_.isString(props.type)) {
            _this.addComponent(props.type);

            if (/^platform$/i.test(props.type)) {
              _this.addComponent('Platform');
            } else if (/^block$/i.test(props.type)) {
              _this.addComponent('Platform', 'Solid', 'Collision');
            } else if (/^pushable$/i.test(props.type)) {
              _this.addComponent('Platform', 'Solid', 'Collision', 'Pushable');
            } else if (/^player$/i.test(props.type)) {
              _this.addComponent('Player', 'Collision');
              _this.direction = '';
            }
          }

          // gravity
          if ((!_.isUndefined(props.gravitation) && !_.isNull(props.gravitation)) && _.isNumber(props.gravitation.strength)) {
            var sign = props.gravitation.direction ? 1 : -1; // direction
            _this.addComponent("Gravity");
            _this.gravity("Platform");
            _this.gravityConst(parseFloat(props.gravitation.strength));
          }

          // events
          _this.bind("EnterFrame", function(frame) {

            //destroy object if it goes out of bounds
            // if (this._x > Crafty.viewport.width || this._x < 0 || this._y > Crafty.viewport.height || this._y < 0) {
            //   this.destroy();

            //   if (this.has('Player')) {
            //     setTimeout(function() {
            //       Crafty.scene('outro');
            //     }, 500);
            //   }
            // }

            // stop item on viewport bounds
            if (this._x > Crafty.viewport.width - Parser.blockSize) {
              this.x = Crafty.viewport.width - Parser.blockSize;
            }
            if (this._x < 0) {
              this.x = 0;
            }
            if (this._y > Crafty.viewport.height - Parser.blockSize) {
              this.y = Crafty.viewport.height - Parser.blockSize;
            }
            if (this._y < 0) {
              this.y = 0;
            }
          });

          // // TODO handle scores
          // if (_.isArray(props.collisions)) {
          //   //console.log(props.collisions);
          //   _this.addComponent('Collision');
          //   _this.collisions = props.collisions;
          //   _.each(props.collisions, function(collision) {
          //     if (_.isObject(props.collisions[0])) {
          //       var col_target = collision.target;
          //       var col_event = collision.event;
          //       _this.onHit(col_target.slug, function(ent) {
          //         var target = ent[0].obj;
          //         //console.log(col_target.slug + ' HIT ' + _this.slug);
          //         handleCollision(_this, target);
          //       });
          //     }
          //   });

          /*
            _this.onHit("Player", function(ent) {
              //console.log('SOMEONE HIT PLAYER!');
              //console.log(ent);

              var target = ent[0].obj;
              _.each(props.collisions, function(collision) {
                  if (_.isObject(props.collisions[0]) ) {
                    var col_event = collision.event;
                    //var col_score = collision.score;
                    if(col_event === "destroySelf") {
                        _this.destroy();
                    } else if (col_event === "destroyTarget") {
                        target.destroy();
                        Crafty.scene('outro'); // TODO reduce hitpoints, don't die immediately
                    } else if (col_event === "startDialog") {
                        //console.log('Collision: Init dialog');
                    } else if (col_event === "createElement") {
                        //console.log('Collision: Create element');
                    }

                    // handle score
                    if(col_score) {
                        col_score = parseInt(col_score);
                        //console.log('Score: ' + col_score);
                    }

                  }

              });

            });
*/

          //    }

          // _this.bind('Moved', function(from) {

          //   if (this.has('Collision')) {

          //     var hitPushable = this.hit('Pushable');

          //     // hit pushable
          //     if (hitPushable) {
          //       // platformer
          //       var dir = this._x > from.x ? 'left' : 'right';
          //       ////console.log(dir);
          //       var leftX = this._x;
          //       var widthThis = this._w;
          //       var rightX = leftX + widthThis;

          //       _.each(hitPushable, function(pushable) {
          //         var tgt = pushable.obj;
          //         if (dir == 'left') {
          //           // push from left to right
          //           var posObj = rightX - tgt._x;
          //           tgt.attr({
          //             x: tgt._x + posObj
          //           });
          //         } else {
          //           // push from right to left
          //           var posObj = (tgt._x + tgt._w) - leftX;
          //           tgt.attr({
          //             x: tgt._x - posObj
          //           });
          //         }
          //         // TODO: push top/down?
          //       });

          //     }

          //     // hit solid
          //     if (this.hit('Solid')) {
          //       //console.log("HIT SOLID");
          //       /*
          //         var target = this.hit('Solid')[0].obj;
          //         //console.log(target);
          //         */
          //       this.attr({
          //         x: from.x,
          //         y: from.y
          //       });
          //     }


          //   } // if collision

          // });

        } // init
      });
    });

    return true;
  },
  getGame: function(slug, webSocket) {
    socket = webSocket;
    socket.emit('joinGame', function(data) {
      Parser.parseGame(data);
    });
  }
};