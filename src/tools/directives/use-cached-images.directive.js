function () {
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
}
