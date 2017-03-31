//JS

//Good Marker Info: https://developers.google.com/maps/documentation/javascript/markers
//Info Windows: https://developers.google.com/maps/documentation/javascript/examples/map-latlng-literal
//Info Window on lat/lng itself: https://developers.google.com/maps/documentation/javascript/infowindows
//Consider using info windows on lat/lng + kml overlay


var model = {
    include_on_hover: ["Pressure","Thermo1","Thermo2","Thermo3","Thermo4","Squeal", "Speed", "Latitude", "Longitude", "Second", "Milliseconds"], //items to be shown on marker hover. Same names as in header line
    include_in_dropdown: ["Pressure","Thermo1","Thermo2","Thermo3","Thermo4", "Speed"],//items to be shown in dropdown. Same names as in header line
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
    min_color: "white",
    max_color: "red",
    gradient_direction: "to right",
    unit_map: { //Using object to map data types to their appropriate units.
        Thermo1: String.fromCharCode(176) + "F",
        Thermo2: String.fromCharCode(176) + "F",
        Thermo3: String.fromCharCode(176) + "F",
        Thermo4: String.fromCharCode(176) + "F",
        Pressure: "PSI",
        Latitude: String.fromCharCode(176),
        Longitude: String.fromCharCode(176),
        Speed: "Kn"
    },
    object_data_array: {//Each key will be a data type (temperature,pressure,etc). Each value will be an array containing the all of those values across all of the points

    }
}
