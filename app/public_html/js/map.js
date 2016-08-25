$(document).ready(function() {
	// Loads a CSV file
	var loadCSV = function(csvUrl) {
		return $.ajax({
			url: csvUrl,
			dataType: "text"
		});
	};

	// Loads a JSON file
	var loadJSON = function(jsonUrl) {
		return $.ajax({
			url: jsonUrl,
			dataType: "json"
		});
	};

	// Parses the array of tweets (created from the csv file) and turns them into useful GeoJSON
	var parseTweetArray = function(tweetArray, bounds) {
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
	};

	// Creates the map!
	L.mapbox.accessToken = "pk.eyJ1Ijoic2t5bGFyaXR5IiwiYSI6ImNpczI4ZHBmbzAwMzgyeWxrZmZnMGI5ZXYifQ.1-jGFvM11OgVgYkz3WvoNw";
	var map = L.mapbox.map("censusmap", "mapbox.streets");
	map.setView([35.0178, -106.6291], 11); // Bernalillo County

	// Load data and do stuff with it
	$.when(loadCSV("data/FacebookPlaces_Albuquerque.csv"), loadCSV("data/Twitter_141103.csv"), loadJSON("data/BernallioCensusBlocks_Joined.json")).done(function(csv1, csv2, json) {
		var facebookPlacesArray = $.csv.toArrays(csv1[0]);
		var tweetArray = $.csv.toArrays(csv2[0]);
		var censusJson = json[0];

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
		var censusBlocks = L.mapbox.featureLayer().loadURL("data/BernallioCensusBlocks_Joined.json").addTo(map);

		// Tweet marker cluster
		tweetCluster = new L.MarkerClusterGroup({
			iconCreateFunction: function(cluster) {
				return new L.DivIcon({
					iconSize: [50, 50],
					html: "<div class=\"twitter-marker\">" + cluster.getChildCount() + "</div>"
				});
			}
		});
		tweetGeoJSON = L.mapbox.featureLayer().setGeoJSON(parseTweetArray(tweetArray, bernalilloBounds(censusJson)));
		tweetCluster.addLayer(tweetGeoJSON);
		map.addLayer(tweetCluster);
	});
});
