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
