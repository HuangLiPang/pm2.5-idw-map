let fs = require('fs');

fs.readFile('./Emission_Points.geojson', 'utf-8', (err, data) => {
  if (err) throw err;
  let json = JSON.parse(data);
  json.features.forEach(feature => {
  	let a = feature.geometry.coordinates[1],
  		b = feature.geometry.coordinates[0];
  		if(a > b){
  			feature.geometry.coordinates[1] = b;
  			feature.geometry.coordinates[0] = a;
  		}
  });
  json = JSON.stringify(json);
  fs.writeFile('./Emission_Points.geojson', json, 'utf-8', (err) => {
  	if (err) throw err;
  	console.log('The file has been saved!');
 	});
});