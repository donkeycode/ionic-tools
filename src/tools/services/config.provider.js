function() {
    this.config = {
        lang: {
            api: ""
        },
        pushwoosh: {
            AppId: "",
            googleProjectNumber: ""
        }
    };

    this.$get = function unicornLauncherFactory() {
        return this.config;
    };
}
