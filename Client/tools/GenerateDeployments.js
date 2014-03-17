// Run with NodeJS in a command line like this: node GenerateClientBundles.js
// Will generate code.js and templates.js in the /app directory
// Client needs to also include /util/Namespace.js before code.js or templates.js
// Maybe create an include snippet in /app directory for the scripts the client will need to include?

// Todo - it would be nicer if I had a exploded mode as well for development - especially when the size of files grows
var exec = require('child_process').exec;
var clientRootDirectory = __dirname.replace(/\\/g, '/') + '/../';

exec('cp ' + clientRootDirectory + 'src/util/Namespace.js' + ' ' + clientRootDirectory + 'app/', function(error){
    if(error){
        console.log('!ERROR! Could not copy Namespace.js to app directory: ' + error);
    }
    else {
        console.log('Copied Namespace.js to the app directory');
    }
});

// Bundle the templates
exec('node ' + clientRootDirectory + 'tools/bundle_templates/BundleTemplates.js ' + clientRootDirectory + 'src/views/ ' + clientRootDirectory + 'app/templates.js', function(error){
    if(error){
        console.log('!ERROR! Bundling templates: ' + error);
    }
    else {
        console.log('Templates bundled in the app directory');
    }
});

// Bundle the code
exec('browserify ' + clientRootDirectory + 'src/Start.js > ' + clientRootDirectory + 'app/code.js', function(error){
    if(error){
        console.log('!ERROR! Bundling code: ' + error);
    }
    else {
        console.log('Code bundled in the app directory');
    }
});