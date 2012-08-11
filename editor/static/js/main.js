
/* Magos Editor */

(function(App, $, undefined){

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
      //
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

/**************************
* Scene
**************************/

App.Scene = Em.Object.extend({
  name: null,
  elements: []
});

/**************************
* SceneComponent
**************************/

App.SceneComponent = Em.Object.extend({
  title: null,
  slug: null,
  scenes: [],
  potions: [],
  active: false,
  icon : function() {
    return '../static/img/components/' + this.get('slug') + '.png';
  }.property('slug')
});

App.sceneComponentsController = Em.ArrayController.create({
  content: [],
  selected: null,
  populate: function() {
    var controller = this;

    App.dataSource.getSceneComponents(function(data) {
      // set content
      controller.set('content', data);
    });
  },
  selectedObserver: function() {
    //
    var items = this.get('content');
    var selected = this.get('selected');
    //
    _.each(items, function(item) {
      item.set('active', false);
    });
    //
    selected.set('active', true);
    //
  }.observes('selected')
});

App.SceneComponentsView = Em.View.extend({
  classNameBindings: ['uiSelected'],
  uiSelected: false,
  contentBinding: 'App.sceneComponentsController.content',
  click: function(event) {
    var selected = this.get('item');
    var items = this.get('content');

    // set selected component
    App.sceneComponentsController.set('selected', selected);

    // this could be done more efficiently
    var siblings = this.$().siblings('li');
    // loop siblings and remove ui-selected class
    _.each(siblings, function(sibling) {
      var view = Ember.View.views[ $(sibling).attr('id') ];
      view.set('uiSelected', false);
    });

    this.set('uiSelected', true);
  }
});


/**************************
* Component
**************************/

App.Component = Em.Object.extend({
  title: null,
  slug: null,
  sprite: null,
  active: false,
  icon : function() {
    return '../static/game/sprites/' + this.get('sprite') + '.png';
  }.property('sprite')
});

App.componentsController = Em.ArrayController.create({
  content: [],
  selected: null,
  populate: function() {
    //
    var array = [];
    //
    array.push( App.Component.create({ title: 'Player', slug: 'player', sprite: 'player' }) );
    array.push( App.Component.create({ title: 'Brick', slug: 'brick', sprite: 'brick' }) );
    array.push( App.Component.create({ title: 'Water', slug: 'water', sprite: 'water' }) );
    array.push( App.Component.create({ title: 'Painting', slug: 'painting', sprite: 'painting' }) );

    this.set('content', array);
    /*
    var controller = this;

    App.dataSource.getSceneComponents(function(data) {
      // set content
      controller.set('content', data);
    });
*/
},
contentObserver: function() {
  // update draggable binding
  $(".game-item").draggable({ helper: "clone" });

}.observes('content'),
selectedObserver: function() {
    //
    var items = this.get('content');
    var selected = this.get('selected');
    //
    _.each(items, function(item) {
      item.set('active', false);
    });
    //
    selected.set('active', true);
    //
  }.observes('selected')
});

App.ComponentsView = Em.View.extend({
  classNameBindings: ['uiSelected'],
  uiSelected: false,
  contentBinding: 'App.componentsController.content',
  click: function(event) {
    var selected = this.get('item');
    var items = this.get('content');

    // set selected component
    App.componentsController.set('selected', selected);

    // this could be done more efficiently
    var siblings = this.$().siblings('li');
    // loop siblings and remove ui-selected class
    _.each(siblings, function(sibling) {
      var view = Ember.View.views[ $(sibling).attr('id') ];
      view.set('uiSelected', false);
    });

    this.set('uiSelected', true);
  }
});

App.componentsController.populate();

App.AddComponentView = Em.View.extend({
  click: function(event) {
    // open bootstrap dialog
    $('#dialog-new-item').modal().on('show', function () {
      $(this).find('input').val('');
      $(this).find('.control-group').removeClass('error');
    })
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
      var item = App.Component.create({ title: itemTitle, slug: safeSlug, sprite: 'empty' });

      App.componentsController.get('content').pushObject(item);

      $('#dialog-new-item').modal('hide');

      // send to node

      this.set('itemTitle', null);

    }
  });

App.RemoveComponentView = Em.View.extend({
  click: function(event) {
    alert("remove item action");
  }
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
        //
        var obj = App.Scene.create({
          'name': scene.name,
          'elements': [] // TODO
        });
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

/*
$(".chest").selectable({
  filter: "> li:not(:empty)"
});
*/
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
