

var App = App || {};

App.games = {
    init_list: function() {
        console.log('Init games');
        // load magos games as default tab content
        this.listGames('B', $('.active a')[0].hash , $('.active a'));
        this.bindGames();
        this.bindPlayEditButtons();
    },

    bindPlayEditButtons: function() {
        $(document).on('click', '#playLatest', function(e) {
            e.preventDefault();
            var url = $(this).attr('href');
            if(url) {
                window.location = url;
            }
        });
    },

    bindGames: function() {
        var self = this;
        // bind tab click
        $('#gamesList li a').click(function (e) {
            e.preventDefault();
            var gameType = $(this).attr("data-url"); // magos or magos-lite
            var url = '/game/ajax_list_games/' + $(this).attr("data-url"); 
            var href = this.hash;
            var pane = $(this);
            self.listGames(gameType, href, pane);
        });
    },
    listGames: function(gameType, target, pane) {
        console.log('Get my games');
        var url = '/game/ajax_list_games/' + gameType;
        var ajaxReq = $.ajax( {
            dataType : 'html',
            type : 'GET',
            url: url 
        });
        ajaxReq.done(function(data) {
                $(target).html(data);
        });
        ajaxReq.fail(function() {
                $(target).html('Failed getting games.');
        });
        ajaxReq.always(function() {
                pane.tab('show');
        });
    },


    init_create: function() {
        this.bindSelectGameType();
        this.bindCreateSubmit();
        this.bindCancelCreate();
    },

    loadCreateForm: function(formType) {
        var self = this;
        $('#createGame').empty();
        var ajaxUrl = '/game/create/' + formType + '/';
        var ajaxReq = $.ajax({
            dataType : 'html',
            type : 'GET',
            url : ajaxUrl
        });
        ajaxReq.done(function ( data, textStatus, jqXHR ) {
            $('#createGame').append(data);
            App.accessibility.refresh();
        });
        ajaxReq.fail(function (jqXHR, textStatus, errorThrown) {
            $('#createGame').html('<p>Error in request. ' + errorThrown + '</p>');
        });
    },

    bindCancelCreate: function() {
        $(document).on('click', '#cancelCreateGame', function(e) {
            $('#selectGameType').slideDown();
            $('#createGameContainer').slideUp();
        });
    },

    bindCreateSubmit: function() {
        $(document).on('submit', 'form#createGameForm', function(e) {
            var thisForm = this;
            var ajaxUrl = this.action;
            var formData = $(this).serializeArray();
            var ajaxReq = $.ajax({
                dataType : 'json',
                type: 'POST',
                data: formData,
                url : ajaxUrl
            });
            ajaxReq.done(function ( data, textStatus, jqXHR ) {
                if (!(data['success'])) {
                    // display from with errors
                    $(thisForm).replaceWith(data['form_html']);
                } else {
                    // redirect to newly created game page
                    window.location.replace(data.url);
                }
            });
            return false;
        });
    },

    bindSelectGameType: function() {
        var self = this;
        $('#selectGameType').on('click', '.gameType', function() {
            $('.gameType').removeClass('on');
            $(this).addClass('on');
            var selected = $(this).attr('id');
            var curFormType = selected.replace('btn-', '');
            self.loadCreateForm(curFormType);
            $('#selectGameType').slideUp();
        });
    },

    /**
     * Display flash notifications
     */
    notify: function(msg, msgType, msgTimeout) {
        if(_.isUndefined(msgTimeout)) msgTimeout = 600;
        // show notification
        var note = noty({
            text: msg, 
            type: msgType || 'alert',
            timeout: msgTimeout
        });
    }    
};


App.language = {
    init: function() {
        this.bindChangeLanguage();
    },

    bindChangeLanguage: function() {
        $('#magosLanguage').on('change', function() {
            this.form.submit();
        });
    }
    
};

App.settings = {
    init: function() {
        this.bindClickSettings();
    },

    bindClickSettings: function() {
        var self = this;
        $('#toggleSettings').on('click', function(e) {
            e.preventDefault();
            $modalTarget = $('#modalTargetSettings');
            var url = this.href;
            $modalTarget.load(url, function() { // load the url into the modal
                self.bindSubmitUserSettings();
                $(this).modal('show'); // display the modal on url load
            });
            return false;
        });
    },

    bindSubmitUserSettings: function() {
        var self = this;
        $(document).off('submit', 'form#userSettingsForm');
        $(document).on('submit', 'form#userSettingsForm', function(e) {
            e.preventDefault();
            var url = this.action;
            var formData = $(this).serializeArray();
            var settings_form = $(this);
            // use jQuery form plugin
            settings_form.ajaxSubmit({
                url : url,
                dataType : 'json',
                data: formData,
                clearForm: false,
                success : function(json) {
                    if (json.errors) {
                        App.utils.processFormErrors(json, team_form);
                    } else {
                        // reload to take settings into effect
                        window.location = json.base_url;
                    }
                }
            });
            return false;
        });
    }    

};


App.accessibility = {
    use_uppercase_text: false,

    init: function(use_uppercase_text) {
        this.use_uppercase_text = use_uppercase_text;

        if(this.use_uppercase_text) this.uppercaseAll();
    },

    refresh: function() {
        if(this.use_uppercase_text) this.uppercaseAll();
    },

    uppercaseAll: function() {
        $('body, button, select').css({ 'text-transform': 'uppercase' });
    }

};

App.utils = {
    
    hideFormErrors: function() {
        $('.errorlist').remove();
        $('.hasErrors').removeClass('hasErrors');
    },

    processFormErrors: function(json, form) {
        this.hideFormErrors();
        errors = json.errors;
        if (errors.__all__ != undefined) {
            $('.errors', form).append(errors.__all__).addClass('alert alert-danger');
        }
        prefix = form.find(":hidden[name='prefix']").val();
        prefix == undefined ? prefix = '' : prefix = prefix + '-';
        for (field in errors) {
            $('#id_' + prefix + field).addClass('error');
        }
    }

};
