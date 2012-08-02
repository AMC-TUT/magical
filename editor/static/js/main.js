
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

}(window.App = window.App || Em.Application.create(), jQuery));
