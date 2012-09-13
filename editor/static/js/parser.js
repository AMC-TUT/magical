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

var Parser = {
  game: null,
  socket: null,

  getGame: function(slug, webSocket) {
    socket = webSocket;

    socket.emit('joinGame', slug, function(data) {
      $('#test').text( JSON.stringify(data));
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
