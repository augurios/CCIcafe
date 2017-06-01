var global = {};
global.setting = {
    service: "http://icafe.centroclima.org/",
    //service: "http://localhost/",
    getServiceUrl: function () {
        return this.service;
    }
}