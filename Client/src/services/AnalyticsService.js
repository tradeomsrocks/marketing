

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
