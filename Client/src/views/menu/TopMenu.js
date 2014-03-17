require('../BaseView.js');

GetNamespace('TradeOMS.views.menu').TopMenu = TradeOMS.views.BaseView.extend({

    events: {
        'click a': '_onLinkClicked'
    },

    initialize: function(){
        _.bindAll(this, '_onSelectedMenuChanged');
        this.listenTo(TradeOMS.session, 'change:selectedMenu', this._onSelectedMenuChanged);
    },

    render: function(){
        this.$el.html(this.template());
        return this;
    },

    _onLinkClicked: function(event){
        TradeOMS.services.navigatorService.navigate('home', {menu: event.target.id});
        return false; // always return false on link click events or the url fragment hash will be cleared out!!
    },

    _onSelectedMenuChanged: function(){
        this.$('li').removeClass('active');
        this.$('a#' + TradeOMS.session.get('selectedMenu')).parent().addClass('active');
    }
});