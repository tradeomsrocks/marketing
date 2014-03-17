// Meant to be run in NodeJS as a pre-process before the single page app is served up
// Takes an input directory,
//   recursively locates all .html files
//     extracts the text from the .html file
//       stores the text as a javascript string in a namespace that matches the directory + file name of the .html file
// Writes all of the javascript strings in an output file

var fs = require('fs');
var underscore = require('underscore');

var rootDirectory = process.argv[2];
var templates = '';
var outputFile = process.argv[3];
var carriageReturnsRegex = /[\n\r]/g;

if(!fs.existsSync(rootDirectory)){
    throw 'Hey you big dummy! The rootDirectory did not exist: ' + rootDirectory;
}

function processTemplate(templateFile){
    var fileContent = fs.readFileSync(templateFile, 'utf8');
    fileContent = fileContent.replace(carriageReturnsRegex, '');
    var template = underscore.template(fileContent);
    var templateNamespace = 'TradeOMS.templates' + templateFile.replace(rootDirectory, '').replace('.html', '').replace(/\//g, '.');
    var templateName = templateNamespace.substr(templateNamespace.lastIndexOf('.') + 1);
    templateNamespace = templateNamespace.substr(0, templateNamespace.lastIndexOf('.'));
    templates += 'GetNamespace(\'' + templateNamespace + '\').' + templateName + '=' + template.source + ';';
};

var fileItems = [rootDirectory];
var fileItem, fileItemStats, childItems, childItemsCount;

while(fileItems.length > 0){
    fileItem = fileItems.pop();
    fileItemStats = fs.statSync(fileItem);

    if(fileItemStats.isFile() && fileItem.indexOf('.html') === fileItem.length -5){
        processTemplate(fileItem);
    }
    else if(fileItemStats.isDirectory()){
        childItems = fs.readdirSync(fileItem);
        for(childItemsCount in childItems){
            fileItems.push(fileItem + '/' + childItems[childItemsCount]);
        }
    }
}

fs.writeFile(outputFile, templates);
