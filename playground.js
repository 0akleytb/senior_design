//Good Marker Info: https://developers.google.com/maps/documentation/javascript/markers
//Info Windows: https://developers.google.com/maps/documentation/javascript/examples/map-latlng-literal

var data_array = [
    {
        location: {lat: -34.397, lng: 150.544},
        speed: 158,
        temperature: 70,
        squeal: true
    },
    {
        location: {lat: -34.397, lng: 150.644},
        speed: 75,
        temperature: 50,
        squeal: false
    },
    {
        location: {lat: -34.397, lng: 150.744},
        speed: 55,
        temperature: 20,
        squeal: false
    },
    {
        location: {lat: -34.397, lng: 150.844},
        speed: 125,
        temperature: 90,
        squeal: true
    },
]


//Program Logic
var map;
function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 8
    });

    for(var i = 0, len = data_array.length; i < len; i++){
        addMarker2(data_array[i],map);
    }


}


function addMarker(location, map, data) {
    if (data.squeal == true){
        var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
    }
    else{
        var image = null;
    }

    var marker = new google.maps.Marker({
        position: location,
        //label: labels[labelIndex++ % labels.length],
        map: map,
        title: ObjToString(data),
        icon: image

        //if data.squeal === true then set marker options to show a special marker icon
    });
}

function ObjToString(object){

    var string = "";

    for(var key in object) {
        if(object.hasOwnProperty(key) && key != "location") {
            var value = object[key];
            string = string + key + ": " + value + "\n";
        }
    }

    return string;
}

//console.log(ObjToString(info2));


function addMarker2(data, map) {
    var location = data.location;

    if (data.squeal == true){
        var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
    }
    else{
        var image = null;
    }

    var marker = new google.maps.Marker({
        position: location,
        map: map,
        title: ObjToString(data),
        icon: image
    });
}