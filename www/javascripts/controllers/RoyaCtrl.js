app.controller('RoyaCtrl', [
'$rootScope',
'$scope',
'$state',
'auth',
'localStorageService',
'socket',
'unit',
'user',
'methods',
'roya',
'PouchDB',
'onlineStatus',
function($rootScope, $scope, $state, auth, localStorageService, socket, unit, user, methods, roya, PouchDB, onlineStatus){
  $scope.currentUser = auth.currentUser;
  var currentId = auth.currentUser();
  var testInStore = localStorageService.get('localTest');
	$scope.IsErrorInfrmRoyaAddPlanta=false;
	$scope.IsErrorInfrmRoyaAddPlantaLeaf=false;
	$scope.IsErrorInfrmRoyaAddPlantaLeafAffectedLeaf=false;
	$scope.IsTotalPlantaAdded=false;
	$scope.IsHideCloseAndAddPlantaButtonInPopup=false;
	$scope.modal={};
	$scope.modal.number="";
	$scope.modal.numberSubmitted=false;
	$scope.user_Ided = auth.userId();
	
	
	
	 $scope.onlineStatus = onlineStatus;

    $scope.$watch('onlineStatus.isOnline()', function (online) {
        $scope.online_status_string = online ? 'online' : 'offline';
        onlineStatus = $scope.online_status_string

    });

  $scope.ClearTest = function(){
		$scope.IsErrorInfrmRoyaAddPlanta=false;
		$scope.IsErrorInfrmRoyaAddPlantaLeaf=false;
		$scope.IsErrorInfrmRoyaAddPlantaLeafAffectedLeaf=false;
		$scope.IsTotalPlantaAdded=false;
		$scope.IsHideCloseAndAddPlantaButtonInPopup=false;
  	localStorageService.remove('localTest');
  	$state.go($state.current, {}, {reload: true})
  }
  var plantEditor = function(plant) {
	  $scope.plantname = plant;
	  $scope.leafList = $scope.test.plantas[plant - 1];
	  $scope.modal.number="";
		$scope.modal.numberSubmitted=false;
		$scope.affect = "";
	  $('#plantModal').modal('show');
  };
		$scope.affect = "";
		
    PouchDB.GetUserDataFromPouchDB(auth.userId()).then(function (result) {
        if (result.status == 'fail') {
            $scope.error = result.message;
        }
        else if (result.status == 'success') {
            $scope.userO7 = result.data;

        }
    });

    //console.log("Is INTERNET AVAILABLE=" + $rootScope.IsInternetOnline);
    if ($rootScope.IsInternetOnline) {
	    
	    console.log('app online');
	    
        user.get($scope.user_Ided).then(function (user) {
            $scope.userO7 = user;



            //region to  get user unit from local PouchDB instead of server
            PouchDB.GetAllUserUnit(auth.userId()).then(function (result) {
                if (result.status == 'fail') {
                    $scope.error = result.message;
                }
                else if (result.status == 'success') {

                    $scope.units = result.data;
                    //if($scope.userO7.units.length === result.data.length){

                    //	$scope.units = result.data;
                    //	console.log('local mode:',result.data);

                    //} else {
                    //	console.log('server mode:', $scope.userO7.units);
                    //	$scope.units = $scope.userO7.units;
                    //	$scope.remoteMode = true;
                    //}


                }
            });
            //endregion

        });
    } else {
	    
	    console.log('app offline');
	    
	    
	    
        
        //region to  get user unit from local PouchDB instead of server
        PouchDB.GetAllUserUnit(auth.userId()).then(function (result) {
            if (result.status == 'fail') {
                $scope.error = result.message;
            }
            else if (result.status == 'success') {


                $scope.units = result.data;
                console.log('local mode:', result.data);


            }
        });
        //endregion
    }
    
    
     $scope.test = testInStore || {
	  	advMode : false,
	  	bandolas : false,
	  	resolved: false,
	  	user : currentId,
	  	plantas: [],
	  	unidad: {},
	  	incidencia: 0,
	  	avgplnt : "",
		avgplntDmgPct : 0,
		incidencia : 0
	  };
	  
	methods.get().then(function(methods){
		 var meth = methods.data[0];
		 var date = new Date();
		 var currentMonth = date.getMonth();
		if(currentMonth < 6 ){
		   var methodsAvail = {};
		   methodsAvail.grade1 = meth.caseInidence10.abrilJunio;
		   methodsAvail.grade2 = meth.caseInidence1120.abrilJunio;
		   methodsAvail.grade3 = meth.caseInidence2150.abrilJunio;
		   methodsAvail.grade4 = meth.caseInidence50.abrilJunio;
		   $scope.methodsMonth = methodsAvail;
		   
		} else if(currentMonth > 5 && currentMonth < 9) {
		   var methodsAvail = {};
		   methodsAvail.grade1 = meth.caseInidence10.julioSetiembre;
		   methodsAvail.grade2 = meth.caseInidence1120.julioSetiembre;
		   methodsAvail.grade3 = meth.caseInidence2150.julioSetiembre;
		   methodsAvail.grade4 = meth.caseInidence50.julioSetiembre;
		   $scope.methodsMonth = methodsAvail;
		} else if(currentMonth > 8) {
		   var methodsAvail = {};
		   methodsAvail.grade1 = meth.caseInidence10.octubreDiciembre;
		   methodsAvail.grade2 = meth.caseInidence1120.octubreDiciembre;
		   methodsAvail.grade3 = meth.caseInidence2150.octubreDiciembre;
		   methodsAvail.grade4 = meth.caseInidence50.octubreDiciembre;
		   $scope.methodsMonth = methodsAvail;
		}
    });

  
   $scope.$watch('test', function () {
      localStorageService.set('localTest', $scope.test);
    }, true);
 
  
  if(testInStore && Object.keys(testInStore.unidad).length > 1) {
	  $('.roya-wrap').addClass('initiated');
  }
  
  if(testInStore && testInStore.resolved) {
	  $('.test').hide();
	  $('.results').show();
  }
	
  $scope.startTest = function(userid,selectedUnit) {
	  selectedUnit["user"] = userid;
	  $scope.test.unidad = selectedUnit;
	  $('.roya-wrap').addClass('initiated');
   }
   $scope.bandolas = function() {
	   if($scope.test.bandolas) {
		  $scope.test.bandolas = false;
	  } else {
		  $scope.test.bandolas = true;
	  }
		var requiredLength=0;
		if($scope.test.bandolas==true){
			requiredLength=29;
		}
		else{
			requiredLength=49;
		}
		if($scope.test.plantas.length>requiredLength)
		{
			$scope.IsTotalPlantaAdded=true;
		}
		else{
			$scope.IsTotalPlantaAdded=false;
		}

	}
	$scope.addPlant = function() {
		$('.severity-list').removeClass('active');
		$scope.IsErrorInfrmRoyaAddPlanta=false;
		$scope.IsErrorInfrmRoyaAddPlantaLeafAffectedLeaf=false;
		$scope.IsErrorInfrmRoyaAddPlantaLeafAffected=false;
		$scope.IsHideCloseAndAddPlantaButtonInPopup=false;
		var requiredLength=0;
		if($scope.test.bandolas==true){
			requiredLength=29;
		}
		else{
			requiredLength=49;
		}
		if($scope.test.plantas.length>requiredLength)
		{
			$scope.IsTotalPlantaAdded=true;
			return false;
		}
		else{
			$scope.IsTotalPlantaAdded=false;
		}
		$scope.test.plantas.push([]);
		var plantName = $scope.test.plantas.length;
		plantEditor(plantName);
		setTimeout(function () { $('[name=amount]').val(''); }, 100);
	};

	$scope.CloseAndAddPlant=function()
	{
		console.log($scope.leafList);
		$scope.IsErrorInfrmRoyaAddPlanta=false;
		$scope.IsErrorInfrmRoyaAddPlantaLeafAffectedLeaf=false;
		$scope.IsHideCloseAndAddPlantaButtonInPopup=false;
	  $scope.addPlant();
	}
	
	$scope.editPlant = function($index) {
		$('.severity-list').removeClass('active');
		$scope.IsErrorInfrmRoyaAddPlanta=false;
		$scope.IsErrorInfrmRoyaAddPlantaLeaf=false;
		$scope.IsErrorInfrmRoyaAddPlantaLeafAffectedLeaf=false;
		$scope.IsHideCloseAndAddPlantaButtonInPopup=false;
		plantEditor($index + 1);
		$scope.leafList = $scope.test.plantas[$index];
	}

	$scope.initLeaf = function(number) {
    if(!$scope.frmRoyaAddPlanta.$valid || number==undefined || number<1 || number>99 ){
			$scope.IsErrorInfrmRoyaAddPlanta=true;
			return;
		}
		else{
				$scope.IsErrorInfrmRoyaAddPlanta=false;
				$scope.modal.numberSubmitted=true;
		}

		$('.severity-list').addClass('active');
		$scope.IsHideCloseAndAddPlantaButtonInPopup=true;
	}
	
	$scope.closePlant = function() {
		$('.plant-editor').removeClass('active');
	}
	
	$scope.addLeaf = function(severity,isPrefixAddRequired) {
		if(isPrefixAddRequired)
		{
			if(!$scope.frmRoyaAddPlantaAffectedLeaf.$valid){
					$scope.IsErrorInfrmRoyaAddPlantaLeaf=true;
					$scope.IsErrorInfrmRoyaAddPlantaLeafAffectedLeaf=false;
					return;
				}
				else{
						$scope.IsErrorInfrmRoyaAddPlantaLeaf=false;
						$scope.modal.numberSubmitted=true;
				}
		}
		var amount = $('[name=amount]').val();
		if(isPrefixAddRequired)
		{
				if(severity>amount){
				$scope.IsErrorInfrmRoyaAddPlantaLeafAffectedLeaf=true;
				return;
				}
				else{
					$scope.IsErrorInfrmRoyaAddPlantaLeafAffectedLeaf=false;
				}
				severity='afectadas: ' + severity;

		}
		var plantIndex = $scope.plantname - 1;
		$scope.test.plantas[plantIndex].push([amount,severity]);
		$scope.leafList = $scope.test.plantas[plantIndex];
		$('[name=amount]').val('');
		$scope.affect ="";
		$('.severity-list').removeClass('active');
		$scope.modal.number="";
		$scope.modal.numberSubmitted=false;
		$scope.IsHideCloseAndAddPlantaButtonInPopup=false;
	};

    $scope.removePlant = function (index) {
      $scope.test.plantas.splice(index, 1);
    };
    
    $scope.removeLeaf = function (index) {
	  var plantIndex = $scope.plantname - 1;
      $scope.test.plantas[plantIndex].splice(index, 1);
    };  
    
    $scope.calculateTest = function() {
	    
	    if ($scope.test.advMode) {
		    $scope.totalPlants = $scope.test.plantas.length;
			var totalPlantitas = $scope.totalPlants;	
			var totalLeaf = 0;
			var totalIncidencePlant = [];
			var totalDamagePlant = [];
			var avgInc = 0;
			var avgPct = 0;
			
			for(var i = 0, len = $scope.totalPlants; i < len; i++) {
				var affected = 0;
				var avgDmg = 0;
				var Dmg = [];
				$.each($scope.test.plantas[i], function( index, value ) {
					  totalLeaf += parseInt(value[0]);
					  	if (value[1] !='0%') {
						   affected += parseInt(value[0]);
						   Dmg.push(parseInt(value[1]));
					  	} 
				});	
				totalIncidencePlant.push(affected);
				$.each(Dmg, function( index, value ) {
					  
					  avgDmg += parseInt(Dmg[index]);
				});
				var curAvgDmg = avgDmg / Dmg.length;
				totalDamagePlant.push(curAvgDmg);
				
			}
			var incidenceLength = totalIncidencePlant.length;
			for(var i = 0; i < incidenceLength; i++) {
			    avgInc += totalIncidencePlant[i];
			}
			var avg = avgInc / incidenceLength;
			var damageLength = totalDamagePlant.length;
			for(var i = 0; i < damageLength; i++) {
			    avgPct += totalDamagePlant[i];
			}
			var avgDmgPct = avgPct / damageLength;
			$scope.avgIncidence = (avgInc/totalLeaf)*100;
			$scope.test.avgplnt = avg;
			$scope.test.avgplntDmgPct = avgDmgPct;
			$scope.test.resolved = true;
			$scope.test.incidencia = $scope.avgIncidence;
			$('.test').hide();
			$('.results').show();
	    } else {
		   
		  
		   var plants = $scope.test.plantas,
		   	   totalPlants = plants.length,
		   	   affectedLeaf = [];
		   	   affectedTotal = 0;
		   	   allLeaf = [];
		   	   totalLeaf = 0;
		   	    $scope.totalPlantis = plants.length;
		   
		   	   $.each($scope.test.plantas, function( index, value ) {	
			   		var count = value[0][1].split(":"),
			   			affectedCnt = parseInt(count[1]);
			   			affectedLeaf.push(affectedCnt);
				});
				
				$.each($scope.test.plantas, function( index, value ) {	
			   		var totalCnt = parseInt(value[0][0]);
			   			allLeaf.push(totalCnt);
				});
				
			   for(var i = 0; i < affectedLeaf.length; i++) {
				    affectedTotal += affectedLeaf[i];
				}
				
				for(var i = 0; i < allLeaf.length; i++) {
					
				    totalLeaf += parseInt(allLeaf[i]);
				}
				
			   var avgAffected = affectedTotal / affectedLeaf.length,
			       avgLeaf = totalLeaf / totalPlants,
			       percent = (avgAffected/avgLeaf)*100;
			       
			   $scope.test.incidencia = percent;
			   $scope.test.resolved = true;
			   $('.test').hide();
			   $('.results').show();
			  
		   
	    }
		
		
    };
    
    $scope.getHelp = function(currentUser) { 
	    
	    
	    roya.create(testInStore).success(function(data){
		    
		    
		    
		     var msg = 'Calculo De Roya Enviado: ID: ' + data._id + '.' ;
		  	 var data_server={
	            message:msg,
	            to_user:'admin',
	            from_id:currentUser
	        };
	        socket.emit('get msg',data_server);

		    
	        localStorageService.remove('localTest');
        });
	    
	           
        
        
    };
    
    $scope.graficarHitorial = function () {


    Array.prototype.contains = function(obj) {
        var i = this.length;
        while (i--)
            if (this[i] == obj)
                return true;
            return false;
        }

        $("#datagUnit").css({display:"block"});

        var data = $scope.royaHistory;
        var fechas = [];
        var puntosIncidencia = [];


        for (var i = 0; i < data.length; i++) {

            if (!fechas.contains(data[i].createdAt)){
                fechas.push(data[i].createdAt);    
            } 

            puntosIncidencia.push({meta: data[i].unidad.nombre,value: data[i].incidencia});

        }

        console.log(fechas);
        console.log(puntosIncidencia);


        var dataG = new Chartist.Line('#datagUnit', {
          labels: fechas,
          series: [puntosIncidencia]
      }, {
          fullWidth: true,

          chartPadding: {
            right: 40
        },
        plugins: [
            Chartist.plugins.tooltip()
        ]


    });

    }
    
    
    
    $scope.logChange = function() {
		console.log("is changing");
		console.log($scope.affect);
		
	};
    
    var usrid = auth.userId();;
    
    var historialLaunchFunc = function() {
	    
	    if ($rootScope.IsInternetOnline) {
		    
			  roya.getUser($scope.user_Ided).then(function(userhistory){
				  $scope.royaHistory = userhistory.data;
				  localStorageService.set('royaHistory',userhistory.data);
				  console.log($scope.royaHistory);
			  });
			  
		} else {
			$scope.royaHistory = localStorageService.get('royaHistory');	  
		}
    };
    historialLaunchFunc();
    $scope.historialLaunch = historialLaunchFunc();
    
    
}]);