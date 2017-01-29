//JS

//Good Marker Info: https://developers.google.com/maps/documentation/javascript/markers
//Info Windows: https://developers.google.com/maps/documentation/javascript/examples/map-latlng-literal
//Info Window on lat/lng itself: https://developers.google.com/maps/documentation/javascript/infowindows
//Consider using info windows on lat/lng + kml overlay

//TO DO: FIX UPDATE SO THAT WHEN MARKERS ARE ADDED THE MAP'S VIEW FOCUS (CENTER) MOVED THERE.
//TO DO: FILL OUT LOREM IPSUM INSTRUCTIONS. FIX CONTROLS COLOUM SO THAT IT ALSO TAKES 90% OF VIEW HEIGHT.

var model = {
    display_squeal: false,
    something: true,
    map: null,
    markers: [],
    squeal_image: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
    no_squeal_image: null, //null results in regular google marker
    data_order: ["lat","lng","pressure","temperature","squeal"],
    data_array: []
}

function init(){ //Create function
    model.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -34.397, lng: 150.644},
      zoom: 8
    });

    //Add event listeners
    document.getElementById("go_button").addEventListener("click", updateMap)
    document.getElementById("clear_button").addEventListener("click", clearMap)
    document.getElementById('files').addEventListener('change', showFiles, false);
    // document.getElementById("squeal_button").addEventListener("click", updateMap) //Squeal switch. Instead maybe have the layers that they wanted.
    // document.getElementById("files").addEventListener("change", readFile)       //listener for fileuploadlocation. Changing file would

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
        console.log("File API supported");
    }
    else {
        alert('The File APIs are not fully supported in this browser.');
    }

}

function readUI() {
  //READ CONTENTS FROM THE UI. Read value of UI

}

function updateMap() {
  //   readUI() ; //Read layer selection. Use dropdown selection
    //To DO: Call AddMarkerArray as an optional callback in readFile (Use JS pattern in JS Patterns book)
    readFile(); //readFile's affect on model.data_array is asynchrous so have to either pass methods that depend on its affect as callbacks, therefore cannot call addArrayMarker after hoping that model.data_array has been updated
    // console.log("In UpdateMap Function model.data_array is : ", model.data_array);
    // addMarkerArray(model.data_array,model.map);
}

function readFile(){

    var UploadFileLocation = document.getElementById("files");

    //TO DO: Check over here if correct type of file before instaintate file reader

    var reader = new FileReader();

    reader.onload = function(e) {
        var arr = [];
        var rows;
        //e.target.result contains the csv or txt information
        var result = e.target.result;
        //result is a long string of the file contents. Split by newline and commas.
        rows = result.split("\n");

        for(var i = 0, num_rows = rows.length; i < num_rows; i++){
            arr.push([]);
            var cells = rows[i].split(",");
            for(var j = 0, num_cols = cells.length; j < num_cols; j++){
                arr[i].push(cells[j]);
            }
        }
        //At this point arr is a 2D array containing data passed in. Each row is a line. Each coloum in a data point.
        //NOTE: model.data_array is a jagged array containing objects representing each point.
        model.data_array = create_object_array(model.data_order,arr);
        // console.log(model.data_array);
        addMarkerArray(model.data_array,model.map);

    }

    reader.readAsText(UploadFileLocation.files[0]);
}

function clearMap(map) {
  //model.map
  //   init();//Simply create a new map. OR you can remove all the markers off the old map.
    model.data_array = [];
    clearMarkers(model.markers,model.map);
    document.getElementById("input_field").innerHTML = '<input type="file" id="files" name="files[]" multiple />';
    document.getElementById("list").innerHTML = '<p id="temp_text">Uploaded files will show up here</p>';

    //Re add event listener to file field since replaced input fields
    document.getElementById('files').addEventListener('change', showFiles, false);
}

function showFiles(e) {
    var files = e.target.files; // FileList object

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

function ObjToString(object){

    var string = "";

    for(var key in object) {
        if(object.hasOwnProperty(key)) {
            var value = object[key];
            string = string + key + ": " + value + "\n";
        }
    }

    return string;
}

function addMarker(data, map) {
    //TO DO: Build Up position object. location: {lat: -34.397, lng: 150.544}. OR Use new lan,lat function in google maps (YES!)
    // var location = data.location;
    var lat = Number(data.lat);
    var lng = Number(data.lng);
    var squeal = data.squeal.trim(); //Trim string to remove any special characters like newlines or carriage returns
    var image;

    if (squeal === "true"){
        image = model.squeal_image;
    }
    else{
        image = model.no_squeal_image;
    }

    var marker = new google.maps.Marker({
        position: {lat: lat, lng: lng},
        map: map,
        title: ObjToString(data),
        icon: image
    });

    model.markers.push(marker);

    //TO-DO: Push marker into marker_array so that later markers can be cleared
}

function addMarkerArray(data_array, map){
    for(var i = 0, len = data_array.length; i < len; i++){
        addMarker(data_array[i], map);
    }

    //Extract lat and lng of first point and convert to numbers (data file is read in as a string.)
    var lat = Number(data_array[0].lat);
    var lng = Number(data_array[0].lng);

    //Set map view to the first marker
    map.setCenter({lat: lat, lng: lng});

}

function clearMarkers(markers, map) {
    setMapOnAll(markers, null);
}

function setMapOnAll(markers,map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

function create_object_array(data_order, data){
    var object_array = [];

    for (var i = 0; i < data.length; i++) {//data.length is number of rows (data points)
        object_array.push({});
        for (var j = 0; j < data_order.length; j++) {//order.length is number of member properties.
            // object_array[i][order[j]] = next item in file //Use dynamic member accessor to create a property with correct key name
            object_array[i][data_order[j]] = data[i][j];
        }
    }

    return object_array;
}

/*****************************PROGRAM LOGIC***************************************/
init();
