//JS

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


//Try later - Using Dropzones that append to fileList (array of files)
// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
  console.log("File API supported");
} else {
  alert('The File APIs are not fully supported in this browser.');
}


//Program Logic
var map;
function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
    });

    // var ctaLayer = new google.maps.KmlLayer({
    //     url: 'http://googlemaps.github.io/js-v2-samples/ggeoxml/cta.kml',
    //     map: map
    // });

    for(var i = 0, len = data_array.length; i < len; i++){
        addMarker2(data_array[i],map);
    }
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
            f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
            '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

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