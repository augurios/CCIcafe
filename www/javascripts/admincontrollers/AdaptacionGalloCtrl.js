//adaptation controller
app.controller('AdaptacionGalloCtrl', [
	'$scope',
	'auth',
	'$location',
	'methodsGallo',
	function ($scope, auth, $location, methodsGallo) {
	    $scope.isLoggedIn = auth.isLoggedIn;
	    $scope.currentUser = auth.currentUser;
	    $scope.logOut = auth.logOut;
	    $scope.isActive = function (viewLocation) {
	        var active = (viewLocation === $location.path());
	        return active;
	    };
	    var tableObject = {},
	    	tableFill = false;

	    methodsGallo.get().then(function (methods) {
	        //console.log(methods.data[0]);
	        tableObject = methods.data[0];
	        $scope.table = tableObject;
	        if($scope.table){
		        tableFill = true;
	        }
	    })



	    $scope.saveTable = function () {
		    if(tableFill){
		        methodsGallo.update($scope.table);
	        } else {
		        methodsGallo.create($scope.table);
				tableFill = true;
	        }
	       

	    };

	}]);
