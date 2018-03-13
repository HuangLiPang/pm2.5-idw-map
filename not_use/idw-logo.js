var date = new Date(version),
	timezone = date.toString().split(/\s/),
	version = date.toLocaleString("en-us", { hour12: false }) + " " + timezone[6],
	logoLayer = L.control({ position: 'bottomleft' });
logoLayer.onAdd = function(map) {
	let div = L.DomUtil.create('div', 'logo');
	div.innerHTML = 
		`<table border=1 cellspacing=0 cellpadding=0 bgcolor='#000080'>
			<tr bgcolor='#000080'>
				<td align='center'>
		    	<font size='+1' color='#FFFFFF'><b>PM2.5 IDW Diagram</b></font>
		    </td>
		  </tr>
		  <tr bgcolor='#ffffff'>
		  	<td align='center'>
		    	<img src='./images/AS-logo.png' alt='Academia Sinica' height=55>
		    	<img src='./images/LASS-logo.png' alt='Location Aware Sensing System (LASS)' height=55>
		    	<br>
		    	<font>${version}</font>
		    </td>
		  </tr>
		</table>`;
	return div;
};
logoLayer.addTo(map);