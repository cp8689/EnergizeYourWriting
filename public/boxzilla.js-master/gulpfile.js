'use strict';

const browserify = require('browserify');
const gulp = require('gulp');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const insert = require('gulp-insert');
const cssmin = require('gulp-cssmin');

gulp.task('js-styles', function() {
    return gulp.src('./src/styles.css')
        .pipe(cssmin())
        .pipe(insert.wrap('const styles = `', '`; \nmodule.exports = styles;'))
        .pipe(rename({extname: '.js'}))
        .pipe(gulp.dest('./src'));
});

gulp.task('default', gulp.series('js-styles', function () {
    return browserify({
            entries: 'src/boxzilla.js'
        }).on('error', gutil.log)
        .bundle()
        .pipe(source('boxzilla.js'))
        .pipe(buffer())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest('./dist/'))
        .pipe(sourcemaps.init({loadMaps: true}))

        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(rename({extname: '.min.js'}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/'));
}));

gulp.task('watch', gulp.series('default', function() {
  gulp.watch(['src/*.js', 'src/*.css'], ['default']);
}));
