require('../BaseView.js');
require('../menu/TopMenu.js');

GetNamespace('TradeOMS.views.main').MainLayout = TradeOMS.views.BaseView.extend({

    _topMenu: undefined,
    className: 'container',

    initialize: function(){
        this._topMenu = new TradeOMS.views.menu.TopMenu();
    },

    render: function(){
        this.$el.append(this._topMenu.render().el);
        this.$el.append(this.template());
        return this;
    },

    getMainBodyEl: function(){
        return this.$('#mainBody');
    }
});