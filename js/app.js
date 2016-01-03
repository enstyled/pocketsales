$(function () {

	Cache.expiry = 300000;	// 5 minutes
	$.cookie.defaults = { expires: 365 };
	
	var username, key;
	var URL = "http://marketplace.envato.com/api/v3/";
	var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	
	var App = {
		init: function() {			
			if( ! isMobile ) {
				this.showPage('homepage', true);
				return false;
			}
			
			this.bindEvents();
			this.isAuthenticated();
		},
		
		showPage: function(name, addClass) {
			var template = $('#'+name).html();
			
			$('#content').html(template);
			$('body').removeClass('loading').addClass(function() {
				if( addClass === true ) {
					return name;
				}
			});
		},
		
		bindEvents: function () {
			$('body').on('submit', '#login-form', this.validateLogin.bind(this));
			$('body').on('click', '#signout', this.logout.bind(this));
		},
		
		isAuthenticated: function() {
			username = $.cookie('username');
			key = $.cookie('api-key');
		
			if ( username && key ) {
				this.getData();
			} else {
				this.showPage('login');
			}
		},
		
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
		
		authorize: function(username, key) {
			var orgLabel = $('#login-form button').text();
			var login = $.getJSON(URL + username +'/'+ key + "/vitals.json");
						
			$('#login-form button').prop('disabled', true).text('Logging in...');
			
			login.done(function() {
				$.cookie('username', username);
				$.cookie('api-key', key);
				App.isAuthenticated();
			});
			
			login.fail(function() {
				$('#login-form button').prop('disabled', false).text(orgLabel);
				alert('Wrong username or API key.');
			});
		},
		
		logout: function() {
			$.removeCookie('username');
			$.removeCookie('api-key');
			
			this.isAuthenticated();
		},
		
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
		
		formatData: function(data) {
	    	var monthly = data['earnings-and-sales-by-month'];
			
			data.account.monthly = monthly[monthly.length - 1];
			data.account.commission = data.account.current_commission_rate * 100;
			
			Cache.set(key, data);
		},
		
		markNewSales: function(data) {
			$.each(data, function() {
				if( new Date(this.occured_at).getTime() > $.cookie('last-visit') ) {
					this.fresh = 'class=new';
				}
			});
			
			return data;
		},	
		
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
