function (dcToolsConfig, $log, $ionicPopup, $location, $rootScope) {
    if (!window.cordova) {
        return {};
    }

    var pushNotification;

    var init = function init() {
        $log.debug('PushWooshService init');

        pushNotification = window.plugins.pushNotification;

        if (ionic.Platform.isIOS()) {
            pushNotification.onDeviceReady({
                pw_appid: dcToolsConfig.pushwoosh.AppId,
            });
        } else {
            pushNotification.onDeviceReady({
                pw_appid: dcToolsConfig.pushwoosh.AppId,
                projectid: dcToolsConfig.pushwoosh.googleProjectNumber
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
                    var deviceToken;
                    
                    // Android
                    if (_.isObject(status)) {
                        deviceToken = status.deviceToken;
                    } else { // IOS
                        deviceToken = status;
                    }

                    $log.debug('registerDevice: ' + deviceToken);

                    if (tags) {
                        pushNotification.setTags(tags);
                    }

                    $rootScope.$broadcast('push:registerDevice', {
                        devicetoken: deviceToken,
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

        },
        unregisterDevice: function registerDevice() {
            init();
            //register for pushes
            pushNotification.unregisterDevice(
                function onSuccess(deviceToken) {
                    $log.debug('unRegisterDevice: ' + deviceToken);

                    $rootScope.$broadcast('push:unRegisterDevice', {
                        devicetoken: deviceToken
                    });
                },
                function onError(status) {
                    $log.debug('failed to register : ' + JSON.stringify(status));
                }
            );
        }
    };
}
