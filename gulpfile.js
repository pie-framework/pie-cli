const gulp = require('gulp'),
  mocha = require('gulp-mocha'),
  releaseHelper = require('release-helper'),
  ts = require('gulp-typescript'),
  tsProject = ts.createProject('tsconfig.json'),
  fsExtra = require('fs-extra'),
  runSequence = require('run-sequence'),
  path = require('path'),
  spawn = require('child_process').spawn,
  { join } = require('path');

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

gulp.task('ts', () => {
  let tsResult = tsProject.src()
    .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('lib'));
});

gulp.task('watch-ts', () => watch('ts'));
gulp.task('watch-pug', () => watch('pug'));
gulp.task('watch-ejs', () => watch('ejs'));
gulp.task('watch-md', () => watch('md'));

gulp.task('unit', ['build'], () => {
  return gulp.src('test/unit/**/*.js', { read: false })
    .pipe(mocha({ require: ['babel-register'] }));
});

gulp.task('it', ['build'], () => {
  return gulp.src(['test/integration/init.js', 'test/integration/**/*-test.js'], { read: false })
    .pipe(mocha({ require: ['babel-register'] }))
    .once('end', () => process.exit());
});

gulp.task('clean', (done) => {
  fsExtra.remove('lib', done);
})

gulp.task('build', done => runSequence('clean', ['md', 'ejs', 'pug', 'ts'], done));

gulp.task('dev', ['build', 'watch-md', 'watch-ejs', 'watch-pug', 'watch-ts']);

gulp.task('test', ['unit']);


const dir = (d) => join(__dirname, 'support', d);

const install = (name) => {
  return (done) => {
    const p = spawn('npm', ['install'], { cwd: dir(name) });
    p.on('error', done);
    p.on('close', done.bind(null, null));
  }
}

const rmDeps = (name) => (done) => fsExtra.remove(join(dir(name), 'node_modules'), done);

gulp.task('install-support-base', install('base'));
gulp.task('install-support-less', install('less'));
gulp.task('install-support-react', install('react'));
gulp.task('install-support-corespring-legacy', install('corespring-legacy'));

gulp.task('rm-support-base', rmDeps('base'));
gulp.task('rm-support-less', rmDeps('less'));
gulp.task('rm-support-react', rmDeps('react'));
gulp.task('rm-support-corespring-legacy', rmDeps('corespring-legacy'));

gulp.task('install-support-dependencies', [
  'install-support-base',
  'install-support-less',
  'install-support-react',
  'install-support-corespring-legacy'
]);

gulp.task('rm-support-dependencies', done => runSequence(
  'rm-support-base',
  'rm-support-less',
  'rm-support-react',
  'rm-support-corespring-legacy',
  done));
