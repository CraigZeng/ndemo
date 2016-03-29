var gulp          = require('gulp');
var iconfont      = require('gulp-iconfont');
var iconfontCss   = require('gulp-iconfont-css');
var lessc         = require('gulp-less');
var through       = require('through2');
var rjs           = require('requirejs');
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

function uglifyJs () {
    return through.obj(function (file, encoding, callback) {
        var filePath = file.path;
        var _this = this;
        rjs.optimize({
            baseUrl: config.srcAssets,
            name: path.relative(config.srcAssets, filePath).replace('.js', ''),
            optimizeAllPluginResources: false,
            out: function cb(params) {
                file.contents = new Buffer(params);
                _this.push(file);
                callback();
            }
        });
        
    });
};

gulp.task('clean', function clean () {
    return del(config.output);
});

gulp.task('fontCreate', function fontCreate () {
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

gulp.task('iconRev', function iconRev () {
    return gulp.src(path.join(config.srcAssets, config.fontFiles))
        .pipe(rev())
        .pipe(gulp.dest(path.join(config.outputAssets, config.fontDir)))
        .pipe(rev.manifest('icons-rev.json'))
        .pipe(gulp.dest(config.revDir));
});

gulp.task('iconfonts', sequence('fontCreate', 'iconRev'));

gulp.task('imgRev', function imgRev () {
    return gulp.src(path.join(config.srcAssets, config.imgFiles))
        .pipe(rev())
        .pipe(gulp.dest(path.join(config.outputAssets, config.imgDir)))
        .pipe(rev.manifest('imgs-rev.json'))
        .pipe(gulp.dest(config.revDir));
});


gulp.task('less2css', function less2css () {
    return gulp.src([path.join(config.srcAssets, config.cssFiles)])
        .pipe(lessc({ relativeUrls: true }))
        .pipe(gulp.dest(path.join(config.outputAssets, config.cssDir)))
        .pipe(browserSync.stream());
});

gulp.task('cssRev', function cssRev () {
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
        .pipe(gulp.dest(config.revDir));
});

gulp.task('jsRev', function () {
    return gulp.src(path.join(config.srcAssets, config.jsFiles))
        .pipe(uglifyJs())
        .pipe(rev())
        .pipe(gulp.dest(path.join(config.outputAssets, config.jsDir)))
        .pipe(rev.manifest('js-rev.json'))
        .pipe(gulp.dest(config.revDir));
});

gulp.task('htmlRev', function htmlRev () {
    return gulp.src([config.revDir + '/*.json', config.srcViewFiles])
        .pipe(revCollector({
            replaceReved: true,
            dirReplacements: {
                '/img/': function(value) {
                    return '/img/' + value;
                },
                '/css/': function(value) {
                    return '/css/' + value;
                },
                '/js/': function(value) {
                    return '/js/' + value;
                }
            }
        }))
        .pipe(gulp.dest(config.outputViews));
});

gulp.task('serve', function serve () {  
    browserSync.init({
        server: {
            baseDir: './',
            index: '/views/index.html',
            middleware: [
                function (req, res, next) {
                    if (req.url.indexOf('.css') !== -1) {
                        req.url = path.join('/' + config.output, req.url); 
                    }
                    next(); 
                }
           ]
        }
    });
    
    gulp.watch(config.srcViewFiles).on('change', browserSync.reload);
    gulp.watch(path.join(config.srcAssets, '**')).on('change', browserSync.reload);
    gulp.watch(path.join(config.srcAssets, config.iconsFiles), ['iconfonts', 'less2css']);
    gulp.watch(path.join(config.srcAssets, config.cssFiles), ['less2css']);
});

gulp.task('default', sequence('serve'))
gulp.task('release', sequence('clean', ['iconfonts', 'imgRev', 'less2css'], ['cssRev', 'jsRev'], 'htmlRev'));
