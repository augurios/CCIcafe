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
	    var tableObject = {},
	    	tableFill = false;

	    methods.get().then(function (methods) {
	        //console.log(methods.data[0]);
	        tableObject = methods.data[0];
	        $scope.table = tableObject;
	        if($scope.table){
		        tableFill = true;
	        }
	    })



	    $scope.saveTable = function () {
		    if(!$scope.table){
		        methods.update($scope.table);
	        } else {
		        methods.create($scope.table);
				tableFill = true;
	        }
	    };
	    

	}]);
