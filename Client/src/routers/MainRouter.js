require('../services/NavigatorService.js');
require('../services/MainService.js');

GetNamespace('TradeOMS.routers').MainRouter = Backbone.Router.extend({
    routes:{
        '': '_homeRoute',
        'home/:menu': '_homeRoute'
    },

    _homeRoute: function (menu) {
        menu = menu || 'why';
        TradeOMS.services.navigatorService.navigate('home', {menu: menu});
    },

    _home: function(context){
        TradeOMS.session.set({selectedMenu: context.menu});
        TradeOMS.services.navigatorService.pushHistoryFragment('home/' + context.menu);
    }
});