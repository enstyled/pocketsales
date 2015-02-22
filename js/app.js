$(function () {

	Cache.expiry = 300000;	// 5 minutes
	
	$.cookie.defaults = { expires: 365 };
	
	var URL = "http://marketplace.envato.com/api/v3/";
	var username, key;
	
	
	
	var App = {
		init: function() {			
			if( ! /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				this.showHomepage();
				return false;
			}
			
			this.bindEvents();
			this.isAuthenticated();
		},
		
		
		
		/* Show homepage */
		showHomepage: function() {
			var template = $('#homepage').html();
			$('#content').html(template);
			$('body').removeClass('loading').addClass('homepage');
		},
		
		
		
		// Bind events
		bindEvents: function () {		
			$('body').on('submit', '#login-form', this.validateLogin.bind(this));
			$('body').on('click', '#signout', this.logout.bind(this));
		},
		
		
		
		// Check authentication
		isAuthenticated: function() {		
			username = $.cookie('username');
			key = $.cookie('api-key');
		
			if ( username && key ) {
				this.getData();
			} else {
				this.showLogin();
			}
		},
		
		
		
		// Login page
		showLogin: function() {
			var template = $('#login').html();				
			$('#content').html(template);
			$('body').removeClass('loading');
		},
		
		
		
		// Login validation
		validateLogin: function() {			
			var username = $('#login-form input[name="username"]').val();
			var key = $('#login-form input[name="key"]').val();
			
			if( !username || !key ) {
				alert("Please enter your username and API key.");
			} else {
				this.authorize(username, key);
			}
			
			return false;
		},
		
		
		
		// Authorize
		authorize: function(username, key) {
			
			var orgLabel = $('#login-form button').text();
						
			$('#login-form button').prop('disabled', true).text('Logging in...');
			
			$.getJSON(URL + username +'/'+ key + "/vitals.json")
				.done(function() {
					$.cookie('username', username);
					$.cookie('api-key', key);
					App.isAuthenticated();
				})
				.fail(function() {
					$('#login-form button').prop('disabled', false).text(orgLabel);
					alert('Wrong username or API key.');
				});
		},
		
		
		
		// Logout
		logout: function() {
			$.removeCookie('username');
			$.removeCookie('api-key');
			
			this.showLogin();
			return false;
		},
		
		
		
		// Get user data
		getData: function() {			
			if( Cache.get(key) ) {
			
				App.render();
				
			} else {

				var data = {};
				var resources = ['user', 'vitals', 'account', 'statement', 'earnings-and-sales-by-month'];
				var deferreds = $.map(resources, function(current) {
					var apiURL = current == 'user' ? URL + "user:" + username : URL + username +'/'+ key +'/'+ current;
					
			        return $.getJSON(apiURL + ".json", function(response) {
						$.extend(data, response);
					});
			    });
			
			    $.when.apply($, deferreds).then(function() {
			    	App.formatData(data);
			    	App.render();
			    });
			}
		},
		
		
		
		// Format data
		formatData: function(data) {
	    	var monthly = data['earnings-and-sales-by-month'];
			data.account.monthly = monthly[monthly.length - 1];
			data.account.commission = data.account.current_commission_rate * 100;
	
			Cache.set(key, data);
		},
		
		
		// Mark new sales
		markNewSales: function(data) {
			$.each(data, function() {
				if( new Date(this.occured_at).getTime() > $.cookie('last-visit') ) {
					this.fresh = 'class=new';
				}
			});
			
			return data;
		},	
		
		
		// Render
		render: function() {
			$('body').addClass('loading');
			
			var data = Cache.get(key);
			var template = $('#user').html();
			
			data.statement = this.markNewSales(data.statement);
			
			$('#content').html(Mustache.render(template, data));
				
			window.addEventListener('shake', function() { location.reload(); }, false);
			$.cookie('last-visit', new Date().getTime());
			$('body').removeClass('loading');
		}
	};
	
	
	App.init();

});



/* Google Analytics */
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-29563000-1']);
_gaq.push(['_trackPageview']);

(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();