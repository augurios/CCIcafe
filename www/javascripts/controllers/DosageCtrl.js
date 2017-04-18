app.controller('DosageCtrl', [
'$scope',
'$state',
'auth',
'localStorageService',
'socket',
function($scope, $state, auth,localStorageService, socket){
  var tempEstanions;
  $scope.currentUser=auth.currentUser;
  /*if($scope.plantsByHa=='ot'){

  }*/

  $scope.calculateDosage= function(){
	var ProductDetails = $scope.dosage.productName.split(",");
	
	if ($scope.dosage.productType != 'Ojo de gallo') {
		$scope.dosage.dosageByEstanion = (ProductDetails[1]/500)*ProductDetails[3];
	} else {
		var prodDtlSplt = ProductDetails[1].split("+"),
			prodDtl = parseInt(prodDtlSplt[0]) + parseInt(prodDtlSplt[1]),
			prodDtlBSplt = ProductDetails[3].split("+"),
			prodDtlB = parseInt(prodDtlBSplt[0]) + parseInt(prodDtlBSplt[1]);
			$scope.dosage.dosageByEstanion = (prodDtl/500)*prodDtlB;
			
	}
    
    
  }


}]);