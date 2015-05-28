function($log, $filter) {
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
}
