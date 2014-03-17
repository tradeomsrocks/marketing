GetNamespace('TradeOMS.services').ErrorService = Backbone.Model.extend({

    // returns a jquery promise.  register for .done() or .error()
    initialize: function(){
        _.bindAll(this, '_onAjaxError');
        $(document).ajaxError(this._onAjaxError);
    },

    _onAjaxError: function(event, jqXHR, ajaxSettings, thrownError){
        // Todo - handle generic errors gracefully
        alert('Sum Ting Wong: ' + thrownError);
    }

});
