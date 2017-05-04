//JS

/**************MODEL OBJECT STORING APPLICATION DATA*******************/
var model = {
    map_loaded: false,
    include_on_hover: ["Pressure","Thermo1","Thermo2","Thermo3","Thermo4","Squeal", "Speed", "Acceleration" ,"Latitude", "Longitude", "Second", "Milliseconds"], //items to be shown on marker hover. Same names as in header line
    include_in_dropdown: ["Pressure","Thermo1","Thermo2","Thermo3", "Thermo4","Speed"],//items to be shown in dropdown. Same names as in header line
    map: null, //Stores map instance
    markers: [], //Stores each google map data point
    data_order: [], //array of strings containing header line info. Ex: ["lat","lng","pressure","temperature","squeal"],
    data_selected: null, //Possible values: One of the elements in data order (string)
    data_array: [], //Will be filled with each data point, as an object.
    min_limit: 100, //Default min limit (override when application runs)
    max_limit: 1000, //Default max limit
    min_color: "white", //Default min color
    max_color: "red", //Default max color
    gradient_direction: "to right", //Horizontal gradient CSS property
    unit_map: { //Using object to map data types to their appropriate units.
        Thermo1: String.fromCharCode(176) + "F",
        Thermo2: String.fromCharCode(176) + "F",
        Thermo3: String.fromCharCode(176) + "F",
        Thermo4: String.fromCharCode(176) + "F",
        Pressure: "PSI",
        Latitude: String.fromCharCode(176),
        Longitude: String.fromCharCode(176),
        Speed: "MPH",
        Acceleration: "MPH/s"
    },
    object_data_array: {//Each key will be a data type (temperature,pressure,etc). Each value will be an array containing the all of those values across all of the points

    }
}

/************UTILITY FUNCTIONS FUNCTIONS THAT DEPEND ON MODEL OBJECT (DATA)*******************/

/**
 * Name:create_object_array
 * Description: Creates an array of objects from the data read in from file
 * @param data_order. An array containing the data types in the order which they appear (Ex. Temp,Lat,Lng,Pressure)
 * @param data. A 2D array containing the data from the log file. Each line represents a data point
 * @returns {Array}. An 1D array of objects each respresenting a data point.
 */
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

/**
 * Called within ReadFile
 * Does preliminary work after the file is read, like filling in the data, populating the select dropdown, creating the data table that shows the marker information, and calls updateMap
 */
function afterReadFile(){
    //Fill object array
    model.object_data_array = fillObjectDataArray();

    //populateDropdown
    populateDropdown(model.data_order, "dropdown");

    //Create data table
    createDataTable();

    //Update The Map by adding markers
    newUpdateMap();

    //RemoveOverlay. Recursive call with setTimeout checking every 5000ms to see if loaded flag is true(polling essentially)
    removeOverlay(5000);

}


/**
 * Reads the file contents into model.data_array and then calls afterReadFile
 */
function readFile(){

    //Apply overlay and set map_loaded to false
    document.getElementById("app").classList.add("loading-overlay");
    model.map_loaded = false;

    var UploadFileLocation = document.getElementById("files");

    //TODO: Check over here if correct type of file before instantiate file reader. If not, output error and return

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
                //if (typeof cells[j] != 'undefined')
                arr[i-1].push(cells[j]);//Changed to i-1
            }
        }
        //At this point arr is a 2D array containing data passed in. Each row is a line. Each coloum in a data point.
        //NOTE: model.data_array is a jagged array containing objects representing each point.
        model.data_array = create_object_array(model.data_order,arr);


        //Set up next "scene" of maps application. Consider hiding the controls, until this point
        afterReadFile();

    }

    //Call HTML5 fileReader to read data as a string. When it finishes, the reader.onload function defined above will be called
    reader.readAsText(UploadFileLocation.files[0]);
}

/**
 *Name: setMinColor
 *Sets left end of the color gradient
 * @param e. Event object passed in by onchange eventlistener
 */
function setMinColor(e){
    model.min_color = e.target.value;
    var gradient = document.getElementById("color-bar");
    gradient.style.background = 'linear-gradient('+ model.gradient_direction + ', ' + model.min_color + ', ' + model.max_color+ ')';
    updateMarkersGradient(model.markers);
}

/**
 *Name: setMaxColor
 *Sets right end of the color gradient
 * @param e. Event object passed in by onchange eventlistener
 */
function setMaxColor(e){
    model.max_color = e.target.value;
    var gradient = document.getElementById("color-bar");
    gradient.style.background = 'linear-gradient('+ model.gradient_direction + ', ' + model.min_color + ', ' + model.max_color+ ')';
    updateMarkersGradient(model.markers);
}

/**
 *Name: setMinLimit
 *Sets min limit of the selected data
 * @param e. Event object passed in by onchange eventlistener
 */
function setMinLimit(e){
    model.min_limit = e.target.value;
    console.log(model.min_limit);
    updateMarkersGradient(model.markers);
}

/**
 *Name: setMaxLimit
 *Sets max limit of the selected data
 * @param e. Event object passed in by onchange eventlistener
 */
function setMaxLimit(e){
    model.max_limit = e.target.value;
    console.log(model.max_limit);
    updateMarkersGradient(model.markers);
}

/**
 * Name: setDataSelected
 * Description: Called when user selects a parameter from the dropdown. Minimum and maximum of that parameter are found
 * and displayed as min and max limits. Then the gradient and units are updated
 * @param e
 */
function setDataSelected(e){

    var object_array = model.object_data_array;
    var min_limit = model.min_limit;
    var max_limit = model.max_limit;
    var elements;

    //Update data_selected as the dropdown
    model.data_selected = e.target.value;
    console.log(model.data_selected);

    //Find min and max of the parameter selected and store into the model store
    model.min_limit = Math.min.apply(null, object_array[model.data_selected]);
    model.max_limit = Math.max.apply(null, object_array[model.data_selected]);

    //Display min and max limits in the inputs
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
            //If not defined in the model.unit_map simply show a star
            elements[i].innerHTML = "*";
        }
    }
}

/**
 * Name: getGradientColor
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
/**
 * Name: addOption
 * http://www.plus2net.com/javascript_tutorial/list-adding.php
 * Description: Adds an option to a HTML selectbox
 * @param selectbox. HTML select element to be appended to
 * @param text. Text of the new option
 * @param value. Value of the new option
 * @param index. Index where the option should be inserted (starts from 0)
 */

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
 * Name: populateDropdown
 * Description: Called within afterReadFile. Populates the select dropdown with information that is model.include_in_dropdown
 * @param info. Array containing data to be used to populate the dropdown
 * @param id. String ID of the element (a select tag) to be populated.
 */
function populateDropdown(info, id){
    //Element will the select tag. The id will be the id of the select tag
    var element = document.getElementById(id);
    // element.options = [];
    element.options.length = 0; // clear options

    //Populate the select tag
    for(var i = 0, len = info.length; i < len; i++){
        //If header, since model_data_order will be passed as info, is in model_include_in_dropdown array show it.
        if (model.include_in_dropdown.includes(info[i])) { //info[i] != "squeal" didnt create random blank options. But this does.
            addOption(element, info[i], info[i], i);
        }
    }

    //Remove all blank options that get randomly created for some reason. //Could also create a select element and add only filtered options and then replace the select tag
    for(var i = 0; i < element.options.length; i++){
        removeOptionsByValue(element, "");
    }

    //Manually fire an onchange event to update data selected. Doesn't update by itself when adding an option
    var event = new Event('change');
    element.dispatchEvent(event);
}

/**
 * Name: createDataTable
 * Description: Called within afterReadFile. Creates a table with the header information.
 */
function createDataTable(){

    //If the example table has already been removed, do not create a new one. Exit. //Consider always swapping table when read file in case the file has less or more headers
    if(!document.getElementById("example_table")){
        return;
    }

    // Create table.
    var table = document.createElement('table');

    //Style table
    table.className = "table table-bordered data_table";
    table.id = "table";

    //Create thead and add a table row (tr)
    var head_tag = table.createTHead();
    var header_row = head_tag.insertRow(0);

    //Populate Header
    for (var i = 0; i < model.include_on_hover.length; i++) {
        header_row.insertCell(i).innerHTML = model.include_on_hover[i];
    }

    //var body = table.createTBody doesn't exist. since can have multiple tbodies in a table
    var body = table.appendChild(document.createElement('tbody'));
    var data_row = body.insertRow(0);

    //Populate data row (second row) of the table
    for (var k = 0; k < model.include_on_hover.length; k++) {
        data_row.insertCell(k).innerHTML = "-"; //Dummy text on start up. These columns will be modified on hover.
    }


    //Get and replace example_table with real table
    var example_table = document.getElementById("example_table");

    //Get parentNode of example_table and call replaceChild on it
    example_table.parentNode.replaceChild(table, example_table);
}

/**
 * Name: units
 * @param name. The data. Ex: pressure, speed.
 * @returns String. Returns the appropiate unit for the given data. Ex: PSI, MPH
 */
function units(name){
    // return typeof model.unit_map[name] !== undefined ? : model.unit_map[name] : ""; //One line version

    // If the unit has been defined in model.unit_map, use it, else empty string
    if (typeof model.unit_map[name] !== "undefined"){
        return model.unit_map[name];
    }
    else{
        return "";
    }
}

/**
 * Name: removeOptionsByValue.
 * @param select. The HTML select tag whose options will be removed
 * @param value. The value of the option to be removed
 * @returns {null}
 */
function removeOptionsByValue (select, value) {
    //Get the select options
    var options = select.options;

    //Loop through all the select tag options and remove the one whose value matches
    for (var i = 0; i < options.length; i++) {
        if (options[i].value === value) {
            select.removeChild(options[i]);
        }
    }

    return null
}

/**
 * Name: fillObjectDataArray
 * Description: Creates an objects whose keys are the headers in the header line of the read in file, and values are arrays of that data type across all data points
 * @returns {}. An object
 */
function fillObjectDataArray(){
    var object = {};

    var data = model.data_array;
    var order = model.data_order;
    var temp;

    //Create keys for each header in the header line of the read file. (Ex. Pressure, Temperature)
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

/**
 * //http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
 * @param color
 * @returns {CanvasPixelArray}
 */
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

/*****************************FUNCTIONS THAT CALL THE GOOGLE MAP API***************************************/

/**
 * Name: addMarker
 * Description: Adds a data point to the google map
 * @param data. An object containing all the information for one data point
 * @param map. The google map instance to add the point too.
 */
function addMarker(data, map) {
    if(data.Squeal.trim() === "1") //Everything read as text (stored as strings)
        addSqueal(data,map);
    else
        addCircle(data,map);
}

/**
 * Name: addCircle
 * Description: Adds a point to the map as a circle
 * @param data. An object containing all the information for one data point
 * @param map. The google map instance to add the point too.
 */
function addCircle(data, map){

    //Get latitude and longitude properties and convert to a number (read in as a string)
    var lat = Number(data.Latitude);
    var lng = Number(data.Longitude);


    //Add circle to the map passed in
    var circle = new google.maps.Circle({
        strokePosition: google.maps.StrokePosition.INSIDE,
        strokeOpacity: 0,
        strokeWeight: 2,
        fillOpacity: 0.95,
        map: map,
        center: {lat: lat, lng: lng},
        radius: 5
    });

    //Add properties for later use
    circle.type = "CIRCLE";
    circle.data = data; //Could use the data property later.

    //Store circle in marker array
    model.markers.push(circle);
}

/**
 * Name: addSqueal
 * Description: Adds a point to the map as a flag (squeal)
 * @param data. An object containing all the information for one data point
 * @param map. The google map instance to add the point too.
 */
function addSqueal(data, map){
    var lat = Number(data.Latitude);
    var lng = Number(data.Longitude);


    //Add squeal to the map passed in
    var marker = new google.maps.Marker({
        position: {lat: lat, lng: lng},
        map: map,
        title: "Squeal Heard!",
        icon: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png"
        // icon: {size: new google.maps.Size(100,100,"px","px"),
        //         url:'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png' }
    });

    //Add properties to be used later
    marker.type = "SQUEAL";
    marker.data = data; //Could use the data property later.

    //Store squeal in marker array
    model.markers.push(marker);
}

/**
 * Name: addMarkerArray
 * Description: Adds an array of objects to the map
 * @param data_array. An array of objects containing all points to be added to the map
 * @param map. The google map instance to add the point too.
 */
function addMarkerArray(data_array, map){
    for (var i = 0, len = data_array.length; i < len; i++) {
        addMarker(data_array[i], map);
    }

    //Extract lat and lng of first point and convert to numbers (data file is read in as a string.)
    var lat = Number(data_array[0].Latitude);
    var lng = Number(data_array[0].Longitude);

    //Set gradient
    updateMarkersGradient(model.markers);

    //Set listeners
    // addMarkerEventListeners(model.markers);
    addMarkerEventListeners();

    //Set map view to the first marker
    map.setCenter({lat: lat, lng: lng});
    map.setZoom(17);

    //A bit of a hack, placed the loaded flag here since google map api function calls seem to be async so hard time queueing the removeOverlay to be after the last api call
    model.map_loaded = true;
}

/**
 * Name: newUpdateMap
 * Description: Empties the model.markers array, clears the markers off of the map and adds in the new data.
 * Called whenever a new file is uploaded.
 */
function newUpdateMap(){
    //Clear markers array and on map
    if(model.markers.length !== 0) {//If markers on map clear
        clearMarkers(model.markers);
        model.markers = []; //better way to clear is: model.markers.length = 0;
    }

    //Add new markers
    addMarkerArray(model.data_array,model.map);
}

/**
 * Description: Takes the markers array and sets all their map properties to null thereby taking them off the google map instance.
 * @param markers
 */
function clearMarkers(markers) {
    setMapOnAll(markers, null);
}

/**
 * Description: Takes the markers array and puts them on a map. If pass null as map, it removes the markers off their current map
 * @param markers
 * @param map
 */
function setMapOnAll(markers,map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

/**
 * Name: updateMarkersGradient
 * Description: Updates the gradient on google map markers or circles
 * @param data. An array of markers (model.markers_array)
 */
function updateMarkersGradient(data){

    //IF IT IS A SQUEAL DO NOT UPDATE GRADIENT (DOESNT HAVE ONE)
    // if (data.type === "SQUEAL"){
    //     console.log
    //     return
    // }

    var difference, temp_percent, percent,color;
    var min_limit = model.min_limit;
    var max_limit = model.max_limit;
    var data_selected;

    //Changes HTML5 Colornames to hex values, and leaves them as hex as so
    var min_color = colorToHex(model.min_color);
    var max_color = colorToHex(model.max_color);


    for(var i = 0, len = data.length; i < len; i++){
        //Select data to base gradient off of
        data_selected = data[i].data[model.data_selected];

        //Calculate the intensity of the gradient and store it in percent
        difference = Math.max(data_selected - min_limit, 0); //Choose max of the two to make sure not negative
        temp_percent = difference*1.0/(max_limit - min_limit); //Float division since 1.0 //Temp_percent could be greater than 1
        percent = Math.min(temp_percent, 1);

        //Retrieve color based on percentage between min and max colors
        color = getGradientColor(min_color, max_color, percent);

        //Only update gradient for circle objects
        if(data[i].type === "CIRCLE") {
            //setFillColor as gradientcolor
            data[i].setOptions({fillColor: color})

            //Add a color property to each marker resembling its gradient color
            data[i].color = color;
        }
        else{
            //console.log(i,"th point is a squeal");
        }
    }
}

/**
 * Name: addMarkersEventListeners
 * Description: adds mouseover and mouseout event listeners to each google maps point (flag or circle) so that is shows the information
 * of that point on hover.
 */
function addMarkerEventListeners(){
    var table = document.getElementById("table");
    var data_row = table.rows[1];

    //Loop through points and add event listeners depending on if it is a circle or a squeal (flag)
    for(var i = 0, len = model.markers.length; i < len; i++) {
        if(model.markers[i].type === "CIRCLE") {//CIRCLES
            model.markers[i].addListener('mouseover', function () {
                //Consider setting zIndex as well.

                //Show the information for that data point on hover
                for (var j = 0; j < model.include_on_hover.length; j++) {
                    //Populate data table and add units. Check if the include_hover_array item is in the data file
                    if(model.data_order.includes(model.include_on_hover[j]))
                        data_row.cells[j].innerHTML = this.data[model.include_on_hover[j]] + units(model.include_on_hover[j]);
                }

                //Outline the marker being hovered over
                this.setOptions({strokeOpacity: 1, strokeColor: "#000", strokeWeight: 5});
            });

            model.markers[i].addListener('mouseout', function () {
                //document.getElementById("data_location").innerHTML = "Data Shown Here On Hover";

                //Hide the information on mouseout
                for (var j = 0; j < model.include_on_hover.length; j++) {
                    //Populate data table and add units
                    data_row.cells[j].innerHTML = "-";
                }

                this.setOptions({strokeOpacity: 0});
            });
        }
        else {//Flag.
            model.markers[i].addListener('mouseover', function () {
                //Consider setting zIndex as well.
                //this.setOptions({strokeOpacity: 1, strokeColor: "#000", strokeWeight: 5});

                //Show the information for that data point on hover
                for (var j = 0; j < model.include_on_hover.length; j++) {
                    //Populate data table and add units
                    if(model.data_order.includes(model.include_on_hover[j]))
                        data_row.cells[j].innerHTML = this.data[model.include_on_hover[j]] + units(model.include_on_hover[j]);
                }

            });

            //Hide the information on mouseout
            model.markers[i].addListener('mouseout', function () {
                //document.getElementById("data_location").innerHTML = "Data Shown Here On Hover";
                //this.setOptions({strokeOpacity: 0});

                for (var j = 0; j < model.include_on_hover.length; j++) {
                    //Populate data table and add units
                    data_row.cells[j].innerHTML = "-";
                }
            });
        }
    }

}

/**
 * Name: removeOverlay
 * Description: Polls the model.map_loaded flag at specified interval to see and if the flag is true, it removes the overlay
 * @param time. The polling interval.
 */
function removeOverlay(time){

    setTimeout(function(){

        if(model.map_loaded !== true)
            removeOverlay(time);
        else
            document.getElementById("app").classList.remove("loading-overlay");

    }, time)
}

/*****************************INITIALIZATION FUNCTION AND INVOCATION (START OF APPLICATION)***************************************/
function init(){ //Create function

    //Creates a new google maps instance and stores it into model.map
    model.map = new google.maps.Map(document.getElementById('map'), {
        center: {lat:37.646152, lng:-77.511429},
        zoom: 17
    });

    //Add event listeners
    document.getElementById("files").addEventListener("change", readFile)
    document.getElementById("dropdown").addEventListener("change", setDataSelected)
    document.getElementById("min_color").addEventListener("change", setMinColor)
    document.getElementById("max_color").addEventListener("change", setMaxColor)
    document.getElementById("min_limit").addEventListener("change", setMinLimit)
    document.getElementById("max_limit").addEventListener("change", setMaxLimit)

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

    //Show default min and max values
    document.getElementById("min_limit").value = model.min_limit;
    document.getElementById("max_limit").value = model.max_limit;

}

/*********Start Program***********/
init();
