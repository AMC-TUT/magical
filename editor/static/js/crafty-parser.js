var isiPad = navigator.userAgent.match(/iPad/i) !== null;

function capitaliseFirstLetter(string) {
  string = string.toLowerCase();
  return string.charAt(0).toUpperCase() + string.slice(1);
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
    Crafty.scene('loading');
  },
  initGame: function(canvas) {
    var height = canvas.blockSize * canvas.rows;
    var width = canvas.blockSize * canvas.columns;

    Parser.blockSize = canvas.blockSize;

    Crafty.init(width, height).canvas.init();
    Crafty.background('#FFF');

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
          Crafty.background('#F2F2F2');

          scores = 0;

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
              Crafty.scene('game');
            })
            .attr({
              w: 200,
              h: 50,
              x: (Crafty.magos.width / 2) - 100,
              y: Crafty.magos.height - 80
            });
        } // intro

        if (scene.name == 'outro') {
          Crafty.background('#F2F2F2');

          gameOver = Crafty.e('2D, DOM, Text2, TitleText')
            .text(gameOverText)
            .setStyle(fontStyleTitle)
            .setAlign('center')
            .attr({
              x: 0,
              y: 30,
              w: Crafty.magos.width
            });

          var s = Crafty.e('2D, DOM, Text2, ScorePoints, OutroText')
            .text('Score: ' + scores)
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
              Crafty.scene('intro');
            })
            .attr({
              w: 200,
              h: 50,
              x: (Crafty.magos.width / 2) - 100,
              y: Crafty.magos.height - 80
            });
        }

        if (scene.name == 'game') {
          Crafty.background('#222222');

          var xButton = Crafty.e('Button, Text2, StartButton, XButton')
            .text('x')
            .setStyle(fontStyleGame)
            .setAlign('center')
            .button(function() {
              Crafty.scene('outro');
            })
            .attr({
              w: 20,
              h: 20,
              x: Crafty.magos.width - 22,
              y: 2
            });

          var floor = Crafty.e('2D, Canvas, Platform') // floor to make twoway work on bottom of the canvas. does not work otherwise (5h wasted).
            .attr({
              w: Crafty.magos.width,
              h: 2,
              x: 0,
              y: Crafty.magos.height - 1,
              z: 99
            });

          scoreEnt = Crafty.e('2D, DOM, Text2, ScorePoints, GameText')
            .text('Score: ' + scores)
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
    Crafty.scene('loading', function() {
      Crafty.background('#F2F2F2');

      Crafty.e('HTML').append('<div style="width:' + Crafty.magos.width + 'px;" class="loader">' + ' <img src="' + Parser.settings.djangoUri + 'static/img/magos-m-black.png" class="loader-logo" />' + ' <p class="loader-procent" style="color: #000;">0%</p>' + ' </div>');

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
      //console.log(JSON.stringify(component.properties));
      var props = component.properties,
        sprite = _.isString(props.file) ? props.file : false;

      var comp = Crafty.c(component.slug, {
        init: function() {
          var _this = this;

          // basic comps
          _this.addComponent('2D', 'Canvas', 'SpriteAnimation');
          // helper
          _this.slug = component.slug;
          // name
          _this.setName(component.title);
          // component name
          _this.addComponent(capitaliseFirstLetter(component.slug));
          // sprite as comp image
          _this.addComponent(_this.slug + "Sprite");

          // type
          if (_.isString(props.type)) {
            _this.addComponent(props.type);

            if (/^platform$/i.test(props.type)) {
              _this.addComponent('Platform');
              _this.z = 1;
            } else if (/^block$/i.test(props.type)) {
              _this.addComponent('Platform', 'Collision');
              _this.z = 2;
            } else if (/^pushable$/i.test(props.type)) {
              _this.addComponent('Platform', 'Pushable', 'Collision');
              _this.z = 3;
            } else if (/^collectible$/i.test(props.type)) {
              _this.addComponent('Collectible', 'Collision');
              _this.z = 4;
            } else if (/^player$/i.test(props.type)) {
              _this.addComponent('Player', 'Collision');
              _this.z = 100;
            }
          }

          // controls
          if (!_.isUndefined(props.controls)) {
            // speed and jump
            var jump = _.isString(props.controls.jumpHeight) ? props.controls.jumpHeight : 12;
            var speed = _.isString(props.controls.speed) ? props.controls.speed : 4;

            if (_this.has('Player')) {
              player = _this;
            }

              if (/^twoway$/i.test(props.controls.method)) {
                _this.addComponent('Twoway', 'Keyboard', 'Gravity');
                _this.twoway(speed, jump);
                _this.gravity('Platform');
                _this.gravityConst(2); // default
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

          // gravity
          if (_.isObject(props.gravitation)) {
            var sign = props.gravitation.direction ? 1 : -1; // direction
            _this.addComponent('Gravity');
            _this.gravity('Platform');
            _this.gravityConst(parseFloat(props.gravitation.strength));
          }

          // events
          _this.bind('EnterFrame', function(frame) {
            //destroy object if it goes out of bounds
            // if (this._x > Crafty.viewport.width || this._x < 0 || this._y > Crafty.viewport.height || this._y < 0) {
            //   this.destroy();

            //   if (this.has('Player')) {
            //     setTimeout(function() {
            //       Crafty.scene('outro');
            //     }, 500);
            //   }
            // }
            //

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

            // collisions
            _.each(props.collisions, function(collision) {
              if (targets = _this.hit(collision.target.slug)) {
                if (!_.isNull(collision.score)) {
                  scores += parseInt(collision.score);
                  scoreEnt.text('Score: ' + scores);
                }

                // destroy something
                if (collision.event.event === 'destroyTarget') {
                  var ent = _.first(targets).obj;
                  // custom for player obj
                  if (ent.has('Player')) {
                    setTimeout(function() {
                      gameOverText = 'Game Over';
                      Crafty.scene('outro');
                    }, 500);
                  }
                  ent.destroy();
                } else if (collision.event.event === 'destroySelf') {
                  _this.destroy();
                } // destroy
                else if (collision.event.event === 'finishGame') {
                  _this.destroy();
                  gameOverText = 'Game Finish';
                  Crafty.scene('outro');
                } // game through
              }
            });

            if (_this.has('Pushable')) {
              var hit = _this.hit('Player');

              // if Player hits Pushable, except from above. y = 0 when hit from side,
              // x = -1 from right, x = 1 from left, y = 1 from above, y = -1 from below
              //
              if (hit && _.first(hit).normal.y < 1) {
                //console.log(JSON.stringify(_.first(hit).normal));

                var player = _.first(hit).obj;
                var overlap = _.first(hit).overlap;
                var blockSize = Parser.blockSize;
                var block;

                if (player._x > _this._x) { // from right to left

                  if (b = _this.hit('Block')) {
                    block = _.first(b).obj;
                    _this.x = block._x + blockSize;
                    player.x = block._x + blockSize + blockSize;
                  }
                  if (b = _this.hit('Pushable')) {
                    block = _.first(b).obj;
                    _this.x = block._x + blockSize;
                    player.x = block._x + blockSize + blockSize;
                  }

                  if (player._x - blockSize > 0) {
                    _this.x = player._x - blockSize;
                  } else {
                    player.x = _this._x + blockSize;
                  }
                } else if (_this._x > player._x) { // from left to right

                  if (b = _this.hit('Block')) {
                    block = _.first(b).obj;
                    _this.x = block._x - blockSize;
                    player.x = block._x - blockSize - blockSize;
                  }
                  if (b = _this.hit('Pushable')) {
                    block = _.first(b).obj;
                    _this.x = block._x - blockSize;
                    player.x = block._x - blockSize - blockSize;
                  }

                  if (player._x + blockSize + blockSize < Crafty.magos.width) {
                    _this.x = player._x + blockSize;
                  } else {
                    player.x = _this._x - blockSize;
                  }
                }
              }
            }

          });

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