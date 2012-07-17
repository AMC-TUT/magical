
var App = Ember.Application.create();

App.pressa = Ember.Object.extend({
  nimi: null,
  asema: 'tasavallan pressa'
});

App.pressa = App.pressa.create();

App.pressa.set('nimi', 'Sauli');

App.suomiController = Ember.Object.create({
  content: Ember.Object.create({
    //pressaBinding: 'App.pressa'
    nimiBinding: 'App.pressa.nimi',
    asemaBinding: 'App.pressa.asema'
  })
});

App.suomiView = Ember.View.extend({
  templateName: 'suomi-tiedot',
  nimiBinding: 'App.suomiController.content.nimi',
  asemaBinding: 'App.suomiController.content.asema'
});

/*
App.pressatController = Ember.Object.create({
  content: [ { nimi: 'Sauli' },
            { nimi: 'Tarja' } ]
});
*/

App.pressatController = Ember.ArrayController.create({
    content: [ { nimi: 'Sauli' }, { nimi: 'Tarja' } ]
});

/*
App.selectedPressaController = Ember.Object.create({
    pressa: null
});
*/
//App.selectedPressaController.set('pressa', App.pressatController.objectAt(1));
/*
App.pressatView = Ember.View.extend({
  pressat: [ { nimi: 'Sauli' },
            { nimi: 'Tarja' } ]
});
*/