let fs = require('fs');

fs.readFile('./Emission_Points.geojson', 'utf-8', (err, data) => {
  if (err) throw err;
  let json = JSON.parse(data);
  json.features.forEach(feature => {
  	let geoType = feature.geometry.type;
  	if(geoType === 'Point'){
      feature.geometry.type = 'Polygon';
      let lon = feature.geometry.coordinates[0],
        lat = feature.geometry.coordinates[1];
      feature.geometry.coordinates = [
        [
          [lon, lat + 0.015], 
          [lon + 0.015, lat], 
          [lon, lat - 0.015], 
          [lon - 0.015, lat], 
          [lon, lat + 0.015]
        ]
      ];
    }
    feature.properties.stroke = '#0000ff';
    feature.properties['fill-opacity'] = 0.5;
    feature.properties.fill = '#00ccff';
  });
  json = JSON.stringify(json);
  fs.writeFile('./Emission_Points_Polygons.geojson', json, 'utf-8', (err) => {
  	if (err) throw err;
  	console.log('The file has been saved!');
 	});
});