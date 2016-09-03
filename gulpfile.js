"use strict"; // подсказки в консоли при ошибках

const gulp          = require('gulp');

const sass          = require('gulp-sass');           // компилирует sass
const sourcemaps    = require('gulp-sourcemaps');     // создает sourcemaps
const autoprefixer  = require('gulp-autoprefixer');   // для добавления префиксов
const csso          = require('gulp-csso');           // минификация css

const uglify        = require('gulp-uglify');         // минификация js

const imagemin      = require('gulp-imagemin');       // минификация img
const pngquant      = require('gulp-pngquant');       // минификация png
const svgmin        = require('gulp-svgmin');         // минификация svg

const del           = require('del');                 // удаление файлов/директорий
const browserSync   = require('browser-sync');        // виртуальный сервер

const concat        = require('gulp-concat');         // конкатенации файлов
const fileinclude   = require('gulp-file-include');   // работа с инклюдами

const cache         = require('gulp-cache');          // для кеширования файлов
const useref        = require('gulp-useref');         // парсинг-перенос файлов
const gulpif        = require('gulp-if');


const prettify        = require('gulp-html-prettify');

// ============ сборка html ============
gulp.task('html', function() {
  gulp.src('app/html/*.html')
    .pipe(fileinclude({
      //prefix: '@@',
      //basepath: '@file'
    }))
    .pipe(prettify({indent_char: ' ', indent_size: 4}))  //выравнивание html
    .pipe(gulp.dest('app/'));
});


// ============ компиляция sass ============
gulp.task('sass', function() {
  return gulp.src('app/sass/main.scss') //находим наш файл стилей
    .pipe(sourcemaps.init()) // создаем sourcemaps
    .pipe(sass().on('error', sass.logError)) // преобразуем Sass в CSS посредством gulp-sass
    .pipe(autoprefixer([ // создаем префиксы
      'last 15 versions', '> 1%', 'ie 9', 'ie 10']))
    .pipe(csso()) //минифицируем css
    .pipe(sourcemaps.write()) // записываем изменения в soursemaps
    .pipe(gulp.dest('app/css')) // выгружаем результата в папку app/css
    .pipe(browserSync.reload({ stream: true })); // обновляем CSS на странице при изменении
});


// ============ обработка SVG ============
gulp.task('svg', function () {
    return gulp.src('app/img/svg/**/*.svg')
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(gulp.dest('app/img/svg'))
});


// ============ обработка фоточек ============
gulp.task('img', ['svg'], function() {
  return gulp.src('app/img/**/*') // берем все изображения из app
    .pipe(cache(imagemin({ // сжимаем их с наилучшими настройками с учетом кеширования
      interlaced: true, progressive: true,
      svgoPlugins: [{ removeViewBox: false }],
      use: [pngquant()]})))
    .pipe(gulp.dest('app/img'));
});


// ============ запуск Browser Sync ============
gulp.task('browser-sync', function() { // создаем таск browser-sync
  browserSync({ // выполняем browserSync
    server: { // определяем параметры сервера
      baseDir: 'app' // директория для сервера - app
    },
    notify: false // отключаем уведомления
  });
});


// ============ очистка папки DIST перед боевой сборкой ============
gulp.task('clean', ['img'], function() {
  return del('dist'); // удаляем папку dist перед сборкой
});


// ============ слежение за изменениями в файлах ============
gulp.task('watch', ['browser-sync', 'html', 'sass', 'img'], function() {
  gulp.watch('app/sass/**/*.scss', ['sass']);         // sass
  gulp.watch('app/js/**/*.js', browserSync.reload);   // js
  gulp.watch('app/html/**/*.html', ['html']);         // изменения в исходниках html
  gulp.watch('app/*.html', browserSync.reload);       // изменения в собранном html
});


// ============ сборка в DIST ============
gulp.task('build', ['clean'], function() {
  var buildImg = gulp.src('app/img/**/*') // переносим картинки в продакшен
    .pipe(gulp.dest('dist/img'))

  // переносим шрифты в продакшен
  var buildFonts = gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'))

  // парсим html в соответствующих коментах
  return gulp.src('app/*.html')
    .pipe(useref())
    .pipe(gulpif('*.js', uglify())) //минифицируем js
    //заливаем обработанные файлы (html, css, js) в dist
    .pipe(gulp.dest('dist'))
});
