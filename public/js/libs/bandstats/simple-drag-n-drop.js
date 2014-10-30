$(document).ready(function() {
   /**************************************
    *
    *  image drag and drop
    *  simply copies src attr, does not upload images
    *
    **/
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
}
