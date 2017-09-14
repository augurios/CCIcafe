app.controller('VisitaCtrl', [
'$http', '$scope', 'auth', 'unit', 'varieties', 'user', 'PouchDB', '$rootScope', 'onlineStatus','localStorageService','socket','mailer',
function ($http, $scope, auth, unit, varieties, user, PouchDB, $rootScope, onlineStatus, localStorageService, socket, mailer) {

    $scope.currentUser = auth.currentUser;
    $scope.searchmode = "Cedula"
   
    $scope.unitsToShow = [];
    $scope.currentUnit = null;
    $scope.NoUserUnit = false;
    $scope.isSearching = false;

    function isCharacterExist(n) {
        var isCharExist =false;
        for (var cnt = 0; cnt < n.length; cnt++) {
            var code = n.charCodeAt(cnt);
            if (code < 48 || code > 57) {
                if (code == 46) continue;
                else {
                    isCharExist = true;
                    break;
                }
            }
        }
        return isCharExist;
    }

    $scope.searchedUserId = "-1";
    $scope.searchUnit = function () {

        var searchVal = $("#searchtextbox").val();
        if (searchVal != "") {


            var searchType = $("input:radio[name ='inlineRadioOptions']:checked").val();
            if (searchType == "Cedula" && isCharacterExist(searchVal)) {
                $scope.CNTMSG = "Solo numeros en la cedula";
                return;
            }

            var searchObj = {
                searchType: searchType,
                searchValue: searchVal
            }

            $scope.isSearching = true;
            $scope.CNTMSG = "";
            $scope.unitsToShow = {};
            $scope.NoUserUnit = false;

            user.searchUserUnit(searchObj).then(function (response) {

                $scope.isSearching = false;
                console.log(response);
                if (response.errorCODE) {
                    $scope.CNTMSG = "nada!";
                }
                else {
                    $scope.searchedUserId = response._id;
                    if (response.units && response.units.length > 0) {
                        $scope.NoUserUnit = false;
                        $scope.CNTMSG = "Resultados";
                        console.log("from api");
                        $scope.unitsToShow = response;
                        console.log($scope.unitsToShow);
                    } else {
                        $scope.unitsToShow = response;
                        $scope.NoUserUnit = true;
                    }
                }

            });
        }
    }

    $scope.sendMail = function (mailRequest) {
        mailRequest.TO = "centroclimaorg@gmail.com";
        $scope.isEmailing = true;
        console.log("sentRecommendation button hit");
        mailer.sendMail({
            mailRequest: mailRequest
        }).then(function (result) {
            if (result.data.success)
                swal({
                    title: "",
                    text: "Recommendation sent successfully",
                    type: "success",
                    confirmButtonText: "Cool"
                });
            else
                swal({
                    title: "",
                    text: "Error sending in recommendation",
                    type: "error",
                    confirmButtonText: "Cool"
                });
        });
    }
    

    $scope.CNTMSG = "Busqueda de unidades por cedula o nombre de usuario";
    $scope.AddNewUnit = function () {
        console.log($("input:radio[name ='inlineRadioOptions']:checked").val());
        $scope.modalText = "Nueva Unidad";
        $scope.$broadcast('MANAGEUNIT', { unitId: -1, isOtherUser: true, isRecommendationFieldRequired: true, obj: $scope.unitsToShow });
        $("#myModal").modal('show');
    }

    $scope.openUnit = function (unit) {
        $scope.currentUnit = unit;
        $scope.unitopmessage = null
        $scope.modalText = "Editar: " + unit.nombre;
        $scope.$broadcast('MANAGEUNIT', { unitId: unit.PouchDBId, isOtherUser: true ,isRecommendationFieldRequired: false, obj: $scope.unitsToShow });
        $("#myModal").modal('show');
    }


    
    $scope.updateUnitForm = function () {
        if ($scope.updateunitFormlote.$valid) {
            unit.update($scope.editUnit._id, $scope.searchedUserId, $scope.editUnit).then(function (unitN) {
                //$scope.editUnit = {};
                console.log("return  updated data=" + JSON.stringify(unitN.data));
                $scope.editUnit = unitN.data;
                $scope.sucMsg = '¡Unidad Actualizada exitosamente!';
                $('#myModal3').hide();

                var html = "";
                for (var lotCounter = 0; lotCounter < $scope.editUnit.lote.length; lotCounter++) {
                    var lotObject = $scope.editUnit.lote[lotCounter];
                    if (lotCounter == 0) {
                        html += "<b>" + lotObject.nombre + " Recommnendation </b> :- " + lotObject.recommendation;
                    } else {
                        html += "<br/><br/>"
                        html += "<b>" + lotObject.nombre + " Recommnendation </b> :- " + lotObject.recommendation;
                    }
                }

                html += "<br/><br/>Coffe cloud Team";

                $scope.sendMail({
                    TO: $scope.unitsToShow.email,
                    SUBJECT: "Coffe cloud recomendacion | Unit -" + $scope.editUnit.nombre,
                    TEXT: "",
                    HTML: html//"<b>You recieved a recommendation on one of the unit, This is dummy test and has to change </b>"
                });
            });
        }
    }


    $('#myModal3').on('shown.bs.modal', function (e) {
        $('.collapse').collapse('hide');
    });
    $scope.openLotes = function (unit) {
        $scope.editUnit = unit;

        $scope.prependItem = function () {

            var newItem = {
                nombre: ""
            }


            $scope.editUnit.lote.push(newItem);

        };
    }

    $scope.$on('UNITADDED', function (e, args) {
        //var text = args.RecommendationText;
        //$("#myModal").modal('hide');
        //$scope.sendMail({
        //    TO: $scope.unitsToShow.email,
        //    SUBJECT: "Coffe cloud recomendacion | " + args.unit.nombre,
        //    TEXT: "",
        //    HTML: text //"<b>You recieved a recommendation on one of the unit, This is dummy test and has to change </b>"
        //});
        $("#myModal").modal('hide');
    });

    $scope.$on('UNITEDITED', function (e, args) {
        //var text = args.RecommendationText;
        //$("#myModal").modal('hide');
        //$scope.sendMail({
        //    TO: $scope.unitsToShow.email,
        //    SUBJECT: "Coffe cloud recomendacion | " + args.unit.nombre,
        //    TEXT: "",
        //    HTML: text//"<b>You recieved a recommendation on one of the unit, This is dummy test and has to change </b>"
        //});
        $("#myModal").modal('hide');
    });

    
       

    $scope.isEmailing = false;
    $scope.sentRecommendation = function () {
        $scope.isEmailing = true;
        console.log($scope.currentUnit.recommendation);
        console.log("sentRecommendation button hit");
        mailer.sendMail({ mailRequest: { TO: $scope.user.email, SUBJECT: "You recieved a recommendation  on unit", TEXT: "", HTML: "<b>You recieved a recommendation on one of the unit, This is dummy test and has to change </b>" } }).then(function (result) {
            $scope.isEmailing = false;
            $("#myModal").modal('hide');
            if (result.data.success)
                swal({
                    title: "",
                    text: "Recommendation sent successfully",
                    type: "success",
                    confirmButtonText: "Cool"
                });
            else
                swal({
                    title: "",
                    text: "Error sending in recommendation",
                    type: "error",
                    confirmButtonText: "Cool"
                }); 
        });
    }

    
    $scope.init = function () {
        // need to delete this line after full implementation
        //$scope.searchUnit();

        PouchDB.GetUserDataFromPouchDB(auth.userId()).then(function (result) {
            if (result.status == 'fail') {
                $scope.error = result.message;
            }
            else if (result.status == 'success') {
                $scope.user = result.data;
                console.log('user mode:', result.data);
            }
        });

        //unit.getUserUnit(auth.userId()).then(function (units) {
        //    console.log("from api");
        //    console.log(units);
        //});
    }

    $scope.init();

}]);