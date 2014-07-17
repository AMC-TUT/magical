/* Magos Editor */

var DEV = true;

$(function() {

  (function(App, $, Em, undefined) {
    "use strict";
    App.VERSION = '0.0.1',

    App.settings = {
      djangoUri: 'http://192.168.43.232/' // localhost
      //djangoUri : 'http://magos.pori.tut.fi/'
    };

    /**************************
     * NumberField, ColorField
     **************************/

    App.NumberField = Em.TextField.extend({
      attributeBindings: ['min', 'max'],
      type: 'number'
    });

    App.DecimalNumberField = Em.TextField.extend({
      attributeBindings: ['name', 'min', 'max', 'step'],
      type: 'number'
    });

    App.HiddenDecimalNumberField = Em.TextField.extend({
      attributeBindings: ['name', 'min', 'max', 'step'],
      type: 'hidden'
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
      magos: 'magos',
      potion: null,
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
        console.log(gameData);

        App.dataSource.joinRoom(gameData, function(data) {
          if (_.isObject(data)) {
            console.log('User joined room.');
            var room = App.Room.create(data);
            controller.set('content', room);
            var user = App.usersController.get('user');

            var magos = App.Magos.create({
              magos: 'magos',
              user: user
            });

            var potions = [];
            _.each(data.magoses, function(obj) {
              _.each(obj.potions, function(potion) { // rules|
                if (/^(score|controls|collision|gravitation|type|image)$/.test(potion.title)) {
                  var pot = App.Potion.create(potion);

                  potions.push(pot);
                  App.potionsController.get('content').pushObject(pot);
                }
              });
            });

            magos.set('potions', potions);
            App.magosesController.get('content').pushObject(magos);

            // add user to other instances also
            App.dataSource.addUser(user, function(data) {
              console.log('emit (add user AGAIN)');
            });

            App.magosesController.populate();
          } else {
            // user has no access to room
            console.log('Not authorized.');
            window.location.replace(App.settings.djangoUri);
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
        return '/editor/play/' + this.get('slug');
      }.property('playPath')

    });

    App.gameController = Em.Object.create({
      content: null,
      populate: function() {
        var controller = this;
        // set user credentials
        App.dataSource.setUserCredentials(function(data) {
          if (data) {
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
              // console.log('GAME data:');
              // console.log(data);
              controller.set('content', data);
              App.roomController.populate(data);

            });
          }

        });

      }
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
        if (canvas) {
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

          setTimeout(function() {
            var scenes = App.revisionController.getPath('content.scenes');
            var scene = _.find(scenes, function(scene) {
              if (scene.get('name') == 'game') return scene;
            });

            App.scenesController.set('selected', scene);
          }, 600);

        });
      },
      selectedObserver: function() {
        var controller = this;

        var sceneName = this.getPath('selected.name');
        var selected = controller.get('selected');
        var items = controller.get('content');

        _.each(items, function(item) {
          item.set('active', false);
        });

        if (!_.isNull(selected) && !_.isUndefined(selected)) {
          selected.set('active', true);
        }

        $('body').addClass('game-scene');

        if (this.get('firstRun') < 0) {
          Em.run.next(function() {
            var $container = $('.canvas > .canvas-pane:visible');
            $container.fadeOut(250, function() {
              $container.siblings('.canvas-' + sceneName).fadeIn(250);
            });
          });
        }

        this.set('firstRun', this.get('firstRun') - 1);
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
          if (scene.name !== 'intro' && scene.name !== 'outro') array.push(scene);
        });

        this.set('content', array);
      }.observes('scenes')

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
        if (this.get('type') == 2) {
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
          controller.set('content', data);
        });

        setTimeout(function() {
          // run init for sidebar jquery ui droppable
          refreshSidebar($('.sortable-sidearea'));
        }, 200);
      },
      // image assets of type 'block'
      blocks: Em.computed(function() {
        var components = this.get('content');
        var array = [];
        _.each(components, function(component) {
          if (component.type == 0) array.push(component);
        });
        return array;
      }).property('content'),
      // image assets of type 'anim'
      animations: Em.computed(function() {
        var components = this.get('content');
        var array = [];
        _.each(components, function(component) {
          if (component.type == 1) array.push(component);
        });
        return array;
      }).property('content'),
      // image assets of type 'background'
      backgrounds: Em.computed(function() {
        var components = this.get('content');
        var array = [];
        _.each(components, function(component) {
          if (component.type == 2) array.push(component);
        });
        return array;
      }).property('content')
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
        var file_uuid = this.getPath('properties.file'),
          ext = this.get('extension'),
          canvas = App.gameController.get('content').get('revision').canvas,
          blockSize = parseInt(canvas.blockSize, 10),
          rows = parseInt(canvas.rows, 10),
          cols = parseInt(canvas.columns, 10);

        var width = blockSize,
          height = blockSize;

        return App.settings.djangoUri + 'game/image/' + file_uuid + '_' + width + 'x' + height + '.' + ext;
      }.property('properties.file'),
      extension: function() {
        var file_ext = this.getPath('properties.ext');
        return file_ext;
      }.property('properties.ext'),
      snapToGrid: function() {
        var snap = this.getPath('properties.controls.grid');
        if (snap === false) {
          return "No";
        } else if (snap === true) {
          return "Yes";
        } else {
          return snap;
        }
      }.property('properties.controls.grid'),
      collisions: function() {
        var collisions = this.getPath('properties.collisions');
        return _.isObject(collisions) ? collisions : [];
      }.property('properties'),
      filteredScoreEvents: function() {
        var collisions = this.getPath('properties.collisions');
        return _.isObject(collisions) ? collisions.filterProperty('score') : false;
      }.property('properties')
    });

    App.selectedScoreTargetController = Ember.Object.create({
      option: null
    });

    App.selectedScoreEventController = Ember.Object.create({
      option: null
    });

    App.gameComponentsController = Em.ArrayController.create({
      contentBinding: 'App.gameController.content.revision.gameComponents',
      removeItem: function(propName, value) {
        var obj = this.findProperty(propName, value);
        this.removeObject(obj);
        // force game data save
        App.dataSource.saveGame(0, function(data) {
          console.log('save (remove game component)');
        });
      },
      refreshCollisionTargets: function() {
        this.notifyPropertyChange('collisionTargets');
      },
      // objects suitable for collision target
      collisionTargets: function() {
        var targets = [];
        var currentSlug = null;
        var currentComponent = App.selectedComponentController.get('content');
        if (currentComponent) {
          currentSlug = App.selectedComponentController.get('content').slug;
        }

        _.each(App.gameComponentsController.get('content'), function(obj) {
          var type = obj.getPath('properties.type');
          type = type.toLowerCase();

          if (!_.isUndefined(type) && /^(collectible|player|pushable|decoration|block)$/.test(type)) {
            if (obj.slug.toLowerCase() != currentSlug) {
              targets.push(
                App.GameComponent.create(obj)
              );
            }
          }
        });
        return targets;
      }.property('content.@each'),

      refreshScoreCollisionTargets: function() {
        this.notifyPropertyChange('scoreCollisionTargets');
      },

      // collision targets for selected component
      scoreCollisionTargets: function() {
        var targets = [],
          collisions = [],
          slugNames = [],
          controller = this;

        var currentComponent = App.selectedComponentController.get('content');
        if (currentComponent)  {
          collisions = currentComponent.getPath('properties.collisions');
        }

        var selectedScoreTarget = this.get('selectedScoreTarget');

        _.each(collisions, function(obj) {
          var colTarget = App.gameComponentsController.get('content').filterProperty('slug', obj.target.slug);
          // we don't want duplicates
          if (_.indexOf(slugNames, obj.target.slug) == -1) {
            slugNames.push(obj.target.slug);

            targets.push(
              App.GameComponent.create(colTarget[0])
            );
          }
        });
        return targets;
      }.property('content.@each'),

      selectedScoreTargetObserver: function() {
        var selectedScoreTarget = this.get('selectedScoreTarget');
        if (!_.isUndefined(selectedScoreTarget) && !_.isNull(selectedScoreTarget)) {
          this.refreshScoreCollisionEvents();
        }
      }.observes('selectedScoreTarget'),

      refreshScoreCollisionEvents: function() {
        this.notifyPropertyChange('scoreCollisionEvents');
      },

      // collision events for selected target
      scoreCollisionEvents: function() {
        var colEvents = [],
          collisions = [],
          controller = this;

        var currentComponent = App.selectedComponentController.get('content');
        var selectedScoreTarget = this.get('selectedScoreTarget');
        var selectedScoreEvent = this.get('selectedScoreEvent');

        if (currentComponent)  {
          collisions = currentComponent.getPath('properties.collisions');
        }

        _.each(collisions, function(obj) {
          if (!_.isUndefined(selectedScoreTarget) && obj.target.slug == selectedScoreTarget.slug) {
            if (_.isNull(selectedScoreEvent) || _.isUndefined(selectedScoreEvent) || selectedScoreEvent.event != obj.event.title) {
              controller.set('selectedScoreEvent', obj.event);
            }
            colEvents.push(
              App.GameComponent.create(obj.event)
            );
          }
        });
        return colEvents;
      }.property('content.@each'),

      updateItem: function(propName, value, source) {
        var component = App.gameComponentsController.find(function(c) {
          return c.slug == value;
        });

        component.set('properties', source.properties);

        // update instances in the canvas w/ the new graphic
        $('.canvas-pane').find("[data-slug='" + source.slug + "']").attr('src', component.get('icon'));
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

        var $chest = $('.game-container .item-chest');

        $chest.find('li').each(function(index) {
          var $li = $(this);

          if (!$li.hasClass('add-item') && !$li.hasClass('remove-item')) {

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

                var $draggable = $(ui.draggable),
                  $container = $draggable.closest('.magos-potions'),
                  potion = $draggable.data('potion');

                // set potion busy
                var busy = true;
                App.dataSource.potionBusy(potion, busy, function(data) {
                  var potion = App.potionsController.find(function(potion) {
                    return potion.title == data;
                  });

                  if (_.isObject(potion)) {
                    potion.set('busy', busy);
                    App.usersController.setPath('content.potion', potion.title);
                  }
                });

                // play sound
                var sound = document.querySelector('#potion-sound');
                sound.play();

                $container.hide("slide", {
                  direction: "right"
                }, 250, function() {
                  $container.parent().siblings('.magos-potions.' + potion).show('slide', {
                    direction: "left"
                  }, 250);
                  // in case of image potion, open modal window on drop
                  if (potion == 'image') {
                    $('#image-assets').modal().on('show');
                  }
                  if (potion == 'gravitation') {
                    activateGravitationSlider();
                  }
                });
              } // if
            });

          } // if
        });

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

        // -----

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

            var $draggable = $(ui.draggable),
              $container = $draggable.closest('.magos-potions'),
              potion = $draggable.data('potion');

            // set potion busy
            var busy = true;
            App.dataSource.potionBusy(potion, busy, function(data) {
              var potion = App.potionsController.find(function(potion) {
                return potion.title == data;
              });

              if (_.isObject(potion)) {
                potion.set('busy', busy);
                App.usersController.setPath('content.potion', potion.title);
              }
            });

            // play sound
            var sound = document.querySelector('#potion-sound');
            sound.play();

            $container.hide("slide", {
              direction: "right"
            }, 250, function() {
              $container.parent().siblings('.magos-potions.' + potion).show('slide', {
                direction: "left"
              }, 250);
              // in case of image potion, open modal window on drop
              if (potion == 'image') {
                $('#image-assets').modal().on('show');
              }
              if (potion == 'gravitation') {
                activateGravitationSlider();
              }
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
          // if potion form open
          closePotionForm();
        }
      })
    });

    App.AddGameComponentView = Em.View.extend({
      click: function(event) {
        // open bootstrap dialog
        $('#dialog-new-item').modal().on('show', function() {
          $(this).find('input').val('');
          $(this).find('.control-group').removeClass('error');
        });
      },
      didInsertElement: function() {
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
            if ($draggable.hasClass("canvas-item")) {

              $draggable.remove();

            } else {

              var selectedView = Em.View.views[$draggable.parent().attr('id')];
              var selectedItem = selectedView.get('item');
              var slug = selectedItem.get('slug');

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
     * Collision
     **************************/
    App.Collision = Em.Object.extend({
      event: null,
      target: null,
      score: 0
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
        event.preventDefault();

        var itemTitle = this.get('itemTitle');
        var compType = this.getPath('compType.name');

        if (!itemTitle.length || !compType.length) return;

        var safeSlug = createSlug(itemTitle);
        // make sure that component w/ same slug does not exist
        if (!App.gameController.getPath('content.revision.gameComponents').findProperty('slug', safeSlug)) {

          var obj = {
            title: itemTitle,
            slug: safeSlug,
            properties: {
              sprite: 'empty1',
              file: '3a798b81-8973-48ff-b2c3-a198edaf1284', // uuid of empty icon
              ext: 'png',
              type: compType
            }
          };

          var item = App.GameComponent.create(obj);
          App.gameComponentsController.get('content').pushObject(item);

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

        if ($tgt.hasClass('btn-select')) {
          // image was selected from modal window
          var $item = $modal.find('.assets-list').find('.ui-selected');

          if (!$item.length && !_.isNull(App.selectedComponentController.get('content'))) {
            return false;
          }

          var img_type = $item.data('type'),
            sprite = $item.data('sprite'),
            file = $item.data('file'),
            ext = $item.data('ext');

          var selectedImageAsset = App.imageAssetsController.get('content').findProperty('file', file);

          App.selectedComponentController.setPath('content.properties.sprite', sprite);
          App.selectedComponentController.setPath('content.properties.file', file);
          App.selectedComponentController.setPath('content.properties.ext', ext);

          var selectedComponent = App.selectedComponentController.get('content');

          var slugName = App.selectedComponentController.getPath('content.slug');

          var src = selectedImageAsset.get('apiPath');
          $('.item-chest').find("[data-slug='" + slugName + "']").attr('src', src);
          $('.canvas-pane').find("[data-slug='" + slugName + "']").attr('src', src);

          App.dataSource.saveGame(0, function(data) {
            console.log('save (add sprite)');
          });

          App.dataSource.updateGameComponent(slugName, selectedComponent, function(data) {
            console.log('emit (update game component)');
          });

          $modal.modal('hide');
          $modal.find('.ui-selected').removeClass('.ui-selected');

        } else if ($tgt.hasClass('btn-close')) {
          $modal.modal('hide');
          $modal.find('.ui-selected').removeClass('.ui-selected');
        }

        closePotionForm();
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
     **************************/

    App.selectedComponentController = Em.Object.create({
      content: null,
      gameComponentsBinding: 'App.gameComponentsController.content',

      contentObserver: function() {
        var selected = this.get('content');
        var gameItems = $('.item-chest').find('li');

        App.gameComponentsController.refreshCollisionTargets();
        App.gameComponentsController.refreshScoreCollisionTargets();

        _.each(gameItems, function(item) {
          var view = Em.View.views[$(item).attr('id')];
          var component = view.get('item');
          view.set('uiSelected', component === selected ? true : false);
        });

        var gameComponents = this.get('gameComponents');
        var items = gameComponents;

        _.each(items, function(item) {
          item.set('active', false);
        });

        selected.set('active', true);
        console.log('CONTENT');
        console.log(selected.get('properties'));
      }.observes('content')

    });

    /**************************
     * Potions
     **************************/

    App.potionsController = Em.ArrayController.create({
      content: [],
      hideJumpHeight: false, // whether to show or hide jump height

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
      busyObserver: function() {
        return Em.run.next(function() {
          $('.potion-icon').draggable('destroy');
          $('.potion-icon.active').draggable({
            helper: 'clone',
            cursorAt: { left: 10, top: 5 }
          });
        });
      }.observes('content.@each.busy')
    });

    App.Potion = Em.Object.extend({
      title: null,
      properties: null,
      potionIcon: true,
      busy: false,
      active: Em.computed(function() {
        var busy = this.get('busy');
        return !busy;
      }).property('busy'),
      icon: function() {
        var icon = this.get('title');
        return '/editor/static/img/icons/icon-' + icon + '.png';
      }.property('title')
    });

    App.PotionView = Em.View.extend({});

    /**************************
     * Magos
     **************************/

    App.Magos = Em.Object.extend({
      user: null,
      magos: 'magos', // null,
      potions: [],
      userActiveBinding: 'App.usersController.user',
      activeUser: function() {
        var user = this.get('user');
        var active = this.get('userActive');
        return Em.isEqual(user, active);
      }.property('user', 'userActive'),
      magosObserver: function() {
        console.log('magos changes');
        // update magoses to other instances
        var user = this.get('user'),
          magos = this.get('magos');
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
      },
      populate: function() {
        var controller = this;
        var user = App.usersController.get('user');
        var userMagos = 'magos';
        var userMagosObj = controller.get('content').findProperty('magos', userMagos);
        userMagosObj.set('user', user);
      },
      selectedObserver: function() {
        var controller = this;
        var magos = controller.get('selected');
      }.observes('selected')
    });

    App.MagosView = Em.View.extend({
      contentBinding: 'App.magosesController.content',
      classNames: ['sidebar', 'sortable-sidearea'],
    });

    /* VIEW FOR POTION PROPERTY FORMS */
    App.MagosComponentPropertyView = Em.View.extend({
      contentBinding: 'App.potionsController.content',
      controlsBinding: 'App.potionsController.controls',
      gravitationBinding: 'App.potionsController.gravitation',
      collisionBinding: 'App.potionsController.collision',
      compTypesBinding: 'App.potionsController.compTypes',
      scoreBinding: 'App.potionsController.score',
      // field bindings
      controlsMethodBinding: 'App.potionsController.controls.method', // controls
      speedBinding: 'App.potionsController.controls.speed', // controls
      jumpHeightBinding: 'App.potionsController.controls.jumpHeight', // controls
      gridBinding: 'App.potionsController.controls.grid', // controls

      collisionEventBinding: 'App.potionsController.collisions.event', // collision
      collisionTargetBinding: 'collision.target', // collision
      collisionScoreBinding: 'collision.score', // collision

      strengthBinding: 'gravitation.strength', // gravitation
      compTypeBinding: 'compTypes.title', // compType

      // selection bindings
      selectedCollisionTarget: null,
      selectedCollisionEvent: null,
      selectedScoreScore: null,

      cancelFormSubmit: function(event) {
        event.preventDefault();
        closePotionForm();
      },

      submitScoresProperties: function(event) {
        event.preventDefault();

        var col_target = App.gameComponentsController.get('selectedScoreTarget');
        var col_event = App.gameComponentsController.get('selectedScoreEvent');
        var col_score = this.get('selectedScoreScore');
        var targetSlug = (col_target) ? col_target.slug : null;
        var collisions = App.selectedComponentController.getPath('content.properties.collisions');

        _.each(collisions, function(col, index) {
          if (col.target.slug == targetSlug && col.event.event == col_event.event) {

            col.score = col_score;
            console.log('SCORE ADDED FOR COLLISION!');

            App.selectedComponentController.setPath('content.properties.collisions', collisions);

            var selectedComponent = App.selectedComponentController.get('content');
            var slugName = App.selectedComponentController.getPath('content.slug');
            // save game
            App.dataSource.saveGame(0, function(data) {
              console.log('save (edit score properties)');
            });
            // inform others of property change
            App.dataSource.updateGameComponent(slugName, selectedComponent, function(data) {
              console.log('emit (update game component score properties)');
            });

          } // if
        });

      },

      submitCollisionProperties: function(event) {
        event.preventDefault();
        var col_target = App.gameComponentsController.get('selectedCollisionTarget');

        console.log('submitCollisionProperties');

        var col_event = App.gameComponentsController.get('selectedCollisionEvent');
        var targetSlug = (col_target) ? col_target.slug : null;
        var simple_target = {
          'slug': col_target.slug,
          'title': col_target.title
        };
        var collision = App.Collision.create({
          'target': simple_target,
          'event': col_event,
          'score': null
        });
        if (App.selectedComponentController.getPath('content.properties.collisions') === undefined) {
          // no existing collisions
          App.selectedComponentController.setPath('content.properties.collisions', [collision]);
        } else {
          // we can have multiple collisions per one component
          App.selectedComponentController.getPath('content.properties.collisions').pushObject(collision);
        }
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
        // get values from the form
        var gravitationStrengthVal = $('.gravitationStrengthVal');
        var strength = gravitationStrengthVal.val();
        var gravitation = {
          'strength': strength
        };

        console.log('submitGravitationProperties');

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

      submitCompTypeProperties: function(event) {
        event.preventDefault();
        var typeTitle = this.getPath('compType.title');

        console.log('submtiCOmpTYpeProerpteis');

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

      submitControlsProperties: function(event) {
        event.preventDefault();
        var controlsMethod = this.getPath('controlsMethod.method');
        var speed = this.getPath('speed');
        var jumpHeight = this.getPath('jumpHeight');
        //var grid = this.getPath('grid');
        // get values from the form
        var controls = {
          'method': controlsMethod,
          'speed': speed,
          'jumpHeight': jumpHeight
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

      },

      controlsMethodObserver: function() {
        // hide jump height for fourway and multiway
        if (this.getPath('controlsMethod.method') != 'twoway') {
          App.potionsController.set('hideJumpHeight', true);
        } else {
          App.potionsController.set('hideJumpHeight', false);
          //this.set
        }
      }.observes('controlsMethod'),


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

    App.PotionsControlsView = Ember.View.extend({
      contentBinding: 'App.selectedComponentController.content',
      methodBinding: 'App.selectedComponentController.content.properties.controls.method',

      save: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.set('method', this.get('textField').getCurrentValue());
      }
    });

    var infobox = App.InfoBoxView = Em.View.create({
      templateName: 'infobox-view'
    });

    App.InfoBoxControlsView = Em.View.extend({
      contentBinding: 'App.selectedComponentController.content.properties.controls',
      showJumpHeight: false,
      contentObserver: function() {
        var controlsMethod = this.getPath('content.properties.controls.method');
        if (!_.isUndefined(controlsMethod) && controlsMethod == 'twoway') {
          this.set('showJumpHeight', true);
        } else {
          this.set('showJumpHeight', false);
        }
        var showJumpHeight = this.get('showJumpHeight');
      }.observes('content')

    });

    App.InfoBoxCollisionView = Em.View.extend({
      contentBinding: 'App.selectedComponentController.content.properties.collisions',
      removeCollision: function(evt) {
        var collision = evt.context;
        App.selectedComponentController.getPath('content.properties.collisions').removeObject(collision);
        var selectedComponent = App.selectedComponentController.get('content');
        var slugName = App.selectedComponentController.getPath('content.slug');
        // force game data save
        App.dataSource.saveGame(0, function(data) {
          console.log('save (remove collision)');
        });
        // inform others of property change
        App.dataSource.updateGameComponent(slugName, selectedComponent, function(data) {
          console.log('emit (update game component properties)');
        });
      }
    });
    App.InfoBoxGravitationView = Em.View.extend({
      contentBinding: 'App.selectedComponentController.content.properties.gravitation',
      removeGravitation: function(evt) {
        App.selectedComponentController.setPath('content.properties.gravitation', null);
        var selectedComponent = App.selectedComponentController.get('content');
        var slugName = App.selectedComponentController.getPath('content.slug');
        // force game data save
        App.dataSource.saveGame(0, function(data) {
          console.log('save (remove gravitation)');
        });
        // inform others of property change
        App.dataSource.updateGameComponent(slugName, selectedComponent, function(data) {
          console.log('emit (update game component properties)');
        });
      }
    });
    App.InfoBoxScoreView = Em.View.extend({
      collisionsBinding: 'App.selectedComponentController.content.properties.collisions',
      collisionObserver: function() {
        this.rerender();
      }.observes('collisions.@each')
    });
    App.InfoBoxSpriteView = Em.View.extend();
    App.InfoBoxAnimationView = Em.View.extend();
    App.InfoBoxTypeView = Em.View.extend();

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
        }), App.ComponentType.create({
          'name': 'Decoration'
        })
      ]
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

        if (hours < 10) hours = '0' + hours;
        if (minutes < 10) minutes = '0' + minutes;
        if (seconds < 10) seconds = '0' + seconds;

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
        })
      ]
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

        if (!message.length) return;

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
    });

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
      // saveSceneComponentToCanvas: function(sceneComponent, sceneName, callback) {
      //   socket.emit('saveSceneComponentToCanvas', sceneComponent, sceneName, function(data) {
      //     callback(data);
      //   });
      // },

      // remove scene component from game canvas
      // removeSceneComponentFromCanvas: function(sceneComponent, sceneName, callback) {
      //   socket.emit('removeSceneComponentFromCanvas', sceneComponent, sceneName, function(data) {
      //     callback(data);
      //   });
      // },

      addUser: function(user, callback) {
        socket.emit('addUser', user, function(data) {
          callback(data);
        });
      },

      // userChangedMagos: function(user, magos, callback) {
      //   socket.emit('userChangedMagos', user, magos, function(data) {
      //     callback(data);
      //   });
      // },

      potionBusy: function(potion, busy, callback) {
        socket.emit('potionBusy', potion, busy, function(data) {
          callback(potion, busy);
        });
      },

      // canUserChangeMagos: function(gameSlug, user, magos, callback) {
      //   socket.emit('canUserChangeMagos', gameSlug, user, magos, function(data) {
      //     callback(data);
      //   });
      // },

      saveGame: function(mode, callback) {
        var game = App.gameController.get('content');
        socket.emit('saveGame', mode, game, function(data) {
          callback(data);
        });
      },
      getSkillsets: function(callback) {
        socket.emit('getSkillsets', '', function(data) {
          var components = [],
            allPotions = [],
            potions = [];

          _.each(data, function(obj) {
            _.each(obj.potions, function(potion) { // rules|
              if (/^(score|controls|collision|gravitation|type|image)$/.test(potion.title)) {
                var pot = App.Potion.create({
                  'title': potion.title,
                  'properties': potion.properties
                });

                App.potionsController.get('content').pushObject(pot);
                allPotions.push(pot);
                potions.push(pot);
              }
            });

            components.push(
              App.Magos.create({
                "magos": obj.magos,
                "potions": potions
              }));
          });

          callback(components);
        });
      },
      getSceneComponents: function(callback) {
        callback([]);
        // socket.emit('getSceneComponents', '', function(data) {
        //   var components = [];

        //   _.each(data, function(obj) {
        //     components.push(
        //     App.SceneComponent.create({
        //       "slug": obj.slug,
        //       "title": obj.title,
        //       "sprite": obj.sprite,
        //       "scenes": obj.scenes,
        //       "potions": obj.potions
        //     }));
        //   });

        //   callback(components);
        // });
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

        if (type === 'background') {
          //img_type = 2;
          width = canvas.blockSize * canvas.columns;
          height = canvas.blockSize * canvas.rows;
        } else {
          width = canvas.blockSize;
          height = canvas.blockSize;
        }

        socket.emit('getImageAssets', filter, width, height, limit, offset, function(data) {
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
          if (data) {

            var game = App.Game.create();
            // debug
            //console.log(data);

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
                'magos': 'magos' // author.magos,
              });
              //
              authors.push(obj);
            });
            game.set('authors', authors);

            var revision = data.revision;

            if (_.isString(revision)) {
              revision = JSON.parse(revision);
            }

            var gameComponentsA = [];
            _.each(revision.gameComponents, function(component) {
              // console.log(component);
              // console.log(component.properties);
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
                // console.log(component.oid);
                sceneArray.push(App.CanvasComponent.create({
                  slug: component.slug,
                  position: component.position,
                  oid: component.oid,
                  properties: component.properties
                }));
              });

              var gameArray = [];
              _.each(scene.gameComponents, function(component) {
                gameArray.push(App.CanvasComponent.create({
                  slug: component.slug,
                  position: component.position,
                  oid: component.oid
                }));
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

            var sprites = [];

            var rev = App.Revision.create({
              'canvas': revision.canvas,
              'scenes': scenes,
              'sprites': sprites,
              'gameComponents': gameComponentsA
            });

            game.set('revision', rev);

            callback(game);

          } else {
            // game by that slug was not found
            console.log('Game not found.');
            window.location.replace("http://192.168.43.232/");
          }
        });
      }
    });

    App.dataSource = App.DataSource.create({
      store: App.store
    });
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
      App.gameController.populate();
    });

    socket.on('foobar', function(user) {
      console.log(user);
      App.setFlash('notice', 'User ' + user.userName + ' requests Magos change from ' + user.magos);

    });

    socket.on('potionBusy', function(potion, busy) {
      if (_.isString(potion) && _.isBoolean(busy)) {
        var pot = App.potionsController.find(function(p) {
          return p.title == potion;
        });
        pot.set('busy', busy);
      }
    });

    // receive shout
    socket.on('shout', function(shout) {
      if (_.isObject(shout)) {
        App.shoutsController.get('content').pushObject(App.Shout.create(shout));
      }
    });

    // add new game component
    socket.on('addGameComponent', function(item) {
      console.log('>>> SOCKET REQUEST: addGameComponent');
      if (_.isObject(item)) {
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

    socket.on('addUser', function(user) {
      // add user if same user does not already exist
      console.log('>>> SOCKET REQUEST: addUser');
      console.log(user);
      if (_.isObject(user)) {
        if (!App.usersController.get('content').findProperty('userName', user.userName)) {
          App.usersController.get('content').pushObject(App.User.create(user));
        }
      }
    });

    socket.on('disconnectUser', function(data) {
      console.log('>>> SOCKET REQUEST: disconnectUser');
      App.usersController.removeItem('userName', data.userName);
    });

    socket.on('refreshRevision', function(game) {
      if (_.isObject(game)) {
        console.log('refeshRevision');
        console.log(game);
        console.log(game.revision);

        var revision = game.revision;

        if (_.isString(revision)) {
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

          var gameArray = [];
          _.each(scene.gameComponents, function(component) {
            gameArray.push(App.CanvasComponent.create({
              slug: component.slug,
              position: component.position,
              oid: component.oid
            }));
          });

          var obj = App.Scene.create({
            name: scene.name,
            sceneComponents: [],
            gameComponents: gameArray
          });
          scenes.push(obj);
        });

        var sprites = [];

        var rev = {
          'canvas': game.revision.canvas,
          'scenes': scenes,
          'sprites': game.sprites,
          'gameComponents': gameComponentsA
        };

        App.gameController.get('content').set('revision', App.Revision.create(rev));
        populateScenes(); // redraw game components
      }
    });

    /**************************
     * jQuery UI parts
     **************************/

    // show/hide grid button
    $(document).on('click tap', '.btn-grid', function(event) {
      event.preventDefault();
      var $tgt = $(event.target).closest('.btn');
      $('.canvas .canvas-table').toggleClass('gridless');
      $tgt.toggleClass('active');
    });

    // theme switcher
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

    // state switcher
    $(document).on('click tap', '.btn-group-state .btn', function(event) {
      event.preventDefault();
      var $tgt = $(event.target).closest('.btn');

      $tgt.siblings().removeClass("active");
      $tgt.addClass("active");

      var state = $tgt.data('state');
      var bool = state == 'public' ? 1 : 0;
      App.gameController.setPath('content.state', bool);
    });

    setTimeout(function() {
      var state = App.gameController.getPath('content.state');
      if (state) {
        $('.btn-group-state .btn:first').addClass('active');
      } else {
        $('.btn-group-state .btn:last').addClass('active');
      }
    }, 200);

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

      if (!$modal.hasClass('styled')) {
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

      var slug = location.pathname.split("/").pop();
      var frame = '<iframe id="preview" seamless src="/editor/play/' + slug + '"></iframe>';

      $modal.one('show', function() {
        $modal.find('.game-preview-view').empty().append(frame);
      });

      $modal.find('button').on('click tap', function(event) {
        $modal.modal('hide');
        $modal.find('.game-preview-view').empty();
      });

      $modal.modal();

    });

    $(document).on('click tap', '.btn-back-potion, .btn-reset-action', function(event) {
      event.preventDefault();
      closePotionForm();
    });

    function activateGravitationSlider() {
      var tooltip = $('.slider-tooltip');
      tooltip.hide();
      var gravitationStrengthVal = App.selectedComponentController.getPath('content.properties.gravitation.strength') ? App.selectedComponentController.getPath('content.properties.gravitation.strength') : 0.0;
      $("#gravitationStrength").slider({
        min: 0,
        max: 10,
        step: 1,
        value: parseFloat(gravitationStrengthVal) * 10,
        start: function(event, ui) {
          tooltip.fadeIn('fast');
        },
        slide: function(event, ui) {
          var strength = ui.value / 10;
          var value = $(this).slider('value');
          $('.gravitationStrengthVal').val(strength);
          tooltip.css('left', ui.value * 10 + '%').text(strength);
        },
        stop: function(event, ui) {
          tooltip.fadeOut('slow');
        },
      });
    }

    function refreshSidebar($sortableArea) {
      $sortableArea.disableSelection();
    }

    function bindClickToRemove(itemType) {
      var itemClass = (itemType == 'gameComponents') ? 'canvas-game-component' : 'canvas-scene-component';
      $(".canvas-pane").on('click tap', 'img.' + itemClass, function(event) {
        var $tgt = $(event.target),
          oid = $tgt.data('oid');
        var item = App.scenesController.getPath('selected.' + itemType).findProperty('oid', oid);
        console.log('REMOVABLE ITEM:');
        console.log(item);
        App.scenesController.getPath('selected.' + itemType).removeObject(item);
        $tgt.remove();

        App.dataSource.saveGame(0, function(data) {
          console.log('save (click)');
          // emit removal via socket
          var sceneName = App.scenesController.get('selected').get('name');
          // emit game component removal
          App.dataSource.removeGameComponentFromCanvas(item, sceneName, function(data) {
            console.log('emit (remove game component from game canvas');
          });
        });
      });
    }

    function closePotionForm() {
      console.log('closePotionForm()');
      // close potion form
      var $magos = $('.selected-magos');
      if ($magos.is(':hidden')) {
        $magos.parent().siblings('.magos-potion-form:visible').hide('slide', {
          direction: 'left'
        }, 250, function() {
          $magos.show('slide', {
            direction: 'right'
          }, 250);
        });
      }

      // set potion free
      var busy = false;
      var potion = App.usersController.getPath('content.potion');
      App.dataSource.potionBusy(potion, busy, function(data) {
        var potion = App.potionsController.find(function(potion) {
          return potion.get('title') == data;
        });

        if (_.isObject(potion)) {
          potion.set('busy', busy);
          App.usersController.setPath('content.potion', potion.title);
        }
      });

    }

    function populateScenes() {
      $('.canvas-cell').empty();
      // add items to canvas
      var scenes = App.gameController.getPath('content.revision.scenes');

      _.each(scenes, function(scene) {
        var gameComponents = scene.get('gameComponents'),
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
          if (App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug)) {
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
      }); // each scenes

      // bind events
      bindClickToRemove('gameComponents');
    }

    function createGameTableCanvases() {

      var canvas = null;
      var interval = setInterval(function() {
        var canvas = App.gameController.getPath('content.revision.canvas');
        if (canvas !== null) {
          // stop loop
          clearInterval(interval);
          // vars
          var $table = $('.canvas-game'),
            $panes = $('.canvas-pane'),
            rows = canvas.rows,
            columns = canvas.columns,
            sizeClass = 'size-' + canvas.blockSize;

          var cells = '';

          for (var i = 0; i < rows; i = i + 1) {
            cells += '<tr>';
            for (var j = 0; j < columns; j = j + 1) {
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
          //$('.scene-chest').addClass(sizeClass);
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

      if (!$tgt.is(":empty")) {
        return false;
      }
      var slug = gameComponent.slug,
        oid = gameComponent.oid,
        sprite = null,
        file = null,
        ext = null,
        apiPath = null;

      if (App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug)) {
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
          if (!$tgt.is(":empty")) {
            return false;
          }

          var $draggable = $(ui.draggable),
            $img = '';

          var slug = $draggable.data('slug');

          if ($draggable.hasClass('game-item')) {
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
          $img.attr({
            'data-oid': oid
          });
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

          if ($draggable.hasClass('cloned')) {
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
          $img.attr({
            'id': oid
          });

          //console.log(oid);
          var obj = {
            oid: oid,
            slug: slug,
            position: {
              left: pos_left,
              top: pos_top
            }
          };

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

    $('.modal').on('hidden.bs.modal', function(e) {
      closePotionForm();
    });

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

    $(document).on('click tap', '.btn-group-help .btn', function(event) {
      event.preventDefault();
      var $tgt = $(event.target).closest('.btn');
      $tgt.toggleClass('active');

      $('body').toggleClass('help');

      $('body').popover({
        selector: '.help .help-popover',
        'placement': 'bottom',
        'delay': {
          show: 500,
          hide: 100
        }
      });

      // run on exit
      $(window).bind('unload', function(event) {
        // make potion free to use
        var potion = App.usersController.getPath('content.potion');
        if (_.isString(potion)) {
          App.dataSource.potionBusy(potion, false, function(data) {});
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
    };

  }(window.App = window.App || Em.Application.create(), jQuery, window.Em));

});