function () {
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
}
