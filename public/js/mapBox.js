/* eslint-disable */

const locations = JSON.parse(document.getElementById("map").dataset.locations);


mapboxgl.accessToken = 'pk.eyJ1IjoiZGV2YW5nbWVodGE5NyIsImEiOiJjbHZycXRidDAwcDdlMmttaHhvbmE1Y2QxIn0.XLo58D2eocOnKSjUMS6nLA';
console.log(locations)
console.log(mapboxgl.accessToken)
const map = new mapboxgl.Map({
	container: 'map', // container ID
	style: 'mapbox://styles/devangmehta97/clvrs5vbm01ev01o05lbraxh3', // style URL
    scrollZoom: false
	// center: [83.022713, 25.376165], // starting position [lng, lat]
	// zoom: 15, // starting zoom
    // interactive: false
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach(location => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // add marker to map
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
    }).setLngLat(location.coordinates).addTo(map);

    // add popup for details of the location
    new mapboxgl.Popup({
        offset: 30
    })
    .setLngLat(location.coordinates)
    .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
    .addTo(map)
    // extend the map bound to include the location
    bounds.extend(location.coordinates);
})

// fitting the map based on the bounds
map.fitBounds(bounds, {
    padding: {
        top: 200,
        bottom: 200,
        left: 100,
        right: 200
    }
})