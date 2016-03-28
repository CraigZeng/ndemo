var gulp          = require('gulp');
var iconfont      = require('gulp-iconfont');
var iconfontCss   = require('gulp-iconfont-css');
var lessc         = require('gulp-less');
var rev           = require('gulp-rev');
var revCollector  = require('gulp-rev-collector');
var sequence      = require('gulp-sequence');
var browserSync   = require('browser-sync').create();
var del           = require('del');

var path = require('path');

var config = {
    output: './output/',
    outputAssets: './output/static/',
    outputViews: './output/views/',
    srcViewFiles: './views/**/*.html',
    srcAssets: './static/',
    jsFiles: './js/**/*.js',
    cssFiles: './css/**/*.less',
    imgFiles: './img/**',
    iconsFiles: './icons/**/*.svg',
    fontFiles: './css/common/fonts/*', 
    fontDir: './css/common/fonts/',
    fontName: 'iconfont',
    revDir: './output/rev/',
    jsDir: './js/',
    cssDir: './css/',
    imgDir: './img/'
};

gulp.task('clean', function () {
    return del(config.output);
});

gulp.task('fontCreate', function () {
    gulp.src(path.join(config.srcAssets, config.iconsFiles))
        .pipe(iconfontCss({
            fontName: config.fontName,
            path: 'less',
            targetPath: '../icons.less',
            fontPath: './fonts/'
        }))
        .pipe(iconfont({
            fontName: config.fontName,
            formats: ['ttf', 'eot', 'woff', 'svg']
        }))
        .pipe(gulp.dest(path.join(config.srcAssets, config.fontDir)));
});

gulp.task('iconRev', function () {
    return gulp.src(path.join(config.srcAssets, config.fontFiles))
        .pipe(rev())
        .pipe(gulp.dest(path.join(config.outputAssets, config.fontDir)))
        .pipe(rev.manifest('icons-rev.json'))
        .pipe(gulp.dest(config.revDir));
});

gulp.task('iconfonts', sequence('fontCreate', 'iconRev'));

gulp.task('imgRev', function imgRev() {
    return gulp.src(path.join(config.srcAssets, config.imgFiles))
        .pipe(rev())
        .pipe(gulp.dest(path.join(config.outputAssets, config.imgDir)))
        .pipe(rev.manifest('imgs-rev.json'))
        .pipe(gulp.dest(config.revDir))
});


gulp.task('less2css', function() {
    return gulp.src([path.join(config.srcAssets, config.cssFiles)])
        .pipe(lessc({ relativeUrls: true }))
        .pipe(gulp.dest(path.join(config.outputAssets, config.cssDir)));
});

gulp.task('cssRev', function () {
    return gulp.src([path.join(config.revDir, './*.json'), path.join(config.outputAssets, config.cssFiles.replace('less', 'css'))])
        .pipe(revCollector({
            replaceReved: true,
            dirReplacements: {
                '/img/': function(value) {
                    return '/img/' + value;
                },
                'fonts/': function(value) {
                    return 'fonts/' + value;
                }
            }
        }))
        .pipe(rev())
        .pipe(gulp.dest(path.join(config.outputAssets, config.cssDir)))
        .pipe(rev.manifest('css-rev.json'))
        .pipe(gulp.dest(config.revDir))
});

gulp.task('htmlRev', function () {
    return gulp.src([config.revDir + '/*.json', config.srcViewFiles])
        .pipe(revCollector({
            replaceReved: true,
            dirReplacements: {
                '/img/': function(value) {
                    return '/img/' + value;
                },
                '/css/': function(value) {
                    return '/css/' + value;
                }
            }
        }))
        .pipe(gulp.dest(config.outputViews));
});

gulp.task('serve', function () {  
    browserSync.init({
        server: {
            baseDir: './',
            index: '/views/index.html',
            middleware: [
                function (req, res, next) { 
                   next(); 
                }
           ]
        }
    });
    
    gulp.watch("./views/**/*.html").on('change', browserSync.reload);
    gulp.watch("./static/**/*").on('change', browserSync.reload);
});

gulp.task('default', sequence('clean', ['iconfonts', 'imgRev', 'less2css'], 'cssRev', 'htmlRev'));
