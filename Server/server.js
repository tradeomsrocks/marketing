// Extremely simple web server that just bundles up the client and serves up the client's home.html file as well as resources (javascript, css, images)

var express = require('express');
var exec = require('child_process').exec;
var fs = require('fs');
var dateFormat = require('dateformat');
var nodemailer = require('nodemailer');

var port = 3000;
var releaseMode = process.argv[2] || 'PROD';
var clientRootDir = __dirname.replace(/\\/g, '/') + '/../Client/';
var staticRootDir = clientRootDir + 'app/';

var app = express();
var homeHtml;

// All code / images / css accessible via the client root directory
app.use(express.static(staticRootDir));

// facilitate body parsing (for emails)
app.use(express.bodyParser());


var deployClient = function(){
    exec('node ' + clientRootDir + 'tools/GenerateDeployments.js', function(error){
        if(error){
            console.log('!ERROR! Could not deploy client: ' + error);
        }
        else {
            homeHtml = fs.readFileSync(staticRootDir + 'home.html', 'utf-8');
            console.log('Deployed client');
        }
    });
};

deployClient();

// Empty root serves up home page
app.get('/', function(req, res){
    if(!homeHtml || releaseMode === 'DEV'){
        deployClient();
    }

    res.writeHeader(200, {'Content-Type': 'text/html'});
    res.write(homeHtml);
    res.end();
});

var smtpTransport = nodemailer.createTransport('Gmail', {
    auth: {
        user: 'rich@wifunds.com',
        pass: 'mypass12'
    }
});

// handle emails
app.post('/sendEmail', function(req, res){
    try {
        // write the email to a file as a backup just in case
        var fileName = 'emails/' + dateFormat(new Date(), 'yyyy-mm-dd-h_MM_ss') + '.txt';
        var backup = 'Email: ' + req.body.fromAddress + '\r\n\r\nMessage: ' + req.body.message;
        fs.writeFile(fileName, backup, function (err) {
            if (err) throw err;
        });
    }
    catch(e) {
        try {
            console.error('!!!!CRITICAL ERROR, could not save an email to a file!!! ', req && req.body && req.body.fromAddress, req && req.body && req.body.message);
        }
        catch(e2){
            // no idea how that could happen but I'm being safe
        }
    }

    // Actually send the email now
    console.log('sending email: ', req.body.fromAddress, req.body.message);

    try {

        var mailOptions = {
            from: 'Trade OMS Sales <sales@tradeoms.com>',
            to: 'rich@wifunds.com, bartwood@gmail.com', // list of receivers
            subject: 'Important! Inquiry from tradeoms.com',
            text: 'From: ' + req.body.fromAddress + '\r\nMessage: ' + req.body.message
        };

        smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            }
            else {
                console.log('Message sent: ' + response.message);
            }
        });
    }
    catch(e){
        
    }

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('{}');
    res.end();
})

app.listen(port);
console.log('Running with release mode: ' + releaseMode);
console.log('Listening on port: ' + port);
