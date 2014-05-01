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

        if(action !== TradeOMS.services.navigatorService.getPreviousAction() && this._activeView){
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