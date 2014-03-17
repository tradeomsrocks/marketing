// Unfortunately this is misbehaving right now
//require('../lib/jquery/jquery.js'); 
//require('../lib/underscore/Underscore.js');
//require('../lib/backbone/Backbone.js');

require('./util/Utils.js');
require('./routers/MainRouter.js');
require('./domain/Session.js');
require('./services/ErrorService.js');
require('./services/AnalyticsService.js');

$().ready(function () {


    TradeOMS.util.initializeSession();
//    TradeOMS.util.loadEnums();
    TradeOMS.util.injectNamespaces();
    TradeOMS.util.injectTemplates();
    TradeOMS.util.initializeServices();
    TradeOMS.util.initializeRouters();

//    TradeOMS.util.loadInitialData();

    // Start the application.  This will trigger the router function that matches the current # in the url
    Backbone.history.start();
});
