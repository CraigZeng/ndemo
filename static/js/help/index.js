define(function(require, exports) {
    'use strict';
    var a = require('../component/a');
    exports.init = function () {
        console.log(exports)
        a.init();
    }
});