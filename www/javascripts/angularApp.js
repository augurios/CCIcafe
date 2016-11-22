var app = angular.module('coffeeScript', ['btford.socket-io','ui.router','snap','luegg.directives','LocalStorageModule','ngSanitize']);

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
            ioSocket: io.connect('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000')
        });
    }
]);

app.controller('MainCtrl',['$scope','posts', 'auth',
function($scope, posts, auth){
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.currentUser = auth.currentUser;
	
	
}]);
app.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
function($scope, posts, post, auth){
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
function($scope, $state, auth){
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



    tempEstanions= $scope.dosage.litersByHa/200;


    $scope.dosage.estanionByHa = parseFloat(tempEstanions).toFixed(2);

    $scope.dosage.dosageByEstanion = ($scope.dosage.ProductDosage/$scope.dosage.litersByHa)*200;

  }


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
app.controller('SupportCtrl',['$scope','auth', 'socket', 'user',
function ($scope, auth, socket, user) {

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

	
	$scope.sendMessage = function() {
		var f = $('.type-sink');
        var msg = f.find('[name=chatMsg]').val();
        var from_id = f.find('[name=fromId]').val();
		var data_server={
            message:msg,
            to_user:'admin',
            from_id:from_id
        };
        socket.emit('get msg',data_server);
        $('.type-sink .form-control').val("");
	};
	socket.on('set msg only',function(data){
        data=JSON.parse(data);
        var user = data.sender;
        if (user == $scope.loggedUser) {
            $scope.setCurrentUserImage(data.messages);
	        $scope.$apply();
	    }
    });
	socket.on('set msg',function(data){
        data=JSON.parse(data);
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
	$scope.editUnit = {};
	user.get($scope.user_Ided).then(function(user){
		 $scope.userO = user;
		 $scope.units = $scope.userO.units;
    });
    $( ".date-field" ).datepicker();
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
}]);

app.controller('CampoCtrl', [
	'$scope',
	'auth',
	'$location',
	'campoService',
	'$window',
    'user',
	function ($scope, auth, $location, campo,  $window, user) { 
	    var currentTest = null;
	  
	    var loadAll = function () {

	    	campo.get().then(function (campo) {
		    	$scope.testsList = campo.data;
	            $scope.currentPage = 1;
	            $scope.pageSize = 9;
	            $scope.noOfPages = Math.ceil($scope.testsList / $scope.pageSize);
	            $scope.totalItems = $scope.testsList.length;
		    })

		    $scope.saveTable = function () {
		        campo.create($scope.campodata);
		    };
	        
	    };

	    loadAll();
	    $(".date-field").datepicker();

	    $scope.head = {
	        createdAt: "Fecha",
	        bandolas: "Bandolas",
	        chasparria: "Chasparria",
	        frutosnudo5: "Frutos nudo 5",
	        frutosnudo6: "Frutos nudo 6",
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

	        $('#detailModalCampo').modal('show');

	    }

	    $scope.removeTest = function (id) {

	    }
	    $scope.exportData = function () {
	        var table = document.getElementById('exportable');
	        var html = table.outerHTML;
	        window.open('data:application/vnd.ms-excel,' + encodeURIComponent(html));
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

app.factory('posts', ['$http', 'auth', function($http, auth){
	  var o = {
	  		posts : []
	  };
	  o.getAll = function() {
	    return $http.get('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/posts').success(function(data){
	      angular.copy(data, o.posts);
	    });
	  };
	  o.create = function(post) {
		  return $http.post('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/posts', post, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
		    o.posts.push(data);
		  });
		};
		o.upvote = function(post) {
		  return $http.put('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/posts/' + post._id + '/upvote', null, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  })
		    .success(function(data){
		      post.upvotes += 1;
		    });
		};
		o.get = function(id) {
		  return $http.get('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/posts/' + id).then(function(res){
		    return res.data;
		  });
		};
		o.addComment = function(id, comment) {
		  return $http.post('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/posts/' + id + '/comments', comment, {
		    headers: {Authorization: 'Bearer '+auth.getToken()}
		  });
		};
		o.upvoteComment = function(post, comment) {
		  return $http.put('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
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
		  return $http.get('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/users', {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).then(function(res){
		    return res.data;
		  });
		};
		o.get = function(id) {
		  return $http.get('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/users/' + id).then(function(res){
		    return res.data;
		  });
		};
		
		o.update = function(user){
	  return $http.put('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/users/' + user._id, user, {
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
	  return $http.post('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/register', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};

	auth.logIn = function(user){
	  return $http.post('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/login', user).success(function(data){
	    auth.saveToken(data.token);
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
	    return $http.get('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/users/'+ id +'/units').success(function(data){
	      return data;
	    });
	  };
   o.get = function(userId,id) {
		  return $http.get('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/users/'+ userId +'/units/'+ id).then(function(res){
		    return res.data;
		  });
		};
   
	o.create = function(unit, id){
	  return $http.post('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/users/'+ id +'/units', unit, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
		    return data;
		  });
	};
	
	o.update = function(unit, id, unitData){
	  return $http.put('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/users/'+ id +'/units/'+ unit, unitData, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
	    return data
	  });
	};
	
	o.deleteUnit = function(unitId, userId){
	  return $http.delete('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/users/'+ userId +'/units/'+ unitId, {
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
	    return $http.get('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/admin/methods/').success(function(data){
	      return data;
	    });
	  };
	  o.create = function(method) {
		  return $http.post('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/admin/methods', method, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
		    return data;
		  });
		};
		o.update = function(method) {
		  return $http.put('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/admin/methods', method, {
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
        return $http.get('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/admin/campo/').success(function (data) {
            return data;
        });
    };
    o.create = function (method) {
        return $http.post('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/admin/campo', method, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data;
        });
    };
    o.update = function (method) {
        return $http.put('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/admin/methods', method, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            return data;
        });
    };

    return o;
}]);

app.factory('roya', ['$http', 'auth', function($http, auth){
	  var o = {
	  		
	  };
	  o.getAll = function() {
	    return $http.get('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/roya').success(function(data){
	      return data;
	    });
	  };
	  o.create = function(roya) {
		 return $http.post('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/roya', roya, {
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
	    return $http.get('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/gallo').success(function(data){
	      return data;
	    });
	  };
	  o.create = function(gallo) {
		 return $http.post('http://ec2-35-162-54-166.us-west-2.compute.amazonaws.com:3000/gallo', gallo, {
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

