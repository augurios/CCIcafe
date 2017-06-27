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
  $scope.dosage = {
	  resultado: "--",
	  listrosHaResult: "--"
	  	
  }
  
  
  $scope.typeChange = function() {
	  $scope.dosage.productName = "";
  }
  
  $scope.calculateDosage= function(){
	
	var distanMetros =  1000 / ($scope.dosage.hileras * $scope.dosage.plantas) 
	
    var litrosHa = ($scope.dosage.litersWornOut / $scope.dosage.plantsAtomised) * distanMetros;
    
    $scope.dosage.listrosHaResult = litrosHa.toFixed(2);
    
    
    var resultado = $scope.dosage.productName / litrosHa;
    
    $scope.dosage.resultado = resultado.toFixed(2);
    
    if($scope.dosage.productType == 'Ojo de gallo' && $scope.dosage.producto2) {
	    	var resultadoS = 2000 / litrosHa;
    
			$scope.dosage.resultadoS = resultadoS.toFixed(2);
    }
    
  }
  
  $scope.clear = function() {
	   $scope.dosage = {resultado: "--"}
  }

}]);