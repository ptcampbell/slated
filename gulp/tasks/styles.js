const gulp = require('gulp')
const config = require('../gulp.config')
const when = require('gulp-if')
const replace = require('gulp-replace');
const $ = require('gulp-load-plugins')()

const production = config.production
const moduleImporter = require('sass-module-importer')
const destination = config.theme + '/assets'

gulp.task('main:styles', function () {
  return gulp.src(config.src.styles + '/main.scss')
    .pipe($.sass({importer: moduleImporter()}))
    .on('error', $.sass.logError)
    .pipe( replace( /({{|}}|{%|%})/g, '/*!$1*/' ) )
    .pipe($.autoprefixer({browsers: ['last 2 versions', 'iOS 8']}))
    .pipe( replace( /\/\*!({{|}}|{%|%})\*\//g, '$1' ) )
    .pipe(when(production, $.groupCssMediaQueries()))
    .pipe(when(production, $.csscomb()))
    .pipe(when(production, $.cssnano()))
    .pipe($.rename({extname: '.scss.liquid'}))
    .pipe(gulp.dest(destination))
})

gulp.task('vendor:styles', function () {
  return gulp.src(config.src.styles + '/vendor.scss')
    .pipe(when(!production, $.sourcemaps.init()))
    .pipe($.sass({importer: moduleImporter()}))
    .on('error', $.sass.logError)
    .pipe($.autoprefixer({browsers: ['last 2 versions', 'iOS 8']}))
    .pipe(when(production, $.groupCssMediaQueries()))
    .pipe(when(production, $.csscomb()))
    .pipe(when(!production, $.sourcemaps.write()))
    .pipe(when(production, $.rename({suffix: '.min'})))
    .pipe(when(production, $.cssnano()))
    .pipe(gulp.dest(destination))
})

gulp.task('styles', gulp.parallel('main:styles', 'vendor:styles'))
