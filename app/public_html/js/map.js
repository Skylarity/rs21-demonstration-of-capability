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
					if ((tweet[3] > -108 && tweet[3] < -106) && (tweet[2] > 34 && tweet[2] < 36)) {
						tweetJson.features.push({
							"type": "Feature",
							"geometry": {
								"type": "Point",
								"coordinates": [tweet[3], tweet[2]]
							},
							"properties": {
								"title": "@" + tweet[1],
								"name": "@" + tweet[1],
								"description": tweet[0],
								"marker-color": "#55acee"
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

	$.when(loadCSV("data/FacebookPlaces_Albuquerque.csv"), loadCSV("data/Twitter_141103.csv"), loadJSON("data/BernallioCensusBlocks_Joined.json")).done(function(csv1, csv2, json) {
		var facebookPlacesArray = $.csv.toArrays(csv1[0]);
		var tweetArray = $.csv.toArrays(csv2[0]);

		var bernalilloBounds = function(json) {
			var longMin = -106.6291, longMax = -106.6291, latMin = 35.0178, latMax = 35.0178;

			json.features.forEach(function() {
				// TODO
			});

			return [longMin, longMax, latMin, latMax];
		};

		// Census blocks
		var censusBlocks = L.mapbox.featureLayer().loadURL("data/BernallioCensusBlocks_Joined.json").addTo(map);

		// Facebook places
		// var facebookPlaces = map.featureLayer.setGeoJSON(parseFacbookPlacesArray(facebookPlacesArray)).addTo(map);

		// Tweets
		tweetCluster = new L.MarkerClusterGroup();
		tweetGeoJSON = L.mapbox.featureLayer().setGeoJSON(parseTweetArray(tweetArray, bernalilloBounds(json)));
		tweetCluster.addLayer(tweetGeoJSON);
		map.addLayer(tweetCluster);
	});
});
