// A collection of critical utility functions.  Some of these are called on application start up before
// services etc have been initialized.  These functions initialize the services, views, etc

GetNamespace('TradeOMS.util').initializeRouters = function() {
    _.each(TradeOMS.routers, function (Router, name) {
        var firstChar = name.charAt(0);
        var lowerName;
        if (firstChar >= 'A' && firstChar <= 'Z' && name.indexOf('Router') !== -1 && !TradeOMS.routers[(lowerName = firstChar.toLowerCase() + name.substring(1))]) {
            TradeOMS.routers[lowerName] = new Router();
        }
    });
};

GetNamespace('TradeOMS.util').initializeServices = function(){
    _.each(TradeOMS.services, function (Service, name) {
        if(_.isFunction(Service)){
            var firstChar = name.charAt(0);
            var lowerName;
            if (firstChar >= 'A' && firstChar <= 'Z' && name.indexOf('Service') !== -1 && !TradeOMS.services[(lowerName = firstChar.toLowerCase() + name.substring(1))]) {
                TradeOMS.services[lowerName] = new Service();
            }
        }
    });
};

GetNamespace('TradeOMS.util').initializeSession = function(){
    TradeOMS.session = new TradeOMS.domain.Session();
};

// Injects a variable named 'namespace' in every class and function that can be found recursively via the
// namespace 'TradeOMS'.  Can be extremely helpful in debugging or other reflection type of utilities
GetNamespace('TradeOMS.util').injectNamespaces = function(){
    var namespacePaths = ['TradeOMS'],
        currentNamespacePath,
        currentNamespace,
        key,
        value;

    while (namespacePaths.length > 0) {
        currentNamespacePath = namespacePaths.pop();
        currentNamespace = GetNamespace(currentNamespacePath, false);

        if(currentNamespace){
            currentNamespace.namespace = currentNamespacePath;
            Object.defineProperty(currentNamespace, 'namespace', {enumerable: false}); // hide from iterators

            for(key in currentNamespace){
                if(currentNamespace.hasOwnProperty(key)){
                    value = currentNamespace[key];

                    if(value){
                        if(_.isFunction(value)){
                            // if is class
                                value.prototype.namespace = currentNamespacePath + '.' + key;
                                Object.defineProperty(value.prototype, 'namespace', {enumerable: false}); // hide from iterators
                        }
                        else if(value.constructor === Object){
                            namespacePaths.push(currentNamespacePath + '.' + key);
                        }
                    }
                }
            }
        }
    }
};

// Hooks up the template functions into matching view classes based on naming convention
// Checks all View classes under the TradeOMS.views namespace and hooks up the templates automatically
GetNamespace('TradeOMS.util').injectTemplates = function(){
    var viewNamespaces = [TradeOMS.views], viewNamespace, key, value, templateNamespace, template;

    while (viewNamespaces.length > 0) {
        viewNamespace = viewNamespaces.pop();

        for(key in viewNamespace){
            if(viewNamespace.hasOwnProperty(key)){
                value = viewNamespace[key];

                if(value.constructor === Object){
                    viewNamespaces.push(value);
                }
                else if(_.isFunction(value) && TradeOMS.util.isClassOfType(value, Backbone.View)){
                    // Try to locate the corresponding template
                    templateNamespace = value.prototype.namespace.replace('TradeOMS.views', 'TradeOMS.templates');
                    template = GetNamespace(templateNamespace, false);

                    if(template){
                        value.prototype.template = template;
                    }
                }
            }
        }
    }

};

// Makes a copy of the value into the JSON structure.
// value:
//    Can be a backbone collection, an array, a backbone model or a javascript object. By default all of the value's attributes
//    are included in the json structure unless they've been excluded. Nested objects are converted to simple objects that
//    only contain ids by default unless an option has been specified for the nested object.  If an option has been specified
//    for a nested attribute, it will be deeply cloned honoring the exclude and nestedAttributeName parameters.  Options
//    can be deeply nested.
//
// options:
//    if set to something, the value will be deeply copied meaning all of the objects attributes will try to be copied unless
//    the attribute is explicitly excluded.  Otherwise, if the object has an id, that's the only thing that is returned.
//
//    exclude: attribute name(s) to ignore.  Can be a string or an array of strings.
//
//    nestedAttributeName: options keyed under an attribute name are options specific to that attribute and are recursively
//    passed to this function
GetNamespace('TradeOMS.util').convertToJSON = function(value, options){
    var json, attName, attValue, includeAtt, nestedOptions;

    if(value instanceof Backbone.Collection){
        return TradeOMS.util.convertToJSON(value.models, options);
    }
    else if(_.isArray(value)){
        return _.map(value, function(val){return TradeOMS.util.convertToJSON(val, options);});
    }
    else if(value instanceof Backbone.Model){
        return TradeOMS.util.convertToJSON(value.attributes, options);
    }
    else if(_.isObject(value)){
        json = {};

        if(options){
            for(attName in value){
                attValue = value[attName];

                if(attValue !== undefined){
                    includeAtt = true;

                    if(_.isString(options.exclude)){
                        includeAtt = options.exclude !== attName;
                    }
                    else if(_.isArray(options.exclude)){
                        includeAtt = _.indexOf(options.exclude, attName) === -1;
                    }

                    if(includeAtt){
                        if(attValue === null){
                            json[attName] = null;
                        }
                        else if (_.isDate(attValue)) {
                            json[attName] = attValue.getTime();
                        }
                        else if(_.isArray(attValue) || _.isObject(attValue)){
                            nestedOptions = options.convertAll ? options : options[attName];
                            json[attName] = Gryphon.convertToJSON(attValue, nestedOptions);
                        }
                        else {
                            json[attName] = attValue;
                        }
                    }
                }
                else if(options.undefinedValue){
                    json[attName] = options.undefinedValue;
                }
            }
        }
        else {
            if(value.id){
                json['id'] = value.id;
            }
        }

        return json;
    }
    return value;
};


// Check a clazz/function if it's the same type or a subtype of the clazz ofType
GetNamespace('TradeOMS.util').isClassOfType = function(clazz, ofType){
    return clazz === ofType || clazz.prototype instanceof ofType;
};