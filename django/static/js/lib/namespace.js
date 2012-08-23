// Namespace utility
var namespace = function (namespace) {
    var components = namespace.split(/[^a-z0-9]+/ig);
    var context = window;

    for (var i = 0, l = components.length; i < l; i += 1) {
        var component = components[i];

        if (!context[component]) {
            context[component] = {};
        }

        context = context[component];
    }

    return context;
}
