//Roya controller
app.controller('RoyaCtrl', [
	'$scope',
	'auth',
	'$location',
	'roya',
    '$window',
    'user', 'Excel', '$timeout',
	function ($scope, auth, $location, roya, $window, user, Excel, $timeout) {
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
	        //window.open('data:application/vnd.ms-excel,' + encodeURIComponent(html));
	        var exportHref = Excel.tableToExcel("#exportable", 'Reportes de Roya');
	        $timeout(function () { location.href = exportHref; }, 100);
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