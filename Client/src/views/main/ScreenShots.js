require('../BaseView.js');

GetNamespace('TradeOMS.views.main').ScreenShots = TradeOMS.views.BaseView.extend({

    className: 'container',

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});