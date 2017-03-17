//JS

//Good Marker Info: https://developers.google.com/maps/documentation/javascript/markers
//Info Windows: https://developers.google.com/maps/documentation/javascript/examples/map-latlng-literal
//Info Window on lat/lng itself: https://developers.google.com/maps/documentation/javascript/infowindows
//Consider using info windows on lat/lng + kml overlay


//TO DO: Add squeals as beach flags. Markers with icons. Place a member property that will be checked in gradient function so that squeals/markers will be ignored

//IMPROVEMENT: Remove run button and just simulate a keypress (if its not too hard) onchange of the filed field (works fine because the needed data for the RUN button has defualt values.)
//TO DO: Fix adding options so that old option array that is longer than new options still shows old options greater than its length
//TO DO: Consider making addmarker and addmarkerarray void functions that directly mutate the model map. So that using it as a callback is smoother


var model = {
    include_on_hover: ["pressure","temperature","squeal"], //items to be shown on marker hover. Same names as in header line
    include_in_dropdown: ["pressure","temperature","lat","lng"],//items to be shown in dropdown. Same names as in header line
    map: null,
    markers: [],
    squeal_color: "red",
    no_squeal_color: 'green',
    data_order: [], //array of strings containing header line info
    data_selected: null, //Possible values: One of the elements in data order (string)
    // data_order: ["lat","lng","pressure","temperature","squeal"],
    data_array: [], //Will be filled with each data point, as an object.
    min_limit: 100,
    max_limit: 1000,
    min_color: "#ff0000",
    max_color: "#0000ff",
    gradient_direction: "to right",
    unit_map: { //Using object to map data types to their appropriate units.
        temperature: String.fromCharCode(176) + "F",
        pressure: "PSI",
        lat: String.fromCharCode(176),
        lng: String.fromCharCode(176)
    },
    object_data_array: {//Each key will be a data type (temperature,pressure,etc). Each value will be an array containing the all of those values across all of the points

    }
}

//Consider making a views object that holds all the references to each of the UI elements. ie. squeal_button: document.getElementById("squeal_button");
var views = {

}

function init(){ //Create function
    model.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat:37.646152, lng:-77.511429},
      zoom: 17
    });

    //Test or old event listeners
    document.getElementById("test_button").addEventListener("click", testButton)
    // document.getElementById("go_button").addEventListener("click", updateMap)
    // document.getElementById("clear_button").addEventListener("click", clearMap)

    //Add event listeners
    document.getElementById("files").addEventListener("change", readFilePopulateDropdown)       //listener for fileuploadlocation. Changing file would
    document.getElementById("dropdown").addEventListener("change", setDataSelected)       //listener for fileuploadlocation. Changing file would
    document.getElementById("min_color").addEventListener("change", setMinColor)
    document.getElementById("max_color").addEventListener("change", setMaxColor)
    document.getElementById("min_limit").addEventListener("change", setMinLimit)
    document.getElementById("max_limit").addEventListener("change", setMaxLimit)
    document.getElementById("run_button").addEventListener("click", newUpdateMap);
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

    //Show Default gradient values
    document.getElementById("min_color").value = model.min_color;
    document.getElementById("max_color").value = model.max_color;

}

function readUI() {
  //READ CONTENTS FROM THE UI. Read value of UI

}


function newUpdateMap(){
    if(model.markers.length !== 0) {//If markers on map clear
        clearMarkers(model.markers);
        model.markers = []; //better way to clear is: model.markers.length = 0;
    }

    addMarkerArray(model.data_array,model.map);
}


function readFilePopulateDropdown(callback){

    var UploadFileLocation = document.getElementById("files");

    //TO DO: Check over here if correct type of file before instaintate file reader. If not, output error and return

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
        model.data_order = rows[0].split(",");

        //Trim hidden characters off when reading info from a file. Refactor to use map
        for (var i = 0, len = model.data_order.length; i < len; i++){//could have used a map here
            model.data_order[i] = model.data_order[i].trim();
        }


        //Start at index one to ignore header
        for(var i = 1, num_rows = rows.length; i < num_rows; i++){
            arr.push([]);
            var cells = rows[i].split(",");
            for(var j = 0, num_cols = cells.length; j < num_cols; j++){
                arr[i-1].push(cells[j]);//Changed to i-1
            }
        }
        //At this point arr is a 2D array containing data passed in. Each row is a line. Each coloum in a data point.
        //NOTE: model.data_array is a jagged array containing objects representing each point.
        model.data_array = create_object_array(model.data_order,arr);
        // console.log(model.data_array);
        // addMarkerArray(model.data_array,model.map);

        //Fill object array
        model.object_data_array = fillObjectDataArray();

        //populateDropdown
        populateDropdown(model.data_order, "dropdown");


        //Send a click event on RUN, testing right now

        var clickEvent = new MouseEvent("click", {
            "view": window,
            "bubbles": true,
            "cancelable": false
        });

        document.getElementById("run_button").dispatchEvent(clickEvent);

        //callback
        if (callback) {
            callback();
        }

    }

    reader.readAsText(UploadFileLocation.files[0]);
}

function clearMap() {

    model.data_array = [];
    clearMarkers(model.markers);
    model.markers = [];
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

    var string = "", value, unit;

    for(var key in object) {
        if(object.hasOwnProperty(key) && model.include_on_hover.includes(key)) {//If key should be shown on hover
            value = object[key];
            unit = model.unit_map[key] ? model.unit_map[key] : ""; //Find the unit via the object map. If doesn't exist empty string as unit
            string = string + "[" + key + "]" + ": " + value + unit + " ";
        }
    }

    return string;
}

function addMarker(data, map) {
    //TO DO: Build Up position object. location: {lat: -34.397, lng: 150.544}. OR Use new lan,lat function in google maps (YES!)
    // var location = data.location;
    var lat = Number(data.lat);
    var lng = Number(data.lng);
    var temperature = Number(data.temperature);
    var squeal = data.squeal;
    // var squeal = data.squeal.trim(); //Trim string to remove any special characters like newlines or carriage returns
    var color;
    var temp_percent;
    var percent;
    var difference;
    var info = ObjToString(data);

    var min_limit = model.min_limit;
    var min_color = model.min_color;
    var max_limit = model.max_limit;
    var max_color = model.max_color;

    //Not doing squeal color anymore. Now only heatmap colors. Squeals are flags.
    // if (squeal === "true"){
    //     color = model.squeal_color;
    // }
    // else{
    //     color = model.no_squeal_color;
    // }

    // //Static data gradient display
    // difference = Math.max(temperature - min_limit, 0); //Choose max of the two to make sure not negative
    // temp_percent = difference*1.0/(max_limit - min_limit); //Float division since 1.0 //Temp_percent could be greater than 1
    // percent = Math.min(temp_percent, 1);
    //
    // color = getGradientColor(min_color, max_color, percent);

    /**Future implementation of updating color based on min max colors
     *
     *     difference = Math.max(data[model.selected_data] - model.min_limit, 0); //Make sure float
     *     percent = difference/(model.max_limit-model.min_limit); //Make sure float division
     */

    //USING CIRCLES
    var circle = new google.maps.Circle({
        strokePosition: google.maps.StrokePosition.INSIDE,
        // strokeColor: '#FF0000',
        strokeOpacity: 0,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.95,
        map: map,
        center: {lat: lat, lng: lng},
        radius: 10
        // radius: Math.sqrt(citymap[city].population) * 100
    });

    circle.data = data; //Could use the data property later.
    circle.info = info; //Could use the data property later.

    //Store circles in marker array
    model.markers.push(circle);

}

function addMarkerArray(data_array, map){
    for (var i = 0, len = data_array.length; i < len; i++) {
        addMarker(data_array[i], map);
    }

    //Extract lat and lng of first point and convert to numbers (data file is read in as a string.)
    var lat = Number(data_array[0].lat);
    var lng = Number(data_array[0].lng);

    //Set gradient
    updateMarkersGradient(model.markers);

    //Set listeners
    // addMarkerEventListeners(model.markers);
    addMarkerEventListeners();

    //Set map view to the first marker
    map.setCenter({lat: lat, lng: lng});
    map.setZoom(17);

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

    for (var i = 0; i < data.length; i++) {//data.length is number of rows (data points)//data is a 2D array
        object_array.push({});
        for (var j = 0; j < data_order.length; j++) {//order.length is number of member properties.
            // object_array[i][order[j]] = next item in file //Use dynamic member accessor to create a property with correct key name
            object_array[i][data_order[j]] = data[i][j];
        }
    }

    return object_array;
}

function setColor(e){
    model.min_color = e.target.value || "#fff";
    model.max_color = e.target.value || "#000";
    var gradient = document.getElementById("color-bar");
    gradient.style.background = 'linear-gradient('+ model.gradient_direction + ', ' + model.min_color + ', ' + model.max_color+ ')';

}

function setMinColor(e){
    model.min_color = e.target.value;
    var gradient = document.getElementById("color-bar");
    gradient.style.background = 'linear-gradient('+ model.gradient_direction + ', ' + model.min_color + ', ' + model.max_color+ ')';
    updateMarkersGradient(model.markers);
}



function setMaxColor(e){
    model.max_color = e.target.value;
    var gradient = document.getElementById("color-bar");
    gradient.style.background = 'linear-gradient('+ model.gradient_direction + ', ' + model.min_color + ', ' + model.max_color+ ')';
    updateMarkersGradient(model.markers);
}

function setMinLimit(e){
    model.min_limit = e.target.value;
    console.log(model.min_limit);
    updateMarkersGradient(model.markers);
}

function setMaxLimit(e){
    model.max_limit = e.target.value;
    console.log(model.max_limit);
    updateMarkersGradient(model.markers);
}

function setDataSelected(e){
    var data = model.data_array;
    var order = model.data_order;
    var object_array = model.object_data_array;
    var min_limit = model.min_limit;
    var max_limit = model.max_limit;
    var elements;

    model.data_selected = e.target.value;
    console.log(model.data_selected);

    model.min_limit = Math.min.apply(null, object_array[model.data_selected]);
    model.max_limit = Math.max.apply(null, object_array[model.data_selected]);

    document.getElementById("min_limit").value = model.min_limit;
    document.getElementById("max_limit").value = model.max_limit;

    //Update Gradient
    updateMarkersGradient(model.markers);

    //Update Units
    elements = document.getElementsByClassName("units")
    for(var i = 0, len = elements.length; i < len; i++){
        if (model.unit_map[model.data_selected] != undefined) {
            elements[i].innerHTML = model.unit_map[model.data_selected];
        }
        else {
            elements[i].innerHTML = "*";
        }
    }
}

/**
 * Description: Returns an interpolation of a linear gradient as a hex value
 * http://stackoverflow.com/questions/3080421/javascript-color-gradient?noredirect=1&lq=1
 * @param start_color in hex
 * @param end_color in hex
 * @param percent. Number between zero and 1
 * @returns {string}
 */
function getGradientColor(start_color, end_color, percent) {
    // strip the leading # if it's there
    start_color = start_color.replace(/^\s*#|\s*$/g, '');
    end_color = end_color.replace(/^\s*#|\s*$/g, '');

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if(start_color.length == 3){
        start_color = start_color.replace(/(.)/g, '$1$1');
    }

    if(end_color.length == 3){
        end_color = end_color.replace(/(.)/g, '$1$1');
    }

    // get colors
    var start_red = parseInt(start_color.substr(0, 2), 16),
        start_green = parseInt(start_color.substr(2, 2), 16),
        start_blue = parseInt(start_color.substr(4, 2), 16);

    var end_red = parseInt(end_color.substr(0, 2), 16),
        end_green = parseInt(end_color.substr(2, 2), 16),
        end_blue = parseInt(end_color.substr(4, 2), 16);

    // calculate new color
    var diff_red = end_red - start_red;
    var diff_green = end_green - start_green;
    var diff_blue = end_blue - start_blue;

    diff_red = ( (diff_red * percent) + start_red ).toString(16).split('.')[0];
    diff_green = ( (diff_green * percent) + start_green ).toString(16).split('.')[0];
    diff_blue = ( (diff_blue * percent) + start_blue ).toString(16).split('.')[0];

    // ensure 2 digits by color
    if( diff_red.length == 1 )
        diff_red = '0' + diff_red

    if( diff_green.length == 1 )
        diff_green = '0' + diff_green

    if( diff_blue.length == 1 )
        diff_blue = '0' + diff_blue

    return '#' + diff_red + diff_green + diff_blue;
}


//http://www.plus2net.com/javascript_tutorial/list-adding.php
function addOption(selectbox,text,value,index) {
    console.log("created option");
    var optn = document.createElement("OPTION");
    optn.text = text.toUpperCase();
    optn.value = value;
    selectbox.options[index] = optn;
    // selectbox.options.add(optn);

    //Tag created looks like: <option value="lat">LAT</option>
}

/**
 *
 * @param info. Array containing data to be used to populate the dropdown
 * @param id. String ID of the element (a select tag) to be populated.
 */
function populateDropdown(info, id){
    var element = document.getElementById(id);
    // element.options = [];
    element.options.length = 0; // clear options
    for(var i = 0, len = info.length; i < len; i++){
        //If header, since data order will be passed as info, is in include in dropdown array show it.
        if (model.include_in_dropdown.includes(info[i])) { //info[i] != "squeal" didnt create random blank options. But this does.
            addOption(element, info[i], info[i], i);
        }
    }

    //Remove all blank options that get randomlny created for some reason. //Could also create a select element and add only filtered options and then replace the select tag
    for(var i = 0; i < element.options.length; i++){
        removeOptionsByValue(element, "");
    }

    //Manually fire an onchange event to updata data selected. Doesnt update by itself when adding an option
    var event = new Event('change');
    element.dispatchEvent(event);
}

function removeOptionsByValue (select, value) {
    var options = select.options;
    for (var i = 0; i < options.length; i++) {
        if (options[i].value === value) {
            select.removeChild(options[i]);
        }
    }
    return null
}

function testButton(){
    console.log("Clicked Test button");
    for (var i = 0; i < 50; i++){
        // model.markers[i].setFillColor("#fff");
        model.markers[i].setOptions({fillColor: "#fff"})
    }
}

function updateMarkersGradient(data){
    var difference, temp_percent, percent,color;
    var min_limit = model.min_limit;
    var max_limit = model.max_limit;
    var data_selected;

    //Changes HTML5 Colornames to hex values, and leaves them as hex as so
    var min_color = colorToHex(model.min_color);
    var max_color = colorToHex(model.max_color);


    for(var i = 0, len = data.length; i < len; i++){
        data_selected = data[i].data[model.data_selected];
        difference = Math.max(data_selected - min_limit, 0); //Choose max of the two to make sure not negative
        temp_percent = difference*1.0/(max_limit - min_limit); //Float division since 1.0 //Temp_percent could be greater than 1
        percent = Math.min(temp_percent, 1);

        color = getGradientColor(min_color, max_color, percent);

        //setFillColor as gradientcolor
        data[i].setOptions({fillColor: color})

        //Add a color property to each marker resembling its gradient color
        data[i].color = color;
    }
}


function addMarkerEventListeners(){
    for(var i = 0, len = model.markers.length; i < len; i++) {
        model.markers[i].addListener('mouseover', function() {
            document.getElementById("data_location").innerHTML = this.info;
            //Consider setting zIndex as well.
            this.setOptions({strokeOpacity: 1, strokeColor: "#000", strokeWeight: 5});
        });

        model.markers[i].addListener('mouseout', function() {
            document.getElementById("data_location").innerHTML = "Data Shown Here On Hover";
            this.setOptions({strokeOpacity: 0});
        });
    }
}



function fillObjectDataArray(){
    var object = {};

    var data = model.data_array;
    var order = model.data_order;
    var temp;
    // var object_array = model.object_data_array; // Object containing arrays

    for(var k = 0, len = order.length; k < len; k++){
        object[order[k]] = [];
    }

    for(var i = 0, len = data.length; i < len; i++){
        for(var j = 0, order_len = order.length; j < order_len; j++){
            //Store corresponding property data in temp.
            temp = data[i][order[j]];
            // Create member properties in model.data_order and push the corresponding property info for each marker into an array.
            object[order[j]].push(temp);
        }
    }

    return object;
}



/**************************HTML COLORNAMES FUNCION ****************/
//http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
function colorToRGBA(color) {
    // Returns the color as an array of [r, g, b, a] -- all range from 0 - 255
    // color must be a valid canvas fillStyle. This will cover most anything
    // you'd want to use.
    // Examples:
    // colorToRGBA('red')  # [255, 0, 0, 255]
    // colorToRGBA('#f00') # [255, 0, 0, 255]
    var cvs, ctx;
    cvs = document.createElement('canvas');
    cvs.height = 1;
    cvs.width = 1;
    ctx = cvs.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data;
}

function byteToHex(num) {
    // Turns a number (0-255) into a 2-character hex number (00-ff)
    return ('0'+num.toString(16)).slice(-2);
}

function colorToHex(color) {
    // Convert any CSS color to a hex representation
    // Examples:
    // colorToHex('red')            # '#ff0000'
    // colorToHex('rgb(255, 0, 0)') # '#ff0000'
    var rgba, hex;
    rgba = colorToRGBA(color);
    hex = [0,1,2].map(
        function(idx) { return byteToHex(rgba[idx]); }
    ).join('');
    return "#"+hex;
}


/*****************************PROGRAM LOGIC***************************************/
init();
