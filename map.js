//JS

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
}
