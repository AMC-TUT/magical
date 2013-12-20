$(document).ready(function() {
    
    // ajax load list of games
    function listGames(gameType, target, pane) {
        console.log(gameType);
        console.log(target);
        console.log(pane);
        var url = '/game/ajax_list_games/' + gameType;
        $.ajax({
            dataType : 'html',
            type : 'GET',
            url : url,
            success : function(data, textStatus, jqXHR) {
                $(target).html(data);
                pane.tab('show');
            },
            error : function(jqXHR, textStatus, errorThrown) {
                $('#errors').html('Error in XHR request.<br/> ' + errorThrown).show();
            }
        });
    } // getFilters

    // load magos games as default tab content
    listGames('magos', $('.active a')[0].hash , $('.active a'));

    // bind tab click
    $('#gamesList li a').click(function (e) {
        e.preventDefault();
        var gameType = $(this).attr("data-url"); // magos or magos-lite
        var url = '/game/ajax_list_games/' + $(this).attr("data-url"); 
        var href = this.hash;
        var pane = $(this);
        listGames(gameType, href, pane);
    });


});
