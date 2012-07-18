var App = Ember.Application.create();

App.pressa = Ember.Object.extend({
  contentBinding: 'App.selectedPressaController.content'
});
/*
App.pressaController = Ember.Object.create({
    nimi: 'Mara',
    asema: 'Rauhantekijä'
});
*/
App.selectedPressaController = Ember.Object.create({
  //templateName: 'pressa-tiedot',
  content: null
});

App.pressaView = Ember.View.extend({
  nimiBinding: 'App.selectedPressaController.content.nimi',
  asemaBinding: 'App.selectedPressaController.content.asema',
  classNames: ['my-class', 'my-other-class']
});

/* templateName: 'pressa-tiedot',
App.suomiView = Ember.View.extend({
  templateName: 'suomi-tiedot',
  nimiBinding: 'App.suomiController.content.nimi',
  asemaBinding: 'App.suomiController.content.asema'
});
*/

/*
App.pressatController = Ember.Object.create({
  content: [ { nimi: 'Sauli' },
            { nimi: 'Tarja' } ]
});
*/

App.pressatController = Ember.ArrayController.create({
  selected: 'App.selectedPressaController.content',
  content: [{
    nimi: 'Sauli',
    asema: 'Kehdonryöstäjä'
  }, {
    nimi: 'Tarja',
    asema: 'Ilkeä ä**ä'
  }, {
    nimi: 'Mara',
    asema: 'Laastarimies'
  }],
  init: function() {
    var obj = this.content.filterProperty('nimi', 'Mara');
    // console.log(obj);
    App.selectedPressaController.set('content', obj);
  }
}); // App.selectedPressaController.set('content', App.pressatController.objectAt(2));
App.checkedObject = Ember.Object.extend({
  content: 'App.checkedController.content'
});

App.checkedController = Ember.Object.create({
  content: Ember.Object.create({
    isChecked: true,
    title: "Checkboxin label"
  })
});

App.textField = Em.TextField.extend({
  valueBinding: 'App.textValue.content.value',
  type: 'number'
});

App.textValue = Em.Object.create({
  content: Ember.Object.create({
    value: null,
    title: 'testi'
  })
});

/**
 *
 *
 *
 *
 */

App.NumberField = Ember.TextField.extend({
    attributeBindings: ['min', 'max'],
    type: 'number'
});

App.ColorField = Ember.TextField.extend({
    type: 'color'
});

App.Font = Em.Object.extend({
  // default values for font
  family: { family: 'Verdana' },
  size: 14,
  color: '#cf0808',
  bgColor: '#141a9c'
});

App.fontsController = Em.ArrayController.create({
  content: [],
  selected: App.Font.create(),
  save: function() {
    console.log('save');
  }
});

var googleFontsUrl = "https://www.googleapis.com/webfonts/v1/webfonts?sort=alpha&key=AIzaSyBdhX1T_3kNk8WFXNzTpnBshi6vg3GKlWU";
$.getJSON(googleFontsUrl, function(data) {
  App.fontsController.set('content', data.items);
});

App.fontPreview = Em.View.extend({
  tagName: 'div',
  classNames: ['font-preview'],
  contentBinding: 'App.fontsController.selected',
  familyBinding: 'App.fontsController.selected.family.family',
  sizeBinding: 'App.fontsController.selected.size',
  colorBinding: 'App.fontsController.selected.color',
  bgColorBinding: 'App.fontsController.selected.bgColor',
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

App.FontForm = Em.View.extend({
    tagName: 'form',
    classNames: ['vertical-form'],
    controller: null,

    submit: function(event) {
      event.preventDefault();
      //
      var hash = this.get('controller').get('selected').getProperties('family', 'size', 'color', 'bgColor');

      console.log(JSON.stringify(hash));

      // send to node

    }
});

/**
 *
 *
 *
 *
 */
App.Shout = Ember.Object.extend({
  timestamp: '',
  writer: '',
  magos: '',
  message: ''
});

App.shoutboxController = Ember.ArrayController.create({
  content: []
});

App.shoutboxView = Ember.View.extend({

});

App.shoutboxController.get('content').pushObject({ 'timestamp': '12:13', 'writer': 'teemu', 'magos': 'principes', 'message': 'lorem ipsum 1' });
App.shoutboxController.get('content').pushObject({ 'timestamp': '13:13', 'writer': 'matti', 'magos': 'physicus', 'message': 'lorem ipsum 2' });
App.shoutboxController.get('content').pushObject({ 'timestamp': '19:13', 'writer': 'maija', 'magos': 'artifex', 'message': 'lorem ipsum 3' });
App.shoutboxController.get('content').pushObject({ 'timestamp': '19:13', 'writer': 'emma', 'magos': 'musicus', 'message': 'lorem ipsum 4' });

/*
{{#each MyApp.listController}}
  {{firstName}} {{lastName}}
{{/each}}
*/

/**
 *
 *
 *
 *
 */
App.Language = Em.Object.extend({
  title: null,
  domain: null,
  flag: function() {
    return '../assets/img/lang-ico/' + this.get('domain') + '.png';
  }.property('domain').cacheable()
});

App.languagesController = Ember.ArrayController.create({
  content: [],
  selected: null
});

var languages = [App.Language.create({ title: 'suomi', domain: 'fi' }), App.Language.create({ title: 'Ελληνικά', domain: 'gr' })];
App.languagesController.set('content', languages);

App.LangList = Ember.View.extend({
  classNames: ['btn-group'],
  contentBinding: 'App.languagesController.selected',
  click: function(event) {
    App.languagesController.set('selected', this.get('language'));
  }
});

App.LanguageSelectionView = Ember.View.extend({
  classNames: ['btn-group'],
  contentBinding: 'App.languagesController.selected'
});

App.languagesController.set('selected', App.languagesController.objectAt(0));



