'use strict';
// External Libs
var fs          = require('fs');
var url         = require('url');
var historyApiFallback = require('connect-history-api-fallback');
var gulp        = require('gulp');
var $           = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload      = browserSync.reload;
var runSequence = require('run-sequence');
var _           = require('lodash');

// Project Files
var manifest = require('tasks/manifest');

var secrets = JSON.parse(
  fs.readFileSync(`${__dirname}/config/secrets.json`)
);
var config = {
  dest: { root: `${__dirname}/build` },
  src: { root: `${__dirname}/app` },
  env: {
    production: process.env.NODE_ENV === 'production',
    firebase: {
      location: "https://record.firebaseio.com/",
      secret: secrets.firebase
    }
  }
};
config.dest.js       = `${config.dest.root}/js`;
config.dest.style    = `${config.dest.root}/css`;
config.dest.manifest = `${config.dest.root}/manifest.json`;
config.src.js        = `${config.src.root}/js`;
config.src.style     = `${config.src.root}/style`;
config.src.main      = `${config.src.js}/main.jsx`;


gulp.task('js', function () {
  return gulp.src(config.src.main, {read: false})
    .pipe( $.plumber({
      errorHandler: $.notify.onError("Err: <%= error.message %>")
    }) )
    .pipe( $.browserify({ debug: !config.env.production }) )
    .pipe( $.if(config.env.production, $.uglify({
      compress: {
        drop_console: true,
        dead_code: true
      }, screw_ie8: true
    })) )
    .pipe( $.rename('build.js') )
    .pipe( gulp.dest(config.dest.js) )
    .pipe( $.if(config.env.production, $.rev()) )
    .pipe( $.if(config.env.production, gulp.dest(config.dest.js)) )
    .pipe( $.if(config.env.production, $.rev.manifest({
      base: config.src.root,
      merge: true,
      path: config.dest.manifest
    })) )
    .pipe( $.if(config.env.production, gulp.dest(config.dest.root)) );
});

gulp.task('less', function() {
  gulp.src(`${config.src.style}/material-ui.less`)
    .pipe( $.less() )
    .pipe( $.postcss([require('css-mqpacker'), require('csswring')]) )
    .pipe( gulp.dest(config.dest.style) )
    .pipe( reload({stream: true }) )
    .pipe( $.if(config.env.production, $.rev()))
    .pipe( $.if(config.env.production, gulp.dest(config.dest.style)) )
    .pipe( $.if(config.env.production, $.rev.manifest({
      base: config.src.root,
      merge: true,
      path: config.dest.manifest
    })) )
    .pipe( $.if(config.env.production, gulp.dest(config.dest.root)) );
});

gulp.task('styles', function() {
  var autoprefixer = require('autoprefixer-core');
  var processors = [autoprefixer({
    browsers: ['last 2 versions']
  })]
  if (config.env.production) {
    processors.push(require('css-mqpacker'));
    processors.push(require('csswring'));
  }

  return gulp.src(`${config.src.style}/master.styl`)
    .pipe( $.if(!config.env.production, $.sourcemaps.init()) )
    .pipe( $.stylus() )
    .pipe( $.if(!config.env.production, $.sourcemaps.write()) )
    .pipe( $.postcss(processors) )
    .pipe( gulp.dest(config.dest.style) )
    .pipe( reload({stream: true}) )
    .pipe( $.if(config.env.production, $.rev()))
    .pipe( $.if(config.env.production, gulp.dest(config.dest.style)) )
    .pipe( $.if(config.env.production, $.rev.manifest({
      base: config.src.root,
      merge: true,
      path: config.dest.manifest
    })) )
    .pipe( $.if(config.env.production, gulp.dest(config.dest.root)) );
});

gulp.task('html', function (cb) {
  console.log(manifest(config.dest.manifest));
  return gulp.src(config.src.root + '/views/layout.jade')
    .pipe( $.jade({
      locals: _.assign({},
                       { production: config.env.production },
                       manifest(config.dest.manifest)),
      pretty: !config.env.production
    }) )
    .pipe( $.rename('index.html') )
    .pipe( gulp.dest(config.dest.root) )
    .pipe( $.rename('404.html') ) // redirect for gh-pages
    .pipe( gulp.dest(config.dest.root) )
});

gulp.task('extras', function() {
  return gulp.src(`${__dirname}/config/CNAME`)
    .pipe(gulp.dest(config.dest.root));
});

gulp.task('clean', function (cb) {
  return require('del')([config.dest.root], cb);
});

gulp.task('size', function () {
  return gulp.src(`${config.dest.root}/**/*`)
    .pipe( $.size({
      title: 'Build',
      gzip: 'True'
    }) );
});

gulp.task('build', function(cb) {
  return runSequence('clean',
              ['styles', 'less', 'js', 'extras'],
              'html',
              'size'
         , cb);
});

gulp.task('serve', ['build'], function() {
  browserSync({
    port: 9000,
    server: {
      baseDir: [config.dest.root],
      middleware: [historyApiFallback]
    }
  });

  gulp.watch("**/*.jade", ['html']);
  gulp.watch("**/*.styl", ['styles']);
  gulp.watch("**/*.less", ['less']);
  gulp.watch([
    "app/**/*.js",
    "app/**/*.jsx",
    "lib/**/*.js"
  ], ['js', reload]);
});

gulp.task('deploy', ['build'], function(cb) {
  var ghPages = require('gh-pages');
  return ghPages.publish(config.dest.root, cb);
});


gulp.task('firebase:rebuild', function(cb) {
  var Firebase = require('firebase');
  var ref = new Firebase(config.env.firebase.location);
  ref.authWithCustomToken(config.env.firebase.secret, function(err, data) {
    if (err) {
      cb(err);
    } else {
      var localData = JSON.parse(fs.readFileSync(`${__dirname}/data.json`));
      ref.set(localData, function(err) {
        console.log(localData);
        if (err) {
          cb(err);
        } else {
          cb();
        }
      });
    }
  });
});


gulp.task('firebase:template', function(cb) {
  var Firebase = require('firebase');
  var ref = new Firebase(config.env.firebase.location);
  ref.authWithCustomToken(config.env.firebase.secret, function(err, data) {
    if (err) {
      console.log('Login failed. ', err);
      cb();
    } else {
    }
  });
});