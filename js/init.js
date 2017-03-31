function init(){ //Create function
    model.map = new google.maps.Map(document.getElementById('map'), {
        center: {lat:37.646152, lng:-77.511429},
        zoom: 17
    });


    //Add event listeners
    document.getElementById("files").addEventListener("change", readFilePopulateDropdown)       //listener for fileuploadlocation. Changing file would
    document.getElementById("dropdown").addEventListener("change", setDataSelected)       //listener for fileuploadlocation. Changing file would
    document.getElementById("min_color").addEventListener("change", setMinColor)
    document.getElementById("max_color").addEventListener("change", setMaxColor)
    document.getElementById("min_limit").addEventListener("change", setMinLimit)
    document.getElementById("max_limit").addEventListener("change", setMaxLimit)
    document.getElementById("generate_graph_button").addEventListener("click", showGraph)

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

/*****************************PROGRAM LOGIC***************************************/
init();
