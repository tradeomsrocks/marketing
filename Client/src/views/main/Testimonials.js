require('../BaseView.js');

GetNamespace('TradeOMS.views.main').Testimonials = TradeOMS.views.BaseView.extend({

    className: 'container',

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});