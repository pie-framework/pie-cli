const gulp = require('gulp'),
  mocha = require('gulp-mocha'),
  ts = require('gulp-typescript'),
  tsProject = ts.createProject('tsconfig.json'),
  fsExtra = require('fs-extra'),
  path = require('path'),
  spawn = require('child_process').spawn,
  { join } = require('path');

let glue = suffix => gulp.src(`src/**/*.${suffix}`).pipe(gulp.dest('lib'));

let watch = (suffix, tasks) => {
  tasks = tasks ? tasks : [suffix];
  return gulp.watch(`src/**/*.${suffix}`, gulp.series(...tasks));
};

// individual tasks
function pug() { return glue('pug'); }
function md() { return glue('md'); }
function ejs() { return glue('ejs'); }

function tsCompile() {
  let tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('lib'));
}

function clean(done) {
  fsExtra.remove('lib', done);
}

function unit() {
  return gulp
    .src('test/unit/**/*.js', { read: false })
    .pipe(mocha({ require: ['@babel/register'] }));
}

function it() {
  return gulp
    .src(['test/integration/init.js', 'test/integration/**/*-test.js'], { read: false })
    .pipe(mocha({ bail: true, require: ['@babel/register'] }))
    .once('end', () => process.exit());
}

// watch tasks
function watchTs() { return watch('ts'); }
function watchPug() { return watch('pug'); }
function watchEjs() { return watch('ejs'); }
function watchMd() { return watch('md'); }

// build pipeline
const build = gulp.series(
  clean,
  gulp.parallel(md, ejs, pug, tsCompile)
);

const dev = gulp.series(
  build,
  gulp.parallel(watchMd, watchEjs, watchPug, watchTs)
);

// task exports
exports.pug = pug;
exports.md = md;
exports.ejs = ejs;
exports.ts = tsCompile;
exports.clean = clean;
exports.unit = gulp.series(build, unit);
exports.it = gulp.series(build, it);
exports.build = build;
exports.dev = dev;
exports.test = exports.unit;
