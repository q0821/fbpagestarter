(function( $ ) { 
  $.fn.fbStarter= function(options) {
    var settings = $.extend({
        appId              : '',
        pageId             : '',
        status             : true,
        cookie             : true,
        xfbml              : true,
        locales            : 'en_US',
        frictionlessRequests : true,
        canvasUrl          : '',

        activeFangate      : false,
        likedPage          : 'like-wrapper',
        unlikePage         : 'unlike-wrapper',
        permissionsSuccess : function(){},
        permissionsFail    : function(){},
        dialogSuccess      : function(){},
        dialogFail         : function(){}
    }, options);

    var channelUrl = settings.canvasUrl + '/channel.html';

    // FB initiation
    // -------------------------------------------------------------------
    window.fbInit = window.fbInit || false;
    if (window.fbInit) {
      $(document).trigger('fb:initialized');
      if (settings.xfbml) {
        FB.XFBML.parse();
      }
      return;
    }
    // Aync Init
    window.fbAsyncInit = function() {
      window.fbInit = true;
      $(document).trigger('fb:initializing');
      FB.init(settings);
      $(document).trigger('fb:initialized');

      // Check like page status
      if(settings.activeFangate){
        FB.getLoginStatus(function(response) {
          if (response.status == 'connected') {
            var user_id = response.authResponse.userID;
            var page_id = settings.pageId; //coca cola
            var fql_query = "SELECT uid FROM page_fan WHERE page_id =" + page_id + " and uid=" + user_id;
            var the_query = FB.Data.query(fql_query);

            the_query.wait(function(rows) {
              if (rows.length == 1 && rows[0].uid == user_id) {
                $('#'+settings.likedPage).show();
              } else {
                $('#'+settings.unlikePage).show();
              }
            });
          } else {
            console.log('not login');
          }
        });
      }
    };
    // Append fb-root
    var fbRoot = 'fb-root';
    if (!document.getElementById(fbRoot)) {
      var element = document.createElement('div');
      element.id = fbRoot;
      document.body.appendChild(element);
    }
    // Add Facebook Javascript SDK
    var js, id = 'facebook-jssdk'; 
    if (!document.getElementById(id)) {
      js = document.createElement('script'); 
      js.id = id; 
      js.async = true;
      js.src = "//connect.facebook.net/" + settings.locales + "/all.js";
      document.getElementsByTagName('head')[0].appendChild(js);
    }


    // Main functions
    // -------------------------------------------------------------------
    return this.each( function() {
      var $this = $(this);
        
      $('.fb-dialog').click(function(e){
        e.preventDefault();
        var dialogType = $(this).data('fbactiontype');
        
        switch (dialogType) {
          case 'install_page': 
            installToPage();
          break;

          case 'permissions': 
            var getPermissions = $(this).data('permissions');
            permissions(getPermissions);
          break;
          
          case 'share': 
            var obj = {
               method:      'feed',
               link:        $(this).data('link'),
               picture:     $(this).data('picture'),
               title:       $(this).data('title'),
               caption:     $(this).data('caption'),
               description: $(this).data('description')
             };
             callUI(obj);
          break;

          case 'requests':
            var obj = {
               method:  'apprequests',
               message: $(this).data('message')
             };
             callUI(obj);
          break;

          case 'send':
            var obj = {
              method: 'send',
              name:    $(this).data('name'),
              picture: $(this).data('picture'),
              link:    $(this).data('link')
            };
            callUI(obj);
          break;
        };
      });

      // Add tab to page
      function installToPage(){
        var redirect_uri = settings.canvasUrl + 'install_to_page.html';
        FB.ui({
          method: 'pagetab',
          redirect_uri: redirect_uri
        }, function(response) {
          if (response != null && response.tabs_added != null) {
            $.each(response.tabs_added, function(pageid) {
            FB.api(pageid, function(response) {
              $('#msg').text('Your tab has already been installed');
            });
          });
          } else {
            $('#msg').text('Action cancelled, unable to install a page');
          }
        });
      };

      // Get permissions
      function permissions(getPermissions){
        FB.login(function(response) {
          if (response.authResponse) {
            if ( $.isFunction( settings.permissionsSuccess ) ) {
              settings.permissionsSuccess.call( this );
            }
          } else {
            if ( $.isFunction( settings.permissionsFail ) ) {
              settings.permissionsFail.call( this );
            }
          }
        }, {scope: getPermissions});
      };

      // Post to timeline
      function callUI(obj){
        FB.ui(obj,function(response) {
          if (response && response.post_id) {
            if ( $.isFunction( settings.dialogSuccess ) ) {
              settings.dialogSuccess.call( this );
            }
          } else {
            if ( $.isFunction( settings.dialogFail ) ) {
              settings.dialogFail.call( this );
            }
          }
        });
      };


    });
  };
})( jQuery );
