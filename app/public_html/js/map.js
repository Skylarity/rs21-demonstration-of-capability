$(document).ready(function() {
	// Loads a csv file
	var loadCSV = function(csvUrl) {
		return $.ajax({
			url: csvUrl,
			dataType: "text"
		});
	};

	// Parses the array of tweets (created from the csv file) and turns them into useful GeoJSON
	var parseTweetArray = function(tweetArray) {
		tweetJson = {
			"type": "FeatureCollection",
			"features": []
		};
		tweetArray.forEach(function(tweet) {
			// Only add the tweet if we have lat/long data
			if (tweet[3] && tweet[2]) {
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
							"description": tweet[0],
							"marker-color": "#55acee"
						}
					});
				}
			}
		});
		return tweetJson;
	};

	// Creates the map!
	L.mapbox.accessToken = "pk.eyJ1Ijoic2t5bGFyaXR5IiwiYSI6ImNpczI4ZHBmbzAwMzgyeWxrZmZnMGI5ZXYifQ.1-jGFvM11OgVgYkz3WvoNw";
	var map = L.mapbox.map("censusmap", "mapbox.streets");
	map.setView([35.0178, -106.6291], 11); // (Bernalillo: 35.0440093,-106.9530535)

	$.when(loadCSV("data/FacebookPlaces_Albuquerque.csv"), loadCSV("data/Twitter_141103.csv")).done(function(csv1, csv2) {
		var facebookPlacesArray = $.csv.toArrays(csv1[0]);
		var tweetArray = $.csv.toArrays(csv2[0]);

		// Census blocks
		var censusBlocks = L.mapbox.featureLayer().loadURL("data/BernallioCensusBlocks_Joined.json").addTo(map);

		// Facebook places
		// var facebookPlaces = map.featureLayer.setGeoJSON(parseFacbookPlacesArray(facebookPlacesArray)).addTo(map);

		// Tweets
		// var tweets = map.featureLayer.setGeoJSON(parseTweetArray(tweetArray)).addTo(map);

		// tweetCluster = L.MarkerClusterGroup();
		// tweetGeoJSON = L.geoJson(parseTweetArray(tweetArray));
		// tweetCluster.addLayer(tweetGeoJSON);
		// map.addLayer(tweetCluster);

		var tweets = L.mapbox.featureLayer().setGeoJSON(parseTweetArray(tweetArray)).on('ready', function(e) {
			// The clusterGroup gets each marker in the group added to it
			// once loaded, and then is added to the map
			var tweetCluster = new L.MarkerClusterGroup();
			e.target.eachLayer(function(layer) {
				tweetCluster.addLayer(layer);
			});
			map.addLayer(tweetCluster);
		});
	});
});
