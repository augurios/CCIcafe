app.controller('MainCtrl',['$scope','posts', 'auth', 'widget','PouchDB',
function($scope, posts, auth, widget,PouchDB){


	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.currentUser = auth.currentUser;
	// Get all widget
	widget.getAll().then(function(data)
   	{
   		$scope.widget = data;
			 
   	});
		 	//Create the pouchDB if not Exist in Local when the app is run.otherwise sync the local data to server;
			PouchDB.CreatePouchDB();
}]);