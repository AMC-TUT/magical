
/* Magos Editor */

(function(App, $, undefined){

 // Em.LOG_BINDINGS = true;
 // Em.VIEW_PRESERVES_CONTEXT = true;

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
    console.log("TITLE MUUTTUI")
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
    console.log("SELECTED MUUTTUI")
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
  store: null,
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
      console.log(data);

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

App.languagesController.populate();

App.gameController.populate();

// (function init() {
// })();

}(window.App = window.App || Em.Application.create(), jQuery));
