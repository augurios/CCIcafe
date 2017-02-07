var app = angular.module('coffeeScriptAdmin', ['btford.socket-io', 'ui.router', 'luegg.directives', 'ui.tinymce', 'ui.bootstrap', 'ngSanitize']);
app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function () {
                scope.$apply(function () {
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

app.filter('startFrom', function () {
    return function (input, start) {
        if (input) {
            start = +start;
            return input.slice(start);
        }
        return [];
    };
});

// Main controller 
app.controller('MainCtrl', ['$scope', 'auth', 'roya', 'chats', 'user', 'widget',
	function ($scope, auth, chats, roya, user, widget) {
	    $scope.isLoggedIn = auth.isLoggedIn;
	    $scope.currentUser = auth.currentUser;
	    $scope.curUserRole = auth.currentUserRole();
	    $scope.logOut = auth.logOut;
	    $scope.msg = '';
	    user.getAll().then(function (users) {
	        $scope.userList = users;
	    });

	    roya.getAll().then(function (tests) {
	        $scope.royaTests = tests.data;
	    });
	    chats.getAll().then(function (chats) {
	        $scope.chatsTotal = chats.data;
	    });


	    if ($scope.isLoggedIn()) {
	        $('body').removeClass('loggedOff');
	        $('body').addClass('loggedIn');
	    } else {
	        $('body').removeClass('loggedin');
	        $('body').addClass('loggedOff');
	    }
	    // Add new widget
	    $scope.addWidget = function(wid)
	    {
	    	wid.user = auth.currentUserObject()._id;
	    	widget.create(wid).then(function(data){
	    		$scope.wid = {};
	    		$('#myModal').modal('hide');
	    		$scope.msg = 'widget Added successfully.';
				widget.getAll().then(function(data)
			   	{
			   		$scope.widget = data;
			   	});	    		
	    	});
	    }

	    widget.getAll().then(function(data)
	   	{
	   		$scope.widget = data;
	   	});

	   	$scope.delwid = function(id)
	   	{
	   		widget.remove(id).then(function(data)
	   		{
	   			$scope.widget = data;	
	   		});
	   	}
	   	
	}]);
	
	
app.filter('unsafe', function($sce) { return $sce.trustAsHtml; });

// Authorize controller
app.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function ($scope, $state, auth) {
	    $scope.user = {};

	    $scope.register = function () {
	        auth.register($scope.user).error(function (error) {
	            $scope.error = error;
	        }).then(function () {
	            $state.go('register-profile');
	        });
	    };

	    $scope.registerProfile = function () {
	        $state.go('location');
	    };

	    $scope.logIn = function () {
	        auth.logIn($scope.user).error(function (error) {
	            $scope.error = error;
	        }).then(function () {
	            $state.go('home');
	            $state.reload();
	        });
	    };
	}]);

// Services for widget
app.factory('widget', ['$http', function($http){
	var w = {};
	w.getAll = function()
	{
		return $http.get('/getWidgets').success(function(data){
			return data;
		});
	};
	w.create = function(wid)
	{
		return $http.post('/admin/addwidget', wid).success(function(data){
    		return data;
    	});
	};
	w.remove = function(id)
	{
		return $http.delete('/admin/widget/'+id).success(function(data) {
			return data;
		});
	}
	return w;
}]);

app.factory('posts', ['$http', 'auth', function ($http, auth) {
    var o = {
        posts: []
    };
    o.getAll = function () {
        return $http.get('/posts').success(function (data) {
            angular.copy(data, o.posts);
        });
    };
    o.update = function (post) {
        return $http.put('/posts/' + post._id, post, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data
        });
    };
    o.create = function (post) {
        return $http.post('/posts', post, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            o.posts.push(data);
        });
    };
    o.upvote = function (post) {
        return $http.put('/posts/' + post._id + '/upvote', null, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        })
          .success(function (data) {
              post.upvotes += 1;
          });
    };
    o.get = function (id) {
        return $http.get('/posts/' + id).then(function (res) {
            return res.data;
        });
    };
    o.addComment = function (id, comment) {
        return $http.post('/posts/' + id + '/comments', comment, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        });
    };

    o.upvoteComment = function (post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        })
          .success(function (data) {
              comment.upvotes += 1;
          });
    };

    return o;
}]);

// Socket Factory service
app.factory('socket', ['socketFactory',
	function (socketFactory) {
	    return socketFactory({
	        prefix: '',
	        ioSocket: io.connect('https://icafe.centroclima.org')
	    });
	}
]);

//authorize service
app.factory('auth', ['$http','$state', '$window', function ($http, $state, $window) {
    var auth = {};

    auth.saveToken = function (token) {
        $window.localStorage['flapper-news-token'] = token;
    };

    auth.getToken = function () {
        return $window.localStorage['flapper-news-token'];
    }

    auth.isLoggedIn = function () {
        var token = auth.getToken();

        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };

    auth.currentUser = function () {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.username;
        }
    };

    auth.currentUserObject = function () {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            return JSON.parse($window.atob(token.split('.')[1]));
        }
        else {
            return null;
        }
    }

    auth.currentUserRole = function () {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.role;
        }
    };

    auth.currentUserDepartamento = function () {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.extemDepartamento;
        }
    };
    

    auth.register = function (user) {
        return $http.post('/register', user).success(function (data) {
            auth.saveToken(data.token);
        });
    };

    auth.logIn = function (user) {
        return $http.post('/login', user).success(function (data) {
            auth.saveToken(data.token);
        });
    };
    auth.logOut = function () {
        $window.localStorage.removeItem('flapper-news-token');
        $state.go('home');
    };

    return auth;
}]);

//nav bar controller
app.controller('NavCtrl', [
	'$scope',
	'auth',
	'$location',
	function ($scope, auth, $location) {
	    $scope.isLoggedIn = auth.isLoggedIn;
	    $scope.currentUser = auth.currentUser;
	    $scope.curUserRole = auth.currentUserRole();
	    $scope.logOut = auth.logOut;
	    $scope.isActive = function (viewLocation) {
	        var active = (viewLocation === $location.path());
	        return active;
	    };
	}]);

//adaptation controller
app.controller('AdaptacionCtrl', [
	'$scope',
	'auth',
	'$location',
	'methods',
	function ($scope, auth, $location, methods) {
	    $scope.isLoggedIn = auth.isLoggedIn;
	    $scope.currentUser = auth.currentUser;
	    $scope.logOut = auth.logOut;
	    $scope.isActive = function (viewLocation) {
	        var active = (viewLocation === $location.path());
	        return active;
	    };
	    var tableObject = {};

	    methods.get().then(function (methods) {
	        //console.log(methods.data[0]);
	        tableObject = methods.data[0];
	        $scope.table = tableObject;
	    })



	    $scope.saveTable = function () {
	        methods.update($scope.table);

	    };

	}]);

//Users editor controller
app.controller('UsersCtrl', [
	'$scope',
	'auth',
	'$location',
	'user',
	function ($scope, auth, $location, user) {
	    muni14.addDepts('departamentos');
	    $scope.isLoggedIn = auth.isLoggedIn;
	    $scope.currentUser = auth.currentUser;
	    $scope.logOut = auth.logOut;
	    $scope.isActive = function (viewLocation) {
	        var active = (viewLocation === $location.path());
	        return active;
	    };
	    user.getAll().then(function (users) {
	        $scope.userList = users;
	    });
	    $scope.newUser = {};

	    $scope.createUser = function () {
	        $scope.newUser.departamento = $("#departamentos option:selected").text();
	        $scope.newUser.municipio = $("#departamentos-munis option:selected").text();

	        auth.register($scope.newUser).error(function (error) {
	            $scope.error = error;
	        }).then(function (data) {
	            $('#myModal').modal('hide');
	            user.getAll().then(function (users) {
	                $scope.userList = users;
	            });
	        });



	    }

	    $scope.editUser = function (user) {
	        $scope.message = null;
	        $scope.error = null;
	        $scope.editUserO = user;
	        $('#myModalEdit').modal('show');
	    }

	    $scope.removeUser = function (id, index) {

	        user.delete(id).then(function (user) {
	            $scope.userList.splice(index, 1);
	        });
	    }

	    $scope.saveUser = function () {
	        $scope.message = null;
	        $scope.error = null;
	        user.update($scope.editUserO).error(function (error) {
	            $scope.error = error;
	        }).then(function (data) {
	            $scope.message = data.data.message;
	        });
	    }


	}]);

app.controller('CampoCtrl', [
	'$scope',
	'auth',
	'$location',
	'campoService',
	'$window',
    'user',
	function ($scope, auth, $location, campo,  $window, user) { 
	    var currentTest = null;
	  
	    var loadAll = function () {

	    	campo.get().then(function (campo) {
		    	$scope.testsList = campo.data;
	            $scope.currentPage = 1;
	            $scope.pageSize = 9;
	            $scope.noOfPages = Math.ceil($scope.testsList / $scope.pageSize);
	            $scope.totalItems = $scope.testsList.length;
		    })

		    $scope.saveTable = function () {
		        campo.create($scope.campodata);
		    };
	        
	    };

	    loadAll();
	    $(".date-field").datepicker();

	    $scope.head = {
	        createdAt: "Fecha",
	        bandolas: "Bandolas",
	        chasparria: "Chasparria",
	        frutosnudo5: "Frutos nudo 5",
	        frutosnudo6: "Frutos nudo 6",
	    };


	    $scope.sort = {
	        column: 'createdAt',
	        descending: false
	    };

	    $scope.selectedCls = function (column) {
	        return column == $scope.sort.column && 'sort-' + $scope.sort.descending;
	    };

	    $scope.changeSorting = function (column) {
	        var sort = $scope.sort;
	        if (sort.column == column) {
	            sort.descending = !sort.descending;
	        } else {
	            sort.column = column;
	            sort.descending = false;
	        }
	    };

	    $scope.loadTest = function (test) {
	        currentTest = test;
	        $scope.detail = currentTest;

	        $('#detailModalCampo').modal('show');

	    }

	    $scope.removeTest = function (id) {

	    }
	    $scope.exportData = function () {
	        var table = document.getElementById('exportable');
	        var html = table.outerHTML;
	        window.open('data:application/vnd.ms-excel,' + encodeURIComponent(html));
	    };
	    $scope.search = {};
	    //$watch search to update pagination
	    $scope.$watch('search', function (newVal, oldVal) {
	        if ($scope.testsList != undefined) {
	            $scope.filtered = $scope.testsList;
	            var arrayToReturn = [];
	            for (var i = 0; i < $scope.testsList.length; i++) {
	                if (newVal._id != undefined && newVal._id != "") {
	                    if ($scope.testsList[i] == newVal._id) {
	                        arrayToReturn.push($scope.testsList[i]);
	                    }
	                }
	                if (newVal.dateFrom != undefined && newVal.dateFrom != "" && newVal.dateTo != "" && newVal.dateTo != undefined) {
	                    var startDate = parseDate(newVal.dateFrom);
	                    var endDate = parseDate(newVal.dateTo);
	                    var createDate = new Date($scope.testsList[i].createdAt);
	                    
	                    if (createDate >= startDate && createDate <= endDate) {
	                        arrayToReturn.push($scope.testsList[i]);
	                    }
	                }
	                if (newVal.dateFrom == undefined && newVal.dateTo == undefined && newVal._id == undefined) {
	                    arrayToReturn.push($scope.testsList[i]);
	                }
	            }
	            $scope.filtered = arrayToReturn;
	            $scope.totalItems = $scope.filtered == undefined ? 0 : $scope.filtered.length;
	            //$scope.pageSize = 9;
	            $scope.noOfPages = Math.ceil($scope.totalItems / $scope.pageSize);
	            $scope.currentPage = 1;
	        }
	        else {
	            var arrayToReturn = [];
	            $scope.filtered = arrayToReturn;
	            $scope.totalItems = 0;
	            $scope.noOfPages = Math.ceil($scope.totalItems / $scope.pageSize);
	            $scope.currentPage = 1;

	        }
	    }, true);
	}]);	
	


app.filter('startFrom', function () {
    return function (input, start) {
        if (input) {
            start = +start;
            return input.slice(start);
        }
        return [];
    };
});

// parse a date in mm/dd/yyyy format
function parseDate(input) {
    var parts = input.split('/');
    // Note: months are 0-based
    return new Date(parts[2], parts[0] - 1, parts[1]);
}
app.filter("myfilter", function () {
    return function (items, search) {
        var arrayToReturn = [];
        if (items != undefined) {
            for (var i = 0; i < items.length; i++) {
                var createDate = new Date(items[i].createdAt);

                var tyepsrch = (typeof typesearch === "undefined")

                if(tyepsrch === "true"){
                	if (typesearch._id != undefined && search._id != "") {
	                    if (items[i]._id == search._id) {
	                        arrayToReturn.push(items[i]);
	                    }
	                }
                }
                else{
                	if (search._id != "") {
	                    if (items[i]._id == search._id) {
	                        arrayToReturn.push(items[i]);
	                    }
	                }
                }


                if (search.dateFrom != undefined && search.dateFrom != "" && search.dateTo != "" && search.dateTo != undefined) {
                    var startDate = parseDate(search.dateFrom);
                    var endDate = parseDate(search.dateTo);
                    if (createDate >= startDate && createDate <= endDate) {
                        arrayToReturn.push(items[i]);
                    }
                }
                if (search.dateFrom == undefined && search.dateTo == undefined && search._id == undefined) {
                    arrayToReturn.push(items[i]);
                }
            }
        }
        return arrayToReturn;
    };

});

//Roya controller
app.controller('RoyaCtrl', [
	'$scope',
	'auth',
	'$location',
	'roya',
    '$window',
    'user',
	function ($scope, auth, $location, roya, $window, user) {
	    var currentTest = null;
	    var loadAll = function () {
	        roya.getAll().then(function (tests) {
	            //debugger;
	            //var token = auth.getToken();
	            //var result = JSON.parse($window.atob(token.split('.')[1]));
	            //user.get(result._id).then(function (userData) {
	            //    userData.extemDepartamento
	            //});
	            
	            if (auth.currentUserRole() == 'Extensionista') {
	                var department = auth.currentUserDepartamento();
	                tests.data = $.grep(tests.data, function (item) {
	                    return item.unidad.departamento == department;
	                });
	            }
	            $scope.testsList = tests.data;
	            $scope.currentPage = 1;
	            $scope.pageSize = 9;
	            $scope.noOfPages = Math.ceil($scope.testsList / $scope.pageSize);
	            $scope.totalItems = $scope.testsList.length;
	            
	            for (var k in tests.data) {
	                if (tests.data[k].unidad) {
	                    $scope.testsList[k].nombre = tests.data[k].unidad.nombre;
	                    $scope.testsList[k].departamento = tests.data[k].unidad.departamento;
	                    if (tests.data[k].unidad.tipoCafe) {
	                        var cafeValue = "";
	                        if (tests.data[k].unidad.tipoCafe.duro) {
	                            cafeValue = "duro";
	                        }
	                        if (tests.data[k].unidad.tipoCafe.estrictamenteDuro) {
	                            cafeValue = cafeValue + " estrictamenteDuro";
	                        }
	                        if (tests.data[k].unidad.tipoCafe.extraprime) {
	                            cafeValue = cafeValue + " extraprime";
	                        }
	                        if (tests.data[k].unidad.tipoCafe.prime) {
	                            cafeValue = cafeValue + " prime";
	                        }
	                        if (tests.data[k].unidad.tipoCafe.semiduro) {
	                            cafeValue = cafeValue + " semiduro";
	                        }
	                        if (cafeValue != "")
	                            $scope.testsList[k].tipoCafe = cafeValue;
	                    }
	                }
	            }
                

	        });
	    };

	    loadAll();
	    $(".date-field").datepicker();

	    $scope.head = {
	        createdAt: "Fecha",
	        incidencia: "Inicidencia",
	        departamento: "Municipio",
	        nombre: "Nombre",
	        tipoCafe: "Tipo de café",
	        user: "User"
	    };


	    $scope.sort = {
	        column: 'createdAt',
	        descending: false
	    };

	    $scope.selectedCls = function (column) {
	        return column == $scope.sort.column && 'sort-' + $scope.sort.descending;
	    };

	    $scope.changeSorting = function (column) {
	        var sort = $scope.sort;
	        if (sort.column == column) {
	            sort.descending = !sort.descending;
	        } else {
	            sort.column = column;
	            sort.descending = false;
	        }
	    };

	    $scope.loadTest = function (test) {
	        currentTest = test;
	        $scope.detail = currentTest;

	        $('#detailModal').modal('show');

	    }

	    $scope.removeTest = function (id) {

	        roya.delete(id).then(function (user) {
	            loadAll();
	        });
	    }
	    $scope.exportData = function () {
	        var table = document.getElementById('exportable');
	        var html = table.outerHTML;
	        window.open('data:application/vnd.ms-excel,' + encodeURIComponent(html));
	    };
	    $scope.search = {};
	    //$watch search to update pagination
	    $scope.$watch('search', function (newVal, oldVal) {
	        if ($scope.testsList != undefined) {
	            $scope.filtered = $scope.testsList;
	            var arrayToReturn = [];
	            for (var i = 0; i < $scope.testsList.length; i++) {
	                if (newVal._id != undefined && newVal._id != "") {
	                    if ($scope.testsList[i] == newVal._id) {
	                        arrayToReturn.push($scope.testsList[i]);
	                    }
	                }
	                if (newVal.dateFrom != undefined && newVal.dateFrom != "" && newVal.dateTo != "" && newVal.dateTo != undefined) {
	                    var startDate = parseDate(newVal.dateFrom);
	                    var endDate = parseDate(newVal.dateTo);
	                    var createDate = new Date($scope.testsList[i].createdAt);
	                    if (createDate >= startDate && createDate <= endDate) {
	                        arrayToReturn.push($scope.testsList[i]);
	                    }
	                }
	                if (newVal.dateFrom == undefined && newVal.dateTo == undefined && newVal._id == undefined) {
	                    arrayToReturn.push($scope.testsList[i]);
	                }
	            }
	            $scope.filtered = arrayToReturn;
	            $scope.totalItems = $scope.filtered == undefined ? 0 : $scope.filtered.length;
	            //$scope.pageSize = 9;
	            $scope.noOfPages = Math.ceil($scope.totalItems / $scope.pageSize);
	            $scope.currentPage = 1;
	        }
	        else {
	            var arrayToReturn = [];
	            $scope.filtered = arrayToReturn;
	            $scope.totalItems = 0;
	            $scope.noOfPages = Math.ceil($scope.totalItems / $scope.pageSize);
	            $scope.currentPage = 1;

	        }
	    }, true);
	}]);

//TechRecCtrl controller
app.controller('TechRecCtrl', [
	'$scope',
	'auth',
	'$location',
	'techRecService',
	'socket',
    '$window',
    'user',
	function ($scope, auth, $location, techRecService, socket, $window, user) {
	    var currentTest = null;
	    var loadAll = function () {
	        techRecService.getAll().then(function (tests) {
	            $scope.testsList = tests.data;
	            $scope.currentPage = 1;
	            $scope.pageSize = 9;
	            $scope.noOfPages = Math.ceil($scope.testsList / $scope.pageSize);
	            $scope.totalItems = $scope.testsList.length;
	        });
	    };

	    loadAll();
	    $(".date-field").datepicker();

	    $scope.head = {
	        createdAt: 		"Fecha",
	        departamento: "Departamento",
	        municipio: "Municipio",
	        ubicacion: "Ubicacion",
	        recomendaciontecnica: "Recomendaciontecnica",
	        user: "User"
	    };


	    $scope.sort = {
	        column: 'createdAt',
	        descending: false
	    };

	    $scope.selectedCls = function (column) {
	        return column == $scope.sort.column && 'sort-' + $scope.sort.descending;
	    };

	    $scope.changeSorting = function (column) {
	        var sort = $scope.sort;
	        if (sort.column == column) {
	            sort.descending = !sort.descending;
	        } else {
	            sort.column = column;
	            sort.descending = false;
	        }
	    };

	    $scope.loadTest = function (test) {
	        currentTest = test;
	        $scope.detail = currentTest;
	        console.log(currentTest);
	        $('#detailModal').modal('show');
	        user.get($scope.detail.user).then(function(obj)
	    	{
	    		$scope.reciverDetail = obj;
	    	});
	    }

	    // Send message to user with unit detail
	    $scope.msgsend = function()
	    {
	    	$scope.loguser = auth.currentUserObject(); 
	    	var str =  'Unit Name : '+$scope.detail.departamento;
	    		str += ' Id : '+$scope.detail._id;
	    		str += ' Message : '+$scope.msgcontent;
	    	msg = {
				bodyMsg: str,
				sender_id: $scope.loguser._id,
			}
			var data_server = {
				message: msg,
				to_user: $scope.reciverDetail.username,
				from_id: $scope.loguser.username
			};
			socket.emit('get msg', data_server);
			$scope.msgcontent = '';
			$scope.msg = 'Message sent successfully.';
	    }

	    $scope.removeTest = function (id) {

	        roya.delete(id).then(function (user) {
	            loadAll();
	        });
	    }
	    $scope.exportData = function () {
	        var table = document.getElementById('exportable');
	        var html = table.outerHTML;
	        window.open('data:application/vnd.ms-excel,' + encodeURIComponent(html));
	    };
	    $scope.search = {};
	    //$watch search to update pagination
	    $scope.$watch('search', function (newVal, oldVal) {
	        if ($scope.testsList != undefined) {
	            $scope.filtered = $scope.testsList;
	            var arrayToReturn = [];
	            for (var i = 0; i < $scope.testsList.length; i++) {
	                if (newVal._id != undefined && newVal._id != "") {
	                    if ($scope.testsList[i] == newVal._id) {
	                        arrayToReturn.push($scope.testsList[i]);
	                    }
	                }
	                if (newVal.dateFrom != undefined && newVal.dateFrom != "" && newVal.dateTo != "" && newVal.dateTo != undefined) {
	                    var startDate = parseDate(newVal.dateFrom);
	                    var endDate = parseDate(newVal.dateTo);
	                    var createDate = new Date($scope.testsList[i].createdAt);
	                    if (createDate >= startDate && createDate <= endDate) {
	                        arrayToReturn.push($scope.testsList[i]);
	                    }
	                }
	                if (newVal.dateFrom == undefined && newVal.dateTo == undefined && newVal._id == undefined) {
	                    arrayToReturn.push($scope.testsList[i]);
	                }
	            }
	            $scope.filtered = arrayToReturn;
	            $scope.totalItems = $scope.filtered == undefined ? 0 : $scope.filtered.length;
	            //$scope.pageSize = 9;
	            $scope.noOfPages = Math.ceil($scope.totalItems / $scope.pageSize);
	            $scope.currentPage = 1;
	        }
	        else {
	            var arrayToReturn = [];
	            $scope.filtered = arrayToReturn;
	            $scope.totalItems = 0;
	            $scope.noOfPages = Math.ceil($scope.totalItems / $scope.pageSize);
	            $scope.currentPage = 1;

	        }
	    }, true);
	}]);

//NewsCtrl editor controller
app.controller('NewsCtrl', [
	'$scope',
	'auth',
	'$location',
	'user',
	'posts',
	function ($scope, auth, $location, user, posts) {
	    $scope.isLoggedIn = auth.isLoggedIn;
	    $scope.currentUser = auth.currentUser;
	    $scope.tinymceOptions = {
	        plugins: 'link image code',
	        toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | code | image'
	    };
	    $scope.newPost = {
	        title: "",
	        content: ""
	    };
	    $scope.posts = posts.posts;
	    console.log(posts.posts);
	    $scope.publish = function () {
	        posts.create($scope.newPost)
	        $scope.newPost = {
	            title: "",
	            content: ""
	        };
	    }
	    $scope.editPost = function (post) {
	        $scope.message = null;
	        $scope.error = null;
	        $scope.editPostO = post;
	        $('#myModalPostEdit').modal('show');
	    }

	    $scope.savePost = function () {
	        $scope.message = null;
	        $scope.error = null;
	        posts.update($scope.editPostO).error(function (error) {
	            $scope.error = error;
	        }).then(function (data) {
	            $scope.message = data.data.message;
	        });
	    }

	}]);

// Support Chat Controller 
app.controller('MessengerCtrl', ['$scope', 'chats', 'auth', 'socket', 'user','fileupload',
	function ($scope, chats, auth, socket, user, fileupload) {
	    $scope.isLoggedIn = auth.isLoggedIn;
	    $scope.currentUser = auth.currentUser;
	    $scope.chats = chats.chats;
	    var f = $('.type-sink');
	    var currentInput = $('.type-sink input[name=toId]');
	    var currentchat = currentInput.val();
		 if($scope.userList==undefined)
		 {
			user.getAll().then(function (users) {
				$scope.userList = users;
			});
		 }
	    $scope.currentChat = currentchat;
	    $scope.UserName = 'admin';
	    $scope.UserImage = '../images/ChatUser.png';
	    $scope.UserImageBottom = '../images/ChatUser.png';
	    $scope.nickname = 'admin';
	    $scope.myFile = null;
        $scope.clientImage='';
	    $('#userImage').change(function (e) {
	        var file = e.target.files[0],
                imageType = /image.*/;
	        if (!file.type.match(imageType))
	            return;
	        var reader = new FileReader();
	        reader.onload = $scope.saveImage;
	        reader.readAsDataURL(file);
	    });
	    $scope.saveImage = function (e) {
	        $scope.UserImage = e.target.result;
	    }
	    
	    $scope.getUserImage = function () {
	        var userObj = auth.currentUserObject();
	        user.get(userObj._id).then(function (userObj) {
	            if (userObj.nickname == "") {
	                userObj.nickname = null;
	            }
	            if (userObj.image == "") {
	                userObj.image = null;
	            }
	            $scope.UserName = userObj.nickname || 'admin';
	            $scope.nickname = userObj.nickname || 'admin';
	            $scope.UserImage = userObj.image || '../images/ChatUser.png';
	            $scope.UserImageBottom = userObj.image || '../images/ChatUser.png';
	        });
	    }
	    $scope.getUserImage();

	    $scope.sendMessage = function () {
	        var msg = f.find('[name=chatMsg]').val();
	        var from_id = f.find('[name=fromId]').val();
	        var to_id = f.find('[name=toId]').val();
	        var userObj = auth.currentUserObject();
	        msg = {
	            bodyMsg: msg,
	            sender_id: userObj._id,
	        }
	        var data_server = {
	            message: msg,
	            to_user: to_id,
	            from_id: from_id
	        };
	        socket.emit('get msg', data_server);
	        $('.type-sink .form-control').val("");
	    };
	    $scope.loadChat = function ($event, sender) {
	        $scope.currentChat = sender;
	        currentInput.val(sender);
	        var data_server = {
	            from_id: sender
	        }
	        socket.emit('load msg', data_server);
	    }

	    $scope.openImagePopup = function () {
	        $('#myModalUserImage').modal('show');
	    }

	    $scope.setCurrentUserImage = function (messageList) {

	        for (var i = 0; i < messageList.length; i++) {
	            if (messageList[i].sender == 'admin') {
	                messageList[i].sender = $scope.UserName;
	                messageList[i].imageurl = $scope.UserImage;
	            }
	            else {
	                var cuser = $.grep($scope.userList, function (item) {
	                    return item.username == messageList[i].sender;
	                });
	                if (cuser != null && cuser.length > 0) {
	                    if (cuser[0].image != undefined) {
	                        messageList[i].imageurl = cuser[0].image;
	                    }
	                    else {
	                        messageList[i].imageurl = '../images/ChatUser.png'
	                    }
	                }
	                else {
	                    messageList[i].imageurl = '../images/ChatUser.png'
	                }
	            }
	        }
	        $scope.chatLog = messageList;
	    }

	    $scope.uploadPhoto = function () {
	        var userObj = auth.currentUserObject();
	        if(userObj!=null && userObj!=undefined)
			{
			 if ($scope.UserImage != null) {
	                    userObj.image = $scope.UserImage;
	                }
	                if ($scope.UserName != null) {
	                    userObj.nickname = $scope.UserName;
	                }
			  user.update(userObj).error(function (error) {
	                    $scope.error = error;
	                }).then(function (data) {
						$scope.getUserImage();
	                });
	        $('#myModalUserImage').modal('hide');
			}
	    }

	    socket.on('set msg', function (data) {
	        data = JSON.parse(data);
	        var usera = data.to_user;
	        var userb = data.from_id;
	        currentchat = currentInput.val();
	        if (usera == currentchat || userb == currentchat) {
	            $scope.setCurrentUserImage(data.chat.messages);
	            $scope.$apply();
	        }
	    });

	    socket.on('set msg only', function (data) {
	        data = JSON.parse(data);
	        $scope.setCurrentUserImage(data.messages);
	        $scope.$apply();
	    });
	    socket.on('push chats', function (data) {
	        data = JSON.parse(data);
	        $scope.chats = data;
	        $scope.$apply();
	    });

	    $scope.deleteChat = function (chatid) {
	        var data_server = {
	            chatid: chatid
	        }
	        socket.emit('dlt chat', data_server);
	    }
	}]);

//chats service
app.factory('chats', ['$http', 'auth', function ($http, auth) {
    var o = {
        chats: []
    };
    o.getAll = function () {
        return $http.get('/admin/chats').success(function (data) {
            angular.copy(data, o.chats);
        });
    };

    return o;
}]);
//FileUpload service
app.factory('fileupload', ['$http', 'auth', function ($http, auth) {
    var o = {};
    o.upload = function (file) {
        return $http.post('/upload/photo', file, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken(),
                'Content-Type': 'multipart/form-data'
            }
        }).success(function (data) {
            return data
        });
    };

    return o;
}]);
// User profile service
app.factory('user', ['$http', 'auth', function ($http, auth) {
    var o = {
    };
    /*o.create = function(post) {
		return $http.post('/posts', post, {
	headers: {Authorization: 'Bearer  '+auth.getToken()}
}).success(function(data){
			o.posts.push(data);
		});
	};*/
    o.getAll = function () {
        return $http.get('/users', {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).then(function (res) {
            return res.data;
        });
    };
    o.get = function (id) {
        return $http.get('/users/' + id).then(function (res) {
            return res.data;
        });
    };

    o.update = function (user) {
        return $http.put('/users/' + user._id, user, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data
        });
    };
    o.delete = function (user) {
        return $http.delete('/users/' + user, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data
        });
    };

    return o;
}]);

app.factory('methods', ['$http', 'auth', function ($http, auth) {
    var o = {
        chats: []
    };
    o.get = function () {
        return $http.get('/admin/methods/').success(function (data) {
            return data;
        });
    };
    o.create = function (method) {
        return $http.post('/admin/methods', method, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data;
        });
    };
    o.update = function (method) {
        return $http.put('/admin/methods', method, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data;
        });
    };

    return o;
}]);
//campocontoller Fact
app.factory('campoService', ['$http', 'auth', function ($http, auth) {
    var o = {
        chats: []
    };
    o.get = function () {
        return $http.get('/admin/campo/').success(function (data) {
            return data;
        });
    };
    o.create = function (method) {
        return $http.post('/admin/campo', method, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data;
        });
    };
    o.update = function (method) {
        return $http.put('/admin/methods', method, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data;
        });
    };

    return o;
}]);


app.factory('roya', ['$http', 'auth', function ($http, auth) {
    var o = {

    };
    o.getAll = function () {
        return $http.get('/roya').success(function (data) {
            return data;
        });
    };
    o.create = function (roya) {
        return $http.post('/roya', roya, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data;
        });
    };
    o.delete = function (test) {
        return $http.delete('/roya/' + test, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data
        });
    };

    return o;
}]);

//TechRecCtrl
app.factory('techRecService', ['$http', 'auth', function ($http, auth) {
    var o = {

    };
    o.getAll = function () {
        return $http.get('/technico/units').success(function (data) {
           return data;
        });
    };
    o.create = function (roya) {
        return $http.post('/roya', roya, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data;
        });
    };
    o.delete = function (test) {
        return $http.delete('/roya/' + test, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data
        });
    };

    return o;
}]);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function ($stateProvider, $urlRouterProvider) {

	    $stateProvider
			.state('home', {
			    url: '/home',
			    templateUrl: '/home.html',
			    controller: 'MainCtrl',
			    onEnter: ['$state', 'auth', function ($state, auth) {
			        var curUserRole = auth.currentUserRole();
			        if (!auth.isLoggedIn()) {
			            $state.go('login');
			        } else if (curUserRole != 'admin' && curUserRole != 'Admin' && curUserRole != 'Extensionista' && curUserRole != 'Tecnico') {
			            window.location.href = '/';
			        }
			    }]
			})
			.state('login', {
			    url: '/login',
			    templateUrl: '/login.html',
			    controller: 'AuthCtrl',
			    onEnter: ['$state', 'auth', function ($state, auth) {
			        if (auth.isLoggedIn()) {
			            var curUserRole = auth.currentUserRole();
			            if (curUserRole != 'admin' && curUserRole != 'Admin' && curUserRole != 'Extensionista' && curUserRole != 'Tecnico') {
			                window.location.href = '/';
			            }
			            else {
			                $state.go('home');
			            }
			        }
			    }]
			})
			.state('register', {
			    url: '/register',
			    templateUrl: '/register.html',
			    controller: 'AuthCtrl',
			    onEnter: ['$state', 'auth', function ($state, auth) {
			        if (auth.isLoggedIn()) {
			            var curUserRole = auth.currentUserRole();
			            if (curUserRole != 'admin' && curUserRole != 'Admin' && curUserRole != 'Extensionista') {
			                window.location.href = '/';
			            }
			            else {
			                $state.go('home');
			            }
			        }
			    }]
			})
			.state('messenger', {
			    url: '/messenger',
			    templateUrl: '/messenger.html',
			    controller: 'MessengerCtrl',
			    onEnter: ['$state', 'auth', function ($state, auth) {
			        var curUserRole = auth.currentUserRole();
			        if (!auth.isLoggedIn()) {
			            $state.go('login');
			        }
			        else if (curUserRole != 'admin' && curUserRole != 'Admin' && curUserRole != 'Extensionista') {
			            window.location.href = '/';
			        }
			    }],
			    resolve: {
			        chatPromise: ['chats', function (chats) {
			            return chats.getAll();
			        }]
			    }
			})
			.state('adaptacion', {
			    url: '/adaptacion',
			    templateUrl: '/adaptacion.html',
			    controller: 'AdaptacionCtrl',
			    onEnter: ['$state', 'auth', function ($state, auth) {
			        var curUserRole = auth.currentUserRole();
			        if (!auth.isLoggedIn()) {
			            $state.go('login');
			        }
			        else if (curUserRole != 'admin' && curUserRole != 'Admin' && curUserRole != 'Extensionista') {
			            window.location.href = '/';
			        }
			    }]
			})
			.state('users', {
			    url: '/users',
			    templateUrl: '/users.html',
			    controller: 'UsersCtrl',
			    onEnter: ['$state', 'auth', function ($state, auth) {
			        var curUserRole = auth.currentUserRole();
			        if (!auth.isLoggedIn()) {
			            $state.go('login');
			        }
			        else if (curUserRole != 'admin' && curUserRole != 'Admin') {
			            window.location.href = '/';
			        }
			    }]
			})
			.state('noticias', {
			    url: '/noticias',
			    templateUrl: '/noticias.html',
			    controller: 'NewsCtrl',
			    onEnter: ['$state', 'auth', function ($state, auth) {
			        var curUserRole = auth.currentUserRole();
			        if (!auth.isLoggedIn()) {
			            $state.go('login');
			        }
			        else if (curUserRole != 'admin' && curUserRole != 'Admin' && curUserRole != 'Extensionista') {
			            window.location.href = '/';
			        }
			    }],
			    resolve: {
			        postPromise: ['posts', function (posts) {
			            return posts.getAll();
			        }]
			    }
			})
			.state('roya', {
			    url: '/roya',
			    templateUrl: '/roya.html',
			    controller: 'RoyaCtrl',
			    onEnter: ['$state', 'auth', function ($state, auth) {
			        var curUserRole = auth.currentUserRole();
			        if (!auth.isLoggedIn()) {
			            $state.go('login');
			        }
			        else if (curUserRole != 'admin' && curUserRole != 'Admin' && curUserRole != 'Extensionista') {
			            window.location.href = '/';
			        }
			    }]
			})
			.state('recomendaciontecnica', {
			    url: '/technical-recommendation',
			    templateUrl: '/tech_recom.html',
			    controller: 'TechRecCtrl',
			    onEnter: ['$state', 'auth', function ($state, auth) {
			        var curUserRole = auth.currentUserRole();
			        
			        if (!auth.isLoggedIn()) {
			            $state.go('login');
			        }
			        else if (curUserRole != 'admin' && curUserRole != 'Admin' && curUserRole != 'Extensionista' && curUserRole != 'Tecnico') {
			            window.location.href = '/';
			        }
			    }]
			})
			.state('campo', {
			    url: '/campo',
			    templateUrl: '/campo.html',
			    controller: 'CampoCtrl',
			    onEnter: ['$state', 'auth', function ($state, auth) {
			        var curUserRole = auth.currentUserRole();
			        
			        if (!auth.isLoggedIn()) {
			            $state.go('login');
			        }
			        else if (curUserRole != 'admin' && curUserRole != 'Admin' && curUserRole != 'Extensionista' && curUserRole != 'Tecnico') {
			            window.location.href = '/';
			        }
			    }]
			})
			.state('reportescampo', {
			    url: '/reportesdecampo',
			    templateUrl: '/reportesdecampo.html',
			    controller: 'CampoCtrl',
			    onEnter: ['$state', 'auth', function ($state, auth) {
			        var curUserRole = auth.currentUserRole();
			        
			        if (!auth.isLoggedIn()) {
			            $state.go('login');
			        }
			        else if (curUserRole != 'admin' && curUserRole != 'Admin' && curUserRole != 'Extensionista' && curUserRole != 'Tecnico') {
			            window.location.href = '/';
			        }
			    }]
			});

	    $urlRouterProvider.otherwise('home');
	}]);
