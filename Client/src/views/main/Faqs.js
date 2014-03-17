require('../BaseView.js');

GetNamespace('TradeOMS.views.main').Faqs = TradeOMS.views.BaseView.extend({

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});