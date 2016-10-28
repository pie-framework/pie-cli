const gulp = require('gulp'),
  babel = require('gulp-babel');

gulp.task('pug', () => {
  return gulp.src('src/**/*.pug')
    .pipe(gulp.dest('lib'));
});

gulp.task('babel', () => {
  return gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});

gulp.task('watch-babel', () => {
  return gulp.watch('src/**/*.js', ['babel']);
});

gulp.task('watch-pug', () => {
  return gulp.watch('src/**/*.pug', ['pug']);
});

gulp.task('build', ['pug', 'babel']);

gulp.task('dev', ['pug', 'babel', 'watch-pug', 'watch-babel']);
