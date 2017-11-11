
function onExecutedPegjs(result) {
  var querying = browser.tabs.query({ currentWindow: true, active: true });
  var schemeinterpreter_SCRIPT = querying.executeScript(null, {
    file: "/content_scripts/scheme_interpreter.js"
  });
  schemeinterpreter_SCRIPT.then(onExecutedSchemeInterpreter, onErrorSchemeInterpreter);
}

function onErrorPegjs(error) {
  console.log(`Error adding pegjs: ${error}`);
}


var executingpegjs = browser.tabs.executeScript(null, {
            file: "/content_scripts/peg-0.9.0.js"
          });
 
 executingpegjs.then(() => {
            console.log("loaded");
}).error(onErrorPegjs);


function onErrorSchemeInterpreter(error) {
  console.log(`Error adding SchemeInterpreter: ${error}`);
}