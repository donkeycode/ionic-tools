(function module() {
'use strict';

// dc.tools (tools)

angular

.module("dc.tools", [
    "ionic"
])

.run(["$templateCache", function cacheTemplates($templateCache) {
    $templateCache.put("dc.tools.directives.searchBar", "<div class=\"bar bar-grey1 bar-subheader item-input-inset item-input-search\">\n    <label class=\"item-input-wrapper\">\n        <i class=\"icon ion-ios-search placeholder-icon\"></i>\n        <input type=\"search\" id=\"search\" placeholder=\"{{'mobile.global.search.placeholder' | translate}}\" autocorrect=\"off\" autocapitalize=\"off\" ng-focus=\"searchIsFocused = true; searchFocusChanged(searchIsFocused)\">\n        <button data-tap-disabled=\"true\"\n                class=\"icon ion-close-circled button-close-search button-clear ng-hide show-if-search\"\n                ng-click=\"emptySearch(); focusSearch();\"></button>\n    </label>\n    <button data-tap-disabled=\"true\" class=\"button button-clear button-grey3 button-main ng-hide cancel-search\"\n            ng-click=\"emptySearch(); blurSearch(); broadcastCancel()\" translate=\"mobile.global.search.cancel\">\n    </button>\n</div>");
}])

.run(["$ionicTemplateLoader", "$templateCache", "$q", "$log", function templateloader($ionicTemplateLoader, $templateCache, $q, $log) {
    var oldFn = $ionicTemplateLoader.load;

    $ionicTemplateLoader.load = function fetchTemplate(url) {
        if ($templateCache.get(url)) {
            var defer = $q.defer();
            defer.resolve($templateCache.get(url));
            return defer.promise;
        }

        $log.debug('Template ' + url + ' not found in $templateCache');
        return oldFn(url);
    }
}])

.factory("dcToolsAutocacheImages", ["$log", "$filter", function autocacheImages($log, $filter) {
    /**
    * @ngdoc
    * Require : "imgcache.js"
    * @service dcToolsAutocacheImages
    * @usage
    * `````
    *
    * Init your app with
    * // ImageCache
      ImgCache.options.debug = true;

      // increase allocated space on Chrome to 50MB, default was 10MB
      ImgCache.options.chromeQuota = 50*1024*1024;
      ImgCache.options.usePersistentCache = true;

      ImgCache.init(function(){
        $log.debug('ImgCache init: success!');

        // from within this function you're now able to call other ImgCache methods
        // or you can wait for the ImgCacheReady event
        dcToolsAutocacheImages.ready();
      }, function(){
        $log.debug('ImgCache init: error! Check the log for errors');
      });
    *
    *
    * In your services
    * dcToolsAutocacheImages.cacheImages(
        response.data, // The json array
        'item.id', // path to build image /// item = root of row
        [ // Optional filter list to find the image

            "firstFilter", // Simple filter by string

            // Or by object to pass args
            {
                filter: "userIdToImageUrl",
                args: [
                    "someparam"
                ]
            }
        ]
    );
    * `````
    */
    var jsonPaths = [];

    var isReady = false;

    var processCache = function processCache() {
        if (!isReady) {
            return;
        }

        _.each(jsonPaths, function forEachCachedEntry(jsonPath) {
            _.each(jsonPath.json, function forEachJsonEntry(item) {
                try {
                    var imageValue = eval(jsonPath.jpath);

                    if (jsonPath.filters) {
                        _.each(jsonPath.filters, function applyFilter(filter) {
                            console.log(filter, typeof filter);

                            if (typeof filter === 'object') {
                                imageValue = $filter(filter.filter)(imageValue, filter.args);
                                return;
                            }
                            imageValue = $filter(filter)(imageValue);
                        });
                    }

                    ImgCache.cacheFile(imageValue, function onSuccess() {
                        $log.debug(imageValue, 'cached');
                    }, function onError() {
                        $log.debug(imageValue, 'not cached');
                    });
                } catch (e) {
                    return;
                }
            });
        });
    };

    return {
        ready: function ready() {
            isReady = true;

            $log.debug("AutoCacheImages.isReady", jsonPaths);
            processCache();
        },
        cacheImages: function cacheImages(json, jpath, filters) {
            $log.debug("AutoCacheImages.registerByJsonPath", json, jpath, filters);

            jsonPaths.push({
                jpath: jpath,
                json: json,
                filters: filters
            });

            processCache();
        }
    };
}])

.factory("dcToolsOnline", function online () {
    /**
    * @ngdoc
    * @service dcToolsOnline
    * @usage
    * `````
    * dcToolsOnline.isOnline();
    * `````
    */
    return {
        /**
        * @return true if brower is online
        */
        isOnline: function isOnline() {
            if (!window.cordova) {
                return navigator.onLine;
            }

            try {
                return "none" !== window.navigator.connection.type;
            } catch (e) {
                return navigator.onLine;
            }
        }
    };
})

.factory("dcToolsPushwoosh", ["dcCommonConfig", "$log", "$ionicPopup", "$location", "$rootScope", function pushwoosh (dcCommonConfig, $log, $ionicPopup, $location, $rootScope) {
    if (!window.cordova) {
        return {};
    }

    var pushNotification;

    var init = function init() {
        $log.debug('PushWooshService init');

        pushNotification = window.plugins.pushNotification;

        if (ionic.Platform.isIOS()) {
            pushNotification.onDeviceReady({
                pw_appid: dcCommonConfig.pushwoosh.AppId,
            });
        } else {
            pushNotification.onDeviceReady({
                pw_appid: dcCommonConfig.pushwoosh.AppId,
                projectid: dcCommonConfig.pushwoosh.googleProjectNumber
            });
        }
    };

    return {
        registerListener: function registerListener() {
            pushNotification = window.plugins.pushNotification;

            //set push notification callback before we initialize the plugin
            document.addEventListener('push-notification', function onNotificationRecieved(event) {
                //get the notification payload
                var notification = event.notification;

                if (notification.userdata.url) {
                    //display alert to the user for example
                    var confirmPopup = $ionicPopup.confirm({
                        title: notification.userdata.title || "Notification",
                        template: notification.userdata.message || notification.aps.alert,
                        okText: "Voir",
                        cancelText: "Annuler"
                    });

                    confirmPopup.then(function onPopupConfirmed(res) {
                        if (res) {
                            $location.path(notification.userdata.url);
                        }
                    });
                }

                //clear the app badge
                pushNotification.setApplicationIconBadgeNumber(0);
            });

            document.addEventListener("resume", function onAppResumed() {
                pushNotification.setApplicationIconBadgeNumber(0);
            }, false);

            pushNotification.setApplicationIconBadgeNumber(0);
        },
        registerDevice: function registerDevice(tags) {
            init();
            //register for pushes
            pushNotification.registerDevice(
                function onSuccess(status) {
                    $log.debug('registerDevice: ' + status.deviceToken);

                    if (tags) {
                        pushNotification.setTags(tags);
                    }

                    $rootScope.broadcast('push:registerDevice', {
                        devicetoken: status.deviceToken,
                        tags: tags
                    });
                },
                function onError(status) {
                    $log.debug('failed to register : ' + JSON.stringify(status));
                    $ionicPopup.alert({
                        title: 'Push',
                        template: "Impossible de vous enregistrer au push"
                    });
                }
            );

        }
    };
}])

.factory("dcToolsTranslation", ["dcCommonConfig", "$log", "$q", "$http", function translation (dcCommonConfig, $log, $q, $http) {
    return function getTranslations(options) {
        var deferred = $q.defer();

        $log.debug("Run dcToolsTranslation");

        $http.get(dcCommonConfig.lang.api).then(function getLang(translations) {
            if (translations.data[options.key]) {
                $log.debug("Translations find with key : '" + options.key + "'");
                deferred.resolve(translations.data[options.key]);
            } else {
                $log.debug("Translations not find with key : '" + options.key + "'");
            }
        });

        return deferred.promise;
    };
}])

.directive("dcToolsBlurOnScroll", function blurOnScroll () {
    /**
    * @ngdoc directive
    * @description blur all focused when the content is scrolled
    * @usage
    * <ion-content dc-tools-blur-scroll></ion-content>
    *
    */
    return {
        restrict: 'A',
        link: function link($scope, $element) {
            $element.on('touchmove', function onTouchMove() {
                if (!ionic.scroll.isScrolling) {
                    return;
                }

                if (document.activeElement) {
                    document.activeElement.blur();
                }
            });

            $scope.$on('$destroy', function onDestroy() {
                $element.off('touchmove');
            });
        }
    };
})

.directive("dcToolsConfirmClick", ["$ionicPopup", function confirmClick($ionicPopup) {
    /**
    * @ngdoc directive
    * @description open a yes/no confirm modal
    * @params {expression} confirmed-click confirm function
    * @usage
    * <a dc-tools-confirm-click="Are you sure ?"
    *       confirmed-click="doIt()"
    *       confirm-click-title="Title of alert">Link</a>
    *
    */
    return {
        restrict: 'A',
        link: function link(scope, element, attr) {
            var msg = attr.dcCommonConfirmClick || "Are you sure?";
            var clickAction = attr.confirmedClick;
            element.bind('click', function onElementClicked() {
                var confirmPopup = $ionicPopup.confirm({
                    title: attr.confirmClickTitle,
                    template: msg,
                    okType: 'button-positive',
                    cancelText: "Non",
                    okText: "Oui"
                });

                confirmPopup.then(function onPopupClose(res) {
                    if (res) {
                        scope.$eval(clickAction);
                    }
                });
            });
        }
    };
}])

.directive("dcToolsHeaderShrink", ["$document", "$ionicSlideBoxDelegate", function headerShrink ($document, $ionicSlideBoxDelegate) {
    /**
    * @ngdoc directive
    * @description shrink search header on content scroll
    * @usage
    * <ion-content dc-tools-header-shrink></ion-content>
    *
    */
    var shrink = function shrink(header, content, amt, headerHeight) {
        amt = Math.min(44, amt);

        ionic.requestAnimationFrame(function requestAnimationFrame () {
            header.style[ionic.CSS.TRANSFORM] = 'translate3d(0, -' + amt + 'px, 0)';

            if (headerHeight) {
                content.style.top = (headerHeight) + 'px';
            }
        });
    };

    return {
        restrict: 'A',
        link: function link($scope, $element, $attr) {
            var starty = $scope.$eval($attr.alMobileHeaderShrink) || 40;
            var orgStarty = starty;
            var shrinkAmt;
            $element.bind('scroll', function scrollBind(e) {
                var header = $document[0].body.querySelector($attr.shrinkSelector  || '.bar-subheader');

                if (!header) {
                    return;
                }

                if ($scope.searchIsFocused) {
                    return;
                }

                var scrollTop = e.detail ? e.detail.scrollTop : $element.scrollTop();

                var headerHeight = header.offsetHeight;
                shrinkAmt = headerHeight - (headerHeight - (scrollTop - starty));

                if (shrinkAmt >= headerHeight) {
                    //header is totaly hidden - start moving startY downward so that when scrolling up the header starts showing
                    starty = scrollTop - headerHeight;
                    shrinkAmt = headerHeight;
                } else if (shrinkAmt < 0) {
                    //header is totaly displayed - start moving startY upwards so that when scrolling down the header starts shrinking
                    starty = Math.max(orgStarty, scrollTop);
                    shrinkAmt = 0;
                }

                shrink(header, $element[0], shrinkAmt, $attr.shrinkSelector  ? ((parseInt($attr.shrinkHeaderHeight, 10) || 0) + headerHeight) : null);  //do the shrinking

            });
        }
    };
}])

.directive("dcToolsSearchBar", ["$timeout", "$rootScope", function searchBar ($timeout, $rootScope) {
    /**
    * @ngdoc directive
    * @description search bar
    * @usage
    * <dc-tools-search-bar ng-model="search" search="onSearchChanged(term)"></dc-tools-search-bar>
    *
    */
    return {
        restrict: 'E',
        templateUrl: 'dc.tools.directives.searchBar',
        require: 'ngModel',
        scope: {
            ngModel: '=',
            search: '&'
        },
        link: function link(scope, elm, attr, ngModelCtrl) {
            var input = angular.element(elm[0].querySelector('input'));

            var toggleShowIfSearch = function toggleShowIfSearch() {
                if (input.val() !== "") {
                    elm[0].querySelector('.show-if-search').classList.remove('ng-hide');
                } else {
                    elm[0].querySelector('.show-if-search').classList.add('ng-hide');
                }
            };

            input.unbind('input');

            var debounceTimeout;

            input.bind('input', function inputBind() {
                $timeout.cancel(debounceTimeout);
                toggleShowIfSearch();

                debounceTimeout = $timeout(function debounceTimeout() {
                    scope.$apply(function debounceApply() {
                        ngModelCtrl.$setViewValue(input.val());
                    });
                }, attr.ngDebounce || 100);
            });

            input.bind('blur', function inputBlur() {
                scope.$apply(function inputBlurApply() {
                    ngModelCtrl.$setViewValue(input.val());

                    if (!scope.ngModel) {
                        scope.searchIsFocused = false;
                        scope.searchFocusChanged(false);
                    }

                    if (input.val() === "") {
                        scope.broadcastCancel();
                    }
                });
            });

            ngModelCtrl.$viewChangeListeners.push(function ngModelListeners() {
                scope.search({
                    term: ngModelCtrl.$viewValue
                });
            });

            scope.searchIsFocused = false;
            // Toggle on event
            scope.searchFocusChanged = function searchFocusChanged(isFocused) {
                if (isFocused) {
                    elm[0].querySelector('.cancel-search').classList.remove('ng-hide');
                } else {
                    elm[0].querySelector('.cancel-search').classList.add('ng-hide');
                }
            };

            scope.focusSearch = function focusSearch() {
                $timeout(function delayFocusSearch() {
                    document.getElementById('search').focus();
                    scope.searchIsFocused = true;
                    scope.searchFocusChanged(true);
                });
            };

            scope.emptySearch = function emptySearch() {
                $timeout(function emptySearchTimeout() {
                    scope.ngModel = '';
                    input.val('');
                    toggleShowIfSearch();
                    ngModelCtrl.$setViewValue(scope.ngModel);
                    scope.broadcastCancel();
                });
            };

            scope.blurSearch = function blurSearch() {
                scope.searchIsFocused = false;

                $timeout(function delayBlurSearch() {
                    document.activeElement.blur();

                    if (!scope.ngModel) {
                        scope.searchFocusChanged(false);
                    }
                });
            };

            scope.broadcastCancel = function broadcastCancel() {
                $rootScope.$broadcast('cancel.search');
            };
        }
    };
}])

.directive("dcToolsTabsHeader", ["$ionicSlideBoxDelegate", "$ionicScrollDelegate", function tabsHeader ($ionicSlideBoxDelegate, $ionicScrollDelegate) {
    return {
        restrict: 'A',
        link: function link($scope, $element, attrs) {
            $scope.goToSlide = function goToSlide(index) {
                $ionicSlideBoxDelegate.slide(index);
            };

            $scope.$parent.slideChanged = function slideChanged(index) {
                if ($scope.$parent.afterSlideChanged) {
                    $scope.$parent.afterSlideChanged(index);
                }

                $scope.activeTab = index;
                $scope.isDragUp = false;

                if (!document.querySelector(".bar.tabs")) {
                    return;
                }

                var tabs = $element[0].getElementsByClassName('tab-item');

                _.forEach(tabs, function forEachTab(tab) {
                    tab.classList.remove('active');
                });

                if (tabs && tabs[index]) {
                    tabs[index].classList.add('active');
                }

                var lft = $element[0].getBoundingClientRect().width * (index / $ionicSlideBoxDelegate.slidesCount());
                lft -= $element[0].getBoundingClientRect().width * (1 / $ionicSlideBoxDelegate.slidesCount());
                $ionicScrollDelegate.$getByHandle(attrs.delegateHandle).scrollTo(lft, 0, true);
            };
        }
    };
}])

.directive("dcToolsUseCachedBgImage", function useCachedBgImage () {
    return {
        restrict: 'A',
        priority: 555,
        link: function useCachedImage(scope, element) {
            ImgCache.isBackgroundCached(element.attr('src'), function onSuccess(path, success) {
                if (success) {
                    // already cached
                    ImgCache.useCachedBackground(element);
                } else {
                    // not there, need to cache the image
                    ImgCache.cacheBackground(element.attr('src'), function cacheForNext() {
                        ImgCache.useCachedBackground(element);
                    });
                }
            });
        }
    };
})

.directive("dcToolsUseCachedImage", function useCachedImage () {
    return {
        restrict: 'A',
        priority: 555,
        link: function useCachedImage(scope, element) {
            ImgCache.isCached(element.attr('src'), function onSuccess(path, success) {
                if (success) {
                    // already cached
                    ImgCache.useCachedFile(element);
                } else {
                    // not there, need to cache the image
                    ImgCache.cacheFile(element.attr('src'), function cacheForNext() {
                        ImgCache.useCachedFile(element);
                    });
                }
            });
        }
    };
})

.filter("dcToolsHighlight", function highlight () {
    /**
    * @ngdoc filter
    * @description remove html tags
    * @usage
    * <p ng-bind-html="article.body | dcToolsStriptags | dcToolsHighlight:search"></p>
    *
    */
    return function highLight(str, highlight) {
        if (undefined === str) {
            return str;
        }

        if (highlight !== undefined && highlight !== '') {
            var strippedString = str.replace(/(<([^>]+)>)/gi, '');
            var rgxp = new RegExp("(" + highlight.replace(' ', '|') + ")", 'ig');
            var repl = '<span class="highlight">$1</span>';
            str = strippedString.replace(rgxp, repl);
        }

        return str;
    };
})

.filter("dcToolsStriptags", function striptags () {
    /**
    * @ngdoc filter
    * @description remove html tags
    * @usage
    * <p ng-bind-html="article.body | dcToolsStriptags"></p>
    *
    */
    return function cleanTags(str) {
        if (!str) {
            return '';
        }
        return str.replace(/(<([^>]+)>)/gi, '');
    };
})
;
})();
