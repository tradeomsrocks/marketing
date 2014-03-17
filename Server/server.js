// Extremely simple web server that just bundles up the client and serves up the client's home.html file as well as resources (javascript, css, images)

var express = require('express');
var exec = require('child_process').exec;
var fs = require('fs');

var port = 3000;
var releaseMode = process.argv[2] || 'DEV';
var clientRootDir = __dirname.replace(/\\/g, '/') + '/../Client/';
var staticRootDir = clientRootDir + 'app/';

var deployClient = function(){
    exec('node ' + clientRootDir + 'tools/GenerateDeployments.js', function(error){
        if(error){
            console.log('!ERROR! Could not deploy client: ' + error);
        }
        else {
            console.log('Deployed client');
        }
    });
};

var app = express();
var homeHtml;

// All code / images / css accessible via the client root directory
app.use(express.static(staticRootDir));

// facilitate body parsing (for emails)
app.use(express.bodyParser());

// Empty root serves up home page
app.get('/', function(req, res){
    if(!homeHtml || releaseMode === 'DEV'){
        deployClient();
        homeHtml = fs.readFileSync(staticRootDir + 'home.html', 'utf-8');
    }

    res.writeHeader(200, {"Content-Type": "text/html"});
    res.write(homeHtml);
    res.end();
});

// handle emails
app.post('/sendEmail', function(req, res){
    console.log('sending email: ', req.body.fromAddress, req.body.message);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('{}');
    res.end();
})

app.listen(port);
console.log('Running with release mode: ' + releaseMode);
console.log('Listening on port: ' + port);
