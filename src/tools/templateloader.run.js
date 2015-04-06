function($ionicTemplateLoader, $templateCache, $q, $log) {
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
}
