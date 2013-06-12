/* Magos Editor */

$(function() {

  (function(App, $, Em, undefined) {
    "use strict";
    App.VERSION = '0.0.1',

    App.settings = {
      djangoUri : 'http://localhost:8000/'
      //djangoUri : 'http://magos.pori.tut.fi/'
    };

    /**************************
     * NumberField, ColorField
     **************************/

    App.NumberField = Em.TextField.extend({
      attributeBindings: ['min', 'max'],
      type: 'number'
    });

    App.ColorField = Em.TextField.extend({
      type: 'color'
    });

    /**************************
     * User
     **************************/

    App.User = Em.Object.extend({
      userName: null,
      firstName: null,
      lastName: null,
      magos: null,
      busy: false,
      role: 'student'
    });

    /**************************
     * Users Controller
     **************************/

    App.usersController = Em.ArrayController.create({
      content: [],
      user: null,
      removeItem: function(propName, value) {
        var obj = this.findProperty(propName, value);
        this.removeObject(obj);
      },
    });


    /**************************
     * Room
     **************************/

    App.Room = Em.Object.extend({
      slug: null,
      authors: null,
      teachers: null,
      magosesBinding: 'App.magosesController.content',
      init: function() {
        this._super();
        this.set("authors", []);
        this.set("teachers", []);
      }
    });

    App.roomController = Em.Object.create({
      content: null,
      populate: function(gameData) {
        var controller = this;
        console.log('POPULATE ROOM');
        console.log(gameData);
        App.dataSource.joinRoom(gameData, function(data) {
          console.log(data);
          if(_.isObject(data)) {
            console.log('User joined room.');
            var room = App.Room.create(data);
            controller.set('content', room);
            var activeUser = App.usersController.get('user');
            // convert magoses to Ember objects
            _.each(data.magoses, function(obj) {
              var emMagos = App.Magos.create(obj);
              if(emMagos.get('user')) {
                //console.log(obj.magos);
                //console.log(obj.user);
                if(activeUser.userName == emMagos.get('user').userName) {
                  console.log('Set magos ' + emMagos.get('magos') + ' for active user ' + activeUser.userName);
                  //App.usersController.get('user').set('magos', obj.magos);
                  activeUser.set('magos', emMagos.get('magos'));
                }
                var emUser = App.User.create(obj.user);
                emMagos.set('user', emUser);
              }
              // Emberify potions
              var potions = [];
              _.each(obj.potions, function(potion) {
                var emPotion = App.Potion.create(potion);
                potions.push(emPotion);
                App.potionsController.get('content').pushObject(emPotion);
              });
              emMagos.set('potions', potions);
              App.magosesController.get('content').pushObject(emMagos);
            });
            
            // add user to other instances also
            App.dataSource.addUser(activeUser, function(data) {
              console.log('emit (add user AGAIN)');
            });
            
            App.magosesController.populate();
          } else {
            // user has no access to room
            console.log('Not authorized.');
            window.location.replace("http://localhost:8080");
          }
        });
      }
    });

    /**************************
     * Game
     **************************/

    App.Game = Em.Object.extend({
      title: 'Magos',
      slug: null,
      type: null,
      state: 0,
      cloned: 0,
      description: null,
      authors: [],
      revision: null,
      href: null,
      playPath: function() {
        return '/play/' + this.get('slug');
      }.property('playPath')

    });

    // replace this Object with ObjectProxy in 1.0
    App.gameController = Em.Object.create({
      content: null,
      populate: function() {
        var controller = this;
        // set user credentials
        App.dataSource.setUserCredentials(function(data) {          
          if(data) {
            var gameSlug = data.slug;
            var currentUser = App.User.create({
                userName: data.userName,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role
              });
            App.usersController.get('content').pushObject(currentUser);

            var thisUser = App.usersController.get('content').findProperty('userName', data.userName);
            App.usersController.set('user', thisUser);
            // add user to other instances also
            App.dataSource.addUser(thisUser, function(data) {
              console.log('emit (add user)');
            });

            // join game after credential
            App.dataSource.joinGame(function(data) {
              // set content to game controller
              data.slug = gameSlug;
              console.log('GAME data:');
              console.log(data);
              controller.set('content', data);
              App.roomController.populate(data);

            });            
          }

        });

      }
    });

    App.GameView = Em.View.extend({
      playPathBinding: 'App.gameController.content.playPath'
    });

    /**************************
     * Revision
     **************************/

    App.Revision = Em.Object.extend({
      canvas: [],
      scenes: [],
      assets: {},
      gameComponents: []
    });

    App.revisionController = Em.Object.create({
      contentBinding: 'App.gameController.content.revision',
      canvasObserver: function() {
        var controller = this;
        var canvas = controller.getPath('content.canvas');
        if(canvas) {
          //App.magosesController.populate();
          App.imageAssetsController.populate();
        }
      }.observes('content')
    });

    /**************************
     * Scene
     **************************/

    App.Scene = Em.Object.extend({
      name: null,
      gameComponents: [],
      sceneComponents: [],
      active: false
    });

    App.scenesController = Em.ArrayController.create({
      contentBinding: 'App.revisionController.content.scenes',
      selectedBinding: 'App.revisionController.content.scenes.firstObject',
      gameScenes: [],
      firstRun: 1,
      init: function() {
        Em.run.next(function() {
          createGameTableCanvases();
        });
      },
      selectedObserver: function() {
        var controller = this;

        var sceneName = this.getPath('selected.name');
        var selected = controller.get('selected');
        var items = controller.get('content');
        if(selected) console.log(selected.name);

        _.each(items, function(item) {
          item.set('active', false);
        });

        if(!_.isNull(selected)) selected.set('active', true);

        if(sceneName !== 'intro' && sceneName !== 'outro') {
          $('body').addClass('game-scene');
        } else {
          $('body').removeClass('game-scene');
        }

        if(this.get('firstRun') < 0) {
          Em.run.next(function() {
            var $container = $('.canvas > .canvas-pane:visible');
            $container.fadeOut(250, function() {
              $container.siblings('.canvas-' + sceneName).fadeIn(250);
            });
          });
        }

        this.set('firstRun', this.get('firstRun') - 1); // TODO ugly first b/e runs twice at first so make false after second run
      }.observes('selected')
    });

    App.gameScenesController = Em.ArrayController.create({
      content: [],
      scenesBinding: Em.Binding.oneWay('App.scenesController.content'),
      scenesObserver: function() {
        //
        var scenes = this.get('scenes');
        var array = [];

        _.each(scenes, function(scene) {
          if(scene.name !== 'intro' && scene.name !== 'outro') array.push(scene);
        });

        this.set('content', array);
      }.observes('scenes')

    });

    App.SelectSceneView = Em.View.extend({
      contentBinding: 'App.scenesController.content',
      classNames: ['btn-group', 'btn-group-scene'],
      alwaysTrue: true,
      click: function(event) {
        var $tgt = $(event.target);

        var view = Em.View.views[$tgt.parent().attr('id')];
        var selected = view.get('item');

        // set selected component
        App.selectedComponentController.set('content', selected);

      }
    });

    App.SelectSceneBtn = Em.View.extend({
      classNames: ['btn', 'btn-primary'],
      classNameBindings: ['scene.active'],
      click: function(event) {
        App.scenesController.set('selected', this.get('scene'));
      }
    });


    /**************************
     * Image Assets
     **************************/

    App.ImageAsset = Em.Object.extend({
      name: null,
      slug: null,
      file: null, // this is uuid
      ext: null, // image extension
      state: 0,
      type: 0, // 0=block, 1=anim, 2=background
      apiPath: function() {
        var canvas = App.gameController.get('content').get('revision').canvas;
        var blockSize = parseInt(canvas.blockSize, 10),
            rows = parseInt(canvas.rows, 10),
            cols = parseInt(canvas.columns, 10);
        // block size for block
        var width = blockSize, 
            height = blockSize;
        if(this.get('type') == 2) {
          // block size for background
          width = cols * blockSize;
          height = rows * blockSize;
        }
        return App.settings.djangoUri + 'game/image/' + this.get('file') + '_' + width + 'x' + height + '.' + this.get('ext');
      }.property('file')
    });

    App.imageAssetsController = Em.ArrayController.create({
      content: null,
      populate: function() {
        var controller = this;
        App.dataSource.getImageAssets(function(data) {
          console.log('. . . . image assets data:');
          console.log(data);
          controller.set('content', data);
        });
      },
      // image assets of type 'block'
      blocks: Em.computed(function() {
        var components = this.get('content');
        var array = [];
        _.each(components, function(component) {
          if(component.type == 0) array.push(component);
        });
        return array;
      }).property('content'),
      // image assets of type 'anim'
      animations: Em.computed(function() {
        var components = this.get('content');
        var array = [];
        _.each(components, function(component) {
          if(component.type == 1) array.push(component);
        });
        return array;
      }).property('content'),
      // image assets of type 'background'
      backgrounds: Em.computed(function() {
        var components = this.get('content');
        var array = [];
        _.each(components, function(component) {
          if(component.type == 2) array.push(component);
        });
        return array;
      }).property('content')
    });


    /**************************
     * SceneComponent
     **************************/

    App.SceneComponent = Em.Object.extend({
      title: null,
      slug: null,
      sprite: null,
      file: null,
      scenes: [],
      potions: null,
      active: false,
      icon: function() {
        return '/editor/static/img/icons/icon-' + this.get('slug') + '.png';
      }.property('slug'),
      potionsStr: function() {
        var potions = this.get('potions');
        var potionsStr = '';

        _.each(potions, function(potion) {
          potionsStr += 'p-' + potion + ' ';
        });

        return potionsStr.trim();

      }.property('potions'),
      scenesStr: function() {
        var scenes = this.get('scenes');
        var scenesStr = '';

        _.each(scenes, function(scene) {
          scenesStr += 's-' + scene + ' ';
        });

        return scenesStr.trim();

      }.property('scenes')

    });

    App.sceneComponentsController = Em.ArrayController.create({
      content: [],
      selectedSceneBinding: 'App.scenesController.selected.sceneComponents',
      // NOT IN USE
      selectedSceneNameBinding: 'App.scenesController.selected.name',
      populate: function() {
        var controller = this;

        App.dataSource.getSceneComponents(function(data) {
          // set content
          controller.set('content', data);
        });
      },
      available: function() {
        var components = this.get('content');
        var selectedSceneName = this.get('selectedSceneName');
        var array = [];

        _.each(components, function(component) {
          var str = component.scenes.join(' ');
          var reg = new RegExp(selectedSceneName);

          if(str.match(reg)) array.push(component);
        });

        return array;

      }.property('content', 'selectedSceneName')
    });

    App.SceneComponentsView = Em.View.extend({
      contentBinding: 'App.sceneComponentsController.content',
      classNameBindings: ['uiSelected'],
      uiSelected: false,
      alwaysTrue: true,
      didInsertElement: function() {
        var $li = this.$();

        $li.find('> img').tooltip({
          delay: {
            show: 500,
            hide: 100
          },
          placement: 'top'
        });

        var scene = this.get('scene');

        this.$("> img").draggable({
          helper: "clone",
          //snap: ".canvas-cell:empty",
          // grid: [32, 32],
          snapMode: "inner",
          start: function() {
            var view = Em.View.views[$(this).parent().attr('id')];

            var selected = view.get('item');
            // set selected component
            App.selectedComponentController.set('content', selected);
          }

        });

        $li.droppable({
          greedy: true,
          accept: ".potion-icon",
          activeClass: "ui-state-target",
          hoverClass: "ui-state-active",
          drop: function(event, ui) {
            var $tgt = $(this),
              view = Em.View.views[$tgt.attr('id')],
              selected = view.get('item');

            // set selected component
            App.selectedComponentController.set('content', selected);
            // set user busy
            App.usersController.setPath('user.busy', true);

            var $draggable = $(ui.draggable),
              $container = $draggable.closest('.magos-potions'),
              potion = $draggable.data('potion');

            $container.hide("slide", {
              direction: "right"
            }, 250, function() {
              $container.siblings('.magos-potions.' + potion).show('slide', {
                direction: "left"
              }, 250);
            });
          }
        });
        // ---
      },
      eventManager: Em.Object.create({
        click: function(event, view) {
          var selected = view.get('item');
          // set selected component
          App.selectedComponentController.set('content', selected);
          // if user busy, set not busy
          if(App.usersController.getPath('user.busy')) {
            App.usersController.setPath('user.busy', false);
          }

          // if potion form open
          var $magos = $('.selected-magos');
          if($magos.is(':hidden')) {
            $magos.siblings('.magos-potions').hide('slide', {
              direction: 'left'
            }, 250, function() {
              $magos.show('slide', {
                direction: 'right'
              }, 250);
            });
          }
        }
      })
    });

    /**************************
     * GameComponent
     **************************/

    App.CanvasComponent = Em.Object.extend({
      oid: null,
      slug: null,
      position: null,
      properties: null
    });

    App.GameComponent = Em.Object.extend({
      title: null,
      slug: null,
      file: null,
      properties: null,
      active: false,
      icon: function() {
        //return '/editor/user-media/images/' + this.get('properties.sprite') + '.png';
        var file_uuid = this.getPath('properties.file'),
          ext = this.get('extension'),
          canvas = App.gameController.get('content').get('revision').canvas,
          blockSize = parseInt(canvas.blockSize, 10),
          rows = parseInt(canvas.rows, 10),
          cols = parseInt(canvas.columns, 10);
        console.log(ext);
        // block size for block
        var width = blockSize, 
          height = blockSize;
        return App.settings.djangoUri + 'game/image/' + file_uuid + '_' + width + 'x' + height + '.' + ext;
        //return '/editor/' + this.get('properties.file');
      }.property('properties.file'),
      extension: function() {
        var file_ext = this.getPath('properties.ext');
        return file_ext;
      }.property('properties.ext'),
      snapToGrid: function() {
        var snap = this.getPath('properties.controls.grid');

        if(snap === false) {
          return "No";
        } else if(snap === true) {
          return "Yes";
        } else {
          return snap;
        }

      }.property('properties.controls.grid'),
      directionStr: function() {
        var dir = this.getPath('properties.gravitation.direction');

        if(dir === false) {
          return "Inverted";
        } else if(dir === true) {
          return "Normal";
        } else {
          return dir;
        }

      }.property('properties.gravitation.direction'),
      collisions: function() {
        var collisions = this.getPath('properties.collisions');

        return collisions;

      }.property('properties'),
      filteredScoreEvents: function() {
        var collisions = this.getPath('properties.collisions');

        return _.isObject(collisions) ? collisions.filterProperty('score') : false;

      }.property('properties'),
      filteredAudioEvents: function() {
        var collisions = this.getPath('properties.collisions');

        return _.isObject(collisions) ? collisions.filterProperty('audio') : false;

      }.property('properties'),
      filteredTextEvents: function() {
        var collisions = this.getPath('properties.collisions');

        return _.isObject(collisions) ? collisions.filterProperty('text') : false;

      }.property('properties'),
      filteredDialogEvents: function() {
        //var collisions = this.get('properties.collisions');
        //return _.isObject(collisions) ? collisions.filterProperty('text') : false;
        return false;
      }.property('properties')
    });

    App.gameComponentsController = Em.ArrayController.create({
      contentBinding: 'App.gameController.content.revision.gameComponents',
      // 'App.scenesController.selected.gameComponents',
      removeItem: function(propName, value) {
        var obj = this.findProperty(propName, value);
        this.removeObject(obj);
      },
      updateItem: function(propName, value, newItem) {
        // replace old gameComponent with a new one when properties change
        console.log(newItem);
        newItem.active = false;
        var obj = this.findProperty(propName, value),
            src = newItem.properties.file,
            slug = newItem.slug,
            item = App.GameComponent.create(newItem),
            idx = this.indexOf(obj);
        this.replaceContent(idx, 1, [item]);
        // update instances in the canvas w/ the new graphic
        $('.canvas-pane').find("[data-slug='" + slug + "']").attr('src', item.get('icon'));
      }
    });

    App.GameComponentsView = Em.View.extend({
      classNameBindings: ['uiSelected'],
      uiSelected: false,
      alwaysTrue: true,
      sceneBinding: Em.Binding.oneWay('App.scenesController.selected.name'),
      contentBinding: 'App.gameComponentsController.content',
      sceneObserver: function() {

        var scene = this.get('scene');

        // if (scene !== 'intro' && scene !== 'outro') {
        var $chest = $('.game-container .item-chest');

        $chest.find('li').each(function(index) {
          var $li = $(this);

          if(!$li.hasClass('add-item') && !$li.hasClass('remove-item')) {

            // ---
            $li.find('> img').draggable({
              helper: "clone",
              snap: ".canvas-cell:empty",
              snapMode: "inner",
              start: function() {
                var view = Em.View.views[$(this).parent().attr('id')];

                var selected = view.get('item');
                // set selected component
                App.selectedComponentController.set('content', selected);
              }
            });

            // ---
            $li.droppable({
              greedy: true,
              accept: ".potion-icon",
              activeClass: "ui-state-target",
              hoverClass: "ui-state-active",
              drop: function(event, ui) {

                var $tgt = $(this),
                  view = Em.View.views[$tgt.attr('id')],
                  selected = view.get('item');

                // set selected component
                App.selectedComponentController.set('content', selected);
                // set user busy
                App.usersController.setPath('user.busy', true);

                var $draggable = $(ui.draggable),
                  $container = $draggable.closest('.magos-potions'),
                  potion = $draggable.data('potion');

                // play sound
                var sound = document.querySelector('#potion-sound');
                sound.play();

                $container.hide("slide", {
                  direction: "right"
                }, 250, function() {
                  $container.siblings('.magos-potions.' + potion).show('slide', {
                    direction: "left"
                  }, 250);
                });
              }
            });

          } // if
        });

        //  }
      }.observes('scene'),
      didInsertElement: function() {
        var $li = this.$();

        $li.find('> img').tooltip({
          delay: {
            show: 500,
            hide: 100
          },
          placement: 'top'
        });

        var scene = this.get('scene');

        $li.find('> img').draggable({
          helper: "clone",
          snap: ".canvas-cell:empty",
          snapMode: "inner",
          start: function() {
            var view = Em.View.views[$(this).parent().attr('id')];

            var selected = view.get('item');
            // set selected component
            App.selectedComponentController.set('content', selected);
          }
        });

        $li.droppable({
          greedy: true,
          accept: ".potion-icon",
          activeClass: "ui-state-target",
          hoverClass: "ui-state-active",
          drop: function(event, ui) {
            var $tgt = $(this),
              view = Em.View.views[$tgt.attr('id')],
              selected = view.get('item');

            // set selected component
            App.selectedComponentController.set('content', selected);
            // set user busy
            App.usersController.setPath('user.busy', true);

            var $draggable = $(ui.draggable),
              $container = $draggable.closest('.magos-potions'),
              potion = $draggable.data('potion');

            $container.hide("slide", {
              direction: "right"
            }, 250, function() {
              $container.siblings('.magos-potions.' + potion).show('slide', {
                direction: "left"
              }, 250);
            });
          }
        });
        // ---
      },
      eventManager: Em.Object.create({
        click: function(event, view) {
          var selected = view.get('item');
          // set selected component
          App.selectedComponentController.set('content', selected);
          // if user busy, set not busy
          if(App.usersController.getPath('user.busy')) {
            App.usersController.setPath('user.busy', false);
          }

          // if potion form open
          var $magos = $('.selected-magos');
          if($magos.is(':hidden')) {
            $magos.siblings('.magos-potions').hide('slide', {
              direction: 'left'
            }, 250, function() {
              $magos.show('slide', {
                direction: 'right'
              }, 250);
            });
          }

        }
      })
    });

    App.AddGameComponentView = Em.View.extend({
      click: function(event) {
        // open bootstrap dialog
        $('#dialog-new-item').modal().on('show', function() {
          $(this).find('input').val('');
          $(this).find('.control-group').removeClass('error');
        })
      },
      didInsertElement: function() { // TODO Screenshot
        this.$('> img').tooltip({
          delay: {
            show: 500,
            hide: 100
          },
          placement: "top"
        });
      }
    });






    /**************************
     * Remove Game Components
     **************************/

    App.RemoveGameComponentView = Em.View.extend({
      didInsertElement: function() {
        var view = this;

        view.$('> img').tooltip({
          delay: {
            show: 500,
            hide: 100
          },
          placement: "top"
        });

        view.$().droppable({
          greedy: true,
          accept: ".game-item, .canvas-item",
          activeClass: "ui-state-target",
          hoverClass: "ui-state-active",
          drop: function(event, ui) {
            var $draggable = $(ui.draggable);
            if($draggable.hasClass("canvas-item")) {

              $draggable.remove();

            } else {

              var selectedView = Em.View.views[$draggable.parent().attr('id')];
              var selectedItem = selectedView.get('item');
              var slug = selectedItem.get('slug');

              // TODO check that there is no istances of item in canvases
              if (!$('.canvas-pane').find("[data-slug='" + slug + "']").length) {
                App.gameComponentsController.removeItem('slug', slug);
                // inform other authors of the change
                App.dataSource.removeGameComponent(slug, function(data) {
                  console.log('emit (remove game component)');
                });

              } else {
                // cannot remove
                console.log('Can not remove gameComponent');
                App.setFlash('error', 'Can not remove game component. It is in use.');
              }

            }

          }
        });
      }
    });


    /**************************
     * Dialog Add Component
     **************************/

    Em.View.create({
      templateName: 'dialog-new-item'
    }).appendTo('body');

    App.AddItemForm = Em.View.extend({
      tagName: 'form',
      classNames: ['vertical-form'],
      itemTitle: null,
      compType: null,
      submit: function(event) {
        // TODO enter ei toimi
        event.preventDefault();
        //
        var itemTitle = this.get('itemTitle');
        var compType = this.getPath('compType.name');

        console.log(itemTitle + ':::' + compType);
        //
        if(!itemTitle.length || !compType.length) return;

        var safeSlug = createSlug(itemTitle);
        // make sure that component w/ same slug does not exist
        if(!App.gameController.getPath('content.revision.gameComponents').findProperty('slug', safeSlug)) {

          var obj = {
            title: itemTitle,
            slug: safeSlug,
            properties: {
              sprite: 'empty1',
              //file: 'user-media/images/empty1.png',
              file: 'cc7ec50c-b014-4363-850e-35a8c5e30a6c', // uuid of empty icon
              ext: 'png',
              type: compType // TODO check order empty1,2,3,4 and choose unique
            }
          };

          var item = App.GameComponent.create(obj);
          console.log(item.get('properties'));
          App.gameComponentsController.get('content').pushObject(item);

          // App.selectedComponentController.set('content', item);
          $('#dialog-new-item').modal('hide');

          App.dataSource.addGameComponent(item, function(data) {
            console.log('emit (add game component)');
          });

          App.dataSource.saveGame(1, function(data) {
            console.log('save (create new)');
          });

          this.set('itemTitle', null);

        } else {
          // component w/ same name already exists
          App.setFlash('error', 'Item name is already in use. Please choose a different name.');        
          return false;
        }

      }
    });

    /**************************
     * Dialog Image Assets
     **************************/

    Em.View.create({
      templateName: 'dialog-image-assets',
      click: function(event) {
        event.preventDefault();

        var $tgt = $(event.target),
          $modal = $('#image-assets');

        if($tgt.hasClass('btn-select')) {
          // image was selected from modal window
          var $item = $modal.find('.assets-list').find('.ui-selected');

          if(!$item.length && !_.isNull(App.selectedComponentController.get('content'))) {
            return false;
          }

          var img_type = $item.data('type'),
              sprite = $item.data('sprite'),
              file = $item.data('file'),
              ext = $item.data('ext');
          console.log(ext);
          var selectedImageAsset = App.imageAssetsController.get('content').findProperty('file', file);

          // TODO: If we are updating sceneComponents, should we update potions instead of properties...
          App.selectedComponentController.setPath('content.properties.sprite', sprite);
          App.selectedComponentController.setPath('content.properties.file', file);
          App.selectedComponentController.setPath('content.properties.ext', ext);
          
          var selectedComponent = App.selectedComponentController.get('content');

          var slugName = App.selectedComponentController.getPath('content.slug');

          var src = selectedImageAsset.get('apiPath');
          $('.item-chest').find("[data-slug='" + slugName + "']").attr('src', src);

          console.log(src);
          console.log($('.item-chest').find("[data-slug='" + slugName + "']"));

          $('.canvas-pane').find("[data-slug='" + slugName + "']").attr('src', src);

          App.dataSource.saveGame(0, function(data) {
            console.log('save (add sprite)');
          });

          App.dataSource.updateGameComponent(slugName, selectedComponent, function(data) {
            console.log('emit (update game component)');
          });          

          $modal.modal('hide');
          $modal.find('.ui-selected').removeClass('.ui-selected');

        } else if($tgt.hasClass('btn-close')) {
          $modal.modal('hide');
          $modal.find('.ui-selected').removeClass('.ui-selected');
        }
      },
      didInsertElement: function() {
        Em.run.next(function() {
          $('.assets-list').selectable({
            filter: "li"
          });
        });
      }
    }).appendTo('body');

    /**************************
     * Selected Component
     * This can be either sceneComponent or gameComponent
     **************************/

    App.selectedComponentController = Em.Object.create({
      content: null,
      sceneComponentsBinding: 'App.sceneComponentsController.content',
      gameComponentsBinding: 'App.gameComponentsController.content',
      contentObserver: function() {
        //
        var selected = this.get('content');
        var sceneItems = $('.scene-chest').find('li');
        var gameItems = $('.item-chest').find('li');

        console.log(JSON.stringify(this.get('content')));

        // loop elements and remove ui-selected class
        _.each(sceneItems, function(item) {
          var view = Em.View.views[$(item).attr('id')];
          var component = view.get('item');

          view.set('uiSelected', component === selected ? true : false);
        });

        _.each(gameItems, function(item) {
          var view = Em.View.views[$(item).attr('id')];
          var component = view.get('item');

          view.set('uiSelected', component === selected ? true : false);
        });

        //
        var sceneComponents = this.get('sceneComponents');
        var gameComponents = this.get('gameComponents');
        var items = sceneComponents.concat(gameComponents);

        _.each(items, function(item) {
          item.set('active', false);
        });

        selected.set('active', true);

        //console.log('new selected component:');
        //console.log(this.get('content.properties.sprite'));
      }.observes('content')
    });

    /**************************
     * Potion
     **************************/
    /*
    App.Potion = Em.Object.extend({
      magos: null,
      potions: []
    });
*/

    /**************************
     * Potions Controller
     **************************/

    App.potionsController = Em.ArrayController.create({
      content: [],

      controls: Em.computed(function() {
        var components = this.get('content').findProperty('title', 'controls').get('properties');
        return Em.Object.create(components);
      }).property('content'),

      gravitation: Em.computed(function() {
        var components = this.get('content').findProperty('title', 'gravitation').get('properties');
        return Em.Object.create(components);
      }).property('content'),

      collision: Em.computed(function() {
        var components = this.get('content').findProperty('title', 'collision').get('properties');
        return Em.Object.create(components);
      }).property('content'),

      compTypes: Em.computed(function() {
        var components = this.get('content').findProperty('title', 'type').get('properties');
        return Em.Object.create(components);
      }).property('content'),

      fonts: Em.computed(function() {
        var components = this.get('content').findProperty('title', 'font').get('properties');
        return Em.Object.create(components);
      }).property('content')

    });

    /**************************
     * Potions Views
     **************************/

    /**************************
     * Potion
     **************************/

    App.Potion = Em.Object.extend({
      title: null,
      properties: null,
      icon: function() {
        var icon = this.get('title');
        return '/editor/static/img/icons/icon-' + icon + '.png';
      }.property('title')
    });

    App.PotionView = Em.View.extend({
      content: null,
      template: Em.Handlebars.compile('<img {{bindAttr src="content.icon"}} {{bindAttr data-potion="content.title"}} {{bindAttr alt="title"}} class="potion-icon inner-shadow draggable-item" />')
    });

    /**************************
     * Magos
     **************************/

    App.Magos = Em.Object.extend({
      user: null,
      magos: null,
      potions: [],
      userActiveBinding: 'App.usersController.user',
      busy: function() {
        return this.getPath('user.busy');
      }.property('user'),
      icon: function() {
        var magos = this.get('magos');
        return '/editor/static/img/icons/' + magos + '.png';
      }.property('magos'),
      activeUser: function() {
        var user = this.get('user');
        var active = this.get('userActive');
        return Em.isEqual(user, active);
      }.property('user', 'userActive'),
      isArcitectus: function() {
        return this.get('magos') === 'arcitectus' ? true : false;
      }.property('magos'),
      isArtifex: function() {
        return this.get('magos') === 'artifex' ? true : false;
      }.property('magos'),
      isPhysicus: function() {
        return this.get('magos') === 'physicus' ? true : false;
      }.property('magos'),
      isPrincipes: function() {
        return this.get('magos') === 'principes' ? true : false;
      }.property('magos'),
      magosObserver: function() {

        console.log('magos changes');
        // update magoses to other instances
        var user = this.get('user'),
            magos = this.get('magos');
        /*
        App.dataSource.userChangedMagos(user, magos, function(data) {
          console.log('emit (user changed magos)');
        });
        */

        //App.magosesController.set('content', Em.copy(App.magosesController.get('content'), true));

        setTimeout(function() {
          Em.run.next(function() {
            refreshSidebar($('.sortable-sidearea'));
          });
        }, 500);
        //
      }.observes('user.magos')
    });

    /**************************
     * Magos Controller
     **************************/

    App.magosesController = Em.ArrayController.create({
      content: [],
      selectedBinding: 'App.usersController.user.magos',
      updateItem: function(propName, value, newItem) {
        // replace old magos with a new one
        var obj = this.findProperty(propName, value),
            item = App.Magos.create(newItem),
            idx = this.indexOf(obj);
        this.replaceContent(idx, 1, [item]);
        // update instances in the canvas w/ the new graphic
        //$('.canvas-pane').find("[data-slug='" + slug + "']").attr('src', src);
      },
      populate: function() {
        var controller = this;
        var user = App.usersController.get('user');
        var userMagos = user.get('magos');
        if(userMagos) {
          // user has Magos role already
          console.log('User has magos: ' + userMagos);
          var userMagosObj = controller.get('content').findProperty('magos', userMagos);
          userMagosObj.set('user', user);
          //controller.updateItem('magos', userMagos, userMagosObj);
          App.dataSource.userChangedMagos(user, userMagos, function(data) {
            console.log('emit (user has a magos on login)');
          });

        } else {
          // user has no magos role yet, assign a free one
          var freeMagoses = controller.get('content').filterProperty('user', null);
          console.log(freeMagoses);
          var freeMagos = null;
          if(freeMagoses.length > 0) {
            freeMagos = freeMagoses[0];
            //var freeMagosObj = controller.get('content').findProperty('magos', freeMagos.magos);
            var freeMagosObj = App.Magos.create(freeMagos);
            console.log(freeMagosObj);
            console.log('Set user to ' + freeMagos.magos);
            freeMagosObj.set('user', user);
            //controller.get('content').findProperty('magos', freeMagos.magos).set('magos', freeMagosObj);
            controller.updateItem('magos', freeMagos.magos, freeMagosObj);
            App.dataSource.userChangedMagos(user, freeMagos.magos, function(data) {
              console.log('emit (user assigned a magos on login)');
            });
            // set special class for dragging action
            if(freeMagos.magos === 'arcitectus') {
              $('.chest-container').addClass('arcitectus-magos');
            }

          } else {
            alert('There are no free roles.');
          }



        }
        //Em.run.sync();

        /*
        App.dataSource.getSkillsets(function(data) {
          // set content
          controller.set('content', data);
          // set selected
          var user = App.usersController.get('user');

          var magoses = controller.get('content');
          _.each(magoses, function(obj) {
            var magosName = obj.get('magos');
            console.log(obj.get('magos'));
            console.log(obj.get('user'));
          });
          Em.run.sync();
          // get free magoses in the room (not in use)
          var freeMagoses = App.roomController.get('content').get('magoses').filterProperty('user', null);
          //var freeMagoses = App.roomController.get('content').get('magoses').filter(function(obj) { return !obj.user });
          //var freeRoomMagoses = _.where(roomMagoses, {inUse: false});
          //var freeMagosNames = _.pluck(freeRoomMagoses, 'name');
          console.log('freeMagoses');
          console.log(freeMagoses);
          

          var freeMagos = null;
          //var freeMagoses = App.magosesController.get('content').filterProperty('user', null);

          // take the first free magos and set it as users role magos
          //var freeMagos = controller.get('content').findProperty('user', null);
          var freeMagos = freeMagoses[0];
          //var freeMagos = controller.get('content').findProperty('magos', 'physicus');
          //var freeMagos = controller.get('content').findProperty('magos', 'artifex');

          if(_.isObject(freeMagos)) {
            Em.run.sync(); // room controller's magoses are not autosynced for some reason
            console.log('Set user to ' + freeMagos.magos);
            freeMagos.set('user', user);
            App.roomController.get('content').get('magoses').findProperty('magos', freeMagos.magos).set('inUse', true);

            App.dataSource.userChangedMagos(user, freeMagos.magos, function(data) {
              console.log('emit (user changed magos on login)');
            });

          } else {
            alert('there are no free roles. this should have never happened!');
          }

          // set special class for dragging action
          if(freeMagos.get('magos') === 'arcitectus') {
            $('.chest-container').addClass('arcitectus-magos');
          }
        });
        */
      },
      selectedObserver: function() {
        var controller = this;
        var magos = this.get('selected'),
            user = App.usersController.get('user');

        var prevMagos = controller.get('content').findProperty('user', user);
        if(prevMagos) {
          console.log('Previous MAGOS found: ' + prevMagos.magos);
          prevMagos.set('user', null);
        }

        if(magos) {
          console.log('Change user magos to: ' + magos);
          var newMagos = controller.get('content').findProperty('magos', magos);
          console.log('newMagos:');
          console.log(newMagos);
          if (newMagos) {
            newMagos.set('user', user);
          }
          App.usersController.set('user.magos', magos);
        }

        if(magos !== 'arcitectus') {
          $('.chest-container').removeClass('arcitectus-magos');
        } else {
          $('.chest-container').addClass('arcitectus-magos');
        }
      }.observes('selected')
    });

    App.MagosView = Em.View.extend({
      contentBinding: 'App.magosesController.content',
      classNames: ['sidebar', 'sortable-sidearea'],

      didInsertElement: function() {
        var $sortableArea = this.$();
        $sortableArea.sortable();

        Em.run.next(function() {

          refreshSidebar($sortableArea);
        });
      },
      busyObserver: function() { // TODO
        return Em.run.next(function() {
          return Em.run.next(function() {
            $('.busy-icon').tooltip({
              delay: {
                show: 500,
                hide: 100
              },
              placement: 'left'
            });
          });
        });

      }.observes('content.@each.busy'),
      selectedObserver: function() {
        
        /*
        console.log('selectedObserver: function() {');

        App.magosesController.set('content', App.magosesController.get('content'));
        Em.run.next(function() {
          //
          refreshSidebar( $('.sortable-sidearea') );
        });
        */
        
      }.observes('content.selected')

    });


    /* VIEW FOR POTION PROPERTY FORMS */
    App.MagosComponentPropertyView = Em.View.extend({
      contentBinding: 'App.potionsController.content',
      controlsBinding: 'App.potionsController.controls',
      gravitationBinding: 'App.potionsController.gravitation',
      collisionBinding: 'App.potionsController.collision',
      compTypesBinding: 'App.potionsController.compTypes',
      fontsBinding: 'App.potionsController.fonts',
      // field bindings
      controlsMethodBinding:  'App.potionsController.controls.method', // controls
      speedBinding: 'App.potionsController.controls.speed', // controls
      jumpHeightBinding: 'App.potionsController.controls.jumpHeight', // controls
      gridBinding: 'App.potionsController.controls.grid', // controls

      collisionEventBinding: 'collision.event', // collision
      collisionTargetBinding: 'collision.target', // collision

      strengthBinding: 'gravitation.strength', // gravitation
      directionBinding: 'gravitation.direction', // gravitation

      compTypeBinding:  'compTypes.title', // compType
      
      familyBinding: 'fonts.family', // font
      fontSizeBinding: 'fonts.size', // font
      fontColorBinding: 'fonts.color', // font
      fontBackgroundBinding: 'fonts.background', // font

      submitScoresProperties: function(event) {
        event.preventDefault();
        // TODO: implementation of score        
      },


      submitCollisionProperties: function(event) {
        event.preventDefault();
        // TODO: implementation of collision

      },

      submitFontProperties: function(event) {
        event.preventDefault();
        // get values from the form
        var family = this.getPath('family');
        var size = this.getPath('fontSize');
        var fontColor = this.getPath('fontColor');
        var fontBackground = this.getPath('fontBackground');
        // TODO: var background = this.get();
        console.log(size);
        var font = {
          'size' : size,
          'family' : family,
          'color' : fontColor,
          'background' : fontBackground
        }
        App.selectedComponentController.setPath('content.properties.font', font);

        var selectedComponent = App.selectedComponentController.get('content');
        var slugName = App.selectedComponentController.getPath('content.slug');
        // save game
        App.dataSource.saveGame(0, function(data) {
          console.log('save (edit properties)');
        });
        // inform others of property change
        App.dataSource.updateGameComponent(slugName, selectedComponent, function(data) {
          console.log('emit (update game component properties)');
        });          

      },

      submitCompTypeProperties: function(event) {
        event.preventDefault();
        var typeTitle = this.getPath('compType.title');
        
        App.selectedComponentController.setPath('content.properties.type', typeTitle);

        var selectedComponent = App.selectedComponentController.get('content');
        var slugName = App.selectedComponentController.getPath('content.slug');
        // save game
        App.dataSource.saveGame(0, function(data) {
          console.log('save (edit properties)');
        });
        // inform others of property change
        App.dataSource.updateGameComponent(slugName, selectedComponent, function(data) {
          console.log('emit (update game component properties)');
        });

      },

      submitGravitationProperties: function(event) {
        event.preventDefault();
        var strength = this.getPath('strength');
        var direction = this.getPath('direction');
        // get values from the form
        var gravitation = {
          'direction' : direction, // boolean
          'strength' : strength
        }
        App.selectedComponentController.setPath('content.properties.gravitation', gravitation);

        var selectedComponent = App.selectedComponentController.get('content');
        var slugName = App.selectedComponentController.getPath('content.slug');
        // save game
        App.dataSource.saveGame(0, function(data) {
          console.log('save (edit properties)');
        });
        // inform others of property change
        App.dataSource.updateGameComponent(slugName, selectedComponent, function(data) {
          console.log('emit (update game component properties)');
        });          

      },

      
      submitControlsProperties: function(event) {
        event.preventDefault();
        var controlsMethod = this.getPath('controlsMethod.method');
        var speed = this.getPath('speed');
        var jumpHeight = this.getPath('jumpHeight');
        var grid = this.getPath('grid');
        // get values from the form
        var controls = { 
          'method' : controlsMethod, 
          'speed' : speed,
          'grid' : grid,
          'jumpHeight' : jumpHeight
        };

        App.selectedComponentController.setPath('content.properties.controls', controls);

        var selectedComponent = App.selectedComponentController.get('content');
        var slugName = App.selectedComponentController.getPath('content.slug');
        // save game
        App.dataSource.saveGame(0, function(data) {
          console.log('save (edit properties)');
        });
        // inform others of property change
        App.dataSource.updateGameComponent(slugName, selectedComponent, function(data) {
          console.log('emit (update game component properties)');
        });

      },

      removeComponentProperty: function(event) {
        event.preventDefault();

        var $tgt = $(event.target);
        var $view = $tgt.closest('.ember-view');
        var view = Em.View.views[$view.attr('id')];

        var content = view.get('content');

        delete content['score'];

        console.log(score);
        console.log('App.MagosComponentPropertyView')
      },
      openImageAssetsDialog: function() {
        event.preventDefault();

        $('#image-assets').modal().on('show');
      }
    });

    App.setFlash = function(type, mesg) {
      Em.flashQueue.pushFlash(type, mesg);
    };


    /**************************
     * InfoBox Views
     **************************/
/*
  App.LazyTextField = Ember.View.extend({
    attributeBindings: ['value', 'type', 'size', 'name', 'placeholder', 'disabled', 'maxlength'],
    tagName: 'input',
    type: 'text',
    getCurrentValue: function() {
      return this.$().val();
    }
  });
*/
  App.PotionsControlsView = Ember.View.extend({
    contentBinding: 'App.selectedComponentController.content',
    methodBinding: 'App.selectedComponentController.content.properties.controls.method',

    save: function(e) {
      e.preventDefault(); e.stopPropagation();
      this.set('method', this.get('textField').getCurrentValue());
    }
  });


    var infobox = App.InfoBoxView = Em.View.create({
      templateName: 'infobox-view'
    });

    // TODO make these child views with container view
    App.InfoBoxControlsView = Em.View.extend();
    App.InfoBoxCollisionView = Em.View.extend();
    App.InfoBoxGravitationView = Em.View.extend();
    App.InfoBoxScoreView = Em.View.extend();
    App.InfoBoxDialogView = Em.View.extend();
    App.InfoBoxTextView = Em.View.extend();
    App.InfoBoxSpriteView = Em.View.extend();
    App.InfoBoxAnimationView = Em.View.extend();
    App.InfoBoxAudioView = Em.View.extend();
    App.InfoBoxTypeView = Em.View.extend();

    App.InfoBoxFontView = Em.View.extend({
      tagName: 'div',
      classNames: ['font-preview'],
      contentBinding: 'App.selectedComponentController.content',
      familyBinding: 'App.selectedComponentController.content.properties.font.family',
      sizeBinding: 'App.selectedComponentController.content.properties.font.size',
      colorBinding: 'App.selectedComponentController.content.properties.font.color',
      bgColorBinding: 'App.selectedComponentController.content.properties.font.background',
      cssFamily: '',
      cssSize: '',
      cssColor: '',
      cssBgColor: '',

      attributeBindings: ['style'],
      familyObserver: function() {
        //
        this.set('cssFamily', 'font-family:' + this.get('family') + ';');

      }.observes('family'),
      sizeObserver: function() {
        //
        this.set('cssSize', 'font-size:' + this.get('size') + 'px;');

      }.observes('size'),
      colorObserver: function() {
        //
        this.set('cssColor', 'color:' + this.get('color') + ';');

      }.observes('color'),
      bgcolorObserver: function() {
        //
        this.set('cssBgColor', 'background-color:' + this.get('bgColor') + ';');

      }.observes('bgColor')

    });

    /**************************
     * Language
     **************************/

    App.Language = Em.Object.extend({
      title: null,
      slug: null,
      code: null,
      flag: function() {
        return '/editor/static/img/flags/' + this.get('code') + '.png';
      }.property('code')
    });

    App.languagesController = Em.ArrayController.create({
      content: [],
      selected: null,
      populate: function() {
        var controller = this;

        App.dataSource.getLanguages(function(data) {
          // set content
          controller.set('content', data);
          // set as default language, updated when user preferences loaded
          controller.set('selected', controller.objectAt(0));
        });
      },
      selectedObserver: function() {
        // TODO save language preference
      }.observes('selected')
    });

    App.LangList = Em.View.extend({
      click: function(event) {
        App.languagesController.set('selected', this.get('language'));
      }
    });

    App.LanguageSelectionView = Em.View.extend({
      classNames: ['btn-group'],
      contentBinding: 'App.languagesController.selected'
    });

    /**************************
     * Game Component Types
     **************************/

    App.ComponentType = Em.Object.extend({
      name: null
    });

    App.componentTypesController = Em.ArrayController.create({
      selected: null,
      content: [
      App.ComponentType.create({
        'name': 'Block'
      }), App.ComponentType.create({
        'name': 'Collectible'
      }), App.ComponentType.create({
        'name': 'Player'
      }), App.ComponentType.create({
        'name': 'Pushable'
      })]
    });

    /**************************
     * ShoutBox
     **************************/

    var shoutbox = Em.View.create({
      templateName: 'shoutbox-view'
    });

    App.Shout = Em.Object.extend({
      timestamp: '',
      writer: '',
      magos: '',
      message: '',
      time: function() {
        var dt = new Date(this.get('timestamp') * 1000); // to javascript timestamp
        var hours = dt.getHours();
        var minutes = dt.getMinutes();
        var seconds = dt.getSeconds();

        if(hours < 10) hours = '0' + hours;
        if(minutes < 10) minutes = '0' + minutes;
        if(seconds < 10) seconds = '0' + seconds;

        return hours + ":" + minutes + ":" + seconds;

      }.property('timestamp')

    });

    App.shoutsController = Em.ArrayController.create({
      content: [
      App.Shout.create({ // initial content - welcome message
        'timestamp': Math.round((new Date()).getTime() / 1000),
        'firstName': 'Superioux',
        'userName': 'Superioux',
        'magos': 'superioux',
        'message': 'Welcome to Magos'
      })]
    });

    App.ShoutsView = Em.View.extend({
      tagName: 'table',
      contentBinding: 'App.shoutsController.content',
      didInsertElement: function() {
        this.scroll();
      },
      contentObserver: function() {
        var that = this;
        Em.run.next(function() {
          that.scroll();
        });
      }.observes('content.@each'),
      scroll: function() {
        var el = this.$().parent();
        el.scrollTop(el.prop('scrollHeight'));
      }
    });

    App.ShoutForm = Em.View.extend({
      tagName: 'form',
      classNames: ['form-inline'],
      controller: null,
      textField: null,
      firstNameBinding: 'App.usersController.user.firstName',
      userNameBinding: 'App.usersController.user.userName',
      magosBinding: 'App.usersController.user.magos',
      slugBinding: 'App.gameController.content.slug',
      submit: function(event) {
        event.preventDefault();

        var message = this.getPath('textField.value');

        if(!message.length) return;

        var timestamp = Math.round((new Date()).getTime() / 1000); // to unix timestamp
        var shout = {
          'timestamp': timestamp,
          'firstName': this.firstName,
          'userName': this.userName,
          'magos': this.magos,
          'message': message
        };
        var shoutObj = App.Shout.create(shout);

        App.shoutsController.get('content').pushObject(shoutObj);

        // send to node
        var controller = this;

        // add slug for shout
        shout.slug = this.slug;

        App.dataSource.shout(shout, function(data) {
          // do something with callback
        });

        this.setPath('textField.value', null);
      }
    });

    /* Append */

    infobox.appendTo('.sortable-mainarea');
    shoutbox.appendTo('.sortable-mainarea');

    /**************************
     * Views
     **************************/

    App.TitleView = Em.View.extend({
      tagName: 'a',
      classNames: ['brand'],
      attributeBindings: ['href'],
      titleBinding: Em.Binding.oneWay('App.gameController.content.title'),
      hrefBinding: Em.Binding.oneWay('App.gameController.content.href')
    });

    App.PublishedView = Em.View.extend({
      classNames: ['btn-group', 'btn-group-state'],
      classNameBindings: ['privateState', 'publicState'],
      stateBinding: Em.Binding.oneWay('App.gameController.content.state'),
      alwaysTrue: true,
      privateState: false,
      publicState: true // TODO
    });

    App.EmptySettingsView = Em.View.extend({
      templateName: 'empty-settings',
      template: Em.Handlebars.compile('<h4 style="margin: 8px 0;">No Settings</h4>')
    });

    App.ImageAssetsView = Em.View.extend({
      tagName: 'ul',
      classNames: ['assets-list']
    })

    /**************************
     * Data Source
     **************************/

    App.DataSource = Em.Object.extend({

      setUserCredentials: function(callback) {

        var sessionid = $.cookie('sessionid');
        var csrftoken = $.cookie('csrftoken');
        var paths = window.location.pathname.split('/');
        var slug = _.last(paths);

        var credentials = {
          sessionid: sessionid,
          csrftoken: csrftoken,
          slug: slug
        };

        socket.emit('setUserCredentials', credentials, function(data) {
          callback(data);
        });
      },

      joinRoom: function(gameData, callback) {
        socket.emit('joinRoom', gameData, function(data) {
          callback(data);
        });        
      },

      shout: function(shout, callback) {
        socket.emit('shout', shout, function(data) {
          callback(data);
        });
      },
      addGameComponent: function(item, callback) {
        socket.emit('addGameComponent', item, function(data) {
          callback(data);
        });
      },
      removeGameComponent: function(slug, callback) {
        socket.emit('removeGameComponent', slug, function(data) {
          callback(data);
        });
      },
      updateGameComponent: function(slug, selectedComponent, callback) {
        socket.emit('updateGameComponent', slug, selectedComponent, function(data) {
          callback(data);
        });
      },

      // add game component to game canvas
      saveGameComponentToCanvas: function(gameComponent, sceneName, callback) {
        socket.emit('saveGameComponentToCanvas', gameComponent, sceneName, function(data) {
          callback(data);
        });
      },

      // remove game component from game canvas
      removeGameComponentFromCanvas: function(gameComponent, sceneName, callback) {
        socket.emit('removeGameComponentFromCanvas', gameComponent, sceneName, function(data) {
          callback(data);
        });
      },

      // add game component to game canvas
      saveSceneComponentToCanvas: function(sceneComponent, sceneName, callback) {
        socket.emit('saveSceneComponentToCanvas', sceneComponent, sceneName, function(data) {
          callback(data);
        });
      },

      // remove scene component from game canvas
      removeSceneComponentFromCanvas: function(sceneComponent, sceneName, callback) {
        socket.emit('removeSceneComponentFromCanvas', sceneComponent, sceneName, function(data) {
          callback(data);
        });
      },

      addUser: function(user, callback) {
        socket.emit('addUser', user, function(data) {
          callback(data);
        });
      },

      userChangedMagos: function(user, magos, callback) {
        console.log('EMIT USER CHANGED MAGOS');
        console.log(user);
        console.log(user.get('magos'));
        console.log(magos);
        socket.emit('userChangedMagos', user, magos, function(data) {
          callback(data);
        });
      },

      canUserChangeMagos: function(gameSlug, user, magos, callback) {
        console.log('EMIT CAN USER CHANGE MAGOS');
        console.log(user);
        console.log(magos);

        socket.emit('canUserChangeMagos', gameSlug, user, magos, function(data) {
          callback(data);
        });
      },
      
      saveGame: function(mode, callback) {
        // get game
        var game = App.gameController.get('content'); // JSON.stringify(this.get('content'));
        //var gameObj = JSON.parse(gameJson);
        // save it
        socket.emit('saveGame', mode, game, function(data) {
          callback(data);
        });
      },
      getSkillsets: function(callback) {
        socket.emit('getSkillsets', '', function(data) {
          var components = [], allPotions = [];

          _.each(data, function(obj) {

            var potions = [];
            _.each(obj.potions, function(potion) {
              var p = App.Potion.create({
                'title': potion.title,
                'properties': potion.properties
              });
              App.potionsController.get('content').pushObject(p);
              allPotions.push(p);
              potions.push(p);
            });
            components.push(
            App.Magos.create({
              "magos": obj.magos,
              "potions": potions
            }));
          });

          //App.potionsController.set('content', allPotions);

          callback(components);
        });
      },
      getSceneComponents: function(callback) {
        socket.emit('getSceneComponents', '', function(data) {
          var components = [];

          _.each(data, function(obj) {
            components.push(
            App.SceneComponent.create({
              "slug": obj.slug,
              "title": obj.title,
              "sprite": obj.sprite,
              "scenes": obj.scenes,
              "potions": obj.potions
            }));
          });

          callback(components);
        });

      },
      getLanguages: function(callback) {
        socket.emit('getLanguages', '', function(data) {
          var languages = [];

          _.each(data, function(obj) {
            languages.push(
            App.Language.create({
              'title': obj.title,
              'slug': obj.slug,
              'code': obj.code
            }));
          });

          callback(languages);
        });

      },
      getImageAssets: function(callback, filter_, type) {
        var filter = filter_ || null;

        var limit = null,
          offset = null,
          width = null,
          height = null;
          //img_type = 0; // 0=block, 1=anim, 2=background

        var canvas = App.gameController.getPath('content.revision.canvas');

        if(type === 'background') {
          //img_type = 2;
          width = canvas.blockSize * canvas.columns;
          height = canvas.blockSize * canvas.rows;
        } else {
          width = canvas.blockSize;
          height = canvas.blockSize;
        }

        socket.emit('getImageAssets', filter, width, height, limit, offset, function(data) {
          //console.log(data);
          var imageAssets = [];
          _.each(data, function(obj) {
            imageAssets.push(
              App.ImageAsset.create({
                'name': obj.name,
                'slug': obj.slug,
                'file': obj.file, // this is actually uuid
                'ext': obj.ext, // extension
                'state': obj.state,
                'type': obj.type
              })
            );
          });

          callback(imageAssets);
        });

      },
      joinGame: function(callback) {
        socket.emit('joinGame', function(data) {
          if(data) {

            var game = App.Game.create();
            // debug
            console.log(data);

            game.set('title', data.title);
            game.set('slug', data.slug);
            game.set('type', data.type);
            game.set('state', data.state);
            game.set('cloned', data.cloned);
            // game.set('canvas', data.revision.canvas);
            game.set('href', window.location.href);

            var authors = [];
            _.each(data.authors, function(author) {
              //
              var obj = App.User.create({
                'userName': author.userName,
                'firstName': author.firstName,
                'lastName': author.lastName,
                'magos': author.magos
              });
              //
              authors.push(obj);
            });
            game.set('authors', authors);

            var revision = data.revision;

            if(_.isString(revision)) {
              revision = JSON.parse(revision);
            }

            var gameComponentsA = [];
            _.each(revision.gameComponents, function(component) {
              console.log(component);
              console.log(component.properties);
              gameComponentsA.push(App.GameComponent.create({
                title: component.title,
                slug: component.slug,
                properties: component.properties
              }));
            });

            var scenes = [];
            _.each(revision.scenes, function(scene) {

              var sceneArray = [];
              _.each(scene.sceneComponents, function(component) {
                console.log(component.oid);
                // sceneArray.push( App.SceneComponent.create({ title: component.title, slug: component.slug, sprite: component.sprite, properties: component.properties }) );
                sceneArray.push(App.CanvasComponent.create({
                  slug: component.slug,
                  position: component.position,
                  oid: component.oid,
                  properties: component.properties
                }));
                // TODO component properties
              });

              var gameArray = [];
              _.each(scene.gameComponents, function(component) {
                // gameArray.push( App.GameComponent.create({ title: component.title, slug: component.slug, properties: component.properties }) );
                gameArray.push(App.CanvasComponent.create({
                  slug: component.slug,
                  position: component.position,
                  oid: component.oid
                }));
                // TODO component properties
              });

              //
              var obj = App.Scene.create({
                name: scene.name,
                sceneComponents: sceneArray,
                gameComponents: gameArray
              });
              //
              scenes.push(obj);
            });

            var audios = [];
            var sprites = [];

            var rev = App.Revision.create({
              //'authors': authors,
              'canvas': revision.canvas,
              'scenes': scenes,
              'audios': audios,
              'sprites': sprites,
              'gameComponents': gameComponentsA
            });

            game.set('revision', rev);

            callback(game);

          } else {
            // game by that slug was not found
            console.log('Game not found.');
            window.location.replace("http://localhost:8080");
          }
        });
      }
    });

    App.dataSource = App.DataSource.create({
      store: App.store
    });

    /**************************
     * Data Store (tulossa 1.0 versioon, tätä ei käytetä vielä)
     **************************/

    App.Store = Em.ArrayProxy.extend({});

    /**************************
     * Init Magos
     **************************/    

    var pathname = window.location.pathname;
    var slug = pathname.replace(/^\/editor\//, '').replace(/\/$/, '');

    var address = 'http://' + window.location.hostname;
    var socket = io.connect(address, {
      resource: 'editor/socket.io'
    });

    socket.on('connecting', function() {
      console.log('websocket connecting (editor)');
    });

    socket.on('connect_failed', function(reason) {
      console.error('unable to connect to server (editor)', reason);
    });

    socket.on('connect', function() {
      console.log('websocket connected (editor)');
      // populate after socket connection is established
      App.sceneComponentsController.populate();
      App.gameController.populate();
      App.languagesController.populate();
    });


    socket.on('foobar', function(user) {
      console.log(user);
      App.setFlash('notice', 'User ' + user.userName + ' requests Magos change from ' + user.magos);

    });


    // receive shout
    socket.on('shout', function(shout) {
      if(_.isObject(shout)) {
        App.shoutsController.get('content').pushObject(App.Shout.create(shout));
      }
    });

    // add new game component
    socket.on('addGameComponent', function(item) {
      console.log('>>> SOCKET REQUEST: addGameComponent');
      if(_.isObject(item)) {
        App.gameComponentsController.get('content').pushObject(App.GameComponent.create(item));
      }
    });

    // remove game component
    socket.on('removeGameComponent', function(slug) {
      console.log('>>> SOCKET REQUEST: removeGameComponent');
      App.gameComponentsController.removeItem('slug', slug);
    });

    socket.on('updateGameComponent', function(slug, selectedComponent) {      
      console.log('>>> SOCKET REQUEST: updateGameComponent');
      App.gameComponentsController.updateItem('slug', slug, selectedComponent);
    });


    // add game component to game canvas
    socket.on('saveGameComponentToCanvas', function(component, sceneName) {      
      console.log('>>> SOCKET REQUEST: saveGameComponentToCanvas');
      addGameComponentToCavas(component, sceneName);
    });

    // remove game component from game canvas
    socket.on('removeGameComponentFromCanvas', function(component, sceneName) {      
      console.log('>>> SOCKET REQUEST: removeGameComponentFromCanvas');
      removeGameComponentFromCanvas(component, sceneName);
    });


    // add scene component to game canvas
    socket.on('saveSceneComponentToCanvas', function(component, sceneName) {      
      console.log('>>> SOCKET REQUEST: saveSceneComponentToCanvas');
      addSceneComponentToCavas(component, sceneName);
    });

    // remove scene component from game canvas
    socket.on('removeSceneComponentFromCanvas', function(component, sceneName) {      
      console.log('>>> SOCKET REQUEST: removeSceneComponentFromCanvas');
      removeSceneComponentFromCanvas(component, sceneName);
    });







    socket.on('addUser', function(user) {
      // add user if same user does not already exist
      console.log('>>> SOCKET REQUEST: addUser');
      console.log(user);
      if(_.isObject(user)) {
        if(!App.usersController.get('content').findProperty('userName', user.userName)) {
          App.usersController.get('content').pushObject(App.User.create(user));
        }
      }
    });

    socket.on('disconnectUser', function(data) {
      // remove user
      var userName = data.userName, 
          userMagos = data.magos;
      console.log('>>> SOCKET REQUEST: disconnectUser');
      console.log(userName);
      console.log(userMagos);
      App.usersController.removeItem('userName', userName);
      var userMagos = App.magosesController.get('content').findProperty('magos', userMagos);
      console.log(userMagos);
      if(_.isObject(userMagos)) {
        userMagos.set('user', null);
      }
    });

    socket.on('userChangedMagos', function(data) {     
      console.log('>>> SOCKET REQUEST: userChangedMagos');
      var user = data.user,
          newMagos = data.newMagos,
          oldMagos = data.oldMagos;
      console.log(data);

      // remove user from old magos
      if(!_.isNull(oldMagos) && oldMagos != newMagos) {
        var prevMagos = App.magosesController.get('content').findProperty('magos', oldMagos);
        if(_.isObject(prevMagos)) {
          console.log('Old magos removed from user');
          prevMagos.set('user', null);
        }
      }

      // set user to new magos
      var tgtMagos = App.magosesController.get('content').findProperty('magos', newMagos);
      console.log(tgtMagos.user);
      if(!tgtMagos.user) {
        tgtMagos.set('user', user);
        console.log('new magos ' + newMagos + ' assigned to ' + user.userName);
      } else {
        console.log('magos already in use');
      }

    });

    socket.on('refreshRevision', function(game) {
      if(_.isObject(game)) {
        console.log(game);
        console.log(game.revision);
        //App.gameController.get('content').set('revision', App.Revision.create(game.revision));
        //var revision = App.Revision.create(game.revision);
        //console.log(revision);
        var revision = game.revision;

        if(_.isString(revision)) {
          revision = JSON.parse(revision);
        }

        var gameComponentsA = [];
        _.each(revision.gameComponents, function(component) {
          console.log(component);
          gameComponentsA.push(App.GameComponent.create({
            title: component.title,
            slug: component.slug,
            properties: component.properties
          }));
        });

        var scenes = [];
        _.each(game.revision.scenes, function(scene) {

          var sceneArray = [];
          _.each(scene.sceneComponents, function(component) {
            // sceneArray.push( App.SceneComponent.create({ title: component.title, slug: component.slug, sprite: component.sprite, properties: component.properties }) );
            sceneArray.push(App.CanvasComponent.create({
              slug: component.slug,
              position: component.position,
              properties: component.properties
            }));
            // TODO component properties
          });

          var gameArray = [];
          _.each(scene.gameComponents, function(component) {
            // gameArray.push( App.GameComponent.create({ title: component.title, slug: component.slug, properties: component.properties }) );
            gameArray.push(App.CanvasComponent.create({
              slug: component.slug,
              position: component.position,
              oid: component.oid
            }));
            // TODO component properties
          });

          //
          var obj = App.Scene.create({
            name: scene.name,
            sceneComponents: sceneArray,
            gameComponents: gameArray
          });
          //
          scenes.push(obj);
        });

        var audios = [];
        var sprites = [];

        var rev = {
          'canvas': game.revision.canvas,
          'scenes': scenes,
          'audios': game.audios,
          'sprites': game.sprites,
          'gameComponents': gameComponentsA
        };

        //console.log(rev);
        App.gameController.get('content').set('revision', App.Revision.create(rev));
        populateScenes(); // redraw game components

      }
    });

    // (function init() {
    // })();
    /**************************
     * jQuery UI parts
     **************************/

    // $(".game-item").draggable({ helper: "clone" });
    // show/hide grid button TODO replace with ember object
    $(document).on('click tap', '.btn-grid', function(event) {
      event.preventDefault();
      var $tgt = $(event.target).closest('.btn');
      $('.canvas .canvas-table').toggleClass('gridless');
      $tgt.toggleClass('active');
    });

    // theme switcher TODO replace with ember object
    $(document).on('click tap', '.btn-group-theme .btn', function(event) {
      event.preventDefault();
      var $tgt = $(event.target).closest('.btn');

      $tgt.siblings().removeClass("active");
      $tgt.addClass("active");

      // TODO Update theme
      var theme = $tgt.data('theme');
      var href = "/editor/static/css/" + theme + ".css";
      $(document).find('#theme').attr('href', href);
    });

    // play button for infobox audio play button
    $(document).on('click tap', '.btn-play', function(event) {
      event.preventDefault();
      // return first one
      var $audio = $(event.target).closest('td').find('audio')[0];
      // play audio
      $audio.play();
    });

    $(document).on('click tap', '.btn-preview', function(event) {
      event.preventDefault();
      var $modal = $('#dialog-preview');

      if(!$modal.hasClass('styled')) {
        // count & set dialog size
        var canvas = App.revisionController.content.canvas,
          rows = canvas.rows,
          columns = canvas.columns,
          blockSize = canvas.blockSize;

        var dWidth = 15 + (blockSize * columns) + 15;
        var dHeight = (15 + 15 + 58 + 46) + (blockSize * rows);
        var dbHeight = blockSize * rows;

        $modal.css({
          width: dWidth + 'px',
          height: dHeight + 'px'
        });
        $modal.find('.modal-body').css({
          height: dbHeight + 'px'
        });
        $modal.addClass('styled');
      }

      $modal.one('show', function() {
        var win = document.getElementById("preview").contentWindow;
        win.postMessage(slug, window.location.protocol + "//" + window.location.host);
      });

      $modal.find('button').on('click tap', function(event) {
        $modal.modal('hide');
      });

      $modal.modal();

    });

    $(document).on('click tap', '.btn-gameinfo', function(event) {
      event.preventDefault();

      var $modal = $('#dialog-info');

      $modal.find('button').on('click tap', function(event) {
        $modal.modal('hide');
      });

      $modal.modal();
    });

    $(document).on('click tap', '.btn-back-potion', function(event) {
      event.preventDefault();

      // if user busy, set not busy
      if(App.usersController.getPath('user.busy')) {
        App.usersController.setPath('user.busy', false);
      }

      // if potion form open
      var $magos = $('.selected-magos');
      if($magos.is(':hidden')) {
        $magos.siblings('.magos-potions').hide('slide', {
          direction: 'left'
        }, 250, function() {
          $magos.show('slide', {
            direction: 'right'
          }, 250);
        });
      }
    });

    function refreshSidebar($sortableArea) {
      // sortable well
      $sortableArea.sortable({
        placeholder: "sortable-highlight",
        items: "> .sortable-item",
        handle: "h3",
        axis: "y",
        opacity: 0.8,
        forceHelperSize: true
      });
      //
      $sortableArea.disableSelection();

      // small delay required to make this work
      setTimeout(function() {

        // potions
        $('.potion-icon').draggable('destroy');
        $('.selected-magos .potion-icon').draggable({
          helper: 'clone'
        });

        // droppable skillset
        var $droppable = $sortableArea.find('.magos-potions:not(.selected-magos)').find('.skillset');

        $droppable.droppable({
          greedy: true,
          accept: ".skillset-icon",
          activeClass: "ui-state-hover",
          hoverClass: "ui-state-active",
          drop: function(event, ui) {
            var $tgt = $(event.target),
              $draggable = $(ui.draggable),
              magos = $draggable.data('magos'),
              tgtMagos = $tgt.find('.skillset-icon').data('magos');

            
            var user = App.usersController.get('user');
            // inform other authors of the change
            var gameSlug = App.gameController.getPath('content.slug');
            App.dataSource.canUserChangeMagos(gameSlug, user, tgtMagos, function(data) {
              console.log('emit (can user change magos)');
              if(data) {
                console.log('can change magos');
                // change user magos
                App.magosesController.set('selected', tgtMagos);
                App.usersController.set('user.magos', tgtMagos);

                App.dataSource.userChangedMagos(user, tgtMagos, function(data) {
                  console.log('emit (user changed magos)');
                });
              } else {
                // not allowed to change magos
                console.log('cannot change magos');
                App.setFlash('error', 'Can not change Magos');
              }

            });
        
          }
        });

        // draggable skillset-icon
        var $draggable = $sortableArea.find('.magos-potions.selected-magos').find('.skillset').find('.skillset-icon');
        $draggable.draggable({
          helper: 'clone',
          cursor: 'move',
          zIndex: 9999
        });

      }, 400);
    }

    function bindClickToRemove(itemType) {
      var itemClass = (itemType == 'gameComponents') ? 'canvas-game-component' : 'canvas-scene-component';
      $(".canvas-pane").on('click tap', 'img.' + itemClass, function(event){
        var $tgt = $(event.target),
          oid = $tgt.data('oid');
        var item = App.scenesController.getPath('selected.' + itemType).findProperty('oid', oid);
        console.log('REMOVABLE ITEM:');
        console.log(item);
        App.scenesController.getPath('selected.'+ itemType).removeObject(item);
        $tgt.remove();
        if(itemType === 'sceneComponents') {
          if(slug === 'background') {
            $scene.css('background-image', 'none');
          }
        }

        App.dataSource.saveGame(0, function(data) {
          console.log('save (click)');
          // emit removal via socket
          var sceneName = App.scenesController.get('selected').get('name');
          if(itemType == 'gameComponents') {
            // emit game component removal
            App.dataSource.removeGameComponentFromCanvas(item, sceneName, function(data) {
              console.log('emit (remove game component from game canvas');
            });
          } else {
            // emit scene component removal
            App.dataSource.removeSceneComponentFromCanvas(item, sceneName, function(data) {
              console.log('emit (remove scene component from game canvas');
            });
          }
        });
      });
    }


    function populateScenes() {
      console.log('POPULATE SCENES');
      $('.canvas-cell').empty();
      // add items to canvas
      var scenes = App.gameController.getPath('content.revision.scenes');

      _.each(scenes, function(scene) {
        var gameComponents = scene.get('gameComponents'),
          sceneComponents = scene.get('sceneComponents'),
          $scene = $('.canvas-' + scene.name);

        _.each(gameComponents, function(gameComponent) {
          var row = gameComponent.position.row,
            column = gameComponent.position.column,
            slug = gameComponent.slug,
            oid = gameComponent.oid,
            sprite = null,
            file = null,
            ext = null,
            apiPath = null;
          // make sure we have no ghost components
          if(App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug)) {
            sprite = App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug).get('properties.sprite');
            file = App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug).get('properties.file');
            ext = App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug).get('extension');
            apiPath = App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug).get('icon');

            var img = '<img src="' + apiPath + '" data-slug="' + slug + '" data-oid="' + oid + '" class="canvas-item canvas-game-component">';
            var $img = $(img);

            var cssRow = row + 1,
              cssColumn = column + 1;
            // append to scene
            $scene.find('tr:nth-child(' + cssRow + ')').find('td:nth-child(' + cssColumn + ')').append($img);          
          }
        }); // each gameComponents
        

        _.each(sceneComponents, function(sceneComponent) {
          var top = sceneComponent.position.top,
            left = sceneComponent.position.left,
            slug = sceneComponent.slug,
            oid = sceneComponent.oid,
            properties = sceneComponent.properties;

          var img = '<img src="/editor/static/img/icons/icon-' + slug + '.png" id="' + oid + '" data-slug="' + slug + '" data-oid="' + oid + '" class="canvas-item canvas-scene-component" style="position:absolute;left:' + left + 'px;top:' + top + 'px;">';
          var $img = $(img);

          if(slug === 'background' && _.isObject(sceneComponent.properties) && _.isString(properties.sprite)) {
            var backgroundImage = '/editor/user-media/images/' + properties.sprite + '.png';
            $scene.css('background-image', 'url(' + backgroundImage + ')');
          }
          // append to scene
          $scene.append($img);
        }); // each sceneComponents

      }); // each scenes

      // bind events
      bindClickToRemove('gameComponents');
      bindClickToRemove('sceneComponents');
    }


    function createGameTableCanvases() {

      var canvas = null;
      var interval = setInterval(function() {
        var canvas = App.gameController.getPath('content.revision.canvas');
        if(canvas !== null) {
          // stop loop
          clearInterval(interval);
          // vars
          var $table = $('.canvas-game'),
            $panes = $('.canvas-pane'),
            rows = canvas.rows,
            columns = canvas.columns,
            sizeClass = 'size-' + canvas.blockSize;

          var cells = '';

          for(var i = 0; i < rows; i = i + 1) {
            cells += '<tr>';
            for(var j = 0; j < columns; j = j + 1) {
              cells += '<td class="canvas-cell"></td>';
            }
            cells += '</tr>';
          }

          var maxWidth = columns * canvas.blockSize,
            maxHeight = rows * canvas.blockSize,
            sizeStyle = {
              'max-width': maxWidth + 'px',
              'height': maxHeight + 'px'
            };

          // size style to each canvas pane
          $.each($panes, function(index, value) {
            $(this).css(sizeStyle);
          });

          // size class to chests
          $('.scene-chest').addClass(sizeClass)
          $('.item-chest').addClass(sizeClass);

          // add size class and dom nodes game canvas
          $table.addClass(sizeClass).append(cells);
          populateScenes();

          // jqueryui droppable to canvas
          initCanvasDroppable();
          // jquery resize event to canvas to adjust height -> ratio
          canvasResizable();

        }
      }, 10);
    }

    function canvasResizable() {
      $('.canvas-cell').bind('resize', function(event) {
        var $tgt = $(event.target);
        var width = $tgt.width();
        $tgt.css({
          'height': width + ' !important'
        });
      });
      var $canvas = $('.canvas-pane'),
        ratio = $canvas.height() / $canvas.width();
    }
    

    // remove game component from game canvas (after socket message)
    function removeSceneComponentFromCanvas(sceneComponent, sceneName) {
      var $scene = $('.canvas-' + sceneName);
      $scene.find('img.canvas-scene-component#'+ sceneComponent.oid).remove();

    }

    // add scene component to game canvas (after socket message)
    function addSceneComponentToCavas(sceneComponent, sceneName) {
      var $scene = $('.canvas-' + sceneName);
      var top = sceneComponent.position.top,
        left = sceneComponent.position.left,
        slug = sceneComponent.slug,
        oid = sceneComponent.oid,
        properties = sceneComponent.properties;
      var img = '<img src="/editor/static/img/icons/icon-' + slug + '.png" id="' + oid + '" data-slug="' + slug + '" data-oid="' + oid + '" class="canvas-item canvas-scene-component" style="position:absolute;left:' + left + 'px;top:' + top + 'px;">';
      var $img = $(img);

      if(slug === 'background' && _.isObject(sceneComponent.properties) && _.isString(properties.sprite)) {
        var backgroundImage = '/editor/user-media/images/' + properties.sprite + '.png';
        $scene.css('background-image', 'url(' + backgroundImage + ')');
      }
      // append to scene
      $scene.append($img);
    }


    // remove game component from game canvas (after socket message)
    function removeGameComponentFromCanvas(gameComponent, sceneName) {
      var itemType = 'gameComponents';
      var itemClass = (itemType == 'gameComponents') ? 'canvas-game-component' : 'canvas-scene-component';
        
      var $scene = $('.canvas-' + sceneName);
      var row = gameComponent.position.row,
        column = gameComponent.position.column;
      var cssRow = row + 1,
        cssColumn = column + 1;
      
      // append to scene
      var $tgt = $scene.find('tr:nth-child(' + cssRow + ')').find('td:nth-child(' + cssColumn + ') img');
      var oid = gameComponent.oid;        
      var item = App.scenesController.get('content').findProperty('name', sceneName).get('gameComponents').findProperty('oid', oid);
      
      App.scenesController.get('content').findProperty('name', sceneName).get('gameComponents').removeObject(item);
      $tgt.remove();

      if(itemType === 'sceneComponents') {
        if(slug === 'background') {
          $scene.css('background-image', 'none');
        }
      }
    }

    // add game component to game canvas (after socket message)
    function addGameComponentToCavas(gameComponent, sceneName) {
      var $scene = $('.canvas-' + sceneName);
      var row = gameComponent.position.row,
        column = gameComponent.position.column;

      var cssRow = row + 1,
          cssColumn = column + 1;
      // append to scene
      var $tgt = $scene.find('tr:nth-child(' + cssRow + ')').find('td:nth-child(' + cssColumn + ')');

      if(!$tgt.is(":empty")) {
        return false;
      }
      var slug = gameComponent.slug,
        oid = gameComponent.oid,
        sprite = null,
        file = null,
        ext = null,
        apiPath = null;
      
      if(App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug)) {
        sprite = App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug).get('properties.sprite');
        file = App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug).get('properties.file');
        ext = App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug).get('extension');
        apiPath = App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug).get('icon');

        var img = '<img src="' + apiPath + '" data-slug="' + slug + '" data-oid="' + oid + '" class="canvas-item canvas-game-component">';
        var $img = $(img);

        var obj = App.CanvasComponent.create(gameComponent);
        App.scenesController.get('content').findProperty('name', sceneName).get('gameComponents').pushObject(obj);

        $img.data('oid', gameComponent.oid);
        $tgt.append($img);
      }

    }


    function initCanvasDroppable() {

      $(".canvas-cell").droppable({
        greedy: true,
        accept: ".game-item",
        activeClass: "canvas-cell-hover",
        hoverClass: "canvas-cell-active",
        drop: function(event, ui) {
          var $tgt = $(this);
          if(!$tgt.is(":empty")) {
            return false;
          }

          var $draggable = $(ui.draggable), 
            $img = '';

          var slug = $draggable.data('slug');

          if($draggable.hasClass('game-item')) {
            $img = $draggable.clone().removeAttr('data-original-title rel alt class style').addClass('canvas-item canvas-game-component');
          } else {
            $img = $draggable.removeAttr('data-original-title rel alt class style').addClass('canvas-item canvas-game-component');
          }

          var $row = $tgt.closest('tr');
          var column = $row.find('td').index($tgt);
          var row = $row.closest('table').find('tr').index($row);
          var oid = slug + column + row;

          var obj = App.CanvasComponent.create({
            oid: oid,
            slug: slug,
            position: {
              column: column,
              row: row
            }
          });

          App.scenesController.getPath('selected.gameComponents').pushObject(obj);
          $img.attr({'data-oid': oid});
          $img.data('oid', oid);
          $tgt.append($img);

          App.dataSource.saveGame(0, function(data) {
            // game component            
            console.log('save game component (drop)');
            var sceneName = App.scenesController.get('selected').get('name');
            App.dataSource.saveGameComponentToCanvas(obj, sceneName, function(data) {
              console.log('emit (save game component (drop))');
            });
          });
        }
      });

      $(".canvas-pane").droppable({
        greedy: true,
        accept: ".scene-item, .canvas-item",
        activeClass: "canvas-hover",
        hoverClass: "canvas-active",
        drop: function(event, ui) {

          var elPos = ui.position,
            elOffset = ui.offset,
            tgtOffset = $(this).offset();

          var newPosX = parseInt(elOffset.left - tgtOffset.left, 10),
            newPosY = parseInt(elOffset.top - tgtOffset.top, 10),
            newStyle = {
              'top': newPosY,
              'left': newPosX,
              'position': 'absolute'
            };

          var $draggable = $(ui.draggable),
            $tgt = $(this),
            $img = {};

          var slug = $draggable.data('slug');

          if(slug == 'background') {
            // apply background image to canvas background

          }

          if($draggable.hasClass('cloned')) {
            $img = $draggable;
          } else {
            $img = $draggable.clone().removeAttr('data-original-title rel alt class style ui-draggable').addClass('canvas-item cloned');
            $img.css(newStyle);
          }
          $img.addClass('canvas-scene-component');
          $tgt.append($img);

          var position = $img.position();
          var pos_left = Math.round(position.left);
          var pos_top = Math.round(position.top);

          var oid = slug + pos_left + pos_top;
          $img.attr({'id': oid});

          //console.log(oid);
          var obj = {
            oid: oid,
            slug: slug,
            position: {
              left: pos_left,
              top: pos_top
            }
          };

          console.log(obj);
          App.scenesController.getPath('selected.sceneComponents').pushObject(obj);
          App.dataSource.saveGame(1, function(data) {
            // scene component
            console.log('save scene component (drop)');
            var sceneName = App.scenesController.get('selected').get('name');
            App.dataSource.saveSceneComponentToCanvas(obj, sceneName, function(data) {
              console.log('emit (save scene component (drop))');
            });
          });

        } // drop
      });
    } // /function


    // main area sortable elements (shoutbox, infobox)
    $('.sortable-mainarea').sortable({
      placeholder: "sortable-highlight",
      items: "> .ember-view:not(:first)",
      handle: ".sortable-handle",
      axis: "y",
      opacity: 0.8,
      forceHelperSize: true
    });
    $('.sortable-mainarea').disableSelection();

    // help TODO replace with ember object
    $(document).on('click tap', '.btn-group-help .btn', function(event) {
      event.preventDefault();
      var $tgt = $(event.target).closest('.btn');
      $tgt.toggleClass('active');

      $('body').toggleClass('help');

      // TODO .touch action for tablets
      // $('body').find('.help-popover').each(function(index) { });
      // TODO <a class="close" href="#">&times;</a>
      $('body').popover({
        selector: '.help .help-popover',
        'placement': 'bottom',
        'delay': {
          show: 500,
          hide: 100
        }
      });

    });

    /**************************
     * Helper functions
     **************************/

    var createSlug = function(str) {
        // get trimmed string
        var filename = str.trim();

        // replace all not suitable characters and lowercase
        filename = filename.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();

        // remove all double or more dashes with one
        filename = filename.replace(/-+/gi, '-');

        // remove dashes from begin and end of the string
        filename = filename.replace(/^-/, '');
        filename = filename.replace(/-$/, '');

        // limit the string length
        // filename = filename.substring(0, 25);
        // return ready string
        return filename;
      }

  }(window.App = window.App || Em.Application.create(), jQuery, window.Em));

}); // $(function() {
