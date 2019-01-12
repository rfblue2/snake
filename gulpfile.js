var gulp = require('gulp')
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('js', function() {
  return gulp.src('js/**/*.js')
    .pipe(sourcemaps.init())
      .pipe(concat('bundle.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js'));
});

gulp.watch('js/**/*.js', ['js']);

gulp.task('default', ['js']);
