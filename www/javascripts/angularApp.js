var app = angular.module('coffeeScript', ['btford.socket-io','ui.router','snap','luegg.directives','LocalStorageModule','ngSanitize','ngFileUpload','base64']);

app.config(['localStorageServiceProvider', function(localStorageServiceProvider){
  localStorageServiceProvider.setPrefix('ls');
}]);

app.config(function($httpProvider) {
    //Enable cross domain calls
    $httpProvider.defaults.useXDomain = true;
});

// Socket Factory service
app.factory('socket', ['socketFactory',
    function(socketFactory) {
        return socketFactory({
            prefix: '',
            ioSocket: io.connect('https://icafe.centroclima.org')
           // ioSocket: io.connect('https://icafe.centroclima.org:3000')
        });
    }
]);

app.directive('onlyNum', function() {
    return function(scope, element, attrs) {

        var keyCode = [8, 9, 37, 39, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 110];
        element.bind("keydown", function(event) {
            //console.log($.inArray(event.which,keyCode));
            if ($.inArray(event.which, keyCode) === -1) {
                scope.$apply(function() {
                    scope.$eval(attrs.onlyNum);
                    event.preventDefault();
                });
                event.preventDefault();
            }

        });
    };
});

app.controller('MainCtrl',['$scope','posts', 'auth', 'widget',
function($scope, posts, auth, widget){
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.currentUser = auth.currentUser;
	// Get all widget
	widget.getAll().then(function(data)
   	{
   		$scope.widget = data;
   	});
	
}]);

// Services for widget
app.factory('widget', ['$http', function($http){
	var w = {};
	w.getAll = function()
	{
		return $http.get('https://icafe.centroclima.org/getWidgets').success(function(data){
			return data;
		});
	};
	return w;
}]);

app.controller('PostsCtrl', [
'$scope',
'$window',
'posts',
'post',
'auth',
function($scope, $window, posts, post, auth){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.post = post;
		$scope.addComment = function(){
			  if($scope.body === '') { return; }
			  posts.addComment(post._id, {
			    body: $scope.body,
			    author: 'user',
			  }).success(function(comment) {
			    $scope.post.comments.push(comment);
			  $scope.body = '';
			});
		};
		$scope.incrementUpvotes = function(comment){
		  posts.upvoteComment(post, comment);
		};

}]);
//Authorize Controller
app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
'$window',
'$timeout',
function($scope, $state, auth,$window,$timeout){
  $scope.user = {};
  
  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('register-profile');
    });
  };

  $scope.registerProfile = function(){
      $state.go('location');
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
  // Tech - 12 jan
  $scope.GenOtp = function(){
    auth.GenOtp($scope.user).error(function(error){
        $scope.error = error;
    }).then(function(data){
    	
    	if(data.data.success == false){
 
    		$scope.success = false
    		$scope.error = {"message":"Usuario no encontrado"}
    	}
    	else if(data.data.success == true){
    		$scope.error = false
    		window.localStorage['otp-pasw-token'] = JSON.stringify(data.data.data);
    		$state.go('authenticateotp');
    		
    		$scope.success = {"message":"Un Otp fue enviado a tu correo electrónico"}
    	}      	
    });
  };
  $scope.VerifyOTP = function(){
  	if(!$scope.user.otp){
  		
  		return false;
  	}
  	var parseLoca = $window.localStorage['otp-pasw-token'] ? JSON.parse($window.localStorage['otp-pasw-token']) : null;
  	if(parseLoca == null){
  		
  		$scope.success = false
		$scope.error = true
		$scope.error = {"message":"Inténtalo de nuevo solicitando nueva contraseña"}
		$timeout(function(){
			$state.go('forgotpassword');
		}, 2000);
  		return false;
  	}
  	var data =  { otp : $scope.user.otp, support :  parseLoca}
  	auth.VerifyOtp(data).error(function(error){
        $scope.error = error;
    }).then(function(data){
    	if(data.data == 1){
    		//window.localStorage.removeItem('otp-pasw-token');
    		$scope.success = true
    		$scope.error = false
    		sessionStorage.removeItem("count_verify");
    		$scope.success = {"message":"Verificado. Por favor espera..."}
    		$timeout(function(){
			$state.go('changepassword');
			}, 1000);
    		
    	}
    	else{
    		if(sessionStorage.getItem("count_verify") == null){
				  counter= sessionStorage.setItem("count_verify", 1);
				  counters = 1;
				}else{
				  counters= parseInt(sessionStorage.getItem("count_verify")); 
				  counters++;
				  counter=sessionStorage.setItem("count_verify", counters);
				}
    		//window.localStorage.removeItem('otp-pasw-token');
    		//$state.go('changepassword');
    		$scope.success = false
    		$scope.error = true
    		var chance = 3 - counters;
    		$scope.error = {"message":"No válido o caducado. Faltan "+chance+" oportunidades"}
    		if(chance == 0){
    			sessionStorage.removeItem("count_verify");
    			window.localStorage.removeItem('otp-pasw-token');
    			$timeout(function(){
					$state.go('login');
				}, 2000)
    		}
    	}

      	
    });
  }
  $scope.ChangePassword = function(){
  	if(!$scope.user.password || !$scope.user.cpassword ){
  		return false;
  	}
  	if($scope.user.password !== $scope.user.cpassword ){
  		$scope.error =  {"message":"La contraseña no coincide "} 
  		return false;
  	}
  	else{
  		var parseLoca = $window.localStorage['otp-pasw-token'] ? JSON.parse($window.localStorage['otp-pasw-token']) : null;
  		if(parseLoca == null){
  			$scope.error =  {"message":"No se puede identificar al usuario. Inténtalo de nuevo"} 
  			return false
  		}
  		var info = {pasword :$scope.user,user: parseLoca }
	  	auth.ChangePassword(info).error(function(error){
	        $scope.error = error;
	    }).then(function(data){

	    	if(data.data.success){
	    		$scope.success = true
	    		$scope.error = false
	    		window.localStorage.removeItem('otp-pasw-token');
	    		$scope.success = {"message":"Hecho! Contraseña cambiada correctamente. Por favor espera... "}
	    		sessionStorage.removeItem("countchpas");
	    		$timeout(function(){
					$state.go('login');
				}, 3000);
	    	}
	    	else{
	    		var counter = null;
	    		
	    		if(sessionStorage.getItem("countchpas") == null){
				  counter= sessionStorage.setItem("countchpas", 1);
				  counters = 1;
				}else{
				  counters= parseInt(sessionStorage.getItem("countchpas")); 
				  counters++;
				  counter=sessionStorage.setItem("countchpas", counters);
				}
	    		//window.localStorage.removeItem('otp-pasw-token');
	    		//$state.go('changepassword');
	    		$scope.success = false
	    		$scope.error = true

	    		var chance = 3 - counters;
	    		$scope.error = {"message":"Inválido. Faltan "+chance+" oportunidades"}
	    		if(chance == 0){
	    			sessionStorage.removeItem("countchpas");
	    			window.localStorage.removeItem('otp-pasw-token');
	    			$timeout(function(){
						$state.go('login');
					}, 2000)
	    		}

	    	}

	      	
	    });
  	}
  	

  }
}]);

//Units Controller
app.controller('UnitCtrl', [
'$scope',
'$state',
'unit',
'auth',
function($scope, $state, unit, auth){
  $scope.unit = {
	  sombra: true,
	  muestreo: true,
	  fertilizaSuelo: true,
	  fertilizaFollaje: true,
	  enmiendasSuelo: true,
	  manejoTejido: true,
	  fungicidasRoya: true,
	  verificaAgua: true,
	  variedad: {
	  		caturra: false,
			bourbon: false,
			catuai: false,
			maragogype: false,
			typica: false,
		  	pacamara: false,
		  	pacheComun: false,
		  	pacheColis: false,
		  	mundoNovo: false	  
	  },
	  fungicidas: {
		  contacto: true,
	  	  bourbon: false,
	  	  catuai: false
		  
	  },
	  verificaAguaTipo: {
		  ph: true,
		  dureza: false
	  },
	  tipoCafe: {
		  estrictamenteDuro: true,
		  duro: false,
		  semiduro: false,
		  prime: false,
		  extraprime: false
	  }
	  		
  };
  $( ".date-field" ).datepicker();
  $scope.saveUnit = function(){
	$scope.unit.departamento = $("#departamentos option:selected").text();
	$scope.unit.municipio = $("#departamentos-munis option:selected").text();
	
    unit.create($scope.unit,auth.userId()).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
  
  muni14.addDepts('departamentos');
  
}]);

app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
  $scope.isActive = function (viewLocation) {
     var active = (viewLocation === $location.path());
     return active;
	};
}]);

app.controller('NewsCtrl', [
'$scope',
'auth',
'$filter',
'$sce',
'posts',
function($scope, auth, $filter, $sce, posts){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.currentPage = 0;
  $scope.pageSize = 9;
  $scope.data = posts.posts;
  $scope.q = '';
  console.log(posts);
  $scope.getData = function () {
      return $filter('filter')($scope.data, $scope.q)
     
    }
    
    $scope.numberOfPages=function(){
        return Math.ceil($scope.getData().length/$scope.pageSize);                
    }
   
 
}]);

app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});

app.controller('LocationCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.testLocation = function() {
  	$('body').removeClass('modal-open');
  	$('.modal-backdrop').removeClass('modal-backdrop');
  	$state.go('home');
  }
}]);

app.controller('RoyaCtrl', [
'$scope',
'$state',
'auth',
'localStorageService',
'socket',
'unit',
'user',
'methods',
'roya',
function($scope, $state, auth, localStorageService, socket, unit, user, methods, roya){
  $scope.currentUser = auth.currentUser;
  var currentId = auth.currentUser();
  var testInStore = localStorageService.get('localTest');
  $scope.ClearTest = function(){
  	localStorageService.remove('localTest');
  	$state.go($state.current, {}, {reload: true})
  }
  var plantEditor = function(plant) {
	  $scope.plantname = plant;
	  $scope.leafList = $scope.test.plantas[plant - 1];
	  //console.log($scope.leafList);
	  $('#plantModal').modal('show');
  };
    //$scope.affect = 1;
		$scope.affect = "";
    user.get(auth.userId()).then(function(user){
		 $scope.units = user.units;
    });
    
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
	
  $scope.startTest = function(selectedUnit) {
	  $scope.test.unidad = selectedUnit;
	  $('.roya-wrap').addClass('initiated');
   }
   $scope.bandolas = function() {
	   if($scope.test.bandolas) {
		  $scope.test.bandolas = false;
	  } else {
		  $scope.test.bandolas = true;
	  }
	}
	$scope.addPlant = function() {
		$scope.test.plantas.push([]);
		var plantName = $scope.test.plantas.length;
		plantEditor(plantName);
		setTimeout(function () { $('[name=amount]').val(''); }, 100);
	};

	$scope.CloseAndAddPlant=function()
	{
	  $scope.addPlant();
	}
	
	$scope.editPlant = function($index) {
		plantEditor($index + 1);
		$scope.leafList = $scope.test.plantas[$index];
	}
	
	$scope.initLeaf = function() {
		$('.severity-list').addClass('active');
	}
	
	$scope.closePlant = function() {
		$('.plant-editor').removeClass('active');
	}
	
	$scope.addLeaf = function(severity) {
		var amount = $('[name=amount]').val();
		var plantIndex = $scope.plantname - 1;
		$scope.test.plantas[plantIndex].push([amount,severity]);
		$scope.leafList = $scope.test.plantas[plantIndex];
		$('[name=amount]').val('');
		$scope.affect ="";
		//$scope.affect = 1;
		$('.severity-list').removeClass('active');
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
    
}]);



app.controller('GalloCtrl', [
'$scope',
'$state',
'auth',
'localStorageService',
'socket',
'unit',
'user',
'methods',
'gallo',
function($scope, $state, auth, localStorageService, socket, unit, user, methods, roya){
  $scope.currentUser = auth.currentUser;
  var currentId = auth.currentUser();
  var testInStore = localStorageService.get('localTestgallo');
  
  $scope.ClearTest = function(){
  	localStorageService.remove('localTestgallo');
  	$state.go($state.current, {}, {reload: true})
  }
  var plantEditor = function(plant) {
	  $scope.plantname = plant;
	  $scope.leafList = $scope.test.plantas[plant - 1];
	  //console.log($scope.leafList);
	  $('#plantModal').modal('show');
  };
    $scope.affect = 1;
    user.get(auth.userId()).then(function(user){
		 $scope.units = user.units;
    });
    
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
      localStorageService.set('localTestgallo', $scope.test);
    }, true);
 
  
  if(testInStore && Object.keys(testInStore.unidad).length > 1) {
	  $('.roya-wrap').addClass('initiated');
  }
  
  if(testInStore && testInStore.resolved) {
	  $('.test').hide();
	  $('.results').show();
  }
	
  $scope.startTest = function(selectedUnit) {
	  $scope.test.unidad = selectedUnit;
	  $('.roya-wrap').addClass('initiated');
   }
   $scope.bandolas = function() {
	   if($scope.test.bandolas) {
		  $scope.test.bandolas = false;
	  } else {
		  $scope.test.bandolas = true;
	  }
	}
	$scope.addPlant = function() {
		$scope.test.plantas.push([]);
		var plantName = $scope.test.plantas.length;
		plantEditor(plantName);
		setTimeout(function () { $('[name=amount]').val(''); }, 100);
	};
	$scope.CloseAndAddPlant=function()
	{
	  $scope.addPlant();
	}
	
	$scope.editPlant = function($index) {
		plantEditor($index + 1);
		$scope.leafList = $scope.test.plantas[$index];
	}
	
	$scope.initLeaf = function() {
		$('.severity-list').addClass('active');
	}
	
	$scope.closePlant = function() {
		$('.plant-editor').removeClass('active');
	}
	
	$scope.addLeaf = function(severity) {
		var amount = $('[name=amount]').val();
		var plantIndex = $scope.plantname - 1;
		$scope.test.plantas[plantIndex].push([amount,severity]);
		$scope.leafList = $scope.test.plantas[plantIndex];
		$('[name=amount]').val('');
		$scope.affect = 1;
		$('.severity-list').removeClass('active');
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

		    
	        localStorageService.remove('localTestgallo');
        });
	    
	           
        
        
    };
    
}]);

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

app.filter('sumLeafFilter', function () {
    return function (leafArray) {
        var leafTotals = 0;
        for (var i = 0; i < leafArray.length; i++) {
            if (leafArray[i][0] == "") {
                leafArray[i][0] = "0";
            }
            leafTotals += parseInt(leafArray[i][0]);
        }
        return leafTotals;
    };
});
app.controller('WeatherCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.currentUser = auth.currentUser;
}]);

// Support Chat Controller 
app.controller('SupportCtrl',['$scope','auth', 'socket', 'user','Upload','$base64',
function ($scope, auth, socket, user,Upload,$base64) {

	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.currentUser = auth.currentUser;
	$scope.loggedUser = auth.currentUser();
	$scope.userImageList = [];
	$scope.currentUserObj = auth.currentUserObject();
	$scope.adminImage='';
	$scope.adminName='';
	//$scope.UserName = 'User';
	$scope.UserImage = '../images/ChatUser.png';
	$scope.UserImageBottom = '../images/ChatUser.png';
	// $scope.UserNameDisplay = 'User';
	$scope.IsCall = false;

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

	$scope.getUserImage = function (userId) {
	    var result = $.grep($scope.userImageList, function (item) {
	        return item._id == userId;
	    });
	    
	    if (result.length == 0) {
	        $scope.userImageList.push({ _id: userId, nickname: '', image: '' });
	        user.get(userId).then(function (userObj) {
	            if (userObj.nickname == "") {
	                userObj.nickname = null;
	            }
	            if (userObj.image == "") {
	                userObj.image = null;
	            }
	            var nickName = userObj.nickname || userObj.username;
	            var userImage = userObj.image || '../images/ChatUser.png';
	            var res = $.grep($scope.userImageList, function (item) {
	                return item._id == userObj._id;
	            });
	            res[0].nickname = nickName;
	            res[0].image = userImage;
	            $.each($scope.chatLog, function (i, v) {
	                if (userObj._id == v.sender_id) {
	                    v.imageurl = userImage;
						$scope.adminName = nickName;
						if($scope.adminImage == '')
						{
							$scope.adminImage = userImage;
						}
	                    v.sender = nickName;
	                }
	            });
	        });
	    }
	    else {
	        if ($scope.chatLog != undefined) {
	            $.each($scope.chatLog, function (i, v) {
	                
	                    v.imageurl = result[0].image;
	                    v.sender = result[0].nickname;
								
	            });
	        }
	    }
	}

	$scope.openImagePopup = function () {
	    $('#myModalUserImage').modal('show');
	}

	$scope.setCurrentUserImage = function (messageList) {
	    for (var i = 0; i < messageList.length; i++) {
	      if (messageList[i].sender_id != undefined) {
	            $scope.getUserImage(messageList[i].sender_id);
	      }
	    }
	    $scope.chatLog = messageList;
	}

	
	$scope.sendMessage = function(attachmentfile) {
		var image;
		console.log(attachmentfile)
		if(attachmentfile){
			console.log(attachmentfile)
			//console.log(Upload.dataUrl(attachmentfile).then(('base64')))
		 Upload.dataUrl(attachmentfile, true).then(function(dataUrl) {
			image = dataUrl;
			var f = $('.type-sink');
	        var msg = f.find('[name=chatMsg]').val();
	        var from_id = f.find('[name=fromId]').val();
	        var from_chatattchment = image;
	     
	       
			var data_server={
	            message:msg,
	            bodyattachement:from_chatattchment,
	            to_user:'admin',
	            from_id:from_id
	        };

	        socket.emit('get msg',data_server);
	        $('.type-sink .form-control').val("");
	        $scope.files = '';
		 })
		 } else {

		 
			var f = $('.type-sink');
	        var msg = f.find('[name=chatMsg]').val();
	        var from_id = f.find('[name=fromId]').val();
	        var from_chatattchment = image;
	     
	       
			var data_server={
	            message:msg,
	            bodyattachement:from_chatattchment,
	            to_user:'admin',
	            from_id:from_id
	        };

	        socket.emit('get msg',data_server);
	        $('.type-sink .form-control').val("");
        }
	};
	socket.on('set msg only',function(data){
        data=JSON.parse(data);console.log("set msg only", data)
        var user = data.sender;
        if (user == $scope.loggedUser) {
            $scope.setCurrentUserImage(data.messages);
	        $scope.$apply();
	    }
    });
	socket.on('set msg',function(data){
        data=JSON.parse(data);console.log("set msg", data);
        var usera = data.to_user;
        var userb = data.from_id;
        if (usera == $scope.loggedUser || userb == $scope.loggedUser) {
            $scope.setCurrentUserImage(data.chat.messages);
			      $scope.$apply();
        }
        
    });
	if (!$scope.IsCall) {
	    $scope.IsCall = true;
	
	    user.get($scope.currentUserObj._id).then(function (userObj) {
	        if (userObj.nickname == "") {
	            userObj.nickname = null;
	        }
	        if (userObj.image == "") {
	            userObj.image = null;
	        }
	        //$scope.UserNameDisplay = userObj.nickname || userObj.username;
					if($scope.UserName!='admin')
					{
					    //$scope.UserImage = userObj.image || '../images/ChatUser.png';
					    $scope.UserImageBottom = userObj.image || '../images/ChatUser.png';
						$scope.UserName=userObj.username;
					}
					else	
					{
						$scope.UserName = userObj.nickname || userObj.username;
						//$scope.UserImage = userObj.imageurl || '../images/ChatUser.png';
						$scope.UserImageBottom = userObj.image || '../images/ChatUser.png';
					}
	    });
	}
	
	$scope.uploadPhoto = function () {
	    var userObj = auth.currentUserObject();
	    if (userObj != null) {
	        user.get(userObj._id).then(function (userObj) {
	        	console.log($scope.UserImage)
	            if ($scope.UserImage != null) {
	                userObj.image = $scope.UserImage;
	            }
	            //if ($scope.UserName != null) {
	            //    userObj.nickname = $scope.UserName;
	            //}
	            
	            user.update(userObj).error(function (error) {
	                $scope.error = error;
	            }).then(function (data) {
	                $scope.message = data.data.message;
	                location.reload();
	            });
	        });
	    }
	    $('#myModalUserImage').modal('hide');
	    
	}

}]);

app.controller('ProfileCtrl',['$http','$scope', 'auth', 'unit', 'user',
function($http, $scope, auth, unit, user){
	var map;
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.currentUser = auth.currentUser;
	$scope.userId = auth.userId;
	$scope.user_Ided = auth.userId();
	var userO = {};
	$scope.newUnit = {
	  sombra: true,
	  muestreo: true,
	  fertilizaSuelo: true,
	  fertilizaFollaje: true,
	  enmiendasSuelo: true,
	  manejoTejido: true,
	  fungicidasRoya: true,
	  verificaAgua: true,
	  recomendaciontecnica: '',
	  nitrogeno: true,
	  nitrorealiza: '',
	  sacos: '',
	  realizapoda: true,
	  realizamonth: '',
	  quetipo: '',
	  enfermedades: true,
	  cyprosol: true,
	  cyprosoldate: '',
	  atemi: true,
	  atemidate: '',
	  esfera: true,
	  esferadate: '',
	  opera: true,
	  operadate: '',
	  opus: true,
	  opusdate: '',
	  soprano: true,
	  sopranodate: '',
	  hexalon: true,
	  hexalondate: '',
	  propicon: true,
	  propicondate: '',	 
	  hexil: true,
	  hexildate: '',	 
	  otros: true,
	  otrosdate: '',
	  fungicidasmonth: '',
	  produccionhectarea: '',
	  variedad: {
	  		caturra: false,
			bourbon: false,
			catuai: false,
			maragogype: false,
			typica: false,
		  	pacamara: false,
		  	pacheComun: false,
		  	pacheColis: false,
		  	mundoNovo: false
					  
	  },
	  fungicidas: {
		  contacto: true,
	  	  bourbon: false,
	  	  catuai: false,
		 biologico : false,
		 sistemico : false
	  },
	  verificaAguaTipo: {
		  ph: true,
		  dureza: false
	  },
	  rendimiento : '',
	  tipoCafe: {
		  estrictamenteDuro: true,
		  duro: false,
		  semiduro: false,
		  prime: false,
		  extraprime: false
		  }
	};
	$scope.editUnit = {};
	user.get($scope.user_Ided).then(function(user){
		 $scope.userO = user;
		 $scope.units = $scope.userO.units;
    });
	  var spanishDateTimePickerOption = {
        closeText:"Cerrar",prevText:"&#x3C;Ant",nextText:"Sig&#x3E;",currentText:"Hoy",monthNames:["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],monthNamesShort:["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],dayNames:["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],dayNamesShort:["dom","lun","mar","mié","jue","vie","sáb"],dayNamesMin:["D","L","M","X","J","V","S"],weekHeader:"Sm",firstDay:1,isRTL:!1,showMonthAfterYear:!1,yearSuffix:""
    }
    $( ".date-field" ).datepicker(spanishDateTimePickerOption);
    
    $scope.update = function(){
    user.update($scope.userO).error(function(error){
	      $scope.error = error;
	    }).then(function(data){
	      $scope.message = data.data.message;
	    });
	  };
	$scope.deleteUnit = function(e,id,index) {
		
		unit.deleteUnit(id, auth.userId()).then(function(user){
				$scope.userO.units.splice(index, 1);
				$scope.userO.units
			});		
	}
	
	$scope.updateUnit = function(e,id) {
		
		$scope.sucMsg = null;
		unit.get(auth.userId(),id).then(function(unitD){
			console.log(unitD);
			$scope.editUnit = unitD;
			$scope.updateUnitForm = function(){
				if ($scope.updateunitForm.$valid) {
					unit.update(id, auth.userId(), $scope.editUnit).then(function(unitN){
						user.get($scope.user_Ided).then(function(user){
							 $scope.userO = user;
							 $scope.units = $scope.userO.units;
					    });
						$scope.editUnit = unitN.data;
						$scope.sucMsg = '¡Unidad Actualizada exitosamente!';
					});
				}
			}
		});
	}
	
	$scope.saveUnit = function(){

		if ($scope.newunitForm.$valid) {
			
		$scope.newUnit.departamento = $("#departamentos option:selected").text();
		$scope.newUnit.municipio = $("#departamentos-munis option:selected").text();
		$scope.newUnit.lat = $('[name="lat"]').val();
		$scope.newUnit.lng = $('[name="lng"]').val();
		
	    unit.create($scope.newUnit,auth.userId()).error(function(error){
	      $scope.error = error;
	    }).then(function(data){
				$scope.userO.units.push(data.data);
				$('#myModal2').modal('hide');
				$scope.newUnit = {
				  sombra: true,
				  muestreo: true,
				  fertilizaSuelo: true,
				  fertilizaFollaje: true,
				  enmiendasSuelo: true,
				  manejoTejido: true,
				  fungicidasRoya: true,
				  verificaAgua: true,
				  recomendaciontecnica: '',
				  nitrogeno: true,
				  nitrorealiza: '',
				  sacos: '',
				  realizapoda: true,
				  realizamonth: '',
				  quetipo: '',
				  enfermedades: true,
				  cyprosol: true,
				  cyprosoldate: '',
				  atemi: true,
				  atemidate: '',
				  esfera: true,
				  esferadate: '',
				  opera: true,
				  operadate: '',
				  opus: true,
				  opusdate: '',
				  soprano: true,
				  sopranodate: '',
				  hexalon: true,
				  hexalondate: '',
				  propicon: true,
				  propicondate: '',	 
				  hexil: true,
				  hexildate: '',	 
				  otros: true,
				  otrosdate: '',
				  fungicidasmonth: '',
				  produccionhectarea: '',
				  variedad: {
				  		caturra: false,
						bourbon: false,
						catuai: false,
						maragogype: false,
						typica: false,
					  	pacamara: false,
					  	pacheComun: false,
					  	pacheColis: false,
					  	mundoNovo: false		  
				  },
				  fungicidas: {
					  contacto: true,
				  	  bourbon: false,
				  	  catuai: false,
				  	  biologico : false,
		 			  sistemico : false
					  
				  },
				  verificaAguaTipo: {
					  ph: true,
					  dureza: false
				  },
				  rendimiento : '',
				  recomendaciontecnica: '',
				  tipoCafe: {
					  estrictamenteDuro: true,
					  duro: false,
					  semiduro: false,
					  prime: false,
					  extraprime: false
					  }
				}
		    });
			
		}
		
	  };
  
     muni14.addDepts('departamentos');

   function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

    function initialize() {
	var myLatlng, myLat, myLng;
	var x;
	var ax  = [];
	var infoWindow = new google.maps.InfoWindow({map: map});
	if(!document.getElementById('latlongid').value) {
		if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
			
			myLat = position.coords.latitude;
			myLng = position.coords.longitude;
           // map.setCenter(pos);
            myLatlng = new google.maps.LatLng(myLat , myLng); 
            
            var myOptions = {
	 zoom: 13,
	 center: myLatlng,
	 mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);

	map1 = new google.maps.Map(document.getElementById("map-canvas1"), myOptions);

	var marker = new google.maps.Marker({
	 draggable: true,
	 position: myLatlng,
	 map: map,
	 title: "Your location"
	});

	var marker1 = new google.maps.Marker({
		 draggable: true,
		 position: myLatlng,
		 map: map1,
		 title: "Your location"
	});	
	

		google.maps.event.addListener(marker, 'dragend', function(event) {
		    
		    $scope.newUnit.ubicacion = '('+event.latLng.lat()+' , '+event.latLng.lng()+')';
		     document.getElementById('latlongid').value = event.latLng.lat() +',' + event.latLng.lng();
		    console.log("this is marker info", event.latLng.lat() +' , ' + event.latLng.lng());
		    
		});

		google.maps.event.addListener(marker1, 'dragend', function(event) {
			
		    placeMarker(event.latLng);
		    $scope.editUnit.ubicacion = '('+event.latLng.lat()+' , '+event.latLng.lng()+')';
		    document.getElementById('latlongid').value = event.latLng.lat() +',' + event.latLng.lng();
		    console.log("this is marker info", event.latLng.lat() +' , ' + event.latLng.lng());
		    
		});
		google.maps.event.addDomListener(window, 'load', initialize);
            
          }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
          });
          console.log("this is positon", myLat);
        } else {
          // Browser doesn't support Geolocation
          handleLocationError(false, infoWindow, map.getCenter());
        }
	//myLatlng = new google.maps.LatLng(42.94033923363181 , -10.37109375); 
	
	}
	else {
		x = document.getElementById('latlongid').value;
	x = x.replace(/[{()}]/g, '');
	ax= x.split(",");
	myLatlng = new google.maps.LatLng(ax[0],ax[1]);
	
	var myOptions = {
	 zoom: 13,
	 center: myLatlng,
	  disableDoubleClickZoom: true,
	 mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);

	map1 = new google.maps.Map(document.getElementById("map-canvas1"), myOptions);

	var marker = new google.maps.Marker({
	 draggable: true,
	 position: myLatlng,
	 map: map,
	 title: "Your location"
	});

	var marker1 = new google.maps.Marker({
		 draggable: true,
		 position: myLatlng,
		 map: map1,
		 title: "Your location"
	});	
	

		google.maps.event.addListener(marker, 'dragend', function(event) {
		    
		    $scope.newUnit.ubicacion = '('+event.latLng.lat()+' , '+event.latLng.lng()+')';
		     document.getElementById('latlongid').value = event.latLng.lat() +',' + event.latLng.lng();
		    console.log("this is marker info", event.latLng.lat() +' , ' + event.latLng.lng());
		    
		});

		google.maps.event.addListener(marker1, 'dragend', function(event) {
			
		    placeMarker(event.latLng);
		    $scope.editUnit.ubicacion = '('+event.latLng.lat()+' , '+event.latLng.lng()+')';
		    document.getElementById('latlongid1').value = event.latLng.lat() +',' + event.latLng.lng();
		    console.log("this is marker info", event.latLng.lat() +' , ' + event.latLng.lng());
		    
		});
		
		// double click event
   /*   google.maps.event.addListener(map1, 'dblclick', function(e) {
        var positionDoubleclick = e.latLng;
        marker1.setPosition(positionDoubleclick);
        // if you don't do this, the map will zoom in
      }); */
		google.maps.event.addDomListener(window, 'load', initialize);
	
	}

	
	
}
	
	function placeMarker(location) {
  var marker = new google.maps.Marker({
      position: location,
      draggable:true,
      map: map
  });

  map.setCenter(location);
}

	// Initialize map
	$scope.mapInit = function()
	{
		$('.map').collapse('toggle');
		initialize();
	}


}]);


	
app.controller('CampoCtrl', [
'$scope',
'$state',
'auth',
'localStorageService',
'socket',
'unit',
'user',
'methods',
'gallo','campoService',
function($scope, $state, auth, localStorageService, socket, unit, user, methods, roya, campoService){
  $scope.currentUser = auth.currentUser;
  $scope.resultscampo = false;
  var currentId = auth.currentUser();
  var testInStore = localStorageService.get('localTestCampo');
  $scope.ClearTest = function(){
  	localStorageService.remove('localTestCampo');
  	$state.go($state.current, {}, {reload: true})
  }
  
  var plantEditorCampo = function(plant) {
	  $scope.plantname = plant;
	  $scope.leafList = $scope.test.plantas[plant - 1];
	  //console.log($scope.leafList);
	  $('#plantModal').modal('show');
  };
    $scope.affect = 1;
    user.get(auth.userId()).then(function(user){
		 $scope.units = user.units;
    });
    
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
      localStorageService.set('localTestCampo', $scope.test);
    }, true);
 
  
  if(testInStore && Object.keys(testInStore.unidad).length > 1) {
	  $('.roya-wrap').addClass('initiated');
  }
  
  if(testInStore && testInStore.resolved) {
	  $('.test').hide();
	  $('.results').show();
  }
	
  $scope.startTest = function(selectedUnit) {
	  $scope.test.unidad = selectedUnit;
	  $('.roya-wrap').addClass('initiated');
   }
   $scope.bandolas = function() {
	   if($scope.test.bandolas) {
		  $scope.test.bandolas = false;
	  } else {
		  $scope.test.bandolas = true;
	  }
	}
	$scope.addPlant = function() {
		$scope.test.plantas.push([]);
		var plantName = $scope.test.plantas.length;
		plantEditorCampo(plantName);
		setTimeout(function () { $('[name=amount]').val(''); }, 100);
	};
	
	$scope.editPlant = function($index) {
		plantEditorCampo($index + 1);
		$scope.leafList = $scope.test.plantas[$index];
	}
	
	$scope.initLeaf = function() {
		$('.severity-list').addClass('active');
	}
	
	$scope.closePlant = function() {
		$('.plant-editor').removeClass('active');
	}
	
	$scope.addLeaf = function(severity) {
		var amount = $('[name=amount]').val();
		var plantIndex = $scope.plantname - 1;
		$scope.test.plantas[plantIndex].push([amount,severity]);
		$scope.leafList = $scope.test.plantas[plantIndex];
		$('[name=amount]').val('');
		$scope.affect = 1;
		$('.severity-list').removeClass('active');
	};

    $scope.removePlant = function (index) {
      $scope.test.plantas.splice(index, 1);
    };
    
    $scope.removeLeaf = function (index) {
	  var plantIndex = $scope.plantname - 1;
      $scope.test.plantas[plantIndex].splice(index, 1);
    }; 

    $scope.addPlantMutiple = function(data){
    	var plantIndex = $scope.plantname - 1;
    	$scope.test.plantas[plantIndex].push(data)

    }
    $scope.SaveTestRecord = function() {
    	    testInStore = localStorageService.get('localTestCampo');

  			if(testInStore == null) 
  			{
  				alert("Hubo un error. No se pudo completar la solicitud. Por favor rellene los detalles de las plantas.")
  				return false;
  			}
  			campoService.SaveCampoUnitTest(testInStore).then(function(success){
  				//alert("The test has been saved.")
  				//alert("Se ha guardado la prueba.")
  				if(success.data == 1){
  				 localStorageService.remove('localTestCampo');
  				 $scope.resultscampo = true;

  				 $('.test').hide();
				 $('.results').show();
  				}
  				else{
  					  alert("Hubo un error. No se pudo completar la solicitud. Por favor rellene los detalles de las plantas.")
  				}
  			},function(err){
  				console.log(err)
  				if(err.status == 404){
  				  alert("Hubo un error. No se pudo completar la solicitud.")
  				 // alert("There went an error. Request could not be completed.")
  				}
  				
  			})
    		
    };
    //AKhil
    $scope.getHelp = function(currentUser) { 
	    
	    
	    roya.create(testInStore).success(function(data){
		    
		    
		    
		     var msg = 'Calculo De Roya Enviado: ID: ' + data._id + '.' ;
		  	 var data_server={
	            message:msg,
	            to_user:'admin',
	            from_id:currentUser
	        };
	        socket.emit('get msg',data_server);

		    
	        localStorageService.remove('localTestCampo');
        });
	    
	           
        
        
    };
    
}]);

app.factory('posts', ['$http', 'auth', function($http, auth){
	  var o = {
	  		posts : []
	  };
	  o.getAll = function() {
	    return $http.get('https://icafe.centroclima.org/posts').success(function(data){
	      angular.copy(data, o.posts);
	    });
	  };
	  o.create = function(post) {
		  return $http.post('https://icafe.centroclima.org/posts', post, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
		    o.posts.push(data);
		  });
		};
		o.upvote = function(post) {
		  return $http.put('https://icafe.centroclima.org/posts/' + post._id + '/upvote', null, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  })
		    .success(function(data){
		      post.upvotes += 1;
		    });
		};
		o.get = function(id) {
		  return $http.get('https://icafe.centroclima.org/posts/' + id).then(function(res){
		    return res.data;
		  });
		};
		o.addComment = function(id, comment) {
		  return $http.post('https://icafe.centroclima.org/posts/' + id + '/comments', comment, {
		    headers: {Authorization: 'Bearer '+auth.getToken()}
		  });
		};
		o.upvoteComment = function(post, comment) {
		  return $http.put('https://icafe.centroclima.org/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  })
		    .success(function(data){
		      comment.upvotes += 1;
		    });
		};
  return o;
}]);
// User profile service
app.factory('user', ['$http', 'auth', function($http, auth){
	  var o = {
	  };
	  /*o.create = function(post) {
		  return $http.post('/posts', post, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
		    o.posts.push(data);
		  });
		};*/
		o.getAll = function() {
		  return $http.get('https://icafe.centroclima.org/users', {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).then(function(res){
		    return res.data;
		  });
		};
		o.get = function(id) {
		  return $http.get('https://icafe.centroclima.org/users/' + id).then(function(res){
		    return res.data;
		  });
		};
		
		o.update = function(user){
			/*console.log(user)*/
	  return $http.put('https://icafe.centroclima.org/users/' + user._id, user, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
	    return data
	  });
	};
		
  return o;
}]);
//authorize service
app.factory('auth', ['$http', '$window', function($http, $window){
   var auth = {};

   auth.saveToken = function (token){
	  $window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function (){
	  return $window.localStorage['flapper-news-token'];
	}

	auth.isLoggedIn = function(){
	  var token = auth.getToken();

	  if(token){
	    var payload = JSON.parse($window.atob(token.split('.')[1]));

	    return payload.exp > Date.now() / 1000;
	  } else {
	    return false;
	  }
	};

	auth.currentUser = function(){
	  if(auth.isLoggedIn()){
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
	
	auth.userId = function(){
	  if(auth.isLoggedIn()){
	    var token = auth.getToken();
	    var payload = JSON.parse($window.atob(token.split('.')[1]));
		
	    return payload._id;
	  }
	};

	auth.register = function(user){
	  return $http.post('https://icafe.centroclima.org/register', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};

	auth.logIn = function(user){
	  return $http.post('https://icafe.centroclima.org/login', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};
	// Tech 12 / 1
	// Change Localhost to production url
	// for GenOtp(), VerifyOtp(), ChangePassword()
	
	auth.GenOtp = function(user){
		
	  /*return $http.post('https://icafe.centroclima.org/requestpasswordchange', user).success(function(data){
	    auth.saveToken(data.token);
	  });*/
	  return $http.post('https://icafe.centroclima.org/requestpasswordchange', user).success(function(data){
	     return data;
	  });
	};	
	auth.VerifyOtp = function(user){
		
	  /*return $http.post('https://icafe.centroclima.org/changeauthenticate', user).success(function(data){
	    auth.saveToken(data.token);
	  });*/
	  return $http.post('https://icafe.centroclima.org/changeauthenticate', user).success(function(data){
	     return data;
	  });
	};	
	auth.ChangePassword = function(user){
		
	  /*return $http.post('https://icafe.centroclima.org/passwordchange', user).success(function(data){
	    auth.saveToken(data.token);
	  });*/
	  return $http.post('https://icafe.centroclima.org/passwordchange', user).success(function(data){
	     return data;
	  });
	};

	auth.logOut = function(){
	  $window.localStorage.removeItem('flapper-news-token');
	  window.location.href = '/';
	};

  return auth;
}]);
//units service
app.factory('unit', ['$http', 'auth','$window', function($http, auth, $window){
   var o = {};
   o.getAll = function(id) {
	    return $http.get('https://icafe.centroclima.org/users/'+ id +'/units').success(function(data){
	      return data;
	    });
	  };
   o.get = function(userId,id) {
		  return $http.get('https://icafe.centroclima.org/users/'+ userId +'/units/'+ id).then(function(res){
		    return res.data;
		  });
		};
   
	o.create = function(unit, id){
		//localhost unit
	  
	  return $http.post('https://icafe.centroclima.org/users/'+ id +'/units', unit, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
		    return data;
		  });
	};
	
	o.update = function(unit, id, unitData){
		//localhost unit
	  
	  return $http.put('https://icafe.centroclima.org/users/'+ id +'/units/'+ unit, unitData, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
	    return data
	  });
	};
	
	o.deleteUnit = function(unitId, userId){
	  return $http.delete('https://icafe.centroclima.org/users/'+ userId +'/units/'+ unitId, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
		    return unitId;
		  });
	};

  return o;
}]);

app.factory('methods', ['$http', 'auth', function($http, auth){
	  var o = {
	  		chats : []
	  };
	  o.get = function() {
	    return $http.get('https://icafe.centroclima.org/admin/methods/').success(function(data){
	      return data;
	    });
	  };
	  o.create = function(method) {
		  return $http.post('https://icafe.centroclima.org/admin/methods', method, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
		    return data;
		  });
		};
		o.update = function(method) {
		  return $http.put('https://icafe.centroclima.org/admin/methods', method, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
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
        return $http.get('https://icafe.centroclima.org/admin/campo/').success(function (data) {
            return data;
        });
    };
    o.create = function (method) {
        return $http.post('https://icafe.centroclima.org/admin/campo', method, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data;
        });
    };
    o.update = function (method) {
        return $http.put('https://icafe.centroclima.org/admin/methods', method, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data;
        });
    };
    o.SaveCampoUnitTest = function(data){
    	return $http.post('https://icafe.centroclima.org/admin/campo/addtests',data, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data;
        });
    }

    return o;
}]);

app.factory('roya', ['$http', 'auth', function($http, auth){
	  var o = {
	  		
	  };
	  o.getAll = function() {
	    return $http.get('https://icafe.centroclima.org/roya').success(function(data){
	      return data;
	    });
	  };
	  o.create = function(roya) {
		 return $http.post('https://icafe.centroclima.org/roya', roya, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
		    return data;	
		  });
		};
		/*o.get = function(id) {
		  return $http.get('/roya/' + id).then(function(res){
		    return res.data;
		  });
		};*/
  return o;
}]);

app.factory('gallo', ['$http', 'auth', function($http, auth){
	  var o = {
	  		
	  };
	  o.getAll = function() {
	    return $http.get('https://icafe.centroclima.org/gallo').success(function(data){
	      return data;
	    });
	  };
	  o.create = function(gallo) {
		 return $http.post('https://icafe.centroclima.org/gallo', gallo, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
		    return data;	
		  });
		};
		/*o.get = function(id) {
		  return $http.get('/roya/' + id).then(function(res){
		    return res.data;
		  });
		};*/
  return o;
}]);

//pre loader animation controller
app.run(function($rootScope){
    $rootScope
        .$on('$stateChangeStart', 
            function(event, toState, toParams, fromState, fromParams){ 
                 $('body').removeClass('loaded');
	  			 $('body').addClass('loading');
        });

    $rootScope
        .$on('$stateChangeSuccess',
            function(event, toState, toParams, fromState, fromParams){ 
                setTimeout(function(){ $('body').removeClass('loading'); $('body').addClass('loaded') },400);
	  			
	  			setTimeout(function(){ $('body').removeClass('loaded') },500);

        });

});

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	  }],
	  resolve: {
	    postPromise: ['posts', function(posts){
	      return posts.getAll();
	    }]
  	   }
    })
    .state('posts', {
	  url: '/posts/{id}',
	  templateUrl: '/posts.html',
	  controller: 'PostsCtrl',
	  resolve: {
      post: ['$stateParams', 'posts', function($stateParams, posts) {
      	return posts.get($stateParams.id);
    }]
  }

	})
	.state('login', {
	  url: '/login',
	  templateUrl: '/login.html',
	  controller: 'AuthCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      $state.go('home');
	    }
	  }]
	})
	.state('register', {
	  url: '/register',
	  templateUrl: '/register.html',
	  controller: 'AuthCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      $state.go('home');
	    }
	  }]
	})
	.state('forgotpassword', {
	  url: '/forgotpassword',
	  templateUrl: '/forgorpasswordscreen.html',
	  controller: 'AuthCtrl'
	})
	.state('authenticateotp', {
	  url: '/authenticate',
	  templateUrl: '/otpscreen.html',
	  controller: 'AuthCtrl'
	})
	.state('changepassword', {
	  url: '/resetpassword',
	  templateUrl: '/resetpassword.html',
	  controller: 'AuthCtrl'
	})
	.state('register-profile', {
	  url: '/register-profile',
	  templateUrl: '/register-profile.html',
	  controller: 'UnitCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      //$state.go('home');
	    }
	  }]
	})
	.state('location', {
	  url: '/location',
	  templateUrl: '/location.html',
	  controller: 'LocationCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	  }]
	})
	.state('roya', {
	  url: '/roya',
	  templateUrl: '/roya.html',
	  controller: 'RoyaCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	  }]
	})
	.state('gallo', {
	  url: '/gallo',
	  templateUrl: '/gallo.html',
	  controller: 'GalloCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	  }]
	})
	.state('dosage', {
	  url: '/dosage',
	  templateUrl: '/dosage.html',
	  controller: 'DosageCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	  }]
	})//Dosage
	.state('vulnerability', {
	  url: '/vulnerability',
	  templateUrl: '/vulnerability.html',
	  controller: 'VulneCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	  }]
	})//Dosage
	.state('campo', {
		url: '/campo',
		templateUrl: '/campo.html',
		controller: 'CampoCtrl',
		onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	  }]
	})
	.state('weather', {
	  url: '/weather',
	  templateUrl: '/weather.html',
	  controller: 'RoyaCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	  }]
	})
	.state('forecast', {
	  url: '/forecast',
	  templateUrl: '/forecast.html',
	  controller: 'RoyaCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	  }]
	})
	.state('moon', {
	  url: '/moon',
	  templateUrl: '/moon.html',
	  controller: 'RoyaCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	  }]
	})
	.state('support', {
	  url: '/support',
	  templateUrl: '/support.html',
	  controller: 'SupportCtrl',
	  onEnter: ['$state', 'auth', 'socket', function($state, auth, socket){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	    var currentUser = auth.currentUser();
	    var data_server = {
		    from_id : currentUser
	    }
	    //console.log(data_server);
	    socket.emit('load msg',data_server);
	  }]
	})
	.state('profile', {
	  url: '/profile',
	  templateUrl: '/profile.html',
	  controller: 'ProfileCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	    var currentUser = auth.currentUser();
	    
	    
	  }]
	}).state('news', {
	  url: '/news',
	  templateUrl: '/news.html',
	  controller: 'NewsCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(!auth.isLoggedIn()){
	      $state.go('login');
	    }
	    var currentUser = auth.currentUser();
	    
	    
	  }],
	  resolve: {
	    postPromise: ['posts', function(posts){
	      return posts.getAll();
	    }]
  	   }
	});

  $urlRouterProvider.otherwise('home');
}]);

