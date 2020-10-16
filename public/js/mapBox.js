export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2lrY250IiwiYSI6ImNrZHBpb2J5aDA2a3YycW15ejVtZDZ2bW4ifQ.kF35hGpULJf_THGMWlq7Hw';

// This Map function inserts the style into all the elements that have the id 'map' 
var map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/sikcnt/ckdpknvmq0au51inz6gwp6rw9',
scrollZoom: false,
// center: [-118.4379, 33.9772],
// zoom: 10,
//interactive: false
});

const bounds = new mapboxgl.LngLatBounds()

// After the map has been inserted into the div with the id 'map', we then add additional features to the map variable. The mapvariable injects these additional features into the map that was inserted from the code on line 8.
locations.forEach(doc => {
    // Create marker
    const el = document.createElement('div')
    el.className = 'marker'

    // Add marker
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
    }).setLngLat(doc.coordinates).addTo(map)

    // Add popup
    new mapboxgl.Popup({offset: 30})
    .setLngLat(doc.coordinates)
    .setHTML(`<p>Day ${doc.day}: ${doc.description} </p>`)
    .addTo(map)

    // Extend map bounds to include current location
    bounds.extend(doc.coordinates)
})

map.fitBounds(bounds, {
    padding: {
     top: 200,
     bottom: 150,
     left: 100,
     right: 100
    }
 })
}

