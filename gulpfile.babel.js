'use strict';

import glob from 'glob';
import path from 'path';
import gulp from 'gulp';
import del from 'del';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';

const $ = gulpLoadPlugins();
const $css = gulpLoadPlugins({
  pattern: ['postcss-*','autoprefixer','cssnano'],
  replaceString: /^postcss-/
});

const AUTOPREFIXER_BROWSERS = ['last 2 versions', 'ie >= 9', 'Android >= 30'];
// google version
// const AUTOPREFIXER_BROWSERS = [
//   'ie >= 10',
//   'ie_mob >= 10',
//   'ff >= 30',
//   'chrome >= 34',
//   'safari >= 7',
//   'opera >= 23',
//   'ios >= 7',
//   'android >= 4.4',
//   'bb >= 10'
// ];
const POSTCSS_PROCESSORS = [
  $css.cssnext({browsers: AUTOPREFIXER_BROWSERS})
  // $css.autoprefixer(AUTOPREFIXER_BROWSERS),
  // $css.cssnano()
];

const PATH = {
  build: {
    html: 'build/',
    js: {
      vendor: 'build/js/',
      app: 'build/js/'
    },
    styles: 'build/css/',
    img: 'build/img/',
    pic: 'build/pic/',
    fonts: 'build/fonts/',
    vendor: 'build/vendor/'
  },
  src: {
    html: 'src/pug/*.pug',
    js: {
      vendor: 'src/js/vendor/vendor.js',
      app: 'src/js/app/application.js'
    },
    styles: 'src/sass/application.scss',
    img: 'src/img/**/*',
    pic: 'src/pic/**/*',
    fonts: 'src/fonts/**/*',
    vendor: 'src/vendor/**/*.{css,jpg,jpeg,png,ico,gif,svg,eot,ttf,woff,woff2}'
  },
  watch: {
    html: 'src/pug/**/*.pug',
    js: {
      vendor: 'src/js/vendor/**/*.js',
      app: 'src/js/app/**/*.js'
    },
    styles: 'src/sass/**/*',
    img: 'src/img/**/*',
    pic: 'src/pic/**/*',
    fonts: 'src/fonts/**/*',
    vendor: 'src/vendor/**/*'
  },
  clean: 'build/*'
};

const BROWSERSYNC_CONFIG = {
  server: ["build"],
  notify: false,
  open: false,
  tunnel: false,
  host: "markup",
  port: 9000,
  logPrefix: "browserSync"
};

const FILEINCLUDE_CONFIG = {
  prefix: '//= ',
  basepath: '@file',
  indent: true
};

gulp.task('lint', () =>
  gulp.src(PATH.watch.js.app)
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failOnError()))
);

gulp.task('clean:build', () => del(PATH.clean, {dot: true}));
gulp.task('clean:cache', (cb) => $.cache.clearAll(cb));

gulp.task('serve', () => browserSync(BROWSERSYNC_CONFIG));

gulp.task('todo', () => {
  gulp.src([PATH.watch.js.app, PATH.watch.html, PATH.watch.styles])
    .pipe($.plumber())
    .pipe($.todo({
      // absolute: true,
      customTags: ['NOTE'], // NOTE, TODO, FIXME are supported
      verbose: true
    }))
    // .pipe(gulp.dest('./'))
});

gulp.task('build:vendor', () => {
  gulp.src(PATH.src.vendor)
    .pipe($.changed(PATH.build.vendor, {hasChanged: $.changed.compareSha1Digest}))
    .pipe($.size({title: 'vendor'}))
  .pipe(gulp.dest(PATH.build.vendor))
});

gulp.task('build:html', () => {
  gulp.src(PATH.src.html)
    .pipe($.plumber())
    .pipe($.if('*.pug', $.pug({
      pretty: '    ',
      locals: {
        __pages: glob.sync(PATH.src.html, {
          nodir: true,
          nonull: false
        }).map((filename) => path.parse(filename).name)
      }
    })))
    // .pipe($.if('*.html', $.htmlmin({
    //   removeComments: true,
    //   collapseWhitespace: true,
    //   collapseBooleanAttributes: true,
    //   removeAttributeQuotes: false,
    //   removeRedundantAttributes: true,
    //   removeEmptyAttributes: true,
    //   removeScriptTypeAttributes: true,
    //   removeStyleLinkTypeAttributes: true,
    //   removeOptionalTags: false
    // })))
    .pipe($.changed(PATH.build.html, {hasChanged: $.changed.compareSha1Digest}))
    .pipe($.if(!browserSync.active, $.size({title: 'html', showFiles: true})))
  .pipe(gulp.dest(PATH.build.html))
  .pipe(browserSync.stream())
});

gulp.task('build:js:vendor', () => {
  gulp.src(PATH.src.js.vendor)
    .pipe($.plumber())
    .pipe($.fileInclude(FILEINCLUDE_CONFIG))
    // .pipe($.sourcemaps.init())
      .pipe($.uglify())
    // .pipe($.sourcemaps.write('./'))
    .pipe($.changed(PATH.build.js.vendor, {hasChanged: $.changed.compareSha1Digest}))
  .pipe(gulp.dest(PATH.build.js.vendor))
  .pipe(browserSync.stream())
});

gulp.task('build:js:app', ['lint'], () => {
  gulp.src(PATH.src.js.app)
    .pipe($.plumber())
    .pipe($.fileInclude(FILEINCLUDE_CONFIG))
    .pipe($.sourcemaps.init())
      .pipe($.babel()) // config is in .babelrc
      .pipe($.uglify())
    .pipe($.sourcemaps.write('./'))
    .pipe($.changed(PATH.build.js.app, {hasChanged: $.changed.compareSha1Digest}))
    .pipe($.if(!browserSync.active, $.size({title: 'js:app'})))
  .pipe(gulp.dest(PATH.build.js.app))
  .pipe(browserSync.stream())
});

gulp.task('build:styles', () => {
  gulp.src(PATH.src.styles)
    .pipe($.plumber())
    .pipe($.if('*.{sass,scss}', $.sass({outputStyle: 'expanded'}).on('error', $.sass.logError)))
    .pipe($.sourcemaps.init())
      .pipe($.if('*.css', $.postcss(POSTCSS_PROCESSORS)))
    .pipe($.sourcemaps.write('./'))
    .pipe($.changed(PATH.build.styles, {hasChanged: $.changed.compareSha1Digest}))
    .pipe($.if(!browserSync.active, $.size({title: 'styles'})))
  .pipe(gulp.dest(PATH.build.styles))
  .pipe(browserSync.stream({match: '**/*.css'}))
});

gulp.task('build:img', () => {
  gulp.src(PATH.src.img)
    .pipe($.changed(PATH.build.img, {hasChanged: $.changed.compareSha1Digest}))
    // .pipe($.cache($.imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe($.cache($.imagemin()))
    .pipe($.size({title: 'img', showFiles: true}))
  .pipe(gulp.dest(PATH.build.img))
});

gulp.task('build:pic', () => {
  gulp.src(PATH.src.pic)
    .pipe($.changed(PATH.build.pic, {hasChanged: $.changed.compareSha1Digest}))
    .pipe($.size({title: 'pic', showFiles: true}))
  .pipe(gulp.dest(PATH.build.pic))
});

gulp.task('build:fonts', () => {
  gulp.src(PATH.src.fonts)
    .pipe($.changed(PATH.build.fonts, {hasChanged: $.changed.compareSha1Digest}))
    .pipe($.size({title: 'fonts', showFiles: true}))
  .pipe(gulp.dest(PATH.build.fonts))
});

gulp.task('build:prepare', ['build:vendor']);
// gulp.task('build:styles', ['build:styles:vendor', 'build:styles:app']);
gulp.task('build:js', ['build:js:vendor', 'build:js:app']);

gulp.task('build', [
  'build:prepare',
  'build:html',
  'build:js',
  'build:styles',
  'build:fonts',
  'build:img',
  'build:pic'
]);

gulp.task('clean', [
  'clean:build',
  'clean:cache'
]);

gulp.task('watch', () => {
  gulp.watch(PATH.watch.html, ['build:html']);
  gulp.watch(PATH.watch.styles, ['build:styles']);
  gulp.watch(PATH.watch.js.vendor, ['build:js:vendor']);
  gulp.watch(PATH.watch.js.app, ['build:js:app']);
  gulp.watch(PATH.watch.img, ['build:img']);
  gulp.watch(PATH.watch.pic, ['build:pic']);
  gulp.watch(PATH.watch.fonts, ['build:fonts']);
});

gulp.task('default', ['build', 'serve', 'watch']);
