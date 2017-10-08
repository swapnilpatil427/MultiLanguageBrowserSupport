(function(exports) {
      var parser = PEG.buildParser(
' start = multiexpression;\
  validchar = [a-zA-Z_?!+\\-=@#$%^&*/.];\
  spaces = \" \"*;\
  newline = [\\n]*;\
  digit = [0-9];\
  atom =    spaces newline chars:validchar+ spaces newline   { return chars.join(\"\"); }\
          / spaces newline numbers:digit+ spaces newline     { return parseInt(numbers.join(\"\")); };\
  list =    spaces newline \"(\" spaces newline expressionss:multiexpression+ newline spaces\")\"  spaces newline { return expressionss; };\
  expressions = spaces newline  lists:list+ newline spaces { return lists };\
  multiexpression = atom / expressions ;');

var s = "";
    var document = window.document;
    var Context = function(scope, parent) {
        this.scope = scope;
        this.parent = parent;

        this.get = function(identifier) {
            if (identifier in this.scope) {
                return this.scope[identifier];
            } else if (this.parent !== undefined) {
                return this.parent.get(identifier);
            }
        };
    };

    var library = {
        first: function(x) {
            return x[0];
        },

        rest: function(x) {
            return x.slice(1);
        },

        print: function(x) {
            console.log(x);
            return x;
        },

        "console-log" : function(x) {
            console.log(x);
            return x;
        },
        "console-debug" : function(x) {
            console.log(x);
            return x;
        },

        "console-clear" : function(x) {
            console.clear();
        },
        alert : function (x) {
            window.alert(x);
        },

        confirm : function (x) {
          window.confirm(x);
        },

        "remove-handler!" : function (x) {
            if(arguments.length === 3) {
                var selector = arguments[0];
                var evtType = arguments[1];
                var handler = arguments[2];
                if(handler)
                    $(selector).off(evtType, handler);
                else
                    alert("Add a " + evtType + " on " + selector + " before removing");
            } else {
                throw "Insufficient parameters passed to Remove handler function";
            }
        },
        "add-handler!" : function() {
            if(arguments.length === 3) {
                var selector = arguments[0];
                var evtType = arguments[1];
                var handler = arguments[2];
                $(selector).on(evtType, handler);
                return handler;
                //  elements[0].addEventListener(evtType, handler);
            } else {
                throw "Insufficient parameters passed to add handler function";
            }
        },

        "+" : function() {
            var total = 0;
            for (var i=0; i < arguments.length; i++) {
                total = total + arguments[i];
            }

            return total;
        },

        "&gt;" : function() {
            return arguments[0] > arguments[1];
        },

        "&lt;" : function() {
            return arguments[0] > arguments[1];
        },

        "*" : function() {
            var total = 0;
            for (var i=0; i < arguments.length; i++) {
                total = total * arguments[i];
            }

            return total;
        }
    };

    var special = {
        let: function(input, context) {
            var letContext = input[1].reduce(function(acc, x) {
                acc.scope[x[0].value] = interpret(x[1], context);
                return acc;
            }, new Context({}, context));

            return interpret(input[2], letContext);
        },
        define : function(input, context) {
            context.scope[input[1].value] = interpret(input[2], context);
        },

        lambda: function(input, context) {
            return function() {
                var lambdaArguments = arguments;
                var lambdaScope = input[1].reduce(function(acc, x, i) {
                    acc[x.value] = lambdaArguments[i];
                    return acc;
                }, {});

                return interpret(input.slice(2), new Context(lambdaScope, context));
            };
        },
        if: function(input, context) {
            return interpret(input[1], context) ?
                interpret(input[2], context) :
                interpret(input[3], context);
        }
    };

    var contextChanging = {
        define : function(input, context) {
            var defineContext = {};
            defineContext[input[1]] = interpret(input[2], context)
            return new Context(defineContext, context);
        }
    }

    var interpretList = function(input, context) {

        if (input.length > 0 && input[0].value in special) {
            return special[input[0].value](input, context);
        } else {
            var list = input.map(function(x) {
                return interpret(x, context);
            });
            if (list[0] instanceof Function) {
                return list[0].apply(undefined, list.slice(1));
            } else {
                return list;
            }
        }
    };

    var interpret = function(input, context) {
        if (context === undefined) {
            return interpret(input, new Context(library));
        } else if (input instanceof Array) {
            return interpretList(input, context);
        } else if (input.type === "identifier") {
            return context.get(input.value);
        } else if (input.type === "number" || input.type === "string") {
            return input.value;
        }
    };

    var categorize = function(input) {
        if (!isNaN(parseFloat(input))) {
            return { type:'number', value: parseFloat(input) };
        } else if (input[0] === '"' && input.slice(-1) === '"') {
            return { type:'string', value: input.slice(1, -1) };
        } else {
            return { type:'identifier', value: input };
        }
    };

    var parenthesize = function(input, list) {
        if (list === undefined) {
            return parenthesize(input, []);
        } else {
            var token = input.shift();
            if (token === undefined) {
                return list.pop();
            } else if (token === "(") {
                list.push(parenthesize(input, []));
                return parenthesize(input, list);
            } else if (token === ")") {
                return list;
            } else {
                return parenthesize(input, list.concat(categorize(token)));
            }
        }
    };

    var tokenize = function(input) {
        return input.split('"')
            .map(function(x, i) {
                if (i % 2 === 0) { // not in string
                    return x.replace(/\(/g, ' ( ')
                        .replace(/\)/g, ' ) ');
                } else { // in string
                    return x.replace(/ /g, "!whitespace!");
                }
            })
            .join('"')
            .trim()
            .split(/\s+/)
            .map(function(x) {
                return x.replace(/!whitespace!/g, " ");
            });
    };

    var parse = function(input) {
        return parenthesize(tokenize(input));
    };

  littleScheme = {
      parse : parse,
    interpret: interpret
  };



    var parser = PEG.buildParser(
        ' start = multiexpression;\
          validchar = [a-zA-Z_?!+\\-=@#$%^&*/.];\
          spaces = \" \"*;\
          newline = [\\n]*;\
          digit = [0-9];\
          atom =    spaces newline chars:validchar+ spaces newline   { return chars.join(\"\"); }\
                  / spaces newline numbers:digit+ spaces newline     { return parseInt(numbers.join(\"\")); };\
          list =    spaces newline \"(\" spaces newline expressionss:multiexpression+ newline spaces\")\"  spaces newline { return expressionss; };\
          expressions = spaces newline  lists:list+ newline spaces { return lists };\
          multiexpression = atom / expressions ;')
    /**------------------------------------------------------------------------------------------**/



    function categorizeToken(input) {
        if (!isNaN(parseFloat(input))) {
            return { type:'number', value: parseFloat(input) };
        } else if (input[0] === '"' && input.slice(-1) === '"') {
            return { type:'string', value: input.slice(1, -1) };
        } else {
            return { type:'identifier', value: input };
        }
    };

    function categorizeAST(input) {
        var temp = input.map(function (item) {
            if(Array.isArray(item)) {
                return categorizeAST(item);
            } else {
                return categorizeToken(item);
            }
        });
        return temp;
    };

    $( document ).ready(function() {
        console.log( "ready!" );
        var generatedSource = new XMLSerializer().serializeToString(document);
// Look for script tag with scheme in the page source
        var pattern_for_scheme= /<script type="text\/scheme"[\s\S]*?>[\s\S]*?<\/script>/gi;
// variable matches contains list of the source codes
        var matches = generatedSource.match(pattern_for_scheme);
        var result = "";
        var res;
        for (var i in matches) {
            result += "Match:" + matches[i] + "\n";
            s = matches[i];
            s = s.replace(/<script type="text\/scheme"\s*?>/ig, "");
            s = s.replace(/<\/script>/ig, "");
            s = s.trim();

            // var PegAST= parser.parse(s);
            //   console.log(categorizeAST(PegAST));
            //   var pegRet = littleScheme.interpret(categorizeAST(PegAST));
            // console.log(pegRet);

            var AST = littleScheme.parse(s);
            console.log(AST);

            var ret = littleScheme.interpret(AST);
        }
    });


})(typeof exports === 'undefined' ? this : exports);