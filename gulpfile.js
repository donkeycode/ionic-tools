var gulp       = require('gulp');
var ngBuild    = require('ng-build');
var wiredep    = require('wiredep');
var bower      = require('bower');
var queue      = require('streamqueue');
var del        = require('del');
var rename     = require('gulp-rename');
var ngAnnotate = require('gulp-ng-annotate');
var cache      = require('gulp-cached');
var plumber    = require('gulp-plumber');
var remember   = require('gulp-remember');
var jscs       = require('gulp-jscs');
var path       = require('path');

var ngBlock    = ngBuild.ngBlock;
var ngIndex    = ngBuild.ngIndex;
var ngLint     = ngBuild.ngLint;
var ngModule   = ngBuild.ngModule;
var ngProvider = ngBuild.ngProvider;
var ngStore    = ngBuild.ngStore;
var ngStyle    = ngBuild.ngStyle;
var ngTemplate = ngBuild.ngTemplate;
var ngWire     = ngBuild.ngWire;
var ngWrap     = ngBuild.ngWrap;

process.env.ENV = process.env.ENV || 'dev';

gulp.task('default', ['build']);

var clean = function clean(what) {
    var taskName = 'clean:' + what;

    gulp.task(taskName, function(done) {
        del('build/' + what, done);
    });

    return taskName;
};

gulp.task('bower', function(done) {
    bower.commands.install().on('end', function() { done(); });
});

gulp.task('ng-modules', function() {
    return gulp
        .src('src/**/module.json')
        .pipe(plumber())
        .pipe(cache('modules'))
        .pipe(ngModule({ prefix: 'dc' }))
        .pipe(ngStore.register('modules'))
        .pipe(remember('modules'));
});

gulp.task('ng-templates', function() {
    return gulp
        .src('src/**/*.template.html')
        .pipe(plumber())
        .pipe(cache('templates'))
        .pipe(ngTemplate())
        .pipe(ngStore.register('templates'))
        .pipe(remember('templates'));
});

gulp.task('ng-blocks', function() {
    return gulp
        .src([
            'src/**/*.config.js',
            'src/**/*.run.js'
        ])
        .pipe(plumber())
        .pipe(cache('blocks'))
        .pipe(ngBlock())
        .pipe(ngStore.register('blocks'))
        .pipe(remember('blocks'));
});

gulp.task('ng-providers', function() {
    return gulp
        .src([
            'src/**/*.provider.js',
            'src/**/*.constant.json',
            'src/**/*.factory.js',
            'src/**/*.directive.js',
            'src/**/*.filter.js',
            'src/**/*.controller.js'
        ])
        .pipe(plumber())
        .pipe(cache('providers'))
        .pipe(ngProvider())
        .pipe(ngStore.register('providers'))
        .pipe(remember('providers'));
});

gulp.task('ng-scripts', [clean('js'), 'ng-modules', 'ng-templates', 'ng-blocks', 'ng-providers'], function() {
    return ngStore.stream()
        .pipe(plumber())
        .pipe(cache('scripts'))
        .pipe(ngWire())
        .pipe(ngWrap())
        .pipe(ngAnnotate())
        .pipe(jscs())
        .pipe(remember('scripts'))
        .pipe(gulp.dest('build/js/'));
});

gulp.task('ng-lint', ['ng-modules', 'ng-blocks', 'ng-providers'], function() {
    return ngStore.stream()
        .pipe(plumber())
        .pipe(ngLint())
        .pipe(ngLint.reporter());
});

gulp.task('build', ['bower', 'ng-scripts']);

gulp.task('dev', ['build'], function() {
    gulp.watch('src/**/*.{html,js,json}', ['ng-scripts']);
});

