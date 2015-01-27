'use strict';

var PORT = process.env.PORT || 3000;

var _ = require('lodash');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var watchify = require('watchify');
var to5ify = require('6to5ify');
var del = require('del');
var source = require('vinyl-source-stream');

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var stylus = require('gulp-stylus');
var util = require('gulp-util');

var nib = require('nib');
var jeet = require('jeet');

var historyAPIFallback = require('connect-history-api-fallback');

function onError(error) {
  util.log('Error: ' + error.message);
  /*jshint validthis:true*/
  this.emit('end');
}

gulp.task('browser-sync', function() {
  return browserSync({
    browser: [],
    port: PORT,
    server: {
      baseDir: './dist',
      middleware: [historyAPIFallback]
    }
  });
});

gulp.task('js', function() {
  var bundler = watchify(browserify('./examples/js/index.jsx',
    _.assign({
      debug: true,
      extensions: ['.jsx']
    }, watchify.args)));

  bundler.transform(to5ify);

  function rebundle() {
    return bundler.bundle()
      .on('error', onError)
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('dist'))
      .pipe(browserSync.reload({stream: true, once: true}));
  }

  bundler
    .on('log', util.log)
    .on('update', rebundle);

  return rebundle();
});

gulp.task('stylus', function() {
  return gulp.src('examples/css/index.styl')
    .pipe(sourcemaps.init())
    .pipe(stylus({
      use: [
        nib(),
        jeet()
      ]
    }))
    .on('error', onError)
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('assets', function() {
  return gulp.src('./examples/assets/**/*')
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.reload({stream: true, once: true}));
});

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('default', [
  'assets',
  'stylus',
  'js',
  'browser-sync'
], function() {
  gulp.watch(['examples/css/**/*.styl'], ['stylus']);
  gulp.watch(['examples/assets/**/*'], ['assets']);
});
