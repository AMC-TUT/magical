/**
 *  jQuery plugin to compile a template w/ data and
 *  fill a DOM element with results.
 *  Usage: $('#domelement').handlebars('template-id', {field1: 'Hello', field2: 'world!'}); 
 */
(function($) {
	var compiled = {};
	$.fn.handlebars = function(template, data) {
	  if ($('#' + template) instanceof jQuery) {
	    template = $('#' + template).html();
	  }
	  compiled[template] = Handlebars.compile(template);
	  this.html(compiled[template](data));
	};
})(jQuery);
