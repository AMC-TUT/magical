

var App = App || {};

App.games = {
    init_list: function() {
        console.log('Init games');
        // load magos games as default tab content
        this.listGames('B', $('.active a')[0].hash , $('.active a'));
        this.bindGames();
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
            self.disableSubmit();
            self.bindCreateSubmit(formType);
            self.bindCancelCreate();
        });
        ajaxReq.fail(function (jqXHR, textStatus, errorThrown) {
            $('#createGame').html('<p>Error in request. ' + errorThrown + '</p>');
        });
    },

    bindCancelCreate: function() {
        $('#cancelCreateGame').click(function(e) {
            $('#selectGameType').slideDown();
            $('#createGameContainer').slideUp();
        });
    },

    bindCreateSubmit: function(formType) {
        $('#submitCreateGame').click(function(e) {
            $('#errors').empty().hide();
            $('label.errors').removeClass('errors');
            $('.errortext').remove();
            var ajaxUrl = '/game/create/' + formType + '/';
            var formData = $('#createGameForm').serializeArray();
            var ajaxReq = $.ajax({
                dataType : 'json',
                type: 'POST',
                data: formData,
                url : ajaxUrl
            });
            ajaxReq.done(function ( data, textStatus, jqXHR ) {
                console.log(data);
                if (data.errors){
                    // display from errors
                    for (error in data.errors) {
                        $('label[for="id_' + error + '"]').addClass('errors').after('<span class="errortext errors">' + data.errors[error][0] + '</span>');
                    }
                } else {
                    if(data.success) {
                        // redirect to newly created game page
                        window.location.replace(data.url);
                    }
                }
            });
        });     
    },    

    disableSubmit: function() {
        $("#createGameForm").submit(function(e) {
            e.preventDefault();
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
    }
}

