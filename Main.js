var inputFiles = [];
var inputFiles_split = [];
var places = [];
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
    inputFiles = reader.result.split("\r\n");
    inputFiles_split = [];
    for (i = 1; i < inputFiles.length; i++) {
      inputFiles_split.push(inputFiles[i].split(","));
    }
  };
  //put csv file into file
  var file = fileInput.files[0];

  reader.readAsText(file);
});

//Google api
var tw = { lat: 25.105497, lng: 121.597366 };
var mapOptions = {
  center: tw,
  zoom: 7, //地圖的縮放倍率
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
  //split出places用在waypoints跟頭尾 2021/12/11 by lynnie hsiao
  places = [];
  for (i = 0; i < inputFiles_split.length; i++) {
    if (inputFiles_split[i].length > 1) {
      places.push({ location: inputFiles_split[i][2], stopover: true });
    }
  }

  //create request
  var request = {
    //民權一派出所
    origin: { lat: 25.060142842489007, lng: 121.52792382523405 }, //places[0].location, 第一點
    destination: { lat: 25.060142842489007, lng: 121.52792382523405 }, //places[places.length - 1].location, 最後一點
    // waypoints: [
    //   { location: place1, stopover: true },
    // ],
    waypoints: places.slice(1, places.length - 1), //去掉第一和最後的
    travelMode: google.maps.TravelMode.DRIVING, //WALKING, BYCYCLING, TRANSIT
    optimizeWaypoints: true,
  };

  //pass the request to the route method
  directionsService.route(request, function (result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      //display route
      directionsDisplay.setDirections(result);
    } else {
      //delete route from map
      directionsDisplay.setDirections({ routes: [] });
      //center map in Taiwan
      map.setCenter(tw);
      //show error message
      output.innerHTML =
        "<div class='alert-danger'><i class='fas fa-exclamation-triangle'></i>error</div>";
    }
  });
}
