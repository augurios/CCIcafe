app.controller('VisitaCtrl', [
'$scope',
'$state',
'auth',
'localStorageService',
function($scope, $state, auth,localStorageService, socket){
   $scope.currentUser=auth.currentUser;
   $scope.searchmode = "Cedula"
   
}]);