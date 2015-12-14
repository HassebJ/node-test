var publicStripeApiKeyTesting = 'pk_test_5mlYz3FI2WlstrBMfOBW4x6G';

Stripe.setPublishableKey(publicStripeApiKeyTesting);

;(function(){
    function authInterceptor(API, auth) {
        return {
            // automatically attach Authorization header
            request: function(config) {
                var token = auth.getToken();
                if(config.url.indexOf(API) === 0 && token) {
                    config.headers.Authorization = token;
//                    config
                }

                return config;
            },

            // If a token was sent back, save it
            response: function(res) {
                if(res.config.url.indexOf(API) === 0 && res.data.token) {
                    auth.saveToken(res.data.token);
                }

                return res;
            },
        }
    }

    function authService($window) {
        var self = this;

        self.parseJwt = function(token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace('-', '+').replace('_', '/');
            return JSON.parse($window.atob(base64));
        };

        self.saveToken = function(token) {
            $window.localStorage['jwtToken'] = token;
        };

        self.getToken = function() {
            return $window.localStorage['jwtToken'];
        };

        self.isAuthed = function() {
            var token = self.getToken();
            if(token) {
                var params = self.parseJwt(token);
                alert(JSON.stringify(params));
                return Math.round(new Date().getTime() / 1000) <= params.exp;
            } else {
                return false;
            }
        };

    }

    function stripeService($http, API) {
        var self = this;

        self.makePayment = function(formData, amount, message){
            Stripe.createToken(formData, amount, function (status, res) {
                if (res.error) {
                    alert("Error" + JSON.stringify(res.error));
                    return res.err;
                }else{
                    formData.amount = amount;
                    formData.stripeToken = res.id;

                    $http.post(API + '/payment', formData).then(function successCallback(res) {
                        alert(JSON.stringify(res.data));
                    }, function errorCallback(res) {
                        alert(JSON.stringify(res.data));

                    });
                }
            });

        };


    }

    function userService($http, API, auth) {
        var self = this;
        self.showUsers = function() {
            return $http.get(API + '/users')
        };

        self.showUser = function(username) {
            return $http.get(API + '/users/'+ username)
        };

        self.updateUser = function(username, password) {
            return $http.put(API + '/users/'+ username,{
                email: username,
                password: password
            })
        };

        self.deleteUser = function(username, password) {
            return $http.delete(API + '/users/'+ username,{
                email: username,
                password: password
            })
        };


        self.register = function(username, password) {
            return $http.post(API + '/users', {
                email: username,
                password: password
            })
        };

        self.login = function(username, password) {
            return $http.post(API + '/authenticate', {
                email: username,
                password: password
            })
        };

        self.logout = function() {
            window.localStorage.removeItem('jwtToken');
        };



        // add authentication methods here

    }

    function MainCtrl(user, auth) {
        var self = this;

        function handleRequest(res) {
            var token = res.data ? res.data.token : null;
//            if(token) { console.log('JWT:', token); }
            self.message = res.data.message;
        }

        self.login = function() {
            user.login(self.username, self.password)
                .then(handleRequest, handleRequest);
        };;
        self.register = function() {
            user.register(self.username, self.password)
                .then(handleRequest, handleRequest);
        }
        self.showUsers = function() {
            user.showUsers()
                .then(handleRequest, handleRequest);
        }
        self.showUser = function() {
            user.showUser(self.username)
                .then(handleRequest, handleRequest);
        }
        self.updateUser = function() {
            user.updateUser(self.username, self.password)
                .then(handleRequest, handleRequest);
        }
        self.deleteUser = function() {
            user.deleteUser(self.username, self.password)
                .then(handleRequest, handleRequest);
        }
        self.logout = function() {
            user.logout()
            self.message = "User deleted";
        }
        self.isAuthed = function() {
            return auth.isAuthed ? auth.isAuthed() : false;
        }
    }

    function FormCtrl(stripe) {


        var self = this;

        self.processForm = function() {
            var formData = {
                number: self.cardNumber,
                cvc: self.cvc,
                exp_month: self.expiryMonth,
                exp_year: self.expiryYear

            };

            stripe.makePayment(formData, self.amount, self.message);


        };

    }

    angular.module('app', [])
        .factory('authInterceptor', authInterceptor)
        .service('user', userService)
        .service('auth', authService)
        .service('stripe', stripeService)
        .constant('API', 'https://nameless-spire-5524.herokuapp.com')
        .config(function($httpProvider) {
            $httpProvider.interceptors.push('authInterceptor');
        })
        .controller('Main', MainCtrl)
        .controller('Form', FormCtrl);
})();
