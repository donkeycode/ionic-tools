This project is a coolection of tools to quickly start one [ionicframework](http://ionicframework.com/) app

This project is built using [ng-build](https://github.com/izeau/ng-build)

You can see sample of usage with our [ionic-init](https://github.com/donkeycode/ionic-init) project

# How to install

````
bower install --save donkeycode-ionic-tools
````

In your ionic app add `dc.tools` dep

````
.module("dc.bootstrap", [
    "ionic",
    "angularMoment",
    "angular-data.DSCacheFactory",
    "pascalprecht.translate",
    "ngCordova",
    "truncate",
    "dc.tools",
    "dc.common",
    "dc.home"
])
`````

# What is in ?

## Structure

In the structure folder, you will find a base template for `ngIndex` (ng-build) specially created for ionic

```` js
.pipe(ngIndex({
    main: 'dc.bootstrap',
    baseTemplate: __dirname + '/bower_components/donkeycode-ionic-tools/structure/layout.template.html'
}))
````

## SCSS

````
@import "../../bower_components/donkeycode-ionic-tools/scss/tools";
````

This scss contains some hooks to help you skin tabs and list.

## Services

### dcToolsOnline

Help you check if connection is online switching mode depends if you have cordova or not

````
dcToolsOnline.isOnline()
````

### dcToolsPushwoosh

Help you to register user to pushwoosh

Configure a `dcCommonConfig` constant

`````
{
    "pushwoosh": {
        "AppId": "YOUR_APP_ID",
        "googleProjectNumber": "YOUR_PROJECT_NUMBER"
    }
}
`````

At ionic start call :

`````
if (window.cordova && window.plugins.pushNotification) {
    dcToolsPushWoosh.registerListener();
}
`````

To register a device call

`````
dcToolsPushWoosh.registerDevice(tags)
`````

### dcToolsTranslation

Configure a `dcCommonConfig` constant

`````
{
    "lang": {
        "api": "./mocks/lang.json",
    }
}
`````

Configure translator :

`````
function ($translateProvider) {
    $translateProvider.preferredLanguage('fr');
    $translateProvider.fallbackLanguage('en');
    $translateProvider.useLoader('dcToolsTranslation');
}
`````

## Filters

### Striptags

````
<p ng-bind-html="article.body | dcToolsStriptags"></p>
````

### Highlight

````
<p ng-bind-html="article.body | dcToolsStriptags | dcToolsHighlight:search"></p>
````

## Directives

### Tabs headers

Add method goToSlide and slideChanged to connect a slidebox to tabs header

````
<ion-view view-title="Article">
    <ion-header-bar class="bar tabs tabs2 bar-subheader bar-white" no-tap-scroll="true">
        <ion-scroll
            direction="x"
            scrollbar-x="false"
            scrollbar-y="false"
            delegate-handle="tab_header"
            class="scroll-view ionic-scroll tabs-header"
            dc-tools-tabs-header>
                <a class="tab-item active" ng-click="goToSlide(0)">Details</a>
                <a class="tab-item" ng-click="goToSlide(1);">Sample</a>
        </ion-scroll>
    </ion-header-bar>

    <ion-slide-box show-pager="false" on-slide-changed="slideChanged($index)">
        <ion-slide>
            <ion-content>
                First slide
            </ion-content>
        </ion-slide>
        <ion-slide>
            <ion-content>
                Second slide
            </ion-content>
        </ion-slide>
    </ion-slide-box>
</ion-view>
````

### Search bar

````
<dc-tools-search-bar ng-model="search" search="onSearchChanged(term)"></dc-tools-search-bar>
````

### Header shrink

Shrink search bar when scroll to got more space

````
<dc-tools-search-bar ng-model="search" search="onSearchChanged(term)"></dc-tools-search-bar>
<ion-content class="has-header-shrink" scroll-event-interval="5" dc-tools-header-shrink dc-tools-blur-scroll>
````

### Blur on scroll

Focus out all focused fields when content is scrolled

````
<dc-tools-search-bar ng-model="search" search="onSearchChanged(term)"></dc-tools-search-bar>
<ion-content class="has-header-shrink" scroll-event-interval="5" dc-tools-header-shrink dc-tools-blur-scroll>
````

### Confirm click

Call an action only when modal is confirmed

````
<a dc-tools-confirm-click="Are you sure ?"
           confirmed-click="doIt()"
           confirm-click-title="Title of alert">Link</a>
````
