let PreviewContainer = require('../components/PreviewContainer').default;
let PreviewActions = require('../actions/PreviewActions');
let Constants = require('../costansts');
let Store = require('../store/PreviewsStore');
let interact = require('interactjs');


(function() {
    var originalSetEvents = UI.setEvents;
    var originalSetLastSegmentFromLocalStorage = UI.setLastSegmentFromLocalStorage;
    var originalActiveteSegment = UI.activateSegment;
    var originalAnimateScroll = UI.animateScroll;
    $.extend(UI, {
        windowPreview: null,

        scrollSelector: "#outer",

        setEvents: function () {
            let self  = this;
            originalSetEvents.apply(this);

            // To make tab Footer messages opened by default
            // SegmentActions.registerTab('messages', true, true);

            this.createPreviewContainer();

            Store.addListener(Constants.SELECT_SEGMENT, this.selectSegment.bind(this));
            Store.addListener(Constants.OPEN_WINDOW, this.openWindow.bind(this));
            Store.addListener(Constants.CLOSE_WINDOW, this.closePreview.bind(this));

            $(document).on('click', '.open-screenshot-button', this.openPreview.bind(this));

            interact('#plugin-mount-point')
                .resizable({
                    preserveAspectRatio: true,
                    edges: { left: false, right: false, bottom: false, top: true }
                })
                .on('resizemove', function (event) {
                    var target = event.target,
                        x = (parseFloat(target.getAttribute('data-x')) || 0),
                        y = (parseFloat(target.getAttribute('data-y')) || 0);



                    // update the element's style
                    // target.style.width  = event.rect.width + 'px';
                    if (event.rect.height > (window.innerHeight -26) || event.rect.height < 82) {
                        return
                    }
                    target.style.height = event.rect.height + 'px';

                    var outerH = window.innerHeight - event.rect.height;
                    $('#outer').height(outerH);

                    // translate when resizing from top or left edges
                    // x += event.deltaRect.left;
                    y += event.deltaRect.top;

                    // target.style.webkitTransform = target.style.transform =
                        'translate(' + x + 'px,' + y + 'px)';

                    // target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                    // target.textContent = Math.round(event.rect.width) + '×' + Math.round(event.rect.height);
                });

        },
        activateSegment: function (segment) {
            originalActiveteSegment.apply(this, segment);
            let sid = UI.getSegmentId(segment);
            this.hideShowSegmentButton(sid);

        },
        animateScroll: function (segment, speed) {
            var scrollAnimation = $( UI.scrollSelector ).stop().delay( 300 );
            var pos ;
            var prev = segment.prev('section') ;

            // XXX: this condition is necessary **only** because in case of first segment of a file,
            // the previous element (<ul>) has display:none style. Such elements are ignored by the
            // the .offset() function.
            var commonOffset = $('.header-menu').height() +
                $('.searchbox:visible').height() ;

            if ( prev.length ) {
                pos = prev.offset().top  - prev.offsetParent('#outer').offset().top + commonOffset;
            } else {
                pos = 0;
            }

            scrollAnimation.animate({
                scrollTop: pos
            }, speed);

            return scrollAnimation.promise() ;
        },
        hideShowSegmentButton: function(sid) {
            if (this.segmentsPreviews) {
                var segmentPreview = this.segmentsPreviews.segments.find(function (item) {
                    return item.segment === parseInt(sid);
                });
                if (_.isUndefined(segmentPreview) || segmentPreview.previews.length === 0) {
                    UI.getSegmentById(sid).find('.segment-options-container').remove();
                }
            }
        },
        openWindow: function () {
            if (this.windowPreview && !this.windowPreview.closed) {
                this.windowPreview.focus()
            } else {
                window.addEventListener("storage", this.selectSegmentFromPreview.bind(this), true);
                let url = '/plugins/paypal/preview?id='+ config.id_job + '&pass=' + config.password;
                this.windowPreview = window.open(url, "_blank", "toolbar=no,scrollbars=yes,resizable=no,top=500,left=500,width=1024,height=600");
            }
            this.closePreview();
        },
        selectSegment: function (sid) {
            var el = $("section:not(.opened) #segment-" + sid + "-target").find(".editarea, .targetarea");
            if (el.length > 0 ) {
                UI.editAreaClick(el[0]);
            }
        },
        selectSegmentFromPreview: function (e) {
            if (e.key === UI.localStorageCurrentSegmentId) {
                this.gotoSegment(e.newValue);
            }
        },
        createPreviewContainer: function () {
            let storageKey = 'currentSegmentId-' +config.id_job + config.password;
            let currentId = localStorage.getItem(storageKey);
            let mountPoint = $("#plugin-mount-point")[0];
            let self = this;
            ReactDOM.render(React.createElement(PreviewContainer, {
                sid: currentId,
                classContainer: "preview-core-container",
                showInfo: false,
                showFullScreenButton: true
            }), mountPoint);
            this.getPreviewData().done(function (response) {
                self.segmentsPreviews = response.data;
                self.hideShowSegmentButton(currentId);
                PreviewActions.renderPreview(currentId, response.data);
            });
        },

        getPreviewData: function () {
            return $.ajax({
                async: true,
                type: "get",
                url : "/plugins/paypal/preview/" + config.id_job + "/" + config.password
            });
        },

        setLastSegmentFromLocalStorage: function (segmentId) {
            setTimeout(function () {
                PreviewActions.updatePreview(segmentId);
            });
            originalSetLastSegmentFromLocalStorage.call(this, segmentId);
        },

        closePreview: function () {
            $('#plugin-mount-point').css('height', 0);
            $('#outer').css('height', '100%');
            $('.segment-options-container').show();
        },

        openPreview: function () {
            $('#plugin-mount-point').css('height', '50%');
            $('#outer').css('height', '50%');
            setTimeout(function () {
                UI.scrollSegment(UI.currentSegment);
            }, 100);
            $('.segment-options-container').hide();

        },


    });

})() ;