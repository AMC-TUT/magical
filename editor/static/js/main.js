
/* Magos Editor */

(function(App, $, undefined){

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
* Author
**************************/

App.Author = Em.Object.extend({
  userName: null,
  firstName: null,
  lastName: null,
  magos: null,
  role: 'student'
});

/**************************
* User Controller
**************************/

App.userController = Em.Object.create({ // ObjectController
  content: App.Author.create({
    userName: 'matti.vanhanen',
    firstName: 'Matti',
    lastName: 'Vanhanen',
    magos: 'principes',
    role: 'student'
  })
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
      // console.log(data);
      // console.log(controller.get('content').get('title'));
    });
  },
  titleObserver: function() {
    //
  }.observes('title')
});

/**************************
* Revision
**************************/

App.Revision = Em.Object.extend({
  authors: [],
  scenes: [],
  audios: [],
  sprites: []
});

App.revisionController = Em.Object.create({
  contentBinding: 'App.gameController.content.revision',
  contentObserver: function() {
    // content changed
    console.log('contentObserver event');

  }.observes('content')
});

/**************************
* Scene
**************************/

App.Scene = Em.Object.extend({
  name: null,
  elements: [],
  active: false
});

App.scenesController = Em.ArrayController.create({
  contentBinding: 'App.revisionController.content.scenes',
  selectedBinding: 'App.revisionController.content.scenes.firstObject',
  selectedObserver: function() {
    var controller = this;

    var selected = controller.get('selected');
    var items = controller.get('content');

    _.each(items, function(item) {
      item.set('active', false);
    });

    if(!_.isNull(selected)) selected.set('active', true);

  }.observes('selected')
});

App.SelectSceneView = Em.View.extend({
  contentBinding: 'App.scenesController.content',
  classNames: ['btn-group', 'btn-group-scene'],
  alwaysTrue: true,
  click: function(event) {
    var $tgt = $(event.target);

    var view = Ember.View.views[ $tgt.parent().attr('id') ];
    var selected = view.get('item');
    // set selected component
    App.selectedComponentController.set('content', selected);

  }
});

App.SelectSceneBtn = Em.View.extend({
  classNames: ['btn', 'btn-primary'],
  classNameBindings: ['scene.active'],
  click: function(event) {
    //
    App.scenesController.set('selected', this.get('scene'));
  }
});

/**************************
* SceneComponent
**************************/

App.SceneComponent = Em.Object.extend({
  title: null,
  slug: null,
  scenes: [],
  potions: null,
  active: false,
  icon : function() {
    return '../static/img/components/' + this.get('slug') + '.png';
  }.property('slug'),
  potionsStr: function() {
    var potions = this.get('potions');
    var potionsStr = '';

    _.each(potions, function(potion) {
      potionsStr += 'p-'+potion+' ';
    });

    return potionsStr.trim();

  }.property('potions'),
  scenesStr: function() {
    var scenes = this.get('scenes');
    var scenesStr = '';

    _.each(scenes, function(scene) {
      scenesStr += 's-'+scene+' ';
    });

    return scenesStr.trim();

  }.property('scenes')
});

App.sceneComponentsController = Em.ArrayController.create({
  content: [],
  selectedSceneBinding: 'App.scenesController.selected.sceneComponents', // NOT IN USE
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
    var selectedSceneName =this.get('selectedSceneName');
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
    this.$('> img').tooltip({delay: { show: 500, hide: 100 }, placement: 'top'});

    this.$("> img").draggable({
      helper: "clone",
      snap: ".canvas-cell:empty",
      snapMode: "inner",
      start: function() {
        var view = Ember.View.views[ $(this).parent().attr('id') ];

        var selected = view.get('item');
        // set selected component
        App.selectedComponentController.set('content', selected);
      }
    });
  },
  click: function(event) {
    var selected = this.get('item');
    // set selected component
    App.selectedComponentController.set('content', selected);
  }
});

/**************************
* GameComponent
**************************/

App.GameComponent = Em.Object.extend({
  title: null,
  slug: null,
  properties: null,
  active: false,
  icon : function() {
    return '../static/game/sprites/' + this.getPath('properties.sprite') + '.png';
  }.property('properties'),
  snapToGrid: function() {
    var snap = this.getPath('properties.controls.grid');

    if(snap === false) {
      return "No";
    } else if(snap === true) {
      return "Yes";
    } else {
      return snap;
    }

  }.property('properties'),
  directionStr: function() {
    var dir = this.getPath('properties.gravitation.direction');

    if(dir === false) {
      return "Inverted";
    } else if(dir === true) {
      return "Normal";
    } else {
      return dir;
    }

  }.property('properties')
});

App.gameComponentsController = Em.ArrayController.create({
  contentBinding: 'App.scenesController.selected.gameComponents',
  removeItem: function(propName, value){
    var obj = this.findProperty(propName, value);
    this.removeObject(obj);
  }
});

App.GameComponentsView = Em.View.extend({
  classNameBindings: ['uiSelected'],
  uiSelected: false,
  alwaysTrue: true,
  contentBinding: 'App.gameComponentsController.content',
  didInsertElement: function() {
    this.$('> img').tooltip({delay: { show: 500, hide: 100 }, placement: "top"});

    this.$("> img").draggable({
      helper: "clone",
      snap: ".canvas-cell:empty",
      snapMode: "inner",
      start: function() {
        var view = Ember.View.views[ $(this).parent().attr('id') ];

        var selected = view.get('item');
        // set selected component
        App.selectedComponentController.set('content', selected);
      }
    });
  },
  eventManager: Ember.Object.create({
    click: function(event, view) {
      var selected = view.get('item');
      // set selected component
      App.selectedComponentController.set('content', selected);
    }
  })
});

App.AddGameComponentView = Em.View.extend({
  click: function(event) {
    // open bootstrap dialog
    $('#dialog-new-item').modal().on('show', function () {
      $(this).find('input').val('');
      $(this).find('.control-group').removeClass('error');
    })
  },
  didInsertElement: function() {
    this.$('> img').tooltip({delay: { show: 500, hide: 100 }, placement: "top"});
  }
});

App.RemoveGameComponentView = Em.View.extend({
  didInsertElement: function() {
    var view = this;

    view.$('> img').tooltip({delay: { show: 500, hide: 100 }, placement: "top"});

    view.$().droppable({
      greedy: true,
      accept: ".game-item",
      activeClass: "ui-state-target",
      hoverClass: "ui-state-active",
      drop: function(event, ui) {
        var $draggable = $(ui.draggable);

        var selectedView = Ember.View.views[ $draggable.parent().attr('id') ];
        var selectedItem = selectedView.get('item');
        var slug = selectedItem.get('slug');

        // TODO check that there is no istances of item in canvases

        App.gameComponentsController.removeItem('slug', slug);

      }
    });
  }
});

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
    if(!itemTitle.length) return;

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
    console.log(JSON.stringify(this.getPath('content')));
    var sceneItems = $('.scene-chest').find('li');
    var gameItems = $('.item-chest').find('li');

    // loop elements and remove ui-selected class
    _.each(sceneItems, function(item) {
      var view = Ember.View.views[ $(item).attr('id') ];
      var component = view.get('item');

      view.set('uiSelected', component === selected ? true : false);
    });

    _.each(gameItems, function(item) {
      var view = Ember.View.views[ $(item).attr('id') ];
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
/*
App.InfoBoxControlsView = Em.View.extend({
  contentBinding: 'App.selectedComponentController.content',
  classNames: ['infobox-skillset', 'infobox-physicus'],
  contentObserver: function() {
    //
  }.observes('content')
});
*/

// TODO make these child views
App.InfoBoxControlsView = Em.View.extend();
App.InfoBoxCollisionView = Em.View.extend();
App.InfoBoxGravitationView = Em.View.extend();
App.InfoBoxScoreView = Em.View.extend();
App.InfoBoxDialogView = Em.View.extend();
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

/*
App.InfoView = Em.View.extend({
  contentBinding: 'App.selectedComponentController.content',
  classNames: ['infobox-skillset', 'infobox-physicus'],
  contentObserver: function() {
   // console.log('vittu saatana perkele');
  }.observes('content')
  /*snapToGrid: function() {
    return this.grid ? "True" : "False";
  }.property('grid'),* /
});
*/
/*
App.InfoBoxCollisionView = Em.View.extend({
  tagName: 'table',
  classNames: ['table', 'infobox', 'infobox-collision']//,
  //contentBinding: Ember.Binding.oneWay('App.selectedComponentController.content'),
  //content: null//,
  //emptyView: Ember.View.extend({
  //  template: Ember.Handlebars.compile("The collection is empty")
  //})
});
*/
/*
App.InfoBoxPrincipesView = Em.View.extend({
  //contentBinding: Ember.Binding.oneWay('App.selectedComponentController.content.properties'),
  classNames: ['infobox-skillset', 'infobox-principes'],
  contentObserver: function() {
    console.log('content.@each observer event');
  }.observes('content.@each')
});

App.InfoBoxArtifexView = Em.View.extend({
  //contentBinding: Ember.Binding.oneWay('App.selectedComponentController.content'),
  classNames: ['infobox-skillset', 'infobox-artifex']
});

App.InfoBoxMusicusView = Em.View.extend({
 // contentBinding: Ember.Binding.oneWay('App.selectedComponentController.content'),
  classNames: ['infobox-skillset', 'infobox-musicus']
});
*/

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
    var dt = new Date( this.get('timestamp') * 1000 ); // to javascript timestamp
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
    })
    ]
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
  firstNameBinding: Ember.Binding.oneWay('App.userController.content.firstName'),
  magosBinding: Ember.Binding.oneWay('App.userController.content.magos'),
  slugBinding: Ember.Binding.oneWay('App.gameController.content.slug'),
  submit: function(event) {
    event.preventDefault();

    var message = this.getPath('textField.value');

    if(!message.length) return;

      var timestamp = Math.round((new Date()).getTime() / 1000); // to unix timestamp

      var shout = { 'timestamp': timestamp, 'firstName': this.firstName, 'magos': this.magos, 'message': message };
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
  getSceneComponents: function(callback) {
    socket.emit('getSceneComponents', '', function(data) {
      var components = [];

      _.each(data, function(obj) {
        components.push(
          App.SceneComponent.create({
            "slug": obj.slug,
            "title": obj.title,
            "scenes": obj.scenes,
            "potions": obj.potions
          })
          );
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
          })
          );
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

      game.set('href', window.location.href);

      var authors = [];
      _.each(data.authors, function(author) {
        //
        var obj = App.Author.create({
          'userName': author.userName,
          'firstName': author.firstName,
          'lastName': author.lastName
        });
        //
        authors.push(obj);
      });
      game.set('authors', authors);

      var revision = data.revision;

      authors = [];
      _.each(revision.authors, function(author) {
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

      var scenes = [];
      _.each(revision.scenes, function(scene) {

        var sceneArray = [];
        _.each(scene.sceneComponents, function(component) {
         sceneArray.push( App.SceneComponent.create({ title: component.title, slug: component.slug, properties: component.properties }) );
           // TODO component properties
         });

        var gameArray = [];
        _.each(scene.gameComponents, function(component) {
         gameArray.push( App.GameComponent.create({ title: component.title, slug: component.slug, properties: component.properties }) );
           // TODO component properties
         });

        //
        var obj = App.Scene.create({
          name: scene.name,
          sceneComponents: sceneArray,
          gameComponents: gameArray
        }); // TODO
        //
        scenes.push(obj);
      });

      var audios = [];
      var sprites = [];

      var rev = {
        'authors': authors,
        'scenes': scenes,
        'audios': audios,
        'sprites': sprites
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
var slug = pathname.replace(/^\//, '').replace(/\/$/, '');

var socket = io.connect('http://localhost/editor');

socket.on('connecting', function() {
  console.log('Socket.IO - Connecting to magos');
});

socket.on('connect', function () {
  console.log('Socket.IO - Connected to magos');
});

// receive shout
socket.on('shout', function (shout) {
  if(_.isObject(shout)) {
    App.shoutsController.get('content').pushObject( App.Shout.create(shout) );
  }
});

App.languagesController.populate();

App.sceneComponentsController.populate();

App.gameController.populate();

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

  $('.canvas table td').toggleClass('gridless');
  console.log('click')
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
  var href = "/static/css/"+theme+".css";
  $(document).find('#theme').attr('href', href);


});

// help TODO replace with ember object
$(document).on('click tap', '.btn-group-help .btn', function(event) {
  event.preventDefault();
  $tgt = $(event.target).closest('.btn');
  $tgt.toggleClass('active');

  $('body').toggleClass('help');

  // TODO .touch action for tablets
  // $('body').find('.help-popover').each(function(index) { });
  // TODO <a class="close" href="#">&times;</a>
  $('body').popover({ selector: '.help .help-popover', 'placement': 'bottom', 'delay': { show: 500, hide: 100 } });

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
