'use strict';
// External Libs
var fs          = require('fs');
var mkdirp      = require('mkdirp');
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

gulp.task('deploy', ['build', 'firebase:backup'], function(cb) {
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

/*
 * Primary method for creating new users
 * args:
 *  --email
 *  --password
 *  --first-name
 *  --last-name (optional)
 *  --admin (optional)
 *  --edit (optional)
 */
gulp.task('firebase:createuser', function(cb) {
  var argv = require('minimist')(process.argv.slice(2));
  var Firebase = require('firebase');
  var ref = new Firebase(config.env.firebase.location);
  ref.authWithCustomToken(config.env.firebase.secret, function(err, data) {
    if (err) {
      console.log('Login failed. ', err);
      cb();
    } else {
      ref.createUser({
        email: argv.email,
        password: argv.password
      }, function(err, userData) {
        if (err) {
          switch (err.code) {
            case "EMAIL_TAKEN":
              console.log("The new user account cannot be created because the email is already in use.");
            break;
            case "INVALID_EMAIL":
              console.log("The specified email is not a valid email.");
            break;
            default:
              console.log("Error creating user:", err);
            cb();
          }
        } else {
          console.log("Successfully created user account with uid:", userData.uid);
          ref.child(`users/${userData.uid}`).set({
            admin: !!argv.admin,
            email: argv.email,
            firstName: argv['first-name'],
            lastName: argv['last-name'],
            provider: 'password',
            createdOn: (new Date).toJSON()
          }, function(err) {
            if (err) {
              console.log("Error setting user data");
              cb();
            } else {
              console.log("User data has been set");
              cb();
            }
          })
        }
      })
    }
  })
});

gulp.task('firebase:backup', function(cb) {
  var Firebase = require('firebase');
  var ref = new Firebase(config.env.firebase.location);
  ref.authWithCustomToken(config.env.firebase.secret, function(err, data) {
    if (err) {
      console.log('Login failed. ', err);
      cb();
    } else {
      ref.on('value', function(snap) {
        console.log(snap.val());
        mkdirp.sync(`${__dirname}/backups`);
        fs.writeFileSync(`${__dirname}/backups/${(new Date()).toGMTString()}`,
                         JSON.stringify(snap.val()), 'utf8');
        cb();
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
