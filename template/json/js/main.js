$(document).ready(function() {

    "use strict";

    // http://api.jquery.com/jQuery.getJSON/
    var jqxhr = $.getJSON("words.json", function(data, textStatus, jqXHR) {
        // data === array

        // http://underscorejs.org/
        if (!_.isArray(data)) {
            alert('data was not in array format');
        }

        // first shuffle (randomize)
        data = _.shuffle(data);

        // then pick one object from array
        var obj = _.first(data);

        alert(obj.word);

    });

    // xhr request failed
    jqxhr.fail(function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
    });

});
