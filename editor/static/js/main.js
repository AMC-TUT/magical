
/* Magos Editor */

(function(App, $, undefined){

Em.LOG_BINDINGS = true;

/**************************
* Language
**************************/

App.Language = Em.Object.extend({
  title: null,
  slug: null,
  code: null,
  flag: function() {
    return '../static/img/flags/' + this.get('code') + '.png';
  }.property('code').cacheable()
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
      App.languagesController.set('selected', App.languagesController.objectAt(0));

    });

  }
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
* Data Source
**************************/

App.DataSource = Ember.Object.extend({
  store: null,
  getLanguages: function(callback) {
    //var store = this.store;

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

      // store.pushObjects(languages);
      callback(languages);
    });

  }
});

App.dataSource = App.DataSource.create({
  store: App.store
});

/**************************
* Data Store
**************************/

App.Store = Ember.ArrayProxy.extend({
  content: null,
  init: function() {
    this._super();
    this.set('content', []);
  },
  find: function(id) {
    var content = this.get('content');
    return content.findProperty('id', id);
  }
});

App.store = App.Store.create();

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

//var dataSource = App.DataSource.create();
//dataSource.getLanguages();

App.languagesController.populate();

// (function init() {
// })();

}(window.App = window.App || Em.Application.create(), jQuery));
