var app = angular.module('coffeeScript', ['btford.socket-io','ui.router','snap','luegg.directives','LocalStorageModule','ngSanitize','ngFileUpload','base64']);

app.config(['localStorageServiceProvider', function(localStorageServiceProvider){
  localStorageServiceProvider.setPrefix('ls');
}]);

app.config(function($httpProvider) {
    //Enable cross domain calls
    $httpProvider.defaults.useXDomain = true;
});

app.factory('PouchDB', ['$http','unit','auth','$q','$rootScope',function ($http,unit,auth,$q,$rootScope) {
	      var pouchDbFactory={};
				var localPouchDB=undefined;
			 	pouchDbFactory.CreatePouchDB= function()
				{
								localPouchDB =  new PouchDB('dummyDb')
								localPouchDB.info().then(function (details) {
								if(auth.isLoggedIn && auth.userId())
								{
											 console.log("sync local data to server");
											 if($rootScope.IsInternetOnline){
												 	pouchDbFactory.GetUserNotSyncUnitFromPouchDb(auth.userId());
											 }
								}
								}).catch(function (err) {
										console.log("Erro occured, Unable to create database");
								});
				}
				pouchDbFactory.GetUserDataFromPouchDB=function(userId){
							var result={
									status:'',
									data:{},
									message:''
								};
								var pouchPromise = localPouchDB.get(userId);
								return $q.when(pouchPromise).then(function(doc)
								{
															result.status='success';
															result.data=doc;
 															return result;
						    }).catch(function (err) {
											console.log(err);
											result.status='fail';
											result.message=err;
											return result;
									});
				} 
				pouchDbFactory.SaveUserDataToPouchDB=function(userData){
							var result={
									status:'',
									data:{},
									message:''
								};
								if(userData.data!=undefined && userData.data.userData )
								{
																		var element=userData.data.userData;
																		delete element["__v"];
																		element.type="User";
																		var pouchPromise = localPouchDB.get(element._id);
																		return $q.when(pouchPromise).then(function(doc){
																								doc.email=element.email;
																								doc.image=element.image;
																								doc.phone=element.role;
																								doc.salt=element.salt;
																								doc.type=element.type;
																								doc.units=element.units;
																								doc.username=element.username;
																								var UpdatePouchPromise=localPouchDB.put(doc);
																								return	$q.when(UpdatePouchPromise).then(function (res){
																								if(res && res.ok==true) 
																								{
																													console.log("user data updated");
																													result.status='success';
																													return result;
																								}
																								}).catch(function (err) {
																										console.log(err);
																										result.status='fail';
																										result.message=err;
																										return result;
																								});
																				}).catch(function (err) {
																							if(err.status==404){
																									return	localPouchDB.put(element).then(function () {
																													console.log("user data inserted");
																													result.status='success';
																													return result;
																											}).catch(function (err) {
																															result.status='fail';
																															result.message=err;
																															return result;
																											});
																							}
																								
																			});
								}
						
				}
				pouchDbFactory.SaveUserNotSyncUnitToPouchDB=function(userData){
					var deferred = $q.defer();
					var result={
							status:'',
							data:{},
							message:''
						};
						if(userData.data!=undefined && userData.data.units )
						{
							
							       var isError=false;
										 var message='';
											console.log("userData.data.units"+userData.data.units.length);
										 for(var i=0;i<userData.data.units.length;i++)
										 {
											 		console.log("inside foreach loop");
											 		var element=userData.data.units[i];
											 		var editUnit=element;
													delete element["__v"];
													  //element.isSync=true;
														element.type="Units";
														console.log(element._id+" pouch "+element.PouchDBId);
														if(element.PouchDBId && element.PouchDBId!=null && element.PouchDBId!=undefined){
															element._id=element.PouchDBId;
														}
														if(element._id==undefined){
															var dt=new Date();
															var documentId= dt.getFullYear().toString()+dt.getMonth().toString()+dt.getDate().toString()+dt.getHours().toString()+dt.getMinutes().toString()+dt.getSeconds().toString()+dt.getMilliseconds().toString();
															element._id=documentId;
														}
																	var pouchPromise = localPouchDB.get(element._id);
															    $q.when(pouchPromise).then(function(doc){
																						editUnit.isSync=true;
																						doc=editUnit;
																						var UpdatePouchPromise=localPouchDB.put(doc);
																						$q.when(UpdatePouchPromise).then(function (res){
																						if(res && res.ok==true) 
																						{
																											console.log("unit data updated ");
																											editUnit.isSync=true;
																											delete
																											unit.update(editUnit._id, auth.userId(), editUnit).then(function(unitN)
																											{
																													console.log("User unit updated to server="+editUnit._id);
																											});
																						}
																						}).catch(function (err) {
																								isError=true;
																								message=err;
																								console.log(err)
																						});
																		}).catch(function (err) {
																			console.log("error while finding"+err);
																					 if(err.status==404){
																								localPouchDB.put(element).then(function () {
																									  	console.log("unit inserted");
																											editUnit.isSync=true;
																											delete editUnit["_id"];
																											delete editUnit["type"];
																											unit.update(editUnit._id, auth.userId(), editUnit).then(function(unitN)
																											{
																													console.log("User unit updated to server="+editUnit._id);
																											});
																									}).catch(function (err) {
																									    	console.log(err);
																												message=err;
																												isError=true;
																									});
																					 }
																						
																	});	
										 }
										if(!isError)
										{
														result.status="success";
														result.message=message;
														deferred.resolve(result);
    												return deferred.promise;
													
										}
										else{
															result.status="success";
															deferred.resolve(result);
    											  	return deferred.promise;
										}
										
										
					  }
  			}
				pouchDbFactory.GetUserNotSyncUnitFromPouchDb	= function(userId)
				{
						var result={
							status:'',
							data:{},
							message:''
						};
						function mapFunctionTypeUnit(doc) {
							if((doc.isSync==false && doc.type=="Unit")){
									emit([doc._id,doc.isSync]);
							}
						}
						var pouchPromise = localPouchDB.query(mapFunctionTypeUnit,{include_docs: true});
						return $q.when(pouchPromise).then(function(recordList){
							 if(recordList)
							 {
											 					result.status='success';
																if(recordList.rows.length>0)
																{
																			for (i = 0; i < recordList.rows.length; i++) { 
																										var	element=recordList.rows[i].doc;
																										var documentId=recordList.rows[i].doc._id;
																										var documentRevKey=recordList.rows[i].doc._rev;
																											element.isSync=true;
																											delete element["_id"];
																											delete element["type"];
																											unit.SyncUserUnits(element,auth.userId()).error(function(error){
																													console.log(error);
																											}).then(function(data){
																													localPouchDB.get(documentId)
																													.then(function(doc){
																																				doc._rev=documentRevKey;
																																				doc.isSync=true;
																																				localPouchDB.put(doc);
																																			
																																				}).catch(function (err) {
																																							console.log(err);
																																				});
																													})
																													.catch(function (err) {
																																					console.log(err);
																													});
																			}
																}
																else{
																		result.data=[];
																}
																return result;

							 }
						}).catch(function (err) {
															result.status='fail';
															result.message=err;
															return result
						 });

				};
				pouchDbFactory.AddUnit	= function(newUnit,userId)
				{
						var result={
							status:'',
							data:{},
							message:''
						};
						var dt=new Date();
						var documentId= dt.getFullYear().toString()+dt.getMonth().toString()+dt.getDate().toString()+dt.getHours().toString()+dt.getMinutes().toString()+dt.getSeconds().toString()+dt.getMilliseconds().toString();
						newUnit._id=documentId;
						newUnit.isSync=false;
						newUnit.type="Unit";
						newUnit.user=userId;
						newUnit.PouchDBId=documentId;
						var pouchPromise = localPouchDB.put(newUnit);
						return $q.when(pouchPromise).then(function(data){
						if(data && data.ok==true)
						{
													result.status='success';
													result.data=newUnit;
													return result;
						}
						else{
													result.status='fail';
													result.message=data;
													return result
						}
						}).catch(function (err) {
															result.status='fail';
															result.message=err;
															return result
						});
				};
				pouchDbFactory.EditUnit	= function(editUnit,userId)
				{
						var result={
							status:'',
							data:{},
							message:''
						};
						editUnit.isSync=false;
						editUnit.type="Unit";
						editUnit.user=userId;
					  
						var pouchPromise = localPouchDB.get(editUnit._id);
						return $q.when(pouchPromise).then(function(doc){
													doc=editUnit;
													var UpdatePouchPromise=localPouchDB.put(doc);
													return $q.when(UpdatePouchPromise).then(function (res){
													if(res && res.ok==true) 
													{
																	  result.status='success';
																		result.data=editUnit;
																		return result;
													}
													else{
															result.status='fail';
															result.message=res;
															return result
													}
													}).catch(function (err) {
															result.status='fail';
															result.message=err;
															return result
													});
									}).catch(function (err) {
															result.status='fail';
															result.message=err;
															return result
							});

				}
				
			  pouchDbFactory.DeleteUnit	= function(unitId,userId)
				{
						var result={
							status:'',
							data:{},
							message:''
						};
						var pouchPromise = localPouchDB.get(unitId);
						return $q.when(pouchPromise).then(function(doc){
							if(doc)
							{						
													doc.isSync=false;
													//doc._deleted = true;
													doc.isDeleted=true;
													var deletePouchPromise=localPouchDB.put(doc);
													return $q.when(deletePouchPromise).then(function (res){
													if(res && res.ok==true) 
													{
																	  result.status='success';
																		return result;
													}
													else{
															result.status='fail';
															result.message=res;
															return result
													}
																	
														
													}).catch(function (err) {
															result.status='fail';
															result.message=err;
															return result
													});
							}
						});
				}
				pouchDbFactory.GetUnit	= function(unitId,userId)
				{
						var result={
							status:'',
							data:{},
							message:''
						};
						var pouchPromise = localPouchDB.get(unitId);
						return $q.when(pouchPromise).then(function(doc)
							{
									  if(doc)
										{
												 result.status='success';
												 result.data=doc;
												 return result;
																
										}
								}).catch(function (err) {
															result.status='fail';
															result.message=err;
															return result
													});
				}
				pouchDbFactory.GetAllUserUnit	= function(userId)
				{
						var result={
							status:'',
							data:{},
							message:''
						};
						function mapFunctionTypeUnit(doc) {
							if((doc.type=="Unit" && doc.isDeleted==false)){
									emit([doc._id,doc.isSync]);
							}
						}
						//var pouchPromise = localPouchDB.allDocs({include_docs: true,attachments: true,type:'Unit',user:userId});
						var pouchPromise = localPouchDB.query(mapFunctionTypeUnit,{include_docs: true});
						return $q.when(pouchPromise).then(function(recordList){
							 if(recordList)
							 {
											 					result.status='success';
																if(recordList.rows.length>0)
																{
																			result.data = recordList.rows.map(function (row) {
    																					return row.doc;
																			 });
																}
																else{
																		result.data=[];
																}
																return result;

							 }
						}).catch(function (err) {
															result.status='fail';
															result.message=err;
															return result
						 });

				};
			return pouchDbFactory;
}]);


//connection status factory

app.factory('onlineStatus', ["$window", "$rootScope", function ($window, $rootScope) {
    var onlineStatus = {};

    onlineStatus.onLine = $window.navigator.onLine;

    onlineStatus.isOnline = function() {
        return onlineStatus.onLine;
    }

    $window.addEventListener("online", function () {
        onlineStatus.onLine = true;
        $rootScope.$digest();
    }, true);

    $window.addEventListener("offline", function () {
        onlineStatus.onLine = false;
        $rootScope.$digest();
    }, true);

    return onlineStatus;
}]);

// Socket Factory service
app.factory('socket', ['socketFactory',
    function(socketFactory) {
        return socketFactory({
            prefix: '',
            ioSocket: io.connect('http://icafe.centroclima.org/')
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
'$timeout','PouchDB',
function($scope, $state, auth,$window,$timeout,PouchDB){
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
    }).then(function(data){
			//region added code for saving user data to pouchDB, after saving ***Note need to add code for sync all data too, move to home			
			PouchDB.SaveUserDataToPouchDB(data).then(function(result){
						if(result.status=='fail')
						{
								$scope.error = result.message;
								alert("Error occured while Sync, Error:"+result.message);
								$state.go('home');
						}
						else if(result.status=='success')
						{
							$state.go('home');
						}
				});
			// PouchDB.SaveUserDataToPouchDB(data).then(function(result){
			// 			if(result.status=='fail')
			// 			{
			// 					$scope.error = result.message;
			// 					alert("Error occured while Sync, Error:"+result.message);
			// 					$state.go('home');
			// 			}
			// 			else if(result.status=='success')
			// 			{
			// 				   PouchDB.SaveUserNotSyncUnitToPouchDB(data).then(function(result){
			// 							if(result.status=='fail')
			// 							{
			// 									$scope.error = result.message;
			// 									alert("Error occured while Sync, Error:"+result.message);
			// 									$state.go('home');
			// 							}
			// 							else if(result.status=='success')
			// 							{
			// 								$state.go('home');
			// 							}
			// 					});
			// 			}
			// 	});
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
'PouchDB','onlineStatus','user',
function($scope, $state, unit, auth, PouchDB, onlineStatus, user){
	$scope.user_Ided = auth.userId();
  $scope.newUnit = {
		PouchDBId:'',
		isSync:false,
		isDeleted:false,
	  sombra: true,
	  muestreo: false,
		muestreoMes:[],
	  fertilizaSuelo: false,
		fertilizaSueloMes:[],
	  fertilizaFollaje: false,
		fertilizaFollajeMes:[],
	  enmiendasSuelo: false,
		enmiendasSueloMes:[],
	  manejoTejido: false,
		manejoTejidoMes:[],
	  fungicidasRoya: true,
	  verificaAgua: false,
	  nitrogeno: false,
	  nitrorealiza: [],
	  sacos: '',
	  realizapoda: true,
	  realizamonth: '',
	  quetipo: '',
	  enfermedades: false,
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
	  	Catimor5175:false,
			Sarchimor:false,
			Anacafe14:false,
			Anacafe90:false,
			CostaRica95:false,
			Lempira:false,
			Obata:false,
			Catucai:false,
			HibridoH1:false,
			Marsellesa:false,
			Tupi:false,
			Parainema:false,
			CatuaiAmarillo:false,
			CatuaiRojo:false,
			Caturra:false,
			Pacamara:false,
			Pachecolis:false,
			Geisha:false,
			Bourbon:false,
			Pachecomun:false,
			Pacas:false,
			Robusta:false,
			MundoNovo:false,
			VillaSarchi:false,
			Maragogype:false,
			Typica:false,
			Maracaturra:false,
			Otra:false
	  },
		typeOfCoffeProducessOptionSelected:[],
	  fungicidas: {
		 contacto: false,
	   bourbon: false,
	   catuai: false,
		 biologico : false,
		 sistemico : false,
		 contactoOptionsMonths:{
        caldovicosa : '',
        caldobordeles:'',
        otrocual:'',
      },
		 contactoOptions:{
			 	caldovicosa:false,
		 		caldobordeles:false,
		 		otrocual:false,
		 },
		 
		 	biologicalOptionsMonths:{
			 	verticiliumlecanii:'',
		 		bacilussutillis:'',
		 		otrocual:'',
		 },
		 biologicalOptions:{
			 	verticiliumlecanii:false,
		 		bacilussutillis:false,
		 		otrocual:false,
		 },
		 sistemicoOptionsMonths:{
        opus:'',
        opera:'',
        esferamax:'',
        amistarxtra:'',
        alto10:'',
        silvacur:'',
        verdadero:'',
        otrocual:'',
        mancuerna:'',
        caporal:'',
        halt:'',
        astrostarxtra:'',
        tutela:'',
        halconextra:'',
        beken:'',
        estrobirulina:'',
        otro:'',
		 },
		 sistemicoOptions:{
			 opus:false,
			 opera:false,
			 esferamax:false,
			 amistarxtra:false,
			 alto10:false,
			 silvacur:false,
			 verdadero:false,
			 otrocual:false,
			 mancuerna:false,
			 caporal:false,
			 halt:false,
			 astrostarxtra:false,
			 tutela:false,
			 halconextra:false,
			 beken:false,
			 estrobirulina:false,
			 otro:false
		 }


	  },
	  verificaAguaTipo: {
		  ph: false,
		  dureza: false
	  },
	  rendimiento : '',
	  tipoCafe: {
		  estrictamenteDuro: true,
		  duro: false,
		  semiduro: false,
		  prime: false,
		  extraprime: false
		  },
	};
  
  $scope.MonthDropDownOptions=[
	  {name: 'Enero',displayValue: 'Enero'},
    {name: 'Febrero',displayValue: 'Febrero'},
    {name: 'Marzo',displayValue: 'Marzo'},
    {name: 'Abril',displayValue: 'Abril'},
    {name: 'Mayo',displayValue: 'Mayo'},
		{name: 'Junio',displayValue: 'Junio'},
		{name: 'Julio',displayValue: 'Julio'},
		{name: 'Agosto',displayValue: 'Agosto'},
		{name: 'Septiembre',displayValue: 'Septiembre'},
		{name: 'Octubre',displayValue: 'Octubre'},
		{name: 'Noviembre',displayValue: 'Noviembre'},
		{name: 'Diciembre',displayValue: 'Diciembre'}
		];
		
$scope.typesOfCoffeSelectionOptions=[
	  {name: 'EstrictamenteDuro',displayValue: 'Estrictamente Duro'},
    {name: 'Duro',displayValue: 'Duro'},
    {name: 'Semiduro',displayValue: 'Semiduro'},
    {name: 'Prime',displayValue: 'Prime'},
    {name: 'ExtraPrime',displayValue: 'ExtraPrime'}];

$scope.yesNoSelectionChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.fungicidas.contacto=false:$scope.editUnit.fungicidas.contacto=false;
	(type=="newUnit")?$scope.newUnit.fungicidas.bourbon=false:$scope.editUnit.fungicidas.bourbon=false;
	(type=="newUnit")?$scope.newUnit.fungicidas.catuai=false:$scope.editUnit.fungicidas.catuai=false;
	(type=="newUnit")?$scope.newUnit.fungicidas.sistemico=false:$scope.editUnit.fungicidas.sistemico=false;
	(type=="newUnit")?$scope.newUnit.fungicidas.biologico=false:$scope.editUnit.fungicidas.biologico=false;
	$scope.resetFungicidasSelection(type,true,true,true);
}
$scope.FungicidOptionsChange=function(type,optionType)
{
    switch (optionType) {
			case "contacto":
						  if($scope.newUnit.fungicidas.contacto==false){
								$scope.resetFungicidasSelection(type,true,false,false);
							}
				break;
			case "sistemico":
							if($scope.newUnit.fungicidas.sistemico==false){
								$scope.resetFungicidasSelection(type,false,false,true);
							}
				break;
			case "biologico":
							if($scope.newUnit.fungicidas.biologico==false){
								$scope.resetFungicidasSelection(type,false,true,false);
							}
				break;
			default:
				break;
		}
}
$scope.yesNoNitrogenoChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.quetipo='' : $scope.editUnit.quetipo= '';
	(type=="newUnit")?$scope.newUnit.nitrorealiza=[]:$scope.editUnit.nitrorealiza=[]
}
$scope.yesNoVerificiaAcquaChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.verificaAguaTipo.ph=false : $scope.editUnit.verificaAguaTipo.ph=false;
	(type=="newUnit")?$scope.newUnit.verificaAguaTipo.dureza=false:$scope.editUnit.verificaAguaTipo.dureza=false;
}
$scope.yesNomanejoTejidoChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.manejoTejidoMes=[] : $scope.editUnit.manejoTejidoMes=[]
}
$scope.yesNoenmiendasSueloChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.enmiendasSueloMes=[] : $scope.editUnit.enmiendasSueloMes=[]
}
$scope.yesNofertilizaFollajeChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.fertilizaFollajeMes=[] : $scope.editUnit.fertilizaFollajeMes=[]
}
$scope.yesNofertilizaSueloChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.fertilizaSueloMes=[] : $scope.editUnit.fertilizaSueloMes=[]
}
$scope.yesNomuestreoChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.muestreoMes=[] : $scope.editUnit.muestreoMes=[]
}

$scope.CheckboxBasedMonthChange=function(type,optionName)
{
	switch (optionName) {
		case 'contactoOptions.caldovicosa':
						(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.caldovicosa='' : $scope.editUnit.fungicidas.contactoOptionsMonths.caldovicosa='';
			break;
		case 'contactoOptions.caldobordeles':
						(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.caldobordeles='' : $scope.editUnit.fungicidas.contactoOptionsMonths.caldobordeles='';
			break;
		case 'contactoOptions.otrocual':
						(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.contactoOptionsMonths.otrocual='';
			break;
		case 'sistemicoOptions.opus':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.opus='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.opus='';
			break;
			case 'sistemicoOptions.opera':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.opera='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.opera='';
			break;
			case 'sistemicoOptions.esferamax':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.esferamax='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.esferamax='';
			break;			
			case 'sistemicoOptions.amistarxtra':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.amistarxtra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.amistarxtra='';
		  break;
			case 'sistemicoOptions.alto10':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.alto10='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.alto10='';
			break;
	    case 'sistemicoOptions.silvacur':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.silvacur='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.silvacur='';
			break;
			case 'sistemicoOptions.verdadero':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.verdadero='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.verdadero='';												
			break;
			case 'sistemicoOptions.otrocual':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.otrocual='';
			break;
			case 'sistemicoOptions.mancuerna':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.mancuerna='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.mancuerna='';
			break;			
			case 'sistemicoOptions.caporal':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.caporal='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.caporal='';
		  break;
			case 'sistemicoOptions.halt':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.halt='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.halt='';
			break;
	    case 'sistemicoOptions.astrostarxtra':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.astrostarxtra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.astrostarxtra='';
			break;
			case 'sistemicoOptions.tutela':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.tutela='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.tutela='';												
			break;
			case 'sistemicoOptions.halconextra':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.halconextra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.halconextra='';
		  break;
			case 'sistemicoOptions.beken':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.beken='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.beken='';
			break;
	    case 'sistemicoOptions.estrobirulina':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.estrobirulina='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.estrobirulina='';
			break;
			case 'sistemicoOptions.otro':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.otro='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.otro='';												
			break;
			case 'biologicalOptions.verticiliumlecanii':
						(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.verticiliumlecanii='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.verticiliumlecanii='';
			break;
	    case 'biologicalOptions.bacilussutillis':
						(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.bacilussutillis='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.bacilussutillis='';
			break;
			case 'biologicalOptions.otrocual':
						(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.otrocual='';												
			break;
	
		default:
			break;
	}
	
}

$scope.resetFungicidasSelection=function(type,isResetfungicidasContactoOptions,isResetfungicidasBiologicalOptions,isResetSistemicOptions){
	if(isResetfungicidasContactoOptions)
	{
			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptions.caldovicosa=false:$scope.editUnit.fungicidas.contactoOptions.caldovicosa=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptions.caldobordeles=false:$scope.editUnit.fungicidas.contactoOptions.caldobordeles=false;	
			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptions.otrocual=false:$scope.editUnit.fungicidas.contactoOptions.otrocual=false;

			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.caldovicosa='' :$scope.editUnit.fungicidas.contactoOptionsMonths.caldovicosa='';
			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.caldobordeles='' : $scope.editUnit.fungicidas.contactoOptionsMonths.caldobordeles='';
			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.contactoOptionsMonths.otrocual='';

  }
	if(isResetfungicidasBiologicalOptions)
	{
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptions.verticiliumlecanii=false:$scope.editUnit.fungicidas.biologicalOptions.verticiliumlecanii=false;	
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptions.bacilussutillis=false:$scope.editUnit.fungicidas.biologicalOptions.bacilussutillis=false;
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptions.otrocual=false:$scope.editUnit.fungicidas.biologicalOptions.otrocual=false;
			
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.verticiliumlecanii='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.verticiliumlecanii='';
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.bacilussutillis='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.bacilussutillis='';
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.otrocual='';

	}
	if(isResetSistemicOptions)
	{
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.opus=false:$scope.editUnit.fungicidas.sistemicoOptions.opus=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.opera=false:$scope.editUnit.fungicidas.sistemicoOptions.opera=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.esferamax=false:$scope.editUnit.fungicidas.sistemicoOptions.esferamax=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.amistarxtra=false:$scope.editUnit.fungicidas.sistemicoOptions.amistarxtra=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.alto10=false:$scope.editUnit.fungicidas.sistemicoOptions.alto10=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.silvacur=false:$scope.editUnit.fungicidas.sistemicoOptions.silvacur=false;	
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.verdadero=false:$scope.editUnit.fungicidas.sistemicoOptions.verdadero=false;	
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.otrocual=false:$scope.editUnit.fungicidas.sistemicoOptions.otrocual=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.mancuerna=false:$scope.editUnit.fungicidas.sistemicoOptions.mancuerna=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.caporal=false:$scope.editUnit.fungicidas.sistemicoOptions.caporal=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.halt=false:$scope.editUnit.fungicidas.sistemicoOptions.halt=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.astrostarxtra=false:$scope.editUnit.fungicidas.sistemicoOptions.astrostarxtra=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.tutela=false:$scope.editUnit.fungicidas.sistemicoOptions.tutela=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.halconextra=false:$scope.editUnit.fungicidas.sistemicoOptions.halconextra=false;	
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.beken=false:$scope.editUnit.fungicidas.sistemicoOptions.beken=false;	
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.estrobirulina=false:$scope.editUnit.fungicidas.sistemicoOptions.estrobirulina=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.otro=false:$scope.editUnit.fungicidas.sistemicoOptions.otro=false;

			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.opus='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.opus='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.opera='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.opera='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.esferamax='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.esferamax='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.amistarxtra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.amistarxtra='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.alto10='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.alto10='';
		  (type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.silvacur='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.silvacur='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.verdadero='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.verdadero='';												
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.otrocual='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.mancuerna='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.mancuerna='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.caporal='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.caporal='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.halt='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.halt='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.astrostarxtra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.astrostarxtra='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.tutela='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.tutela='';												
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.halconextra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.halconextra='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.beken='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.beken='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.estrobirulina='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.estrobirulina='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.otro='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.otro='';	

	}
}
  
  $( ".date-field" ).datepicker();
  $scope.onlineStatus = onlineStatus;
    
    $scope.$watch('onlineStatus.isOnline()', function(online) {
        $scope.online_status_string = online ? 'online' : 'offline';
        onlineStatus = $scope.online_status_string
        
    });
    
   if (onlineStatus) {
	    	
	    	user.get($scope.user_Ided).then(function(user){
				$scope.userO7 = user;
				
				
				
					//region to  get user unit from local PouchDB instead of server
			PouchDB.GetAllUserUnit(auth.userId()).then(function(result){
							if(result.status=='fail')
							{
									$scope.error = result.message;
							}
							else if(result.status=='success')
							{
								
								console.log($scope.userO7.units.length, result.data.length)
								if($scope.userO7.units.length === result.data.length){
									
									$scope.units = result.data;
									console.log('local mode:',result.data);
									
								} else {
									console.log('server mode:', $scope.userO7.units);
									$scope.units = $scope.userO7.units;
									$scope.remoteMode = true;
								}
								
								
							}
					});
			//endregion
				
			}); 
    	} else {
	    	
					//region to  get user unit from local PouchDB instead of server
			PouchDB.GetAllUserUnit(auth.userId()).then(function(result){
							if(result.status=='fail')
							{
									$scope.error = result.message;
							}
							else if(result.status=='success')
							{
								
								
									$scope.units = result.data;
									console.log('local mode:',result.data);
																
								
							}
					});
			//endregion
    	}
  
  $scope.saveUnit = function(){

		if ($scope.newunitForm.$valid) {
		/*For sync fied ,as new record will always have sync property false until it is' sync by local db' */
		
		/*Sync */

		$scope.newUnit.departamento = $("#departamentos option:selected").text();
		$scope.newUnit.municipio = $("#departamentos-munis option:selected").text();
		$scope.newUnit.lat = $('[name="lat"]').val();
		$scope.newUnit.lng = $('[name="lng"]').val();
		
			//Commented out as we need to add unit to pouchDB only,that will be sync to server
	   
    	
		if ($scope.remoteMode) {
			
		$scope.newUnit.isSync=true;	
		 unit.create($scope.newUnit,auth.userId()).error(function(error){
	       $scope.error = error;
	     }).then(function(data){
			 	console.log("mongoDB written data="+JSON.stringify(data.data));
			 	$scope.userO7.units.push(data.data);
			 	$state.go('home');
		    });
		} else {
			console.log('savelocal');
			$scope.newUnit.isSync=false;
			
			//region to create unit in local PouchDB instead of server
				PouchDB.AddUnit($scope.newUnit,auth.userId()).then(function(result){
						if(result.status=='fail')
						{
								$scope.error = result.message;
						}
						else if(result.status=='success')
						{
									delete result.data["type"];
									$scope.units.push(result.data)
									$state.go('home');
						}
				});
		//endregion
		}
		
		}
		
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
'PouchDB',
'onlineStatus',
function($scope, $state, auth, localStorageService, socket, unit, user, methods, roya, PouchDB, onlineStatus){
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

	$scope.$watch('onlineStatus.isOnline()', function(online) {
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
		
    if (onlineStatus) {
	    	
	    	user.get($scope.user_Ided).then(function(user){
				$scope.userO7 = user;
				
				
				
					//region to  get user unit from local PouchDB instead of server
			PouchDB.GetAllUserUnit(auth.userId()).then(function(result){
							if(result.status=='fail')
							{
									$scope.error = result.message;
							}
							else if(result.status=='success')
							{
								
								
								if($scope.userO7.units.length === result.data.length){
									
									$scope.units = result.data;
									console.log('local mode:',result.data);
									
								} else {
									console.log('server mode:', $scope.userO7.units);
									$scope.units = $scope.userO7.units;
									$scope.remoteMode = true;
								}
								
								
							}
					});
			//endregion
				
			}); 
    	} else {
	    	
					//region to  get user unit from local PouchDB instead of server
			PouchDB.GetAllUserUnit(auth.userId()).then(function(result){
							if(result.status=='fail')
							{
									$scope.error = result.message;
							}
							else if(result.status=='success')
							{
								
								
									$scope.units = result.data;
									console.log('local mode:',result.data);
																
								
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
'PouchDB',
'onlineStatus',
function($scope, $state, auth, localStorageService, socket, unit, user, methods, roya, PouchDB, onlineStatus){
  $scope.currentUser = auth.currentUser;
  var currentId = auth.currentUser();
  var testInStore = localStorageService.get('localTestgallo');
	$scope.IsErrorInfrmGalloAddPlanta=false;
	$scope.IsErrorInfrmGalloAddPlantaLeaf=false;
	$scope.IsErrorInfrmGalloAddPlantaLeafAffectedLeaf=false;
	$scope.IsTotalPlantaAdded=false;
	$scope.IsHideCloseAndAddPlantaButtonInPopup=false;
	$scope.user_Ided = auth.userId();

	$scope.modal={};
	$scope.modal.number="";
	$scope.modal.numberSubmitted=false;
	
	$scope.$watch('onlineStatus.isOnline()', function(online) {
        $scope.online_status_string = online ? 'online' : 'offline';
        onlineStatus = $scope.online_status_string
        
    });

  $scope.ClearTest = function(){
	  $scope.IsErrorInfrmGalloAddPlanta=false;
		$scope.IsErrorInfrmGalloAddPlantaLeaf=false;
		$scope.IsErrorInfrmGalloAddPlantaLeafAffectedLeaf=false;
		$scope.IsTotalPlantaAdded=false;
		$scope.IsHideCloseAndAddPlantaButtonInPopup=false;
  	localStorageService.remove('localTestgallo');
  	$state.go($state.current, {}, {reload: true})
  }
  var plantEditor = function(plant) {
	  $scope.plantname = plant;
	  $scope.leafList = $scope.test.plantas[plant - 1];
	  $scope.modal.number="";
		$scope.modal.numberSubmitted=false;
		$scope.affect = 1;
	  $('#plantModal').modal('show');
  };
    if (onlineStatus) {
	    	
	    	user.get($scope.user_Ided).then(function(user){
				$scope.userO7 = user;
				
				
				
					//region to  get user unit from local PouchDB instead of server
			PouchDB.GetAllUserUnit(auth.userId()).then(function(result){
							if(result.status=='fail')
							{
									$scope.error = result.message;
							}
							else if(result.status=='success')
							{
								
								
								if($scope.userO7.units.length === result.data.length){
									
									$scope.units = result.data;
									console.log('local mode:',result.data);
									
								} else {
									console.log('server mode:', $scope.userO7.units);
									$scope.units = $scope.userO7.units;
									$scope.remoteMode = true;
								}
								
								
							}
					});
			//endregion
				
			}); 
    	} else {
	    	
					//region to  get user unit from local PouchDB instead of server
			PouchDB.GetAllUserUnit(auth.userId()).then(function(result){
							if(result.status=='fail')
							{
									$scope.error = result.message;
							}
							else if(result.status=='success')
							{
								
								
									$scope.units = result.data;
									console.log('local mode:',result.data);
																
								
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
	
		$scope.IsHideCloseAndAddPlantaButtonInPopup=false;
		$scope.IsErrorInfrmGalloAddPlanta=false;
		$scope.IsErrorInfrmGalloAddPlantaLeafAffectedLeaf=false;
		$scope.IsErrorInfrmGalloAddPlantaLeaf=false;
		
		$('.severity-list').removeClass('active');
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
		$scope.IsErrorInfrmGalloAddPlanta=false;
		$scope.IsErrorInfrmGalloAddPlantaLeafAffectedLeaf=false;
		$scope.IsHideCloseAndAddPlantaButtonInPopup=false;
	  $scope.addPlant();
	}
	
	$scope.editPlant = function($index) {
		$('.severity-list').removeClass('active');
		$scope.IsErrorInfrmGalloAddPlanta=false;
		$scope.IsHideCloseAndAddPlantaButtonInPopup=false;
		$scope.IsErrorInfrmGalloAddPlantaLeaf=false;
		$scope.IsErrorInfrmGalloAddPlantaLeafAffectedLeaf=false;
		plantEditor($index + 1);
		$scope.leafList = $scope.test.plantas[$index];
	}
	
	$scope.initLeaf = function(number) {
		if(!$scope.frmGalloAddPlanta.$valid || number==undefined || number<1 || number>99 ){
			$scope.IsErrorInfrmGalloAddPlanta=true;
			return;
		}
		else{
				$scope.IsErrorInfrmGalloAddPlanta=false;
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
			if(!$scope.frmGalloAddPlantaAffectedLeaf.$valid){
					$scope.IsErrorInfrmGalloAddPlantaLeaf=true;
					$scope.IsErrorInfrmGalloAddPlantaLeafAffectedLeaf=false;
					return;
				}
				else{
						$scope.IsErrorInfrmGalloAddPlantaLeaf=false;
						$scope.modal.numberSubmitted=true;
				}
		}
		var amount = $('[name=amount]').val();
		if(isPrefixAddRequired)
		{
				if(severity>amount){
				$scope.IsErrorInfrmGalloAddPlantaLeafAffectedLeaf=true;
				return;
				}
				else{
					$scope.IsErrorInfrmGalloAddPlantaLeafAffectedLeaf=false;
				}
				severity='afectadas: ' + severity;
		}
		var plantIndex = $scope.plantname - 1;
	 

		$scope.test.plantas[plantIndex].push([amount,severity]);
		$scope.leafList = $scope.test.plantas[plantIndex];
		$('[name=amount]').val('');
		$scope.affect = 1;
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

app.controller('ProfileCtrl',['$http','$scope', 'auth', 'unit', 'user','PouchDB','$rootScope', 'onlineStatus',
function($http, $scope, auth, unit, user, PouchDB, $rootScope, onlineStatus){
	var map;
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.currentUser = auth.currentUser;
	$scope.userId = auth.userId;
	$scope.user_Ided = auth.userId();
	var userO = {};
	PouchDB.CreatePouchDB();
	
	$scope.onlineStatus = onlineStatus;
    
    $scope.$watch('onlineStatus.isOnline()', function(online) {
        $scope.online_status_string = online ? 'online' : 'offline';
        onlineStatus = $scope.online_status_string
        
    });
    
	$scope.newUnit = {
		PouchDBId:'',
		isSync:false,
		isDeleted:false,
	  sombra: false,
	  muestreo: false,
		muestreoMes:[],
	  fertilizaSuelo: false,
		fertilizaSueloMes:[],
	  fertilizaFollaje: false,
		fertilizaFollajeMes:[],
	  enmiendasSuelo: false,
		enmiendasSueloMes:[],
	  manejoTejido: false,
		manejoTejidoMes:[],
	  fungicidasRoya: false,
	  verificaAgua: false,
	  nitrogeno: false,
	  nitrorealiza: [],
	  sacos: '',
	  realizapoda: false,
	  realizamonth: '',
	  quetipo: '',
	  enfermedades: false,
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
	  	Catimor5175:false,
			Sarchimor:false,
			Anacafe14:false,
			Anacafe90:false,
			CostaRica95:false,
			Lempira:false,
			Obata:false,
			Catucai:false,
			HibridoH1:false,
			Marsellesa:false,
			Tupi:false,
			Parainema:false,
			CatuaiAmarillo:false,
			CatuaiRojo:false,
			Caturra:false,
			Pacamara:false,
			Pachecolis:false,
			Geisha:false,
			Bourbon:false,
			Pachecomun:false,
			Pacas:false,
			Robusta:false,
			MundoNovo:false,
			VillaSarchi:false,
			Maragogype:false,
			Typica:false,
			Maracaturra:false,
			Otra:false
	  },
		typeOfCoffeProducessOptionSelected:[],
	  fungicidas: {
		 contacto: false,
	   bourbon: false,
	   catuai: false,
		 biologico : false,
		 sistemico : false,
		 contactoOptionsMonths:{
        caldovicosa : '',
        caldobordeles:'',
        otrocual:'',
      },
		 contactoOptions:{
			 	caldovicosa:false,
		 		caldobordeles:false,
		 		otrocual:false,
		 },
		 
		 	biologicalOptionsMonths:{
			 	verticiliumlecanii:'',
		 		bacilussutillis:'',
		 		otrocual:'',
		 },
		 biologicalOptions:{
			 	verticiliumlecanii:false,
		 		bacilussutillis:false,
		 		otrocual:false,
		 },
		 sistemicoOptionsMonths:{
        opus:'',
        opera:'',
        esferamax:'',
        amistarxtra:'',
        alto10:'',
        silvacur:'',
        verdadero:'',
        otrocual:'',
        mancuerna:'',
        caporal:'',
        halt:'',
        astrostarxtra:'',
        tutela:'',
        halconextra:'',
        beken:'',
        estrobirulina:'',
        otro:'',
		 },
		 sistemicoOptions:{
			 opus:false,
			 opera:false,
			 esferamax:false,
			 amistarxtra:false,
			 alto10:false,
			 silvacur:false,
			 verdadero:false,
			 otrocual:false,
			 mancuerna:false,
			 caporal:false,
			 halt:false,
			 astrostarxtra:false,
			 tutela:false,
			 halconextra:false,
			 beken:false,
			 estrobirulina:false,
			 otro:false
		 }


	  },
	  verificaAguaTipo: {
		  ph: false,
		  dureza: false
	  },
	  rendimiento : '',
	  tipoCafe: {
		  estrictamenteDuro: true,
		  duro: false,
		  semiduro: false,
		  prime: false,
		  extraprime: false
		  },
	};
	$scope.MonthDropDownOptions=[
	  {name: 'Enero',displayValue: 'Enero'},
    {name: 'Febrero',displayValue: 'Febrero'},
    {name: 'Marzo',displayValue: 'Marzo'},
    {name: 'Abril',displayValue: 'Abril'},
    {name: 'Mayo',displayValue: 'Mayo'},
		{name: 'Junio',displayValue: 'Junio'},
		{name: 'Julio',displayValue: 'Julio'},
		{name: 'Agosto',displayValue: 'Agosto'},
		{name: 'Septiembre',displayValue: 'Septiembre'},
		{name: 'Octubre',displayValue: 'Octubre'},
		{name: 'Noviembre',displayValue: 'Noviembre'},
		{name: 'Diciembre',displayValue: 'Diciembre'}
		];
	$scope.initNewUnit=angular.copy($scope.newUnit);

	$scope.editUnit = angular.copy($scope.newUnit);
  
  $scope.ResetNewUnit=function(){
	 $scope.newUnit=angular.copy($scope.initNewUnit);
 }

$scope.typesOfCoffeSelectionOptions=[
	  {name: 'EstrictamenteDuro',displayValue: 'Estrictamente Duro'},
    {name: 'Duro',displayValue: 'Duro'},
    {name: 'Semiduro',displayValue: 'Semiduro'},
    {name: 'Prime',displayValue: 'Prime'},
    {name: 'ExtraPrime',displayValue: 'ExtraPrime'}];

$scope.yesNoSelectionChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.fungicidas.contacto=false:$scope.editUnit.fungicidas.contacto=false;
	(type=="newUnit")?$scope.newUnit.fungicidas.bourbon=false:$scope.editUnit.fungicidas.bourbon=false;
	(type=="newUnit")?$scope.newUnit.fungicidas.catuai=false:$scope.editUnit.fungicidas.catuai=false;
	(type=="newUnit")?$scope.newUnit.fungicidas.sistemico=false:$scope.editUnit.fungicidas.sistemico=false;
	(type=="newUnit")?$scope.newUnit.fungicidas.biologico=false:$scope.editUnit.fungicidas.biologico=false;
	$scope.resetFungicidasSelection(type,true,true,true);
}
$scope.FungicidOptionsChange=function(type,optionType)
{
    switch (optionType) {
			case "contacto":
						  if($scope.newUnit.fungicidas.contacto==false){
								$scope.resetFungicidasSelection(type,true,false,false);
							}
				break;
			case "sistemico":
							if($scope.newUnit.fungicidas.sistemico==false){
								$scope.resetFungicidasSelection(type,false,false,true);
							}
				break;
			case "biologico":
							if($scope.newUnit.fungicidas.biologico==false){
								$scope.resetFungicidasSelection(type,false,true,false);
							}
				break;
			default:
				break;
		}
}
$scope.yesNoNitrogenoChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.quetipo='' : $scope.editUnit.quetipo= '';
	(type=="newUnit")?$scope.newUnit.nitrorealiza=[]:$scope.editUnit.nitrorealiza=[]
}
$scope.yesNoVerificiaAcquaChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.verificaAguaTipo.ph=false : $scope.editUnit.verificaAguaTipo.ph=false;
	(type=="newUnit")?$scope.newUnit.verificaAguaTipo.dureza=false:$scope.editUnit.verificaAguaTipo.dureza=false;
}
$scope.yesNomanejoTejidoChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.manejoTejidoMes=[] : $scope.editUnit.manejoTejidoMes=[]
}
$scope.yesNoenmiendasSueloChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.enmiendasSueloMes=[] : $scope.editUnit.enmiendasSueloMes=[]
}
$scope.yesNofertilizaFollajeChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.fertilizaFollajeMes=[] : $scope.editUnit.fertilizaFollajeMes=[]
}
$scope.yesNofertilizaSueloChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.fertilizaSueloMes=[] : $scope.editUnit.fertilizaSueloMes=[]
}
$scope.yesNomuestreoChange=function(type)
{
	(type=="newUnit")?$scope.newUnit.muestreoMes=[] : $scope.editUnit.muestreoMes=[]
}

$scope.CheckboxBasedMonthChange=function(type,optionName)
{
	switch (optionName) {
		case 'contactoOptions.caldovicosa':
						(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.caldovicosa='' : $scope.editUnit.fungicidas.contactoOptionsMonths.caldovicosa='';
			break;
		case 'contactoOptions.caldobordeles':
						(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.caldobordeles='' : $scope.editUnit.fungicidas.contactoOptionsMonths.caldobordeles='';
			break;
		case 'contactoOptions.otrocual':
						(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.contactoOptionsMonths.otrocual='';
			break;
		case 'sistemicoOptions.opus':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.opus='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.opus='';
			break;
			case 'sistemicoOptions.opera':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.opera='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.opera='';
			break;
			case 'sistemicoOptions.esferamax':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.esferamax='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.esferamax='';
			break;			
			case 'sistemicoOptions.amistarxtra':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.amistarxtra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.amistarxtra='';
		  break;
			case 'sistemicoOptions.alto10':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.alto10='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.alto10='';
			break;
	    case 'sistemicoOptions.silvacur':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.silvacur='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.silvacur='';
			break;
			case 'sistemicoOptions.verdadero':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.verdadero='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.verdadero='';												
			break;
			case 'sistemicoOptions.otrocual':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.otrocual='';
			break;
			case 'sistemicoOptions.mancuerna':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.mancuerna='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.mancuerna='';
			break;			
			case 'sistemicoOptions.caporal':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.caporal='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.caporal='';
		  break;
			case 'sistemicoOptions.halt':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.halt='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.halt='';
			break;
	    case 'sistemicoOptions.astrostarxtra':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.astrostarxtra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.astrostarxtra='';
			break;
			case 'sistemicoOptions.tutela':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.tutela='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.tutela='';												
			break;
			case 'sistemicoOptions.halconextra':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.halconextra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.halconextra='';
		  break;
			case 'sistemicoOptions.beken':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.beken='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.beken='';
			break;
	    case 'sistemicoOptions.estrobirulina':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.estrobirulina='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.estrobirulina='';
			break;
			case 'sistemicoOptions.otro':
						(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.otro='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.otro='';												
			break;
			case 'biologicalOptions.verticiliumlecanii':
						(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.verticiliumlecanii='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.verticiliumlecanii='';
			break;
	    case 'biologicalOptions.bacilussutillis':
						(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.bacilussutillis='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.bacilussutillis='';
			break;
			case 'biologicalOptions.otrocual':
						(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.otrocual='';												
			break;
	
		default:
			break;
	}
	
}

$scope.resetFungicidasSelection=function(type,isResetfungicidasContactoOptions,isResetfungicidasBiologicalOptions,isResetSistemicOptions){
	if(isResetfungicidasContactoOptions)
	{
			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptions.caldovicosa=false:$scope.editUnit.fungicidas.contactoOptions.caldovicosa=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptions.caldobordeles=false:$scope.editUnit.fungicidas.contactoOptions.caldobordeles=false;	
			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptions.otrocual=false:$scope.editUnit.fungicidas.contactoOptions.otrocual=false;

			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.caldovicosa='' :$scope.editUnit.fungicidas.contactoOptionsMonths.caldovicosa='';
			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.caldobordeles='' : $scope.editUnit.fungicidas.contactoOptionsMonths.caldobordeles='';
			(type=="newUnit")?$scope.newUnit.fungicidas.contactoOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.contactoOptionsMonths.otrocual='';

  }
	if(isResetfungicidasBiologicalOptions)
	{
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptions.verticiliumlecanii=false:$scope.editUnit.fungicidas.biologicalOptions.verticiliumlecanii=false;	
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptions.bacilussutillis=false:$scope.editUnit.fungicidas.biologicalOptions.bacilussutillis=false;
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptions.otrocual=false:$scope.editUnit.fungicidas.biologicalOptions.otrocual=false;
			
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.verticiliumlecanii='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.verticiliumlecanii='';
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.bacilussutillis='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.bacilussutillis='';
		(type=="newUnit")?$scope.newUnit.fungicidas.biologicalOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.biologicalOptionsMonths.otrocual='';

	}
	if(isResetSistemicOptions)
	{
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.opus=false:$scope.editUnit.fungicidas.sistemicoOptions.opus=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.opera=false:$scope.editUnit.fungicidas.sistemicoOptions.opera=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.esferamax=false:$scope.editUnit.fungicidas.sistemicoOptions.esferamax=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.amistarxtra=false:$scope.editUnit.fungicidas.sistemicoOptions.amistarxtra=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.alto10=false:$scope.editUnit.fungicidas.sistemicoOptions.alto10=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.silvacur=false:$scope.editUnit.fungicidas.sistemicoOptions.silvacur=false;	
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.verdadero=false:$scope.editUnit.fungicidas.sistemicoOptions.verdadero=false;	
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.otrocual=false:$scope.editUnit.fungicidas.sistemicoOptions.otrocual=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.mancuerna=false:$scope.editUnit.fungicidas.sistemicoOptions.mancuerna=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.caporal=false:$scope.editUnit.fungicidas.sistemicoOptions.caporal=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.halt=false:$scope.editUnit.fungicidas.sistemicoOptions.halt=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.astrostarxtra=false:$scope.editUnit.fungicidas.sistemicoOptions.astrostarxtra=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.tutela=false:$scope.editUnit.fungicidas.sistemicoOptions.tutela=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.halconextra=false:$scope.editUnit.fungicidas.sistemicoOptions.halconextra=false;	
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.beken=false:$scope.editUnit.fungicidas.sistemicoOptions.beken=false;	
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.estrobirulina=false:$scope.editUnit.fungicidas.sistemicoOptions.estrobirulina=false;
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptions.otro=false:$scope.editUnit.fungicidas.sistemicoOptions.otro=false;

			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.opus='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.opus='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.opera='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.opera='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.esferamax='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.esferamax='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.amistarxtra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.amistarxtra='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.alto10='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.alto10='';
		  (type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.silvacur='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.silvacur='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.verdadero='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.verdadero='';												
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.otrocual='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.otrocual='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.mancuerna='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.mancuerna='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.caporal='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.caporal='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.halt='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.halt='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.astrostarxtra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.astrostarxtra='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.tutela='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.tutela='';												
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.halconextra='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.halconextra='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.beken='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.beken='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.estrobirulina='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.estrobirulina='';
			(type=="newUnit")?$scope.newUnit.fungicidas.sistemicoOptionsMonths.otro='' : $scope.editUnit.fungicidas.sistemicoOptionsMonths.otro='';	

	}
}
  //Commented out as we need to read data from pouchDB only
	//  user.get($scope.user_Ided).then(function(user){
	//   console.log("get called");
	//   $scope.userO7 = user;console.log('server:', $scope.userO7.units);
	//   $scope.units = $scope.userO.units;
    // }); 
    
    	PouchDB.GetUserDataFromPouchDB(auth.userId()).then(function(result){
					if(result.status=='fail')
						{
								$scope.error = result.message;
						}
						else if(result.status=='success')
						{
								 $scope.userO = result.data;
								 
						}
		});
    
    
    	if (onlineStatus) {
	    	
	    	console.log('app online');
	    	user.get($scope.user_Ided).then(function(user){
				$scope.userO7 = user;
				
				
				
					//region to  get user unit from local PouchDB instead of server
			PouchDB.GetAllUserUnit(auth.userId()).then(function(result){
							if(result.status=='fail')
							{
									$scope.error = result.message;
							}
							else if(result.status=='success')
							{
								
								
								if($scope.userO7.units.length === result.data.length){
									
									$scope.units = result.data;
									console.log('local mode:',result.data);
									
								} else {
									console.log('server mode:', $scope.userO7.units);
									$scope.units = $scope.userO7.units;
									$scope.remoteMode = true;
								}
								
								
							}
					});
			//endregion
				
			}); 
    	} else {
	    	console.log('app offline');
					//region to  get user unit from local PouchDB instead of server
			PouchDB.GetAllUserUnit(auth.userId()).then(function(result){
							if(result.status=='fail')
							{
									$scope.error = result.message;
							}
							else if(result.status=='success')
							{
								
								
									$scope.units = result.data;
									console.log('local mode:',result.data);
																
								
							}
					});
			//endregion
    	}
		
		
		



	  var spanishDateTimePickerOption = {
        closeText:"Cerrar",prevText:"&#x3C;Ant",nextText:"Sig&#x3E;",currentText:"Hoy",monthNames:["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],monthNamesShort:["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],dayNames:["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],dayNamesShort:["dom","lun","mar","mié","jue","vie","sáb"],dayNamesMin:["D","L","M","X","J","V","S"],weekHeader:"Sm",firstDay:1,isRTL:!1,showMonthAfterYear:!1,yearSuffix:""
    }
    $( ".date-field" ).datepicker(spanishDateTimePickerOption);
    
    // $scope.update = function(){
    // user.update($scope.userO).error(function(error){
	  //     $scope.error = error;
	  //   }).then(function(data){
	  //     $scope.message = data.data.message;
	  //   });
	  // };
	$scope.deleteUnit = function(e,id,index) {
		
		
		if ($scope.remoteMode) {
			unit.deleteUnit(id, auth.userId()).then(function(user){
		 		$scope.userO.units.splice(index, 1);
		 		$scope.units.splice(index, 1);
		  	});
		} else {
			//region to delete units in local PouchDB instead of server
	  	PouchDB.DeleteUnit(id,auth.userId()).then(function(result){
	    	console.log("\n result deleted="+JSON.stringify(result));
	    		if(result.status=='fail')
	    		{
	    				$scope.error = result.message;
	    				console.log($scope.error);
	    		}
	    		else if(result.status=='success')
	    		{
	    				$scope.units.splice(index, 1);
	    		}
	    });
		//endregion
		}
		
				
		

	}
	
	$scope.updateUnit = function(e,id) {
		
		$scope.sucMsg = null;
		//Commented out as we need to update data from pouchDB only,that will be sync to server
		if ($scope.remoteMode) {
		 unit.get(auth.userId(),id).then(function(unitD){
		 	$scope.editUnit = unitD;
		 	$scope.updateUnitForm = function(){
		 		if ($scope.updateunitForm.$valid) {
		 		/*For sync fied ,as new record will always have sync property false until it is' sync by local db' */
		 			$scope.editUnit.isSync=false;
		 		/*Sync */
		 			unit.update(id, auth.userId(), $scope.editUnit).then(function(unitN){
		 				user.get($scope.user_Ided).then(function(user){
		 					 $scope.userO = user;
		 					 $scope.units = $scope.userO.units;
		 			    });
		 				$scope.editUnit={};
		 				console.log("return  updated data="+JSON.stringify(unitN.data));	
		 				$scope.editUnit = unitN.data;
		 				$scope.sucMsg = '¡Unidad Actualizada exitosamente!';
		 			});
		 		}
		 	}
		 });
		 } else {
			 //region to get unit from local PouchDB instead of server
				PouchDB.GetUnit(id, auth.userId()).then(function(result)
				{
								if(result.status=='fail')
								{
										$scope.error = result.message;
								}
								else if(result.status=='success')
								{
											$scope.editUnit = result.data;
								}
				});
		 }
				
	}
		$scope.updateUnitForm = function()
		{
				
				if ($scope.updateunitForm.$valid) {

				//Commented out as we need to update data from pouchDB only,that will be sync to server
				/*For sync fied ,as new record will always have sync property false until it is' sync by local db' */
					$scope.editUnit.isSync=false;
				/*Sync */
					if ($scope.remoteMode) {
					 unit.update(id, auth.userId(), $scope.editUnit).then(function(unitN){
					 	user.get($scope.user_Ided).then(function(user){
					 		 $scope.userO = user;
					 		 $scope.units = $scope.userO.units;
					     });
					 	$scope.editUnit={};
					 	console.log("return  updated data="+JSON.stringify(unitN.data));	
					 	$scope.editUnit = unitN.data;
					 	$scope.sucMsg = '¡Unidad Actualizada exitosamente!';
					 });

						
						} else {
							//region to update data in local PouchDB instead , that will be sync to server
					PouchDB.EditUnit($scope.editUnit,auth.userId()).then(function(result)
							{
										if(result.status=='fail')
										{
												$scope.error = result.message;
										}
										else if(result.status=='success')
										{
													$scope.editUnit = result.data;
													$scope.sucMsg = '¡Unidad Actualizada exitosamente!';
													console.log(result.data)
													for(var i=0 ; i< $scope.units.length; i++)
													{
															if( $scope.units[i]._id==$scope.editUnit._id)
															{
																	$scope.units[i]=$scope.editUnit;
																	break;
															}
													}
										}
						});
						}
							
				
				}
  }
	
	$scope.saveUnit = function(){

		if ($scope.newunitForm.$valid) {
		/*For sync fied ,as new record will always have sync property false until it is' sync by local db' */
		
		/*Sync */

		$scope.newUnit.departamento = $("#departamentos option:selected").text();
		$scope.newUnit.municipio = $("#departamentos-munis option:selected").text();
		$scope.newUnit.lat = $('[name="lat"]').val();
		$scope.newUnit.lng = $('[name="lng"]').val();
		
			//Commented out as we need to add unit to pouchDB only,that will be sync to server
			
		if ($scope.remoteMode) {
			
		$scope.newUnit.isSync=true;	
		 unit.create($scope.newUnit,auth.userId()).error(function(error){
	       $scope.error = error;
	     }).then(function(data){
			 	console.log("mongoDB written data="+JSON.stringify(data.data));
			 	$scope.userO7.units.push(data.data);
			 	$('#myModal2').modal('hide');
			 			$scope.ResetNewUnit();
		    });
		} else {
			console.log('savelocal');
			$scope.newUnit.isSync=false;
			
			//region to create unit in local PouchDB instead of server
				PouchDB.AddUnit($scope.newUnit,auth.userId()).then(function(result){
						if(result.status=='fail')
						{
								$scope.error = result.message;
						}
						else if(result.status=='success')
						{
									delete result.data["type"];
									$scope.units.push(result.data)
									$('#myModal2').modal('hide');
									$scope.ResetNewUnit();
									PouchDB.CreatePouchDB();
						}
				});
		//endregion
		}
		
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
		console.log($rootScope.IsInternetOnline)
		if($rootScope.IsInternetOnline){
				initialize();
		}
	
	}
	console.log($scope.units);

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

  /* for sync data */
		o.getUserNotSyncUnit = function(userId){
						return $http.get('https://icafe.centroclima.org/getUserNotSyncUnits/'+ userId +'/units', {
						headers: {Authorization: 'Bearer '+auth.getToken()}
						}).success(function(data){
									return data;
						});
		 };

		o.SyncUserUnits = function(unit, id){
							return $http.post('https://icafe.centroclima.org/SyncUserUnits/'+ id +'/units', unit,{
									headers: {Authorization: 'Bearer '+auth.getToken()}
							}).success(function(data){
									return data;
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
app.run(function($rootScope,$window){
	
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
		//code added for internet availability		
		$rootScope.IsInternetOnline = navigator.onLine;		
		$window.addEventListener("offline", function () {
        $rootScope.$apply(function() {
          $rootScope.IsInternetOnline = false;
        });
      }, false);
      $window.addEventListener("online", function () {
        $rootScope.$apply(function() {
          $rootScope.IsInternetOnline = true;
        });
      }, false);

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
	  /*resolve: {
	    postPromise: ['posts', function(posts){
	      return posts.getAll();
	    }]
  	   }*/
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

