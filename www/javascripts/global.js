var global = {};
global.setting = {
    service: "http://icafe.centroclima.org/",
    //service: "http://localhost/",
    getServiceUrl: function () {
        return this.service;
    }
}

var cordovita = {
    // Application Constructor
    initialize: function() {
	    console.log("cordovita init");
	    console.log("stats: ", window, cordova);	    
	    
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        cordovita.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);

        console.log('Received Event: ' + id);
    }
};