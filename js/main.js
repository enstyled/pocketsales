new Vue({
    el: 'body',
    
    http: {
        root: 'https://api.envato.com'
    },
    
    data: {
        app: {
            hostname: 'http://localhost/pocketsales/',
            title: 'Pocket Sales',
            credits: 'Tiny app made by <a href="http://themeforest.net/user/enstyled" target="_blank">enstyled</a>',
            client_id: 'pocketsales-s4abdu83',
            client_secret: '9VswgJmIxyIG5JVrWmqHhuI7HbZNVgCK',
            state: 'loading'
        },
        user: {
            username: '',
            statement: '',
            earnings: '',
            details: ''
        }
    },
    
    computed: {
        mobile: function() {
            // Inversed for dev
            return ! /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        logged: function() {
            return Cookies.get('auth');
        },
        auth: function() {
            return Cookies.getJSON('auth');
        }
    },
    
    methods: {
        getParam: function(name) {
            if(name = (new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search)) {
                return decodeURIComponent(name[1]);
            }
        },
        cache: function() {
            var now = new Date();
            var expiration = new Date(now.setMinutes(now.getMinutes() + 5)); // 5 minutes
            
            Cookies.set('user', this.user, { expires: expiration });
        },
        authenticate: function() {
            if( this.getParam('code') ) {
                var auth = this.$resource('token');
                var data = {
                    grant_type: 'authorization_code',
                    code: this.getParam('code'),
                    client_id: this.app.client_id,
                    client_secret: this.app.client_secret
                };
                
                auth.save(data).then(function(response) {    
                    Cookies.set('auth', response.data);
                    window.location.href = this.app.hostname;
                }, logError);
            } else {
                window.location.href = 'https://api.envato.com/authorization?response_type=code&client_id='+this.app.client_id+'&redirect_uri='+this.app.hostname;
            }
        },
        getUserData: function() {
            if( Cookies.get('user') ) {
                this.user = Cookies.getJSON('user');
            } else {
                Vue.http.headers.common['Authorization'] = 'Bearer ' + this.auth.access_token;
                
                var userData = this.$resource('v1/market/private/user/{resource}.json');
                var dataList = ['username', 'statement', 'earnings-and-sales-by-month'];
                
                dataList.forEach(function(name, index) {
                    userData.get({ resource: name }).then(function(response) {
                        if( name === 'earnings-and-sales-by-month' ) {
                            this.user.earnings = response.data[name].slice(-1)[0];
                        } else {
                            this.user[name] = response.data[name];
                        }
                        
                        if( name === 'username' ) {
                            var url = 'v1/market/' + encodeURIComponent('user:enstyled.json');
                            
                            this.$http.get(url).then(function(response) {
                                this.user.details = response.data.user;
                                this.cache();
                            }, logError);
                        }
                        
                        this.cache();
                    }, logError);
                });
            }
        },
        logout: function() {
            Cookies.remove('auth');
            window.location.href = this.app.hostname;
        }
    },
    
    ready: function() {
        if( this.logged ) {
            this.getUserData();
        } else {
            this.authenticate();
        }
        
        this.app.state = 'loaded';
    }
});


// General error log
var logError = function(response) {
    console.log(response);
};


// Shake to reload
window.addEventListener('shake', function() {
    location.reload();
}, false);
