require('../BaseView.js');

GetNamespace('TradeOMS.views.main').About = TradeOMS.views.BaseView.extend({

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});