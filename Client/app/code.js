(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./util/Utils.js');
require('./routers/MainRouter.js');
require('./domain/Session.js');
require('./services/ErrorService.js');
require('./services/AnalyticsService.js');

$().ready(function () {

    // Kojak stuff
//    kConfig.setEnableNetWatcher(true)
//    kConfig.setIncludedPakages(['TradeOMS']);
//    kInst.instrument();

    TradeOMS.util.initializeSession();
    TradeOMS.util.injectNamespaces();
    TradeOMS.util.injectTemplates();
    TradeOMS.util.initializeServices();
    TradeOMS.util.initializeRouters();

    // Start the application.  This will trigger the router function that matches the current # in the url
    Backbone.history.start();
});

},{"./domain/Session.js":2,"./routers/MainRouter.js":3,"./services/AnalyticsService.js":4,"./services/ErrorService.js":6,"./util/Utils.js":9}],2:[function(require,module,exports){
GetNamespace('TradeOMS.domain').Session = Backbone.Model.extend({

});

},{}],3:[function(require,module,exports){
require('../services/NavigatorService.js');
require('../services/MainService.js');

GetNamespace('TradeOMS.routers').MainRouter = Backbone.Router.extend({
    routes:{
        '': '_homeRoute',
        'home/:menu': '_homeRoute'
    },

    _homeRoute: function (menu) {
        menu = menu || 'why';
        TradeOMS.services.navigatorService.navigate('home', {menu: menu});
    },

    _home: function(context){
        TradeOMS.session.set({selectedMenu: context.menu});
        TradeOMS.services.navigatorService.pushHistoryFragment('home/' + context.menu);
    }
});
},{"../services/MainService.js":7,"../services/NavigatorService.js":8}],4:[function(require,module,exports){


GetNamespace('TradeOMS.services').AnalyticsService = Backbone.Model.extend({

    initialize:function () {
        _.bindAll(this, 'push');
    },

    push:function (message) {
        if (window['_gaq']) {
            window._gaq.push(message);
        }
    }
});

},{}],5:[function(require,module,exports){
GetNamespace('TradeOMS.services').EmailService = Backbone.Model.extend({

    // returns a jquery promise.  register for .done() or .error()
    sendEmail: function(emailOptions){
        var sendEmailModel = new Backbone.Model(emailOptions);
        sendEmailModel.urlRoot = '/sendEmail/';
        return sendEmailModel.save();
    }

});
},{}],6:[function(require,module,exports){
GetNamespace('TradeOMS.services').ErrorService = Backbone.Model.extend({

    // returns a jquery promise.  register for .done() or .error()
    initialize: function(){
        _.bindAll(this, '_onAjaxError');
        $(document).ajaxError(this._onAjaxError);
    },

    _onAjaxError: function(event, jqXHR, ajaxSettings, thrownError){
        // Todo - handle generic errors gracefully
        alert('Sum Ting Wong: ' + thrownError);
    }

});

},{}],7:[function(require,module,exports){
require('../views/main/MainLayout.js');
require('../views/main/Why.js');
require('../views/main/ScreenShots.js');
require('../views/main/Faqs.js');
require('../views/main/Testimonials.js');
require('../views/main/About.js');
require('../views/main/Contact.js');

GetNamespace('TradeOMS.services').MainService = Backbone.Model.extend({

    _mainLayout: undefined,
    _activeView: undefined,

    initialize: function(){
        _.bindAll(this, '_onSelectedMenuChanged');
        TradeOMS.session.on('change:selectedMenu', this._onSelectedMenuChanged);
    },

    onBeforeNavigate: function(action, context){
        this._initializeMainLayout();

        if(this._activeView){
            this._activeView.remove();
        }
    },

    _initializeMainLayout: function(){
        // load the main layout if it hasn't been loaded yet
        if(!this._mainLayout){
            this._mainLayout = new TradeOMS.views.main.MainLayout();
            // add the main layout directly to the dom's body element
            $('body').append(this._mainLayout.render().el);
        }
    },

    _onSelectedMenuChanged: function(){
        var viewName = TradeOMS.session.get('selectedMenu');
        viewName = viewName.substring(0, 1).toUpperCase() + viewName.substring(1);

        this._activeView = new TradeOMS.views.main[viewName]();
        this._mainLayout.getMainBodyEl().html(this._activeView.render().el);
    }
});
},{"../views/main/About.js":11,"../views/main/Contact.js":12,"../views/main/Faqs.js":13,"../views/main/MainLayout.js":14,"../views/main/ScreenShots.js":15,"../views/main/Testimonials.js":16,"../views/main/Why.js":17}],8:[function(require,module,exports){
require('./AnalyticsService.js');

// The navigator service provides a simple way for all of the services to coordinate as the user'
// navigates through the application.  Services can override onBefore/After Navigate functions
// and use the action + context to figure out if they need to clean up views, load data etc.
GetNamespace('TradeOMS.services').NavigatorService = Backbone.Model.extend({

    // events triggered: beforeNavigate(action, context), afterNavigate(action, context)

    _previousAction: undefined,
    _previousUrlFragment: undefined,
    _currentUrlFragment: undefined,

    navigate: function(action, context){
        var routerActionName = '_' + action;

        if(!context){
            context = {};
        }

        this._previousUrlFragment = this._currentUrlFragment;
        context.previousAction = this._previousAction;

        this._beforeNavigate(action, context);

        _.each(TradeOMS.routers, function(router){
            if(router[routerActionName] !== undefined){
                router[routerActionName](context);
            }
        });

        this._afterNavigate(action, context);

        this._previousAction = action;
        this._currentUrlFragment = Backbone.history.fragment;

        return this;
    },

    _beforeNavigate: function(action, context){
        _.each(TradeOMS.services, function(service){
            if(_.isFunction(service.onBeforeNavigate)){
                service.onBeforeNavigate(action, context);
            }
        });
    },

    _afterNavigate: function(action, context){
        _.each(TradeOMS.services, function(service){
            if(_.isFunction(service.onAfterNavigate)){
                service.onAfterNavigate(action, context);
            }
        });
    },

    pushHistoryFragment: function(urlFragment){
        Backbone.history.navigate(urlFragment);
        TradeOMS.services.analyticsService.push(['_trackPageview', '#' + urlFragment]);
    }
});

},{"./AnalyticsService.js":4}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
GetNamespace('TradeOMS.views').BaseView = Backbone.View.extend({


});

},{}],11:[function(require,module,exports){
require('../BaseView.js');

GetNamespace('TradeOMS.views.main').About = TradeOMS.views.BaseView.extend({

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});
},{"../BaseView.js":10}],12:[function(require,module,exports){
require('../BaseView.js');
require('../../services/EmailService.js');

GetNamespace('TradeOMS.views.main').Contact = TradeOMS.views.BaseView.extend({

    className: 'container',

    events: {
        'click #submit': '_onSubmitClicked'
    },

    render: function(){
        this.$el.html(this.template());
        this.$('form').validate({
            rules: {
                fromEmail: {
                    required: true,
                    email: true
                },
                message: {
                    required: true
                }
            },
            messages: {
                fromEmail: 'We need a valid email to be able to respond.',
                message: 'The message can\'t be empty'
            }
        });
        return this;
    },

    _onSubmitClicked: function(){

        if(!this.$('form').valid()){
            return false;
        }

        var emailOptions = {fromAddress: this.$('#fromEmail').val(), message: this.$('#message').val()};

        TradeOMS.services.emailService.sendEmail(emailOptions).done(function(){
            this.$('.sendEmail').hide();
            this.$('.sentEmail').show();
        }.bind(this));

        return false; // always return false on link click events or the url fragment hash will be cleared out!!
    }
});

},{"../../services/EmailService.js":5,"../BaseView.js":10}],13:[function(require,module,exports){
require('../BaseView.js');

GetNamespace('TradeOMS.views.main').Faqs = TradeOMS.views.BaseView.extend({

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});
},{"../BaseView.js":10}],14:[function(require,module,exports){
require('../BaseView.js');
require('../menu/TopMenu.js');

GetNamespace('TradeOMS.views.main').MainLayout = TradeOMS.views.BaseView.extend({

    _topMenu: undefined,
    className: 'container',

    initialize: function(){
        this._topMenu = new TradeOMS.views.menu.TopMenu();
    },

    render: function(){
        this.$el.append(this.template());
        this.$('#menu').append(this._topMenu.render().el);

        return this;
    },

    getMainBodyEl: function(){
        return this.$('#mainBody');
    }
});
},{"../BaseView.js":10,"../menu/TopMenu.js":18}],15:[function(require,module,exports){
require('../BaseView.js');

GetNamespace('TradeOMS.views.main').ScreenShots = TradeOMS.views.BaseView.extend({

    className: 'container',

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});
},{"../BaseView.js":10}],16:[function(require,module,exports){
require('../BaseView.js');

GetNamespace('TradeOMS.views.main').Testimonials = TradeOMS.views.BaseView.extend({

    className: 'container',

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});
},{"../BaseView.js":10}],17:[function(require,module,exports){
require('../BaseView.js');

GetNamespace('TradeOMS.views.main').Why = TradeOMS.views.BaseView.extend({

    className: 'container',

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});
},{"../BaseView.js":10}],18:[function(require,module,exports){
require('../BaseView.js');

GetNamespace('TradeOMS.views.menu').TopMenu = TradeOMS.views.BaseView.extend({

    events: {
        'click a': '_onLinkClicked'
    },

    initialize: function(){
        _.bindAll(this, '_onSelectedMenuChanged');
        this.listenTo(TradeOMS.session, 'change:selectedMenu', this._onSelectedMenuChanged);
    },

    render: function(){
        this.$el.html(this.template());
        return this;
    },

    _onLinkClicked: function(event){
        TradeOMS.services.navigatorService.navigate('home', {menu: event.target.id});
        return false; // always return false on link click events or the url fragment hash will be cleared out!!
    },

    _onSelectedMenuChanged: function(){
        this.$('li').removeClass('active');
        this.$('a#' + TradeOMS.session.get('selectedMenu')).parent().addClass('active');
    }
});
},{"../BaseView.js":10}]},{},[1])