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

*/Crafty.c("Controls",{init:function(){this.requires("Twoway"),this.enableControl()},Controls:function(e,t){return this.twoway(e,t),this}});var Parser={game:null,socket:null,blockSize:null,parseGame:function(e){Parser.game=e;var t=Parser.initGame(e.canvas);console.log("init: "+t);var n=Parser.loadSprites(e.revision.gameComponents);console.log("sprites:"+n);var r=Parser.loadAudios(e.revision.audios);console.log("audios:"+r);var i=Parser.createGameComponents(e.revision.gameComponents),s=Parser.createSceneComponents(e.revision.scenes);console.log("gameComps:"+s);var o=Parser.createScenes(e.revision.scenes);console.log("scenes:"+o),Crafty.scene("intro")},initGame:function(e){var t=e.blockSize*e.rows,n=e.blockSize*e.columns;return Parser.blockSize=e.blockSize,Crafty.init(n,t),Crafty.magos={},Crafty.magos.audio=!0,!0},loadAudios:function(e){var t="/static/game/audios";return _.each(e,function(e){var n={},r=[t+"/mp3/"+slug+".mp3",t+"/ogg/"+slug+".ogg",t+"/wav/"+slug+".wav"];n[slug]=r,Crafty.audio.add(n)}),!0},loadSprites:function(e){var t="/static/game/sprites/",n=".png";return _.each(e,function(e){var r=!_.isUndefined(e.properties.sprite)&&_.isString(e.properties.sprite)?e.properties.sprite:"";if(r.length){var i={};i[r+"-sprite"]=[0,0],Crafty.sprite(Parser.blockSize,t+r+n,i)}}),!0},createScenes:function(e){return _.each(e,function(e){var t=_.find(e.sceneComponents,function(e){return e.slug==="background-image"}),n=null,r="/static/game/sprites/",i=".png";_.isObject(t)&&_.isString(t.sprite)&&(n=r+t.sprite+i),Crafty.scene(e.name,function(){_.isNull(n)||Crafty.background("url("+n+")"),_.each(e.sceneComponents,function(e){var t=e.position.left,n=e.position.top;e.slug==="volume"&&Crafty.e(e.slug).attr({x:t,y:n}),e.slug==="time"&&Crafty.e(e.slug).attr({x:t,y:n});if(e.slug==="play"){var r=Crafty.e(e.slug).attr({x:t,y:n});if(!_.isUndefined(e.properties)&&!_.isUndefined(e.properties.font)){var i=e.properties.font;_.isUndefined(i.color)||r.css("color",i.color),_.isUndefined(i.family)||r.css("font-family",i.family),_.isUndefined(i.size)||r.css("font-size",i.size),_.isUndefined(i.background)||(r.css("background-color",i.background),r.css("text-shadow","1px 1px 1px "+i.background),r.css("border","1px solid "+i.background))}}if(e.slug==="highscore"){var r=Crafty.e(e.slug).attr({x:t,y:n});if(!_.isUndefined(e.properties)&&!_.isUndefined(e.properties.font)){var i=e.properties.font;_.isUndefined(i.color)||r.css("color",i.color),_.isUndefined(i.family)||r.css("font-family",i.family),_.isUndefined(i.size)||r.css("font-size",i.size),_.isUndefined(i.background)||(r.css("background-color",i.background),r.css("text-shadow","1px 1px 1px "+i.background),r.css("border","1px solid "+i.background))}}if(e.slug==="title"){var r=Crafty.e(e.slug).attr({x:t,y:n});if(!_.isUndefined(e.properties)&&!_.isUndefined(e.properties.font)){var i=e.properties.font;_.isUndefined(i.color)||r.css("color",i.color),_.isUndefined(i.family)||r.css("font-family",i.family),_.isUndefined(i.size)||r.css("font-size",i.size),_.isUndefined(i.background)||(r.css("background-color",i.background),r.css("text-shadow","1px 1px 1px "+i.background),r.css("border","1px solid "+i.background))}}}),_.each(e.gameComponents,function(e){var t=e.position.column*Parser.blockSize,n=e.position.row*Parser.blockSize;Crafty.e(e.slug).attr({x:t,y:n,w:Parser.blockSize,h:Parser.blockSize})})})}),!0},createGameComponents:function(e){return _.each(e,function(e){var t=e.properties,n=_.isString(t.sprite)?t.sprite:!1;Crafty.c(e.slug,{init:function(){var e=this;e.addComponent("2D","Canvas","Sprite"),n&&e.addComponent(n+"-sprite");if(!_.isUndefined(t.gravity)){var r=t.gravity.direction?1:-1;e.gravity("platform"),e.gravityConst(r*t.gravity.strength)}if(!_.isUndefined(t.controls)){var i=_.isNumber(t.controls.speed)?t.controls.speed:4;if(t.controls.method==="Fourway"){var s=_.isNumber(t.controls.jumpHeight)?t.controls.jumpHeight:12;e.addComponent("Controls","Keyboard","Gravity"),e.Controls(i,s),e.gravity("platform")}}else e.addComponent("platform")}})}),!0},createSceneComponents:function(e){var t="/static/img/components/",n=".png";return _.each(e,function(e){_.each(e.sceneComponents,function(e){e.slug==="volume"&&Crafty.c(e.slug,{init:function(){var r=this,i=_.isUndefined(Crafty.magos.volume)||Crafty.magos.volume?"":"-off";r.addComponent("2D","DOM","Image"),r.image(t+e.slug+i+n),r.addComponent("volume-button")}}),e.slug==="time"&&Crafty.c(e.slug,{init:function(){var r=this;r.addComponent("2D","DOM","Image"),r.image(t+e.slug+n)}}),e.slug==="play"&&Crafty.c(e.slug,{init:function(){var e=this;e.addComponent("2D","DOM","Text"),e.text("Start New Game"),e.addComponent("start-button")}}),e.slug==="highscore"&&Crafty.c(e.slug,{init:function(){var e=this;e.addComponent("2D","DOM"),$(document).trigger("getHighscores")}}),e.slug==="title"&&Crafty.c(e.slug,{init:function(){var e=this;e.addComponent("2D","DOM","Text"),e.text(Parser.game.title)}})})}),!0},getGame:function(e,t){socket=t,socket.emit("joinGame",e,function(e){console.log("websocket getGame (game)"),console.log(e),Parser.parseGame(e)})},getAnimation:function(e,t){var n=_.find(e,function(e){return e.key===t});return n.animation},setAnimation:function(e,t){return e.addComponent(t.id),e.animate(id,0,0,0),e.animate(id,15,1),e}};