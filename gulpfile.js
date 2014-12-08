'use strict';

var PORT = process.env.PORT || 3000;

var browserSync = require('browser-sync');
var browserify = require('browserify');
var reactify = require('reactify');
var watchify = require('watchify');
var del = require('del');
var es6ify = require('es6ify');
var source = require('vinyl-source-stream');

var gulp = require('gulp');
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
    Object.assign({
      debug: true,
      extensions: ['.jsx']
    }, watchify.args)));

  bundler
    .transform(reactify)
    .transform(es6ify.configure(/.jsx/));

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
    .pipe(stylus({
      use: [
        nib(),
        jeet()
      ],
      sourcemap: { inline: true }
    }))
    .on('error', onError)
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.reload({stream: true, once: true}));
});

gulp.task('assets', function() {
  return gulp.src('./examples/assets/**/*')
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('traceur-runtime', function() {
  return gulp.src(es6ify.runtime)
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('default', [
  'assets',
  'traceur-runtime',
  'stylus',
  'js',
  'browser-sync'
], function() {
  gulp.watch(['examples/css/**/*.styl'], ['stylus']);
  gulp.watch(['examples/assets/**/*'], ['assets']);
});
