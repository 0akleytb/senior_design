
//https://addyosmani.com/blog/essential-js-namespacing/#beginners
var myApplication = myApplication = myApplication || {}

myApplication = {
    
    map: null,
    
    initMap: function() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: -34.397, lng: 150.644},
          zoom: 8
    });

    },
       
}