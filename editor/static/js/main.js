/* Magos Editor */

// @codekit-prepend "require.js"
// @codekit-prepend "vendor/jquery.min.js"
// @codekit-prepend "vendor/jquery-ui.min.js"
// @codekit-prepend "vendor/bootstrap.min.js"
// @codekit-prepend "vendor/ember.js"
// @codekit-prepend "plugins.js"
(function(App, $, undefined) {

  // "use strict";
  // Em.LOG_BINDINGS = true;
  // Em.VIEW_PRESERVES_CONTEXT = true;
  /**************************
   * NumberField, ColorField
   **************************/

  App.NumberField = Ember.TextField.extend({
    attributeBindings: ['min', 'max'],
    type: 'number'
  });

  App.ColorField = Ember.TextField.extend({
    type: 'color'
  });

  /**************************
   * User
   **************************/

  App.Author = Em.Object.extend({
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
    user: null
  });

  App.usersController.get('content').pushObject(
  App.Author.create({
    userName: 'matti.vanhanen',
    firstName: 'Matti',
    lastName: 'Vanhanen',
    magos: 'principes',
    role: 'student'
  }));

  // TODO
  var user = App.usersController.get('content').findProperty('userName', 'matti.vanhanen');
  App.usersController.set('user', user);

  /**************************
   * Game
   **************************/

  App.Game = Em.Object.extend({
    title: 'Magos',
    slug: null,
    type: null,
    state: 0,
    cloned: 0,
    canvas: null,
    description: null,
    authors: [],
    revision: null,
    href: null
  });

  // replace this Object with ObjectProxy in 1.0
  App.gameController = Em.Object.create({
    content: null,
    populate: function() {
      var controller = this;

      App.dataSource.joinGame(function(data) {
        // set content
        controller.set('content', data);
      });
    }
    /*
    ,
    titleObserver: function() {
      App.dataSource.saveGame(0, function(data) {
        console.log('save (gameController)');
      });
    }.observes('content.title'),
    stateObserver: function() {
      App.dataSource.saveGame(0, function(data) {
        console.log('save (gameController)');
      });
    }.observes('content.state'),
    canvasObserver: function() {
      App.dataSource.saveGame(0, function(data) {
        console.log('save (gameController)');
      });
    }.observes('content.canvas'),
    descriptionObserver: function() {
      App.dataSource.saveGame(0, function(data) {
        console.log('save (gameController)');
      });
    }.observes('content.description')
    */
  });

  /**************************
   * Revision
   **************************/

  App.Revision = Em.Object.extend({
    scenes: [],
    audios: [],
    sprites: [],
    gameComponents: []
  });

  App.revisionController = Em.Object.create({
    contentBinding: 'App.gameController.content.revision'
    /*
    ,
    audiosObserver: function() {
      App.dataSource.saveGame(0, function(data) {
        console.log('save (revisionController)');
      });
    }.observes('content.audios.@each'),
    spritesObserver: function() {
      App.dataSource.saveGame(0, function(data) {
        console.log('save (revisionController)');
      });
    }.observes('content.sprites.@each'),
    scenesObserver: function() {
      App.dataSource.saveGame(0, function(data) {
        console.log('save (revisionController)');
      });
    }.observes('content.scenes.@each'),
    gameComponentsObserver: function() {
      App.dataSource.saveGame(0, function(data) {
        console.log('save (revisionController)');
      });
    }.observes('content.gameComponents.@each')
    */
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

      _.each(items, function(item) {
        item.set('active', false);
      });

      if (!_.isNull(selected)) selected.set('active', true);

      if (sceneName !== 'intro' && sceneName !== 'outro') {
        $('body').addClass('game-scene');
      } else {
        $('body').removeClass('game-scene');
      }

      if (this.get('firstRun') < 0) {
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
    scenesBinding: Ember.Binding.oneWay('App.scenesController.content'),
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

  App.SelectSceneView = Em.View.extend({
    contentBinding: 'App.scenesController.content',
    classNames: ['btn-group', 'btn-group-scene'],
    alwaysTrue: true,
    click: function(event) {
      var $tgt = $(event.target);

      var view = Ember.View.views[$tgt.parent().attr('id')];
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
   * SceneComponent
   **************************/

  App.SceneComponent = Em.Object.extend({
    title: null,
    slug: null,
    sprite: null,
    scenes: [],
    potions: null,
    active: false,
    icon: function() {
      return '../static/img/components/' + this.get('slug') + '.png';
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

        if (str.match(reg)) array.push(component);
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
/*
      $li.find('> img').draggable({
        helper: "clone",
        snap: ".canvas-cell:empty",
        snapMode: "inner",
        start: function() {
          var view = Ember.View.views[$(this).parent().attr('id')];

          var selected = view.get('item');
          // set selected component
          App.selectedComponentController.set('content', selected);
        }
      });
*/
      this.$("> img").draggable({
        helper: "clone",
        //snap: ".canvas-cell:empty",
        // grid: [32, 32],
        snapMode: "inner",
        start: function() {
          var view = Ember.View.views[$(this).parent().attr('id')];

          var selected = view.get('item');
          // set selected component
          App.selectedComponentController.set('content', selected);
        }
        /*
        helper: function(event, ui) {
          var slug = $(this).data('slug'),
            $clone = null;

          /* TODO show elements as they are on canvas and not just icon
          if(slug === 'play') {
            $clone = $(this).clone().attr('src', '/static/img/start-button.png').css({ 'width': '187px', 'height': '59px' });
          } else {
            $clone = $(this)
          }

          return $clone;
          * /
          return $(this);
        }
        */
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
    eventManager: Ember.Object.create({
      click: function(event, view) {
        var selected = view.get('item');
        // set selected component
        App.selectedComponentController.set('content', selected);
        // if user busy, set not busy
        if (App.usersController.getPath('user.busy')) {
          App.usersController.setPath('user.busy', false);
        }

        // if potion form open
        var $magos = $('.selected-magos');
        if ($magos.is(':hidden')) {
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
    properties: null,
    active: false,
    icon: function() {
      return '../static/game/sprites/' + this.getPath('properties.sprite') + '.png';
    }.property('properties'),
    snapToGrid: function() {
      var snap = this.getPath('properties.controls.grid');

      if (snap === false) {
        return "No";
      } else if (snap === true) {
        return "Yes";
      } else {
        return snap;
      }

    }.property('properties'),
    directionStr: function() {
      var dir = this.getPath('properties.gravitation.direction');

      if (dir === false) {
        return "Inverted";
      } else if (dir === true) {
        return "Normal";
      } else {
        return dir;
      }

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

    }.property('properties')
  });

  App.gameComponentsController = Em.ArrayController.create({
    contentBinding: 'App.gameController.content.revision.gameComponents',
    // 'App.scenesController.selected.gameComponents',
    removeItem: function(propName, value) {
      var obj = this.findProperty(propName, value);
      this.removeObject(obj);
    }
  });

  App.GameComponentsView = Em.View.extend({
    classNameBindings: ['uiSelected'],
    uiSelected: false,
    alwaysTrue: true,
    sceneBinding: Ember.Binding.oneWay('App.scenesController.selected.name'),
    contentBinding: 'App.gameComponentsController.content',
    sceneObserver: function() {

      var scene = this.get('scene');

      // if (scene !== 'intro' && scene !== 'outro') {
      var $chest = $('.game-container .item-chest');

      $chest.find('li').each(function(index) {
        $li = $(this);

        if (!$li.hasClass('add-item') && !$li.hasClass('remove-item')) {

          // ---
          $li.find('> img').draggable({
            helper: "clone",
            snap: ".canvas-cell:empty",
            snapMode: "inner",
            start: function() {
              var view = Ember.View.views[$(this).parent().attr('id')];

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
          var view = Ember.View.views[$(this).parent().attr('id')];

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
    eventManager: Ember.Object.create({
      click: function(event, view) {
        var selected = view.get('item');
        // set selected component
        App.selectedComponentController.set('content', selected);
        // if user busy, set not busy
        if (App.usersController.getPath('user.busy')) {
          App.usersController.setPath('user.busy', false);
        }

        // if potion form open
        var $magos = $('.selected-magos');
        if ($magos.is(':hidden')) {
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

          if ($draggable.hasClass("canvas-item")) {

            $draggable.remove();

          } else {

            var selectedView = Ember.View.views[$draggable.parent().attr('id')];
            var selectedItem = selectedView.get('item');
            var slug = selectedItem.get('slug');

            // TODO check that there is no istances of item in canvases
            App.gameComponentsController.removeItem('slug', slug);
          }

        }
      });
    }
  });

  /**************************
   * Dialog Add Component
   **************************/

  App.AddItemForm = Em.View.extend({
    tagName: 'form',
    classNames: ['vertical-form'],
    itemTitle: null,
    submit: function(event) {
      // TODO enter ei toimi
      event.preventDefault();
      //
      var itemTitle = this.get('itemTitle');
      //
      if (!itemTitle.length) return;

      var safeSlug = createSlug(itemTitle);
      var obj = {
        title: itemTitle,
        slug: safeSlug,
        properties: {
          sprite: 'empty'
        }
      };

      var item = App.GameComponent.create(obj);

      App.gameComponentsController.get('content').pushObject(item);

      // App.selectedComponentController.set('content', item);
      $('#dialog-new-item').modal('hide');

      // TODO send to node
      this.set('itemTitle', null);

    }
  });

  /**************************
   * Selected Component
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

      console.log(JSON.stringify(this.getPath('content')));

      // loop elements and remove ui-selected class
      _.each(sceneItems, function(item) {
        var view = Ember.View.views[$(item).attr('id')];
        var component = view.get('item');

        view.set('uiSelected', component === selected ? true : false);
      });

      _.each(gameItems, function(item) {
        var view = Ember.View.views[$(item).attr('id')];
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
      //console.log(this.getPath('content.properties.sprite'))
    }.observes('content')
  });

  /**************************
   * Potion
   **************************/

  App.Potion = Em.Object.extend({
    magos: null,
    potions: []
  });

  /**************************
   * Potions Controller
   **************************/

  App.potionsController = Em.ArrayController.create({
    content: []
  });

  /**************************
   * Potions Views
   **************************/

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
      return '/static/img/icons/' + magos + '.png';
    }.property('magos'),
    activeUser: function() {
      var user = this.get('user');
      var active = this.get('userActive');

      return Em.isEqual(user, active);
    }.property('user', 'userActive')
  });

  /**************************
   * Potion
   **************************/

  App.Potion = Em.Object.extend({
    title: null,
    properties: null,
    icon: function() {
      var icon = this.get('title');
      return '/static/img/icons/icon-' + icon + '.png';
    }.property('title')
  });

  App.PotionView = Em.View.extend({
    content: null,
    template: Ember.Handlebars.compile('<img {{bindAttr src="content.icon"}} {{bindAttr data-potion="content.title"}} {{bindAttr alt="title"}} class="potion-icon inner-shadow draggable-item" />')
  });

  /**************************
   * Magos Controller
   **************************/

  App.magosesController = Em.ArrayController.create({
    content: [],
    selectedBinding: 'App.usersController.user.magos',
    populate: function() {
      var controller = this;

      App.dataSource.getSkillsets(function(data) {
        // set content
        controller.set('content', data);
        // set selected
        var user = App.usersController.get('user');
        // get role which is marked as user's role
        var magos = controller.get('content').findProperty('magos', user.get('magos'));

        if (user.get('magos') === 'principes') {
          $('.chest-container').addClass('principes-magos');
        }

        if (_.isNull(magos.get('user'))) {
          // set user in its old role
          magos.set('user', user);
        } else {
          // if user's old role is taken take the first free one
          var freeMagos = controller.get('content').findProperty('user', null);
          if (_.isObject(freeMagos)) {
            freeMagos.set('user', user);
          } else {
            alert('there is no free roles. this should have never happened!');
          }
        }
      });
    },
    selectedObserver: function() {
      var magos = this.get('selected');
      if (magos !== 'principes') {
        $('.chest-container').removeClass('principes-magos');
      } else {
        $('.chest-container').addClass('principes-magos');
      }
    }.observes('selected')
  });
  /*
$(".potion-icon").draggable({
  helper: "clone"
});
*/
  App.MagosView = Em.View.extend({
    contentBinding: 'App.magosesController.content',
    classNames: ['sidebar', 'sortable-sidearea'],
    didInsertElement: function() {
      var $sortableArea = this.$();

      console.log('MagosView::didInsertElement');

      Em.run.next(function() {
        //
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

      });
    },
    busyObserver: function() { // TODO
      console.log("MagosView::Observer");

      return Em.run.next(function() {
        return Em.run.next(function() {
          $('.busy-icon').tooltip({
            delay: {
              show: 500,
              hide: 100
            },
            placement: 'left'
          });

          $('.potion-icon').draggable('destroy');
          $('.selected-magos .potion-icon').draggable({
            helper: 'clone'
          });
        });
      });

    }.observes('content.@each.busy')
  })

  App.MagosComponentPropertyView = Em.View.extend({
    removeComponentProperty: function(event) {
      event.preventDefault();

      var $tgt = $(event.target);
      var $view = $tgt.closest('.ember-view');
      var view = Ember.View.views[$view.attr('id')];

      var content = view.getPath('content');

      delete content['score'];

      console.log(score);
      console.log('App.MagosComponentPropertyView')
    }
  });

  /**************************
   * InfoBox Views
   **************************/

  /*
Em.ContainerView.create({
  childViews: ['btnView'],
  btnView: Em.View.extend({
    templateName: '',
    contentBinding: 'App.scenesController.content'
  })
});
*/

  // TODO make these child views
  App.InfoBoxControlsView = Em.View.extend();
  App.InfoBoxCollisionView = Em.View.extend();
  App.InfoBoxGravitationView = Em.View.extend();
  App.InfoBoxScoreView = Em.View.extend();
  App.InfoBoxDialogView = Em.View.extend();
  App.InfoBoxTextView = Em.View.extend();
  App.InfoBoxSpriteView = Em.View.extend();
  App.InfoBoxAnimationView = Em.View.extend();
  App.InfoBoxAudioView = Em.View.extend();

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
      return '../static/img/flags/' + this.get('code') + '.png';
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
   * ShoutBox
   **************************/

  App.Shout = Ember.Object.extend({
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

  App.shoutsController = Ember.ArrayController.create({
    content: [
    App.Shout.create({ // initial content - welcome message
      'timestamp': Math.round((new Date()).getTime() / 1000),
      'firstName': 'Superioux',
      'magos': 'superioux',
      'message': 'Welcome to Magos'
    })]
  });

  App.ShoutsView = Ember.View.extend({
    tagName: 'table',
    contentBinding: Ember.Binding.oneWay('App.shoutsController.content')
  });

  App.ShoutForm = Em.View.extend({
    tagName: 'form',
    classNames: ['form-inline'],
    controller: null,
    textField: null,
    firstNameBinding: Ember.Binding.oneWay('App.usersController.user.firstName'),
    magosBinding: Ember.Binding.oneWay('App.usersController.user.magos'),
    slugBinding: Ember.Binding.oneWay('App.gameController.content.slug'),
    submit: function(event) {
      event.preventDefault();

      var message = this.getPath('textField.value');

      if (!message.length) return;

      var timestamp = Math.round((new Date()).getTime() / 1000); // to unix timestamp
      var shout = {
        'timestamp': timestamp,
        'firstName': this.firstName,
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

  /**************************
   * Views
   **************************/

  App.TitleView = Em.View.extend({
    tagName: 'a',
    classNames: ['brand'],
    attributeBindings: ['href'],
    titleBinding: Ember.Binding.oneWay('App.gameController.content.title'),
    hrefBinding: Ember.Binding.oneWay('App.gameController.content.href')
  });

  App.PublishedView = Em.View.extend({
    classNames: ['btn-group', 'btn-group-state'],
    classNameBindings: ['privateState', 'publicState'],
    stateBinding: Ember.Binding.oneWay('App.gameController.content.state'),
    alwaysTrue: true,
    privateState: false,
    publicState: true // TODO
  });

  /**************************
   * Data Source
   **************************/

  App.DataSource = Ember.Object.extend({

    shout: function(shout, callback) {
      socket.emit('shout', shout, function(data) {
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
        var components = [];

        _.each(data, function(obj) {

          var potions = [];
          _.each(obj.potions, function(potion) {
            var p = App.Potion.create({
              'title': potion.title,
              'properties': potion.properties
            });
            potions.push(p);
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
    joinGame: function(callback) {

      socket.emit('joinGame', slug, function(data) {
        var game = App.Game.create();

        game.set('title', data.title);
        game.set('slug', data.slug);
        game.set('type', data.type);
        game.set('state', data.state);
        game.set('cloned', data.cloned);
        game.set('canvas', data.canvas);

        game.set('href', window.location.href);

        var authors = [];
        _.each(data.authors, function(author) {
          //
          var obj = App.Author.create({
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
        console.log(data);
        var gameComponentsA = [];
        _.each(revision.gameComponents, function(component) {
          gameComponentsA.push(App.GameComponent.create({
            title: component.title,
            slug: component.slug,
            properties: component.properties
          }));
          // TODO component properties
        });

        var scenes = [];
        _.each(revision.scenes, function(scene) {

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
          //'authors': authors,
          'scenes': scenes,
          'audios': audios,
          'sprites': sprites,
          'gameComponents': gameComponentsA
        };

        game.set('revision', rev);

        callback(game);
      });
    }
  });

  App.dataSource = App.DataSource.create({
    store: App.store
  });

  /**************************
   * Data Store (tulossa 1.0 versioon, tätä ei käytetä vielä)
   **************************/

  App.Store = Ember.ArrayProxy.extend({});

  /**************************
   * Init Magos
   **************************/

  var pathname = window.location.pathname;
  var slug = pathname.replace(/^\/editor\//, '').replace(/\/$/, '');

  var address = 'http://' + window.location.hostname + '/editor';
  var socket = io.connect(address);
  console.log(address);
  socket.on('connecting', function() {
    console.log('websocket connecting (editor');
  });

  socket.on('connect_failed', function(reason) {
    console.error('unable to connect to server (editor)', reason);
  });

  socket.on('connect', function() {
    console.log('websocket connected (editor)');
  });

  socket.emit('shout', 'HUUUUUUTO!', function(data) {
    if (_.isObject(shout)) {
      App.shoutsController.get('content').pushObject(App.Shout.create(shout));
    }
  });

  // receive shout
  socket.on('shout', function(shout) {
    if (_.isObject(shout)) {
      App.shoutsController.get('content').pushObject(App.Shout.create(shout));
    }
  });

  App.languagesController.populate();

  App.sceneComponentsController.populate();

  App.gameController.populate();

  App.magosesController.populate();

  // (function init() {
  // })();
  /**************************
   * jQuery UI parts
   **************************/

  // $(".game-item").draggable({ helper: "clone" });
  // show/hide grid button TODO replace with ember object
  $(document).on('click tap', '.btn-grid', function(event) {
    event.preventDefault();
    $tgt = $(event.target).closest('.btn');
    $('.canvas .canvas-table').toggleClass('gridless');
    $tgt.toggleClass('active');
  });

  // theme switcher TODO replace with ember object
  $(document).on('click tap', '.btn-group-theme .btn', function(event) {
    event.preventDefault();
    $tgt = $(event.target).closest('.btn');

    $tgt.siblings().removeClass("active");
    $tgt.addClass("active");

    // TODO Update theme
    var theme = $tgt.data('theme');
    var href = "/static/css/" + theme + ".css";
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

    $modal = $('#dialog-preview');

    if (!$modal.hasClass('styled')) {
      // count & set dialog size
      var canvas = App.gameController.content.canvas,
        rows = canvas.rows,
        columns = canvas.columns,
        blockSize = canvas.blockSize;

      var dWidth = 15 + (blockSize * columns);
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
      win.postMessage(slug, window.location.origin);
    });

    $modal.find('button').on('click tap', function(event) {
      $modal.modal('hide');
    });

    $modal.modal();

  });

  $(document).on('click tap', '.btn-gameinfo', function(event) {
    event.preventDefault();

    $modal = $('#dialog-info');

    $modal.find('button').on('click tap', function(event) {
      $modal.modal('hide');
    });

    $modal.modal();
  });

  $(document).on('click tap', '.btn-back-potion', function(event) {
    event.preventDefault();

    // if user busy, set not busy
    if (App.usersController.getPath('user.busy')) {
      App.usersController.setPath('user.busy', false);
    }

    // if potion form open
    var $magos = $('.selected-magos');
    if ($magos.is(':hidden')) {
      $magos.siblings('.magos-potions').hide('slide', {
        direction: 'left'
      }, 250, function() {
        $magos.show('slide', {
          direction: 'right'
        }, 250);
      });
    }
  });

  // canvas

  function createGameTableCanvases() {

    var canvas = null;
    var interval = setInterval(function() {
      var canvas = App.gameController.getPath('content.canvas');
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
        $('.scene-chest').addClass(sizeClass)
        $('.item-chest').addClass(sizeClass);

        // add size class and dom nodes game canvas
        $table.addClass(sizeClass).append(cells);

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
              sprite = App.gameController.getPath('content.revision.gameComponents').findProperty('slug', slug).getPath('properties.sprite');

            var img = '<img src="../static/game/sprites/' + sprite + '.png" data-slug="' + slug + '" data-oid ="' + oid + '" class="canvas-item">';
            var $img = $(img);

            // remove when clicked - impl. draggable later
            $img.on('click tap', function(event) { // this is duplication - refactor
              var $tgt = $(event.target),
                oid = $tgt.data('oid');

              var item = App.scenesController.getPath('selected.gameComponents').findProperty('oid', oid);
              App.scenesController.getPath('selected.gameComponents').removeObject(item);

              $tgt.remove();

              App.dataSource.saveGame(0, function(data) {
                console.log('save (click)');
              });
            });

            $scene.find('tr:nth-child(' + row + ')').find('td:nth-child(' + column + ')').append($img);
          });

          _.each(sceneComponents, function(sceneComponent) {
            var top = sceneComponent.position.top,
              left = sceneComponent.position.left,
              slug = sceneComponent.slug,
              oid = sceneComponent.oid,
              properties = sceneComponent.properties;

            var img = '<img src="../static/img/components/' + slug + '.png" data-slug="' + slug + '" class="canvas-item" style="position:absolute;left:' + left + 'px;top:' + top + 'px;">';
            var $img = $(img);

            // remove when clicked - impl. draggable later
            $img.on('click tap', function(event) {
              var $tgt = $(event.target),
                slug = $tgt.data('slug');

              var item = App.scenesController.getPath('selected.sceneComponents').findProperty('slug', slug);
              App.scenesController.getPath('selected.sceneComponents').removeObject(item);

              $tgt.remove();

              App.dataSource.saveGame(0, function(data) {
                console.log('save (click)');
              });
            });


            $scene.append($img);
          });

        });

        // ---
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
    /*
    $('.canvas-pane').bind('resize', function(event) {
      var width = $(event.target).width();
      $(event.target).height(parseInt(width*ratio));
    });
    */
  }

  function initCanvasDroppable() {

    $(".canvas-cell").droppable({
      greedy: true,
      accept: ".game-item",
      activeClass: "canvas-cell-hover",
      hoverClass: "canvas-cell-active",
      drop: function(event, ui) {
        var $tgt = $(this);
        //
        if (!$tgt.is(":empty")) {
          return false;
        }

        var $draggable = $(ui.draggable),
          $img = '';

        var slug = $draggable.data('slug');

        if ($draggable.hasClass('game-item')) {
          $img = $draggable.clone().removeAttr('data-original-title rel alt class style').addClass('canvas-item');
        } else {
          $img = $draggable.removeAttr('data-original-title rel alt class style').addClass('canvas-item');
        }

        // remove when clicked - impl. draggable later
        $img.on('click tap', function(event) {
          var $tgt = $(event.target),
            oid = $tgt.data('oid');

          var item = App.scenesController.getPath('selected.gameComponents').findProperty('oid', oid);
          App.scenesController.getPath('selected.gameComponents').removeObject(item);

          $tgt.remove();

          App.dataSource.saveGame(0, function(data) {
            console.log('save (click)');
          });
        });

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

        $img.data('oid', oid);
        $tgt.append($img);

        App.dataSource.saveGame(0, function(data) {
          console.log('save (drop)');
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

        $tgt.append($img);

        // remove when clicked - impl. draggable later
        $img.on('click tap', function(event) {
          var $tgt = $(event.target),
            slug = $tgt.data('slug');

          var item = App.scenesController.getPath('selected.sceneComponents').findProperty('slug', slug);
          App.scenesController.getPath('selected.sceneComponents').removeObject(item);

          $tgt.remove();
        });

        var position = $img.position();
        var obj = {
          'slug': slug,
          position: {
            'left': Math.round(position.left),
            'top': Math.round(position.top)
          }
        };
        console.log(obj);

        App.scenesController.getPath('selected.sceneComponents').pushObject(obj);

        App.dataSource.saveGame(0, function(data) {
          console.log('save (drop)');
        });

      } // drop
    });

    // containment: ".canvas"
    /*     revert: function(valid) {
          if (!valid) $(this).remove();
        },
        revertDuration: 250, */

    //var selected = view.get('item');
    //console.log(view);
    /*{
        snap: ".canvas-pane",
        revert: function(valid) {
          if (!valid) $(this).remove();
        }
      });

 //     $tgt.append( $img );
      //} else {
      //  $img = $draggable.removeAttr('data-original-title rel alt class style').addClass('canvas-item');
      //}

      //var bgimg = $el.data('url');
      /*
      if(bgimg.length) {
        $(tgt).css({
          "background-image": 'url(' + bgimg + ')'
        });
      }
      */

    /*
  $(".canvas").droppable({
    greedy: false,
    accept: ".canvas-item",
    activeClass: "canvas-hover-remove",
    hoverClass: "canvas-active-remove",
    drop: function(event, ui) {
      var $tgt = $(this);
      var $draggable = $(ui.draggable);

      $draggable.remove();
    }
  });
*/
  } // /function
  // /canvas
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
    $tgt = $(event.target).closest('.btn');
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


}(window.App = window.App || Em.Application.create(), jQuery));
