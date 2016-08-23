$(document).ready(function() {
	// Bernalillo: 35.0440093,-106.9530535
	L.mapbox.accessToken = "pk.eyJ1Ijoic2t5bGFyaXR5IiwiYSI6ImNpczI4ZHBmbzAwMzgyeWxrZmZnMGI5ZXYifQ.1-jGFvM11OgVgYkz3WvoNw";
	var map = L.mapbox.map("censusmap", "mapbox.streets");
	map.setView([35.0440093, -106.9530535], 10);

	var linePoints = [
		[35.0, -106.9],
		[35.1, -107.0],
		[35.2, -106.5]
	];

	var polygon = L.polygon(linePoints, {color: "#000"}).addTo(map);
});
