GetNamespace('TradeOMS.services').EmailService = Backbone.Model.extend({

    // returns a jquery promise.  register for .done() or .error()
    sendEmail: function(emailOptions){
        var sendEmailModel = new Backbone.Model(emailOptions);
        sendEmailModel.urlRoot = '/sendEmail/';
        return sendEmailModel.save();
    }

});