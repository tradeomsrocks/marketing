require('../BaseView.js');

GetNamespace('TradeOMS.views.main').Why = TradeOMS.views.BaseView.extend({

    className: 'container',

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});