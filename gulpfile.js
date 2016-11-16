const gulp = require('gulp'),
  babel = require('gulp-babel'),
  gutil = require('gulp-util'),
  eslint = require('gulp-eslint'),
  sourcemaps = require('gulp-sourcemaps'),
  releaseHelper = require('release-helper');

//Init custom release tasks
releaseHelper.init(gulp);

let glue = suffix => gulp.src(`src/**/*.${suffix}`).pipe(gulp.dest('lib'));
let watch = (suffix, tasks) => {
  tasks = tasks ? tasks : [suffix];
  return gulp.watch(`src/**/*.${suffix}`, tasks);
}

gulp.task('pug', () => glue('pug'));
gulp.task('md', () => glue('md'));
gulp.task('ejs', () => glue('ejs'));

gulp.task('babel', () => {
  return gulp.src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .on('error', function (e) {
      console.log(e.stack);
      gutil.log('babel error', e.stack);
      this.emit('end');
    })
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('lib'))
});

gulp.task('watch-babel', () => watch('js', ['babel']));
gulp.task('watch-pug', () => watch('pug'));
gulp.task('watch-ejs', () => watch('ejs'));
gulp.task('watch-md', () => watch('md'));

gulp.task('lint', () => {
  return gulp.src(['src/**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('build', ['lint', 'md', 'ejs', 'pug', 'babel']);

gulp.task('dev', ['md', 'pug', 'babel', 'watch-md', 'watch-ejs', 'watch-pug', 'watch-babel']);
