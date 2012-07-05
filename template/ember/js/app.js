
window.App = Em.Application.create();

App.MyView = Em.View.extend({

});

App.MyObject = Em.Object.extend({

});


App.Button = Ember.View.extend({
  tagName: 'button',
  template: Ember.Handlebars.compile("{{view.title}}"),
  didInsertElement: function() {
    var $btn = this.$().button();
    console.log($btn);
  },
  mouseDown: function() {
    window.alert("hello world!");
  }
});
var button = App.Button.create({
  title: "Hi jQuery UI!",
  "data-testi": "testi"
}).appendTo('body');

/* Font related Objects */
App.FontFamily = Ember.Object.extend({
  family: null
});

App.FontSize = Ember.Object.extend({
  size: null
});

App.FontColor = Ember.Object.extend({
  color: null
});

App.FontBgColor = Ember.Object.extend({
  bgcolor: "testnull"
});

App.Font = Ember.Object.extend({
  familyBinding: 'App.FontFamily.family',
  sizeBinding: 'App.FontSize.size',
  colorBinding: 'App.FontColor.color',
  bgcolorBinding: 'App.FontBgColor.bgcolor',
  toJSON: function() {
    var json = Model.prototype.toJSON.call(this);
    json.author = this.author();
    return json;
  }
});

App.FontFamily.create();
App.FontSize.create();
App.FontColor.create();
App.FontBgColor.create();

var fontti = App.Font.create();
/*
var color = App.FontColor.create();
color.set('color', '#degdeg');

App.wife = Ember.Object.create({
  householdIncome: 80000
});
App.husband = Ember.Object.create({
  householdIncomeBinding: 'App.wife.householdIncome'
});
App.husband.get('householdIncome'); // 80000
*/
/*
  family: "Arial",
  size: 12,
  color: "#coffee",
  bgcolor: "#feed22"
});

/*
App.PostController = Ember.ObjectController.extend({
  author: function() {
    return [this.get('salutation'), this.get('name')].join(' ');
  }.property('salutation', 'name')
});

App.PostView = Ember.View.extend({
  // the controller is the initial context for the template
  controller: null,
  template: Ember.Handlebars.compile("<h1>{{title}}</h1><h2>{{author}}</h2><div>{{body}}</div>")
});
var post = App.Post.create();
var postController = App.PostController.create({
  content: post
});

App.PostView.create({
  controller: postController
}).appendTo('body');
jQuery.getJSON("/posts/1", function(json) {
  post.setProperties(json);
});
*/
