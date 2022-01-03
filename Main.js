var inputFiles = [];
var inputFiles_split = [];
//FileInput
var fileInput = document.getElementById("fileInput");
var fileDisplayArea = document.getElementById("fileDisplayArea");
// upload file function
fileInput.addEventListener("change", function (e) {
  //reader use to read the file
  var reader = new FileReader();
  reader.onload = function (e) {
    //display the content inside the file
    fileDisplayArea.innerText = reader.result;
    //clean the data
    inputFiles = [];
    inputFiles_split = [];
    inputFiles = reader.result.split("\r\n");
    for (i = 1; i < inputFiles.length; i++) {
      inputFiles_split.push(inputFiles[i].split(","));
    }
  };
  var file = fileInput.files[0];
  reader.readAsText(file);
});

//Google api
var tw = { lat: 25.105497, lng: 121.597366 };
var mapOptions = {
  center: tw,
  zoom: 7,
  mapTypeId: google.maps.MapTypeId.ROADMAP,
};

//create map
var map = new google.maps.Map(document.getElementById("googleMap"), mapOptions);
//create a DirectionsService object to use the route method and get a result for our request
var directionsService = new google.maps.DirectionsService();
//create a DirectionsRenderer object which we will use to display the route
var directionsDisplay = new google.maps.DirectionsRenderer();
//bind the DirectionsRenderer to the map
directionsDisplay.setMap(map);

function calcRoute() {
  places = [];
  for (i = 0; i < inputFiles_split.length; i++) {
    if (inputFiles_split[i].length > 1) {
      places.push({ location: inputFiles_split[i][2], stopover: true });
    }
  }
  var request = {
    origin: { lat: 25.060142842489007, lng: 121.52792382523405 },
    destination: { lat: 25.060142842489007, lng: 121.52792382523405 },
    waypoints: places,
    travelMode: google.maps.TravelMode.DRIVING, //WALKING, bicycling, TRANSIT
    optimizeWaypoints: true,
  };
  directionsService.route(request, function (result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(result);
    } else {
      directionsDisplay.setDirections({ routes: [] });
      map.setCenter(tw);
    }
  });
}
