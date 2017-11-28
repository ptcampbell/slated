const gulp = require('gulp')
const config = require('../gulp.config')
const $ = require('gulp-load-plugins')()

gulp.task('assets', function () {
  return gulp.src(config.src.assets)
    .pipe($.changed(config.theme + '/assets', {hasChanged: $.changed.compareSha1Digest}))
    .pipe(gulp.dest(config.theme + '/assets'))
})
