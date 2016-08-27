# Resilient Solutions 21 - Demonstration of Capability

[View the project here](https://skylerrexroad.com/~skyler/rs21/app/public_html/)

[View the source code here](https://github.com/Skylarity/rs21-demonstration-of-capability)

![Screenshot of project](https://raw.githubusercontent.com/Skylarity/rs21-demonstration-of-capability/master/documentation-images/screenshot.png)

## Strategy

There were three stages I went through to complete this project. First I chose what I wanted to visualize (and how), then I chose what to visualize it in, and lastly I implemented the visualization. This provided me with a clear understanding of what I needed to do at any given point in the project.

I looked through the provided datasets in order to gain an understanding of what data was available to me, and decided from the beginning that a correlation between only two or three data points would be easiest to manage during the 5 day time limit.

I chose to visualize the food deserts within Albuquerque, and show the potential correlation between income level and access to healthy food. Food deserts are defined as urban areas in which it is difficult to buy affordable or good-quality fresh food, and the [federal government](http://www.ers.usda.gov/datafiles/Food_Access_Research_Atlas/Download_the_Data/Archived_Version/archived_documentation.pdf) defines 1 mile as the maximum distance someone in an urban area should have to travel to have access that food.

[Mapbox](https://www.mapbox.com/) and [D3](https://d3js.org/) were recommended in the prompt, so I turned to them first. I'd never used either library before this project, but after reading through their documentation I thought that they looked reasonably simple and easy to pick up.

## Points of Interest

I really enjoyed learning Mapbox (and by extension Leaflet) and D3, they're super powerful tools and I thought that they were surprisingly easy to pick up. Like I mentioned earlier, I'd never used them before and I was able to learn and implement them within the time limit of the project.

I also enjoy working with real-world data and identifying potential problems and solutions in a meaningful way. Creating actual visualizations of datasets is something that is extremely satisfying to me.

## Improvements and Extensions

There are a few things that I would have done to take this project further.

1. The Facebook Places provided to me don't classify all grocery stores/farmer's markets/etc. as such (ex. Smith's is classified as a local business). In order to fix this, I could pull the city's building permit and/or business license data in order to see exactly what is and is not a "healthy food source".

2. I used dataset `B19051` to display number of houses with income as a representation of poverty level. I would have rather used dataset `B19052` for this comparison, as it actually shows income level.

3. The census data provided to me was at the county level, but the Facebook Places were contained within Albuquerque. For a project that would actually go to a client I would prefer to use datasets with the same sample area.

4. If I were to work on this project in the future, I would like to pull the city's vacant parcel data in order to display places within the food deserts that could have a food source built on them.
