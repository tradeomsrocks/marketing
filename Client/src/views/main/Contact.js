require('../BaseView.js');
require('../../services/EmailService.js');

GetNamespace('TradeOMS.views.main').Contact = TradeOMS.views.BaseView.extend({

    className: 'container',

    events: {
        'click #submit': '_onSubmitClicked'
    },

    render: function(){
        this.$el.html(this.template());
        this.$('form').validate({
            rules: {
                fromEmail: {
                    required: true,
                    email: true
                },
                message: {
                    required: true
                }
            },
            messages: {
                fromEmail: 'We need a valid email to be able to respond.',
                message: 'The message can\'t be empty'
            }
        });
        return this;
    },

    _onSubmitClicked: function(){

        if(!this.$('form').valid()){
            return false;
        }

        var emailOptions = {fromAddress: this.$('[name=fromEmail]').val(), message: this.$('[name=message]').val()};

        TradeOMS.services.emailService.sendEmail(emailOptions).done(function(){
            this.$('.sendEmail').hide();
            this.$('.sentEmail').show();
        }.bind(this));

        return false; // always return false on link click events or the url fragment hash will be cleared out!!
    }
});
