var littleLisp = require("./simple-scheme-interpreter").littleScheme;
var ret = littleLisp.interpret(littleLisp.parse("((lambda (x) x) "lisp")"));
console.log(ret);