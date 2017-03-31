/*UTILITY FUNCTIONS
 *GENERAL/REUSABLE FUNCTIONS
 *FUNCTIONS THAT DEPEND ON MODEL
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

function afterReadFile(){
    //Fill object array
    model.object_data_array = fillObjectDataArray();

    //populateDropdown
    populateDropdown(model.data_order, "dropdown");

    //Create data table
    createDataTable();

    //Update The Map by adding markers
    newUpdateMap();

}

function showGraph(){
    $("graph_modal").modal('show');
}

function readFilePopulateDropdown(callback){

    var UploadFileLocation = document.getElementById("files");

    //TO DO: Check over here if correct type of file before instaintate file reader. If not, output error and return

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

    reader.readAsText(UploadFileLocation.files[0]);
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

function createDataTable(){

    //If the example table has already been removed, do not create a new one. Exit
    if(!document.getElementById("example_table")){
        return;
    }
    // // var table = document.getElementById("data_table");
    // //var table = document.createElement("table");
    //
    //
    // var header_row = table.rows[0]; //First row
    //
    // //Fill in headers
    // for (var i = 0, j = 0; i < model.data_order.length; i++) {
    //     if(model.include_on_hover.includes(model.data_order[i])) {
    //         header_row.cells[j].innerHTML = model.data_order[i];
    //         j++;
    //     }
    //
    // }

    // Create table.
    var table = document.createElement('table');
    //Style table
    table.className = "table table-bordered data_table"; //bootstrap row aligns it with the rest of the rows
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


    // var app = document.getElementById('app');
    // //app.appendChild(table);
    //
    // //Replace the first child (fake table) with real table
    // app.insertBefore(table, app.firstChild);
    // app.removeChild();

    //Get and replace example_table with real table
    var example_table = document.getElementById("example_table");
    example_table.parentNode.replaceChild(table, example_table);
}

function units(name){
    // return typeof model.unit_map[name] !== undefined ? : model.unit_map[name] : "";
    //
    if (typeof model.unit_map[name] !== "undefined"){
        return model.unit_map[name];
    }
    else{
        return "";
    }
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
