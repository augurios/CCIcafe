app.controller('VulneCtrl', [
'$scope',
'$state',
'auth',
'localStorageService',
'socket',
function($scope, $state, auth,localStorageService, socket){

  $scope.currentUser=auth.currentUser;
  /*if($scope.plantsByHa=='ot'){

  }*/




}]);