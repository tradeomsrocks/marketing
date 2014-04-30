GetNamespace('TradeOMS.templates.menu').TopMenu=function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<div class="row">    <h3 class="col-sm-12 text-muted">Trade OMS: Excel Trade</h3></div><div class="row">    <div class="col-sm-12">        <ul class="nav nav-justified">            <li><a id="why" href="#">Excel Trade</a></li>            <li><a id="screenShots" href="#">Screen Shots</a></li>            <li><a id="faqs" href="#">FAQs</a></li>            <li><a id="testimonials" href="#">Testimonials</a></li>            <li><a id="contact" href="#">Contact</a></li>        </ul>    </div></div>';
}
return __p;
};GetNamespace('TradeOMS.templates.main').Why=function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<br><br><div class="row col-sm-offset-1">    <h3>Love the power and flexibility of Excel for trade analytics?</h3>    <h3>Imagine managing your trades directly in Microsoft Excel.</h3>    <h3>Excel Trade lets you:</h3></div><div class="row col-sm-offset-2 col-xs-offset-1">    <h4>* Execute orders in real-time using Excel formulas to determine price/quantity</h4>    <h4>* Simplify your trading infrastructure</h4>    <h4>* Receive real-time updates in Excel when orders are filled</h4>    <h4>* Send orders to virtually any broker in the US</h4></div>';
}
return __p;
};GetNamespace('TradeOMS.templates.main').Testimonials=function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<br><br><div class="container">    <div class="row col-sm-10 col-sm-offset-1">        <div class="speech-bubble">            <p class="lead">TradeOMS Excel Trade allows me to flexibly automate my trading versus using canned Wall Street software that just doesn\'t do what I need.  By entering formulas into Excel, I can use TradeOMS to customize and execute my trading strategies.  It is a must have for the original trader.</p>            <p class="text-right"><strong>Matt Crouse, Western Investment</strong></p>        </div>    </div>    <div class="row col-sm-10 col-sm-offset-1">        <div class="speech-bubble">            <p class="lead">I have been using TradeOMS Excel Trade for many years. It is very flexible for various trading strategies and, at the same time, dependable software that you can rely on in ever-changing fast market.  I highly recommend to anyone who is serious about trading.</p>            <p class="text-right"><strong>Ansu Lee, Senior Trader</strong></p>        </div>    </div></div>';
}
return __p;
};GetNamespace('TradeOMS.templates.main').ScreenShots=function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<br><br>ExcelTrade in action<hr><strong>Basic configuration options:</strong><br><br><img src="img/Settings.jpg"/><br><br><br><strong>Basic trade example:</strong><br><br><img src="img/Trades.jpg"/>';
}
return __p;
};GetNamespace('TradeOMS.templates.main').MainLayout=function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<div id="menuWithBody" class="container-fluid">    <div id="menu"></div>    <div id="mainBody"></div></div><!-- Site footer --><div class="footer">    <p>&copy; TradeOMS 2014</p></div>';
}
return __p;
};GetNamespace('TradeOMS.templates.main').Faqs=function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<br><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>What do I need to get started?</i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        To get started you need a Windows PC with Microsoft Excel installed and a brokerage account.    </div></div><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>How are orders executed?</i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        Orders are executed through a FIX engine hosted by EZX, Inc.    </div></div><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>How do I manage trades in Excel?</i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        Typically, a trade is contained in a single row in Excel. Some of the fields (e.g. symbol/side/price/quantity/enabled) contain user input. Other fields (e.g. order status, shares filled, shares outstanding) contain feedback from the trading engine.    </div></div><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>How do I know when an order is placed, partially filled, filled, rejected or cancelled? </i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        Order response details are displayed in Excel and are also recorded in a log file on your computer.    </div></div><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>How do I set order parameters (symbol/side/price/quantity)?</i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        Order parameters are set in your Excel spreadsheet and automatically propagate to the trading engine. For example, if the value in the price cell changes, either manually or by a formula updating, the trade engine will cancel the existing order and place a new one.    </div></div><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>How do I send or cancel orders?</i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        Enter "0" in the "enabled" cell in a row containing a trade to cancel an order. Enter "1" in the "enabled" cell to send an order. The value in the "enabled" cell can be based on a formula.    </div></div><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>How do I set a limit for the total number of shares to buy/sell?</i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        Enter the maximum number of shares to buy/sell in the "share cap" cell.    </div></div><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>What happens to my orders if Excel crashes?</i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        If Excel crashes, restart Excel and the trading engine will re-sync with the EZX FIX engine, providing up to date information regarding order statuses for all trades.    </div></div><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>Can I send orders to multiple brokers?</i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        Each trade row has a field where you can specify the executing broker. You can configure as many executing brokers as you want.    </div></div><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>Can I cancel/replace orders after a specific period of time? </i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        Yes, enter the number of seconds to wait before cancelling and replacing an outstanding order in the "" field.    </div></div><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>Can I randomize the order quantity?</i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        Yes, enter the max number of shares by which to reduce/increase the order quantity in the "Rand" field.    </div></div><br><div class="container">    <div class="row col-lg-8 col-md-offset-1">        <strong><i>How do I get support for TradeOMS?</i></strong>    </div>    <div class="row col-lg-8 col-md-offset-1">        We are committed to our customer\'s success. Support is given via email and over the phone.    </div></div>';
}
return __p;
};GetNamespace('TradeOMS.templates.main').Contact=function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<br><br><div class="row col-sm-8 col-sm-offset-1 lead" >    Contact us with any questions regarding TradeOMS Excel Trade and we\'ll get back to you asap.</div><br><br><div class="row col-sm-8 col-sm-offset-1 sendEmail" style="display:block">    <form role="form" id="emailForm">        <div class="form-group">            <label for="cfromEmail">My Email address *</label>            <input type="email" class="form-control" id="cfromEmail" name="fromEmail" placeholder="My email address">        </div>        <div class="form-group">            <label for="cmessage">Message *</label>            <textarea class="form-control" id="cmessage" name="message" rows="5"></textarea>        </div>        <button type="submit" class="submit btn btn-primary btn-lg active" id="submit">Submit</button>    </form></div><div class="row col-sm-8 col-sm-offset-1 sentEmail" style="display:none">    <p class="lead">Thanks for the email.</p>    <p class="lead">We\'ll get back to you asap.</p></div>';
}
return __p;
};GetNamespace('TradeOMS.templates.main').About=function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='About';
}
return __p;
};