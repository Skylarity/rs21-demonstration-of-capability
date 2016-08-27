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

// Point in polygon (@see https://github.com/substack/point-in-polygon)
function pip(point, vs) {
	// ray-casting algorithm based on
	// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

	var x = point[0], y = point[1];

	var inside = false;
	for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
		var xi = vs[i][0], yi = vs[i][1];
		var xj = vs[j][0], yj = vs[j][1];

		var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) {
				inside = !inside;
			}
	}

	return inside;
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
	var facebookPlacesJson = {
		"type": "FeatureCollection",
		"features": []
	};

	var seen = [];

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

		// Only add "Food/grocery" places
		validTypes = ["Food/grocery", "Farming/agriculture"];
		if ($.inArray(type, validTypes) > -1) {
			// Don't add duplicates
			needle = name;
			if ($.inArray(needle, seen) === -1) {
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

				seen.push(needle);
			}
		}
	});
	return facebookPlacesJson;
}

// Parses the census block JSON in order to set the style and perform calculations on the actual census data
function parseCensusJson(censusJson) {
	// Scale the average incomes down between 0.0 and 1.0
	var avgIncomes = [];
	censusJson.features.forEach(function(feature) {
		avgIncomes.push(feature.properties.ACS_13_5YR_B19051_with_ann_HD01_VD01);
	});
	var scale = d3.scaleLinear().domain([d3.min(avgIncomes), d3.max(avgIncomes)]).range([0, 1]);

	censusJson.features.forEach(function(feature) {
		// Prepare base fill and stroke
		// fill (color), fill-opacity (0-1), stroke (color), stroke-opacity (0-1), stroke-width (px), title (string)
		var fillOpacity = scale(feature.properties.ACS_13_5YR_B19051_with_ann_HD01_VD01);
		var stroke = "rgb(150, 90, 90)", fill = "rgba(200, 90, 90, " + fillOpacity + ")", strokeWidth = "2";

		// Actually add the calculated fill and stroke to the block
		feature.properties.fill = fill;
		feature.properties.stroke = stroke;
		feature.properties["stroke-width"] = strokeWidth; // Array key notation here because of the "-"
		feature.properties.title = "Average income: <span class=\"text-success\">$" + feature.properties.ACS_13_5YR_B19051_with_ann_HD01_VD01 + "</span> per month";
	});

	return [censusJson, d3.min(avgIncomes), d3.max(avgIncomes)];
}

$(document).ready(function() {
	// Creates the map!
	L.mapbox.accessToken = "pk.eyJ1Ijoic2t5bGFyaXR5IiwiYSI6ImNpczI4ZHBmbzAwMzgyeWxrZmZnMGI5ZXYifQ.1-jGFvM11OgVgYkz3WvoNw";
	var map = L.mapbox.map("censusmap", "mapbox.streets");
	map.setView([35.13, -106.6056], 12); // Bernalillo County: [35.0178, -106.6291], Albuquerque: [35.0853, -106.6056]

	overlays = L.layerGroup().addTo(map);

	// Load data and do stuff with it
	$.when(loadCSV("data/FacebookPlaces_Albuquerque.csv"), loadJSON("data/BernallioCensusBlocks_Joined.json")).done(function(csv, json) {
		var facebookPlacesArray = $.csv.toArrays(csv[0]);
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
		var censusBlocks = L.mapbox.featureLayer().setGeoJSON(censusJson[0]).addTo(map);

		// Facebook Places marker cluster
		facebookPlacesCluster = new L.MarkerClusterGroup({
			iconCreateFunction: function(cluster) {
				return new L.DivIcon({
					iconSize: [80, 30],
					html: "<div class=\"cluster-marker facebook-marker\"><i class=\"fa fa-sm fa-facebook\"></i> " + cluster.getChildCount() + "</div>"
				});
			}
		});
		facebookPlacesGeoJSON = L.mapbox.featureLayer().setGeoJSON(parseFacebookPlacesArray(facebookPlacesArray, bernalilloBounds(censusJson[0])));
		facebookPlacesCluster.addLayer(facebookPlacesGeoJSON);
		map.addLayer(facebookPlacesCluster);

		// Food desert buffer layer
		seen = [];
		facebookPlacesGeoJSON._geojson.features.forEach(function(feature) {
			var latLng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]; // Have to reverse the coordinates

			// Make sure places right next to eachother don't cause a ton of circles in the same place
			var distance = 0.00417; // 1/4 mile in degrees
			var area = [
				[Number(latLng[0]) + distance, Number(latLng[1]) + distance],
				[Number(latLng[0]) + distance, Number(latLng[1]) - distance],
				[Number(latLng[0]) - distance, Number(latLng[1]) - distance],
				[Number(latLng[0]) - distance, Number(latLng[1]) + distance]
			];
			var notTooClose = true;
			seen.forEach(function(seenArea) {
				if (pip(latLng, seenArea)) {
					notTooClose = false;
				}
			});
			seen.push(area);

			// Food deserts are places > 1 mile away from healthy food sources
			var mileInMeters = 1609.34;

			var options = {
				"fillColor": "rgb(90, 200, 90)",
				"fillOpacity": 0.5,
				"stroke": false,
				"clickable": false
			};

			if (notTooClose) {
				L.circle(latLng, mileInMeters, options).addTo(map);
			}
			seen.push(latLng);
		});
	});
});
