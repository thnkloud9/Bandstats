$(document).ready( domSetup );

function domSetup() {
    /**
     * nav tabs for external ids
     */
    $('.tabs nav.external-ids a').live('click', function(e){
        e.preventDefault();
        if ($(this).hasClass('active')) {
            return false;
        } else {
            $('.tabs nav.external-ids a').removeClass('active');
            $(this).addClass('active');
      
            matchRel = $(this).attr('rel');
            $(this).parent().parent().parent().siblings('div').slideUp(function(){
                setTimeout(function(){
                    $('.tabs > div#'+ matchRel).slideDown();
                },300);
            });
        }
    });

    /**
     * image drag and drop
     */
    var dragImage = null;
    $('.image-draggable').live('dragstart', function(e) {
        var source = $(this).attr('src');
        e.originalEvent.dataTransfer.setData('src', source);
    });

    $('.image-droppable').bind('dragover', function(e) {
        e.preventDefault();
        return false;
    });

    $('.image-droppable').live('drop', function(e) {
        e.preventDefault();
        var source = e.originalEvent.dataTransfer.getData('src');
        $(this).attr('src', source); 
    });

    /**
     * modal window
     */
    $('.modal').live('click', function() {
        $('#modal').empty();
        $('#modal').append("<a href='#' id='modal-close'>Close</a>");
        $('#modal').addClass('loading');
        $('#overlay').fadeIn(function() {
            $('#modal').fadeIn();
            return false;
        });
    });
    
    $('#modal-close').live('click', function() {
        $('#modal').fadeOut(function() {
            $('#overlay').fadeOut();
            return false;
        });
    });
}
