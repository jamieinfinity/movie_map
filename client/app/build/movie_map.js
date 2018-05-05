(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.movie_map = global.movie_map || {})));
}(this, (function (exports) { 'use strict';

/*
TODO:
- write ETL code to process movie data:
    - into an array of (max_num_shots + 2) x num_scenes = (51+2) x 157
    - the first column contains act info (e.g. title): only 4 rows have actual data; the rest are nulls (or some such)
    - the second column contains scene info (e.g. title): every row has data
    - the remaining columns contain info for each shot, up to a max of 51 shots. If there are less the 51 shots, fill
    in the empty columns with nulls (or some such). Those columns will appear empty.
    - eventually, you can add data like scene length, shot length, etc
    - eventually you can add tooltips that display full image(s)
    - eventually you can make selecting a row cause that row to expand:
        - increase in size (MED image)
        - add another row to display the dialog
*/







function buildApp() {

}

exports.buildApp = buildApp;

Object.defineProperty(exports, '__esModule', { value: true });

})));
