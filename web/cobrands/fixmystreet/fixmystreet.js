/*
 * fixmystreet.js
 * FixMyStreet JavaScript
 */

function form_category_onchange() {
    var cat = $('#form_category');
    var args = {
        category: cat.val()
    };

    if ( typeof fixmystreet !== 'undefined' ) {
        args.latitude = fixmystreet.latitude;
        args.longitude = fixmystreet.longitude;
    } else {
        args.latitude = $('input[name="latitude"]').val();
        args.longitude = $('input[name="longitude"]').val();
    }

    $.getJSON('/report/new/category_extras', args, function(data) {
        if ( data.category_extra ) {
            if ( $('#category_meta').size() ) {
                $('#category_meta').html( data.category_extra);
            } else {
                $('#form_category_row').after( data.category_extra );
            }
        } else {
            $('#category_meta').empty();
        }
    });
}

/*
 * general height fixing function
 *
 * elem1: element to check against
 * elem2: target element
 * offset: this will be added (if present) to the final value, useful for height errors
 */
function heightFix(elem1, elem2, offset){
    var h1 = $(elem1).height(),
        h2 = $(elem2).height();
    if(offset === undefined){
        offset = 0;
    }
    if(h1 > h2){
        $(elem2).css({'min-height':h1+offset});
    }
}


/*
 * very simple tab function
 *
 * elem: trigger element, must have an href attribute (so probably needs to be an <a>)
 */
function tabs(elem, indirect) {
    var href = elem.attr('href');
    //stupid IE sometimes adds the full uri into the href attr, so trim
    var start = href.indexOf('#'),
        target = href.slice(start, href.length);

    if (indirect) {
        elem = $(target + '_tab');
    }

    if(!$(target).hasClass('open'))
    {
        //toggle class on nav
        $('.tab-nav .active').removeClass('active');
        elem.addClass('active');
 
        //hide / show the right tab
        $('.tab.open').hide().removeClass('open');
        $(target).show().addClass('open');
    }
}


$(function(){
    var $html = $('html');

    $html.removeClass('no-js').addClass('js');

    // Preload the new report pin
    document.createElement('img').src = '/i/pin-green.png';

    //add mobile class if small screen
    if (Modernizr.mq('only screen and (max-width:47.9375em)')) {
        $html.addClass('mobile');
        $('#map_box').css({ height: '10em' });
        if (typeof fixmystreet !== 'undefined' && fixmystreet.page == 'around') {
            // Immediately go full screen map if on around page
            $('#site-header').hide();
            $('#map_box').prependTo('.wrapper').css({
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                height: 'auto',
                margin: 0
            });
            // Bit yucky, but the ID doesn't exist yet.
            $("<style>#fms_pan_zoom { top: 2.75em !important; }</style>").appendTo(document.documentElement);
            $('.big-green-banner')
                .addClass('mobile-map-banner')
                .removeClass('.big-green-banner')
                .appendTo('#map_box')
                .text('Place pin on map');
        }
    } else {
        // Make map full screen on non-mobile sizes.
        var map_pos = 'fixed', map_height = '100%';
        if ($html.hasClass('ie6')) {
            map_pos = 'absolute';
            map_height = $(window).height();
        }
        $('#map_box').prependTo('.wrapper').css({
            zIndex: 0, position: map_pos,
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%', height: map_height,
            margin: 0
        }).data('size', 'full');
    }

    //heightfix the desktop .content div
    if(Modernizr.mq('only screen and (min-width:48em)')) {
        if (!($('body').hasClass('frontpage'))){
            heightFix(window, '.content', -176);
        }
    }

    $('#pc').focus();

    $('input[type=submit]').removeAttr('disabled');
    /*
    $('#mapForm').submit(function() {
        if (this.submit_problem) {
            $('input[type=submit]', this).prop("disabled", true);
        }
        return true;
    });
    */

    if (!$('#been_fixed_no').prop('checked') && !$('#been_fixed_unknown').prop('checked')) {
        $('#another_qn').hide();
    }
    $('#been_fixed_no').click(function() {
        $('#another_qn').show('fast');
    });
    $('#been_fixed_unknown').click(function() {
        $('#another_qn').show('fast');
    });
    $('#been_fixed_yes').click(function() {
        $('#another_qn').hide('fast');
    });

    // FIXME - needs to use translated string
    jQuery.validator.addMethod('validCategory', function(value, element) {
        return this.optional(element) || value != '-- Pick a category --'; }, validation_strings.category );

    jQuery.validator.addMethod('validName', function(value, element) {
        var validNamePat = /\ba\s*n+on+((y|o)mo?u?s)?(ly)?\b/i;
        return this.optional(element) || value.length > 5 && value.match( /\S/ ) && !value.match( validNamePat ); }, validation_strings.category );

    var form_submitted = 0;
    var submitted = false;

    $("form.validate").validate({
        rules: {
            title: { required: true },
            detail: { required: true },
            email: { required: true },
            update: { required: true },
            rznvy: { required: true }
        },
        messages: validation_strings,
        onkeyup: false,
        onfocusout: false,
        errorElement: 'div',
        errorClass: 'form-error',
        // we do this to stop things jumping around on blur
        success: function (err) { if ( form_submitted ) { err.addClass('label-valid').removeClass('label-valid-hidden').html( '&nbsp;' ); } else { err.addClass('label-valid-hidden'); } },
        errorPlacement: function( error, element ) {
            element.before( error );
        },
        submitHandler: function(form) {
            if (form.submit_problem) {
                $('input[type=submit]', form).prop("disabled", true);
            }

            form.submit();
        },
        // make sure we can see the error message when we focus on invalid elements
        showErrors: function( errorMap, errorList ) {
            if ( submitted && errorList.length ) {
               $(window).scrollTop( $(errorList[0].element).offset().top - 120 );
            }
            this.defaultShowErrors();
            submitted = false;
        },
        invalidHandler: function(form, validator) { submitted = true; }
    });

    $('input[type=submit]').click( function(e) { form_submitted = 1; } );

    /* set correct required status depending on what we submit 
    * NB: need to add things to form_category as the JS updating 
    * of this we do after a map click removes them */
    $('#submit_sign_in').click( function(e) {
        $('#form_category').addClass('required validCategory').removeClass('valid');
        $('#form_name').removeClass();
    } );

    $('#submit_register').click( function(e) { 
        $('#form_category').addClass('required validCategory').removeClass('valid');
        $('#form_name').addClass('required validName');
    } );

    $('#problem_submit > input[type="submit"]').click( function(e) { 
        $('#form_category').addClass('required validCategory').removeClass('valid');
        $('#form_name').addClass('required validName');
    } );

    $('#update_post').click( function(e) { 
        $('#form_name').addClass('required').removeClass('valid');
    } );

    $('#form_category').change( form_category_onchange );

    // Geolocation
    if (geo_position_js.init()) {
        $('#postcodeForm').after('<a href="#" id="geolocate_link">&hellip; or locate me automatically</a>');
        $('#geolocate_link').click(function(e) {
            e.preventDefault();
            // Spinny thing!
            if($('.mobile').length){
                $(this).append(' <img src="/cobrands/fixmystreet/images/spinner-black.gif" alt="" align="bottom">');
            }else{
                $(this).append(' <img src="/cobrands/fixmystreet/images/spinner-yellow.gif" alt="" align="bottom">');
            }
            geo_position_js.getCurrentPosition(function(pos) {
                $('img', this).remove();
                var latitude = pos.coords.latitude;
                var longitude = pos.coords.longitude;
                location.href = '/around?latitude=' + latitude + ';longitude=' + longitude;
            }, function(err) {
                $('img', this).remove();
                if (err.code == 1) { // User said no
                } else if (err.code == 2) { // No position
                    $(this).html("Could not look up location");
                } else if (err.code == 3) { // Too long
                    $('this').html("No result returned");
                } else { // Unknown
                    $('this').html("Unknown error");
                }
            }, {
                enableHighAccuracy: true,
                timeout: 10000
            });
        });
    }

    /* 
     * Report a problem page 
     */
    //desktop
    if ($('#report-a-problem-sidebar').is(':visible')) {
        heightFix('#report-a-problem-sidebar', '.content', 26);
    }

    //show/hide notes on mobile
    $('.mobile #report-a-problem-sidebar').after('<a href="#" class="rap-notes-trigger button-right">How to send successful reports</a>').hide();
    $('.rap-notes-trigger').click(function(e){
        e.preventDefault();
        //check if we've already moved the notes
        if($('.rap-notes').length > 0){
            //if we have, show and hide .content
            $('.content').hide();
            $('.rap-notes').show();
        }else{
            //if not, move them and show, hiding .content
            $('.content').after('<div class="content rap-notes"></div>').hide();
            $('#report-a-problem-sidebar').appendTo('.rap-notes').show().after('<a href="#" class="rap-notes-close button-left">Back</a>');
        }
        $('html, body').scrollTop($('#report-a-problem-sidebar').offset().top);
        location.hash = 'rap-notes';
    });
    $('.mobile').on('click', '.rap-notes-close', function(e){
        e.preventDefault();
        //hide notes, show .content
        $('.content').show();
        $('.rap-notes').hide();
        $('html, body').scrollTop($('#mob_ok').offset().top);
        location.hash = 'report';
    });

    //move 'skip this step' link on mobile
    $('.mobile #skip-this-step').hide();
    $('.mobile #skip-this-step a').appendTo('#key-tools').addClass('chevron').wrap('<li>');

    /*
     * Tabs
     */
    //make initial tab active
    $('.tab-nav a').first().addClass('active');
    $('.tab').first().addClass('open');
    
    //hide other tabs
    $('.tab').not('.open').hide();
    
    //set up click event
    $(".tab-nav").on('click', 'a', function(e){
        e.preventDefault();
        tabs($(this));
    });
    $('.tab_link').click(function(e) {
        e.preventDefault();
        tabs($(this), 1);
    });

    /*
     * Skip to nav on mobile
     */
    $('.mobile').on('click', '#nav-link', function(e){
        e.preventDefault();
        var offset = $('#main-nav').offset().top;
        $('html, body').animate({scrollTop:offset}, 1000);
    });


    /*
     * Show stuff on input focus
     */
    $('.form-focus-hidden').hide();
    $('.form-focus-trigger').on('focus', function(){
        $('.form-focus-hidden').fadeIn(500);
    });

    /*
     * Show on click - pretty generic
     */
    $('.hideshow-trigger').on('click', function(e){
        e.preventDefault();
        var href = $(this).attr('href'),
            //stupid IE sometimes adds the full uri into the href attr, so trim
            start = href.indexOf('#'),
            target = href.slice(start, href.length);

        $(target).removeClass('hidden-js');

        $(this).hide();
    });

    /*
     * nicetable - on mobile shift 'name' col to be a row
     */
    $('.mobile .nicetable th.title').remove();
    $('.mobile .nicetable td.title').each(function(i){
        $(this).insertBefore($(this).parent('tr')).wrap('<tr class="heading" />');
    });
    // $('.mobile .nicetable tr.heading > td.title').css({'min-width':'300px'});
    // $('.mobile .nicetable tr > td.data').css({'max-width':'12%'});

    /*
     * Map controls prettiness
     */
    //add links container (if its not there)
    if($('#sub_map_links').length === 0){
        $('<p id="sub_map_links" />').insertAfter($('#map'));
    }

// A sliding drawer from the bottom of the page
// TODO Not have independent scrolling; height broken in IE6 (at least). Think fixing former will fix latter.
$.fn.drawer = function(id, ajax) {
    this.toggle(function(){
        var $this = $(this), d = $('#' + id);
        if (!$this.addClass('hover').data('setup')) {
            if (!d.length) {
                d = $('<div id="' + id + '">');
            }
            d.removeClass('hidden-js');
            if (ajax) {
                var href = $this.attr('href') + ';ajax=1';
                d.load(href);
            }
            d.find('h2').css({ marginTop: 0 });
            $('.content').append(d);
            d_offset = d.offset().top;
            d.hide();
            $this.data('setup', true);
        }
        d.animate({height:'show'},1000);
        $('html, body').animate({scrollTop:d_offset-80}, 1000);
        
    }, function(e){
        var $this = $(this), d = $('#' + id);
        $this.removeClass('hover');
        d.animate({height:'hide'});
    });
};

    $('#key-tool-wards').drawer('council_wards', false);
    $('#key-tool-around-updates').drawer('updates_ajax', true);
    $('#key-tool-report-updates').drawer('report-updates-data', false);

    // Go directly to RSS feed if RSS button clicked on alert page
    // (due to not wanting around form to submit, though good thing anyway)
    $('.shadow-wrap').on('click', '#alert_rss_button', function(e){
        e.preventDefault();
        var feed = $('input[name=feed][type=radio]:checked').nextAll('a').attr('href');
        window.location.href = feed;
    });
    $('.shadow-wrap').on('click', '#alert_email_button', function(e){
        e.preventDefault();
        var form = $('<form/>').attr({ method:'post', action:"/alert/subscribe" });
        $('#alerts input[type=text], #alerts input[type=hidden], #alerts input[type=radio]:checked').each(function() {
            var $v = $(this);
            $('<input/>').attr({ name:$v.attr('name'), value:$v.val(), type:'hidden' }).appendTo(form);
        });
        form.submit();
    });

    //add permalink on desktop, force hide on mobile
    $('#sub_map_links').append('<a href="#" id="map_permalink">Permalink</a>');
    if($('.mobile').length){
        $('#map_permalink').hide();
        $('#key-tools a.feed').appendTo('#sub_map_links');
    }
    //add open/close toggle button on desk
    $('#sub_map_links').prepend('<span id="map_links_toggle">&nbsp;</span>');

    //set up map_links_toggle click event
    $('#map_links_toggle').on('click', function(){
        var maplinks_width = $('#sub_map_links').width();

        if($(this).hasClass('closed')){
            $(this).removeClass('closed');
            $('#sub_map_links').animate({'right':'0'}, 1200);
        }else{
            $(this).addClass('closed');
            $('#sub_map_links').animate({'right':-maplinks_width}, 1200);
        }
    });


    /*
     * Add close buttons for .promo's
     */
    if($('.promo').length){
        $('.promo').append('<a href="#" class="close-promo">x</a>');
    }
    //only close its own parent
    $('.promo').on('click', '.close-promo', function(e){
        e.preventDefault();
        $(this).parent('.promo').animate({
            'height':0,
            'padding-top':0,
            'padding-bottom':0
        },{
            duration:500,
            queue:false
        }).fadeOut(500);
    });
});

/*
XXX Disabled because jerky on Android and makes map URL bar height too small on iPhone.
// Hide URL bar
$(window).load(function(){
    window.setTimeout(function(){
        var s = window.pageYOffset || document.compatMode === "CSS1Compat" && document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (s < 20 && !location.hash) {
            window.scrollTo(0, 1);
        }
    }, 0);
});
*/

