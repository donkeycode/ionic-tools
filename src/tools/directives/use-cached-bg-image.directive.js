function () {
    return {
        restrict: 'A',
        priority: 555,
        link: function useCachedImage(scope, element) {
            ImgCache.isBackgroundCached(element, function onSuccess(path, success) {
                if (success) {
                    // already cached
                    ImgCache.useCachedBackground(element);
                } else {
                    // not there, need to cache the image
                    ImgCache.cacheBackground(element, function cacheForNext() {
                        ImgCache.useCachedBackground(element);
                    });
                }
            });
        }
    };
}
