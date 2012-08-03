
/* Magos Editor */

(function(App, $, undefined){

Em.LOG_BINDINGS = true;

/**************************
* Language
**************************/
 App.Language = Em.Object.extend({
  title: null,
  domain: null,
  flag: function() {
    return '../static/img/flags/' + this.get('domain') + '.png';
  }.property('domain').cacheable()
});

 App.languagesController = Em.ArrayController.create({
  content: [],
  selected: null
});

 var languages = [
   App.Language.create({ title: 'English', domain: 'uk' }),
   App.Language.create({ title: 'Ελληνικά', domain: 'gr' }),
   App.Language.create({ title: 'italiano', domain: 'it' }),
   App.Language.create({ title: 'suomi', domain: 'fi' })
 ];

 App.languagesController.set('content', languages);

 App.LangList = Em.View.extend({
  click: function(event) {
    App.languagesController.set('selected', this.get('language'));
  }
});

 App.LanguageSelectionView = Em.View.extend({
  classNames: ['btn-group'],
  contentBinding: 'App.languagesController.selected'
});

App.languagesController.set('selected', App.languagesController.objectAt(0));

/**************************
* Data Source
**************************/

App.DataSource = Ember.Object.extend({
  store: null,
  getLanguages: function(callback) {
    var store = this.store;

    /*jQuery.get('/books.json', function(data) {
      store.pushObjects(data);
      callback(store);
    });*/
    socket.emit('getLanguages', '', function(data) {
      console.log('getLanguages')
      console.log(data);
      store.pushObjects(data);
      callback(store);
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

var dataSource = App.DataSource.create();
dataSource.getLanguages();

// (function init() {
// })();

}(window.App = window.App || Em.Application.create(), jQuery));
