$(document).ready(function() {
	// Bernalillo: 35.0440093,-106.9530535
	L.mapbox.accessToken = "pk.eyJ1Ijoic2t5bGFyaXR5IiwiYSI6ImNpczI4ZHBmbzAwMzgyeWxrZmZnMGI5ZXYifQ.1-jGFvM11OgVgYkz3WvoNw";
	var map = L.mapbox.map("censusmap", "mapbox.streets");
	map.setView([35.0178, -106.6291], 11);

	// Census blocks
	var censusBlocks = L.mapbox.featureLayer().loadURL("data/BernallioCensusBlocks_Joined.json").addTo(map);

	// Facebook places
	var facebookPlaces = omnivore.csv("data/FacebookPlaces_Albuquerque.csv").addTo(map);
	console.log(facebookPlaces);
});
