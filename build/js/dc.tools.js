(function module() {
'use strict';

// dc.tools (tools)

angular

.module("dc.tools", [])

.run(["$templateCache", function cacheTemplates($templateCache) {
    $templateCache.put("dc.tools.directives.searchBar", "<div class=\"bar bar-grey1 bar-subheader item-input-inset item-input-search\">\n    <label class=\"item-input-wrapper\">\n        <i class=\"icon ion-ios-search placeholder-icon\"></i>\n        <input type=\"search\" id=\"search\" placeholder=\"{{'mobile.global.search.placeholder' | translate}}\" autocorrect=\"off\" autocapitalize=\"off\" ng-focus=\"searchIsFocused = true; searchFocusChanged(searchIsFocused)\">\n        <button data-tap-disabled=\"true\"\n                class=\"icon ion-close-circled button-close-search button-clear ng-hide show-if-search\"\n                ng-click=\"emptySearch(); focusSearch();\"></button>\n    </label>\n    <button data-tap-disabled=\"true\" class=\"button button-clear button-grey3 button-main ng-hide cancel-search\"\n            ng-click=\"emptySearch(); blurSearch(); broadcastCancel()\" translate=\"mobile.global.search.cancel\">\n    </button>\n</div>");
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
                pw_appid: dcCommonConfig.PushwooshAppId,
            });
        } else {
            pushNotification.onDeviceReady({
                pw_appid: dcCommonConfig.PushwooshAppId,
                projectid: dcCommonConfig.googleProjectNumber
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
