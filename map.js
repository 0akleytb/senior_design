//JS

//Good Marker Info: https://developers.google.com/maps/documentation/javascript/markers
//Info Windows: https://developers.google.com/maps/documentation/javascript/examples/map-latlng-literal
//Info Window on lat/lng itself: https://developers.google.com/maps/documentation/javascript/infowindows
//Consider using info windows on lat/lng + kml overlay

//TO DO: FIX CONTROLS COLUMN SO THAT IT ALSO TAKES 90% OF VIEW HEIGHT.
//TO DO: SET ZOOM ON WHEN ADDING MARKERS
//TO DO: Consider making addmarker and addmarkerarray void functions that directly mutate the model map. So that using it as a callback is smoother
//TO DO: Consider having everything except go and clear as onchange event handlers that mutate model map. Then go uses that info and updates map.
//TO DO: Currently if used select would have to clear and add markers every time I want to display specific data since event listeners to show info is added when markers are added

var model = {
    display_squeal: false,
    something: true,
    map: null,
    markers: [],
    squeal_color: "red",
    no_squeal_color: 'green',
    data_order: ["lat","lng","pressure","temperature","squeal"],
    data_array: [],
    min_color: "#fff",
    max_color: "#000",
    gradient_direction: "to right"
}

function init(){ //Create function
    model.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat:37.646152, lng:-77.511429},
      zoom: 17
    });

    //Add event listeners
    document.getElementById("go_button").addEventListener("click", updateMap)
    document.getElementById("clear_button").addEventListener("click", clearMap)
    document.getElementById("min_color").addEventListener("change", setMinColor)
    document.getElementById("max_color").addEventListener("change", setMaxColor)
    // document.getElementById('files').addEventListener('change', showFiles, false);
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
    readFile(addMarkerArray); //readFile's affect on model.data_array is asynchrous so have to either pass methods that depend on its affect as callbacks, therefore cannot call addArrayMarker after hoping that model.data_array has been updated
    // console.log("In UpdateMap Function model.data_array is : ", model.data_array);
    // addMarkerArray(model.data_array,model.map);
}

//TO DO: PASS MARKER ARRAY AS A CALLBACK
function readFile(callback){

    var UploadFileLocation = document.getElementById("files");

    //TO DO: Check over here if correct type of file before instaintate file reader

    // check if callback is callable
    if (typeof callback !== "function") {
        callback = false;
    }

    var reader = new FileReader();

    reader.onload = function(e) {
        var arr = [];
        var rows;
        //e.target.result contains the csv or txt information
        var result = e.target.result;
        //result is a long string of the file contents. Split by newline and commas.
        rows = result.split("\n");
        //split header into array. Header is first line
        // model.data_order = rows[0].split(",");

        //Start at index one to ignore header
        for(var i = 0, num_rows = rows.length; i < num_rows; i++){
            arr.push([]);
            var cells = rows[i].split(",");
            for(var j = 0, num_cols = cells.length; j < num_cols; j++){
                arr[i].push(cells[j]);//Changed to i-1
            }
        }
        //At this point arr is a 2D array containing data passed in. Each row is a line. Each coloum in a data point.
        //NOTE: model.data_array is a jagged array containing objects representing each point.
        model.data_array = create_object_array(model.data_order,arr);
        // console.log(model.data_array);
        // addMarkerArray(model.data_array,model.map);

        //callback
        if (callback) {
            callback(model.data_array,model.map);
        }

    }

    reader.readAsText(UploadFileLocation.files[0]);
}

function clearMap() {
  //model.map
  //   init();//Simply create a new map. OR you can remove all the markers off the old map.
    model.data_array = [];
    clearMarkers(model.markers);
    //Swap out input field to clear it. Consider storing the innerHTML into a variable and simply restoring it afterward
    document.getElementById("input_field").innerHTML = '<input type="file" id="files" name="files[]" single />';

    //Re add event listener to file field since replaced input fields
    // document.getElementById('files').addEventListener('change', showFiles, false);
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
            string = string + "[" + key + "]" + ": " + value + "\n";
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
    var color;
    var info = ObjToString(data);

    if (squeal === "true"){
        color = model.squeal_color;
    }
    else{
        color = model.no_squeal_color;
    }

    //USING CIRCLES
    var circle = new google.maps.Circle({
        // strokeColor: '#FF0000',
        strokeOpacity: 0.1,
        // strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.95,
        map: map,
        center: {lat: lat, lng: lng},
        radius: 10
        // radius: Math.sqrt(citymap[city].population) * 100
    });

    circle.info = info;

    google.maps.event.addListener(circle, 'mouseover', function(event) {
        document.getElementById("data_location").innerHTML = info;
    });

    google.maps.event.addListener(circle, 'mouseout', function(event) {
        document.getElementById("data_location").innerHTML = "Data Shown Here On Hover";
    });

    //glitchy
    // google.maps.event.addListener(circle, 'mouseover', function(event) {
    //     document.getElementById("data_location").innerHTML = info;
    //     // circle.strokeColor = "#F0FFFF";
    //     circle.set("strokeColor", "#F0FFFF");
    // });
    //
    //
    // google.maps.event.addListener(circle, 'mouseout', function(event) {
    //     document.getElementById("data_location").innerHTML = info;
    //     // circle.strokeColor = "#F0FFFF";
    //     circle.set("strokeColor","FF0000");
    // });

    model.markers.push(circle);

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

function clearMarkers(markers) {
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

function setMinColor(e){
    model.min_color = e.target.value;
    var gradient = document.getElementById("color-bar");
    gradient.style.background = 'linear-gradient('+ model.gradient_direction + ', ' + model.min_color + ', ' + model.max_color+ ')';

}

function setColor(e){
    model.min_color = e.target.value || "#fff";
    model.max_color = e.target.value || "#000";
    var gradient = document.getElementById("color-bar");
    gradient.style.background = 'linear-gradient('+ model.gradient_direction + ', ' + model.min_color + ', ' + model.max_color+ ')';

}

function setMaxColor(e){
    model.max_color = e.target.value;
    var gradient = document.getElementById("color-bar");
    gradient.style.background = 'linear-gradient('+ model.gradient_direction + ', ' + model.min_color + ', ' + model.max_color+ ')';


}
function populateDropdown(){

}

/*****************************PROGRAM LOGIC***************************************/
init();
