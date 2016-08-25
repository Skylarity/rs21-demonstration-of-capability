// Generically loads a CSV file
function loadCSV(csvUrl) {
	return $.ajax({
		url: csvUrl,
		dataType: "text"
	});
}

// Generically loads a JSON file
function loadJSON(jsonUrl) {
	return $.ajax({
		url: jsonUrl,
		dataType: "json"
	});
}

// Parses the array of tweets and turns them into useful GeoJSON
function parseTweetArray(tweetArray, bounds) {
	tweetJson = {
		"type": "FeatureCollection",
		"features": []
	};
	tweetArray.forEach(function(tweet) {
		// Only add the tweet if we have lat/long data
		if (tweet[3] && tweet[2]) {
			// Only add tweets that have content
			if (tweet[0].length > 0) {
				// Only add tweets in Bernalillo County
				var lat = tweet[2], lng = tweet[3];
				if ((lat > bounds.latMin && lat < bounds.latMax) && (lng > bounds.lngMin && lng < bounds.lngMax)) {
					tweetJson.features.push({
						"type": "Feature",
						"geometry": {
							"type": "Point",
							"coordinates": [lng, lat]
						},
						"properties": {
							"title": "@" + tweet[1],
							"name": "@" + tweet[1],
							"description": tweet[0],
							"marker-color": "#55acee",
							"marker-symbol": 1
						}
					});
				}
			}
		}
	});
	return tweetJson;
}

// Parses the array of facebook places, grabs the data we need for each place, and turns them into useful GeoJSON
function parseFacebookPlacesArray(facebookPlacesArray, bounds) {
	facebookPlacesJson = {
		"type": "FeatureCollection",
		"features": []
	};
	facebookPlacesArray.forEach(function(facebookPlace) {
		var name = facebookPlace[0];
		var type, checkins, lat, lng;

		// Gross check to deal with data that's in two formats
		if (facebookPlace[6].length > 0) {
			type = facebookPlace[3];
			checkins = facebookPlace[4];
			lat = facebookPlace[5];
			lng = facebookPlace[6];
		} else {
			type = facebookPlace[1];
			checkins = facebookPlace[2];
			lat = facebookPlace[3];
			lng = facebookPlace[4];
		}

		checkinVerb = checkins == 1 ? "checkin" : "checkins";

		// Only add facebook places in Bernalillo County
		if ((lat > bounds.latMin && lat < bounds.latMax) && (lng > bounds.lngMin && lng < bounds.lngMax)) {
			facebookPlacesJson.features.push({
				"type": "Feature",
				"geometry": {
					"type": "Point",
					"coordinates": [lng, lat]
				},
				"properties": {
					"title": name,
					"name": name,
					"description": type + " <small>(" + checkins + " " + checkinVerb + ")</small>",
					"marker-color": "#3b5998",
					"marker-symbol": 1
				}
			});
		}
	});
	return facebookPlacesJson;
}

function parseCensusJson(censusJson) {
	var avgIncomes = [];
	censusJson.features.forEach(function(feature) {
		avgIncomes.push(feature.properties.ACS_13_5YR_B19051_with_ann_HD01_VD01);
	});
	var scale = d3.scaleLinear().domain([d3.min(avgIncomes), d3.max(avgIncomes)]).range([0, 1]);
	censusJson.features.forEach(function(feature) {
		// fill (color), fill-opacity (0-1), stroke (color), stroke-opacity (0-1), stroke-width (px), title (string)
		var fillOpacity = scale(feature.properties.ACS_13_5YR_B19051_with_ann_HD01_VD01);
		feature.properties.fill = "rgba(90, 90, 255, " + fillOpacity + ")";
		feature.properties.stroke = "rgb(90, 90, 255)";
		feature.properties.title = "Average income: <span class=\"text-success\">$" + feature.properties.ACS_13_5YR_B19051_with_ann_HD01_VD01 + "</span> per month";
	});

	return censusJson;
}

// Initialized here so that it's accessible in showMarkers()
var layers;
var overlays;

function showMarkers() {
	// Grab all controls
	var filters = document.getElementById("marker-form").filters;

	// Create a list of currently enabled markers
	var markerList = [];
	for (var i = 0; i < filters.length; i++) {
		if (filters[i].checked) markerList.push(filters[i].value);
	}

	// Clear any current markers
	overlays.clearLayers();

	// Create a new marker group
	var clusterGroup = new L.MarkerClusterGroup().addTo(overlays);
	// Add any markers that fit the filtered criteria to that group
	layers.eachLayer(function(layer) {
		if (list.indexOf(layer.feature.properties.line) !== -1) {
			clusterGroup.addLayer(layer);
		}
	});
}

$(document).ready(function() {
	// Creates the map!
	L.mapbox.accessToken = "pk.eyJ1Ijoic2t5bGFyaXR5IiwiYSI6ImNpczI4ZHBmbzAwMzgyeWxrZmZnMGI5ZXYifQ.1-jGFvM11OgVgYkz3WvoNw";
	var map = L.mapbox.map("censusmap", "mapbox.streets");
	map.setView([35.0178, -106.6291], 11); // Bernalillo County

	overlays = L.layerGroup().addTo(map);

	// Load data and do stuff with it
	$.when(loadCSV("data/FacebookPlaces_Albuquerque.csv"), loadCSV("data/Twitter_141103.csv"), loadJSON("data/BernallioCensusBlocks_Joined.json")).done(function(csv1, csv2, json) {
		var facebookPlacesArray = $.csv.toArrays(csv1[0]);
		var tweetArray = $.csv.toArrays(csv2[0]);
		var censusJson = parseCensusJson(json[0]);

		// Grabs the bounds of the census blocks
		var bernalilloBounds = function(json) {
			var bounds = {
				"latMin": 35.0178,
				"latMax": 35.0178,
				"lngMin": -106.6291,
				"lngMax": -106.6291
			};

			json.features.forEach(function(feature) {
				feature.geometry.coordinates.forEach(function(coordList) {
					coordList.forEach(function(coord) {
						if (coord[1] > bounds.latMax) {
							bounds.latMax = coord[1];
						} else if (coord[1] < bounds.latMin) {
							bounds.latMin = coord[1];
						}
						if (coord[0] > bounds.lngMax) {
							bounds.lngMax = coord[0];
						} else if (coord[0] < bounds.lngMin) {
							bounds.lngMin = coord[0];
						}
					});
				});
			});

			return bounds;
		};

		// Census block feature layer
		var censusBlocks = L.mapbox.featureLayer().setGeoJSON(censusJson).addTo(map);

		// Facebook Places marker cluster
		facebookPlacesCluster = new L.MarkerClusterGroup({
			iconCreateFunction: function(cluster) {
				return new L.DivIcon({
					iconSize: [80, 30],
					html: "<div class=\"cluster-marker facebook-marker\"><i class=\"fa fa-sm fa-facebook\"></i> " + cluster.getChildCount() + "</div>"
				});
			}
		});
		facebookPlacesGeoJSON = L.mapbox.featureLayer().setGeoJSON(parseFacebookPlacesArray(facebookPlacesArray, bernalilloBounds(censusJson))).on("ready", function(e) {
			layers = e.target;
		});
		facebookPlacesCluster.addLayer(facebookPlacesGeoJSON);
		map.addLayer(facebookPlacesCluster);

		// Tweet marker cluster
		tweetCluster = new L.MarkerClusterGroup({
			iconCreateFunction: function(cluster) {
				return new L.DivIcon({
					iconSize: [80, 30],
					html: "<div class=\"cluster-marker twitter-marker\"><i class=\"fa fa-sm fa-twitter\"></i> " + cluster.getChildCount() + "</div>"
				});
			}
		});
		tweetGeoJSON = L.mapbox.featureLayer().setGeoJSON(parseTweetArray(tweetArray, bernalilloBounds(censusJson))).on("ready", function(e) {
			layers = e.target;
			showMarkers();
		});
		tweetCluster.addLayer(tweetGeoJSON);
		map.addLayer(tweetCluster);
	});
});
