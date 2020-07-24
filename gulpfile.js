const gulp = require("gulp");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const gulpIf = require("gulp-if");
const browserSync = require("browser-sync").create();
const autoprefixer = require("gulp-autoprefixer");
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");
const cssmin = require("gulp-cssmin");
const wait = require("gulp-wait");
const changed = require("gulp-changed");
const del = require("del");
const ghPages = require("gh-pages");
const removeHtmlComments = require("gulp-remove-html-comments");
const imagemin = require("gulp-imagemin");
const recompress = require("imagemin-jpeg-recompress");
const pngquant = require("imagemin-pngquant");
const size = require("gulp-filesize");
const replace = require("gulp-replace");

const isDev = process.env.NODE_ENV === "development";

const dirs = {
  src: "./src/",
  dest: "./build/",
};

const settings = {
  paths: {
    src: {
      root: dirs.src,
      styles: dirs.src + "styles/",
      scripts: dirs.src + "js/",
      images: {
        all: dirs.src + "img/",
      },
      fonts: dirs.src + "fonts/",
    },
    dest: {
      root: dirs.dest,
      styles: dirs.dest + "css/",
      scripts: dirs.dest + "js/",
      images: {
        all: dirs.dest + "img/",
      },
      fonts: dirs.dest + "fonts/",
    },
  },
  vendor: {
    styles: [
      "./node_modules/normalize.css/normalize.css",
      "./node_modules/slick-carousel/slick/slick.css",
      "./node_modules/rateyo/src/jquery.rateyo.css",
      "./node_modules/flatpickr/dist/flatpickr.css",
      "./node_modules/magnific-popup/dist/magnific-popup.css",
    ],
    scripts: [
      "./node_modules/jquery/dist/jquery.js",
      "./node_modules/slick-carousel/slick/slick.js",
      "./node_modules/rateyo/src/jquery.rateyo.js",
      "./node_modules/rellax/rellax.js",
      "./node_modules/flatpickr/dist/flatpickr.js",
      "./node_modules/magnific-popup/dist/jquery.magnific-popup.js",
    ],
  },
};

function clean() {
  return del(settings.paths.dest.root);
}

function vendorScripts() {
  return gulp
    .src(settings.vendor.scripts)
    .pipe(concat("libs.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest(settings.paths.dest.scripts));
}

function scripts() {
  const destPath = settings.paths.dest.scripts;
  return gulp
    .src(`${settings.paths.src.scripts}**/*.js`, { sourcemaps: true })
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(gulpIf(isDev, gulp.dest(destPath, { sourcemaps: true }), gulp.dest(destPath)));
}

function vendorStyles() {
  return gulp
    .src(settings.vendor.styles)
    .pipe(concat("libs.min.css"))
    .pipe(cssmin())
    .pipe(gulp.dest(settings.paths.dest.styles));
}

function styles() {
  return gulp
    .src(`${settings.paths.src.styles}styles.scss`, { sorcmaps: true })
    .pipe(wait(500))
    .pipe(sass({ outputStyle: "compressed" }))
    .pipe(gulpIf(!isDev, replace("../../", "../")))
    .on("error", sass.logError)
    .pipe(
      rename({
        suffix: ".min",
      })
    )
    .pipe(autoprefixer())
    .pipe(
      gulpIf(isDev, gulp.dest(settings.paths.dest.styles, { sourcemaps: true }), gulp.dest(settings.paths.dest.styles))
    )
    .pipe(gulpIf(isDev, browserSync.stream()));
}

function fonts() {
  return gulp
    .src(`${settings.paths.src.fonts}**/*.{ttf,woff,woff2,eot,svg}`)
    .pipe(changed(settings.paths.dest.fonts))
    .pipe(gulp.dest(settings.paths.dest.fonts));
}

function images() {
  if (process.env.NODE_ENV === "development") {
    return gulp.src(`${settings.paths.src.images.all}**/*`).pipe(gulp.dest(settings.paths.dest.images.all));
  }
  return gulp
    .src(`${settings.paths.src.images.all}**/*.+(png|jpg|jpeg|gif|svg|ico|webp)`)
    .pipe(size())
    .pipe(
      imagemin([
        recompress({
          loops: 4,
          min: 80,
          max: 100,
          quality: "high",
          use: [pngquant()],
        }),
        imagemin.gifsicle(),
        imagemin.optipng(),
        imagemin.svgo(),
      ])
    )
    .pipe(gulp.dest(settings.paths.dest.images.all))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    )
    .pipe(size());
}

function icons(done) {
  done();
}

function html() {
  return gulp
    .src(`${settings.paths.src.root}*.html`)
    .pipe(removeHtmlComments())
    .pipe(gulp.dest(settings.paths.dest.root));
}

function server(done) {
  browserSync.init({
    server: settings.paths.dest.root,
    reloadOnRestart: true,
  });
  done();
}

function watch(done) {
  gulp.watch(`${settings.paths.src.root}*.html`).on("all", gulp.series(html, browserSync.reload));
  gulp.watch(`${settings.paths.src.scripts}*.js`).on("all", gulp.series(scripts, browserSync.reload));
  gulp.watch(`${settings.paths.src.styles}**/*.scss`).on("all", gulp.series(styles, browserSync.reload));
  gulp.watch(`${settings.paths.src.images.all}**/*`).on("all", gulp.series(images, browserSync.reload));
  done();
}

function deploy(done) {
  if (!isDev) {
    ghPages.publish(settings.paths.dest.root, done);
  }
  done();
}

function build(done) {
  return gulp.series(
    clean,
    gulp.parallel(fonts, vendorStyles, styles, vendorScripts, scripts, html, images, icons),
    deploy
  )(done);
}

exports.default = gulp.series(build, server, watch);
