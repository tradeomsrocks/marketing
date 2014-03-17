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
