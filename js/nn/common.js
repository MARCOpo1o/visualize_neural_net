function applyVertexColors( g, c ) {
    var count = 0;
    g.faces.forEach( function( f ) {

	var n = ( f instanceof THREE.Face3 ) ? 3 : 4;					
	for( var j = 0; j < n; j ++ ) {

	    f.vertexColors[ j ] = c;
	    count++;
	}

    } );
    //console.log('applied colors to ' + count + 'vertices');

}
function applySpecialVertexColors( g ) {
    
    var faceCount = 0;				
    var color = new THREE.Color();
    color.setHex( Math.random() * 0xffffff )
    var cubeNum = 0;
    g.faces.forEach( function( f ) {
	faceCount++;
	cubeNum = faceCount/12;
	if (faceCount % 12 == 1) {
	    color = new THREE.Color();
	    color.setHex( Math.random() * 0xffffff )
	}
	if (faceCount <= 12) {
	    color = new THREE.Color();
	    color.setHex( 0x0000ff )
	}
	var n = ( f instanceof THREE.Face3 ) ? 3 : 4;
	for( var j = 0; j < n; j ++ ) {
	    f.vertexColors[ j ] = color;
	}
    });
}
function updateTinyBoard() {
    if (goodStart){
	var imageData = customBoard.getImg();
	
	var newCanvas = $("<canvas>")
	    .attr("width", imageData.width)
	    .attr("height", imageData.height)[0];
	
	newCanvas.getContext("2d").putImageData(imageData, 0, 0);
	tinyCtx.drawImage(newCanvas, 0, 0);
	getNNOutput();
    }
}

function updateCubes() {
    var r, g, b, id;
    var numChildren = scene.children.length;
    for ( var i = 0; i<numChildren; i++) {
	if ( scene.children[i].name == 'cubes' ){
	    var object = scene.children[i];
	    
	    var geometry = object.geometry;
	    var faceCount = 0;						
	    geometry.faces.forEach( function( f ) {
		faceCount++;
		if (faceCount % 12 == 1) {								
		    id = math.floor(faceCount/12);
		    if (isComputed){									
			var v = allNodeOutputs[id];
			var colorNum = math.round(v*99);
			r = redLookup[colorNum];
			g = greenLookup[colorNum];
			b = blueLookup[colorNum];
		    } else {
			r=0; g=0; b=0;
		    }
		    color = new THREE.Color();
		    color.setRGB( r,g,b )
		}
		var n = ( f instanceof THREE.Face3 ) ? 3 : 4;
		for( var j = 0; j < n; j ++ ) {
		    f.vertexColors[ j ] = color;
		}
	    });
	    geometry.colorsNeedUpdate = true;
	    geometry.verticesNeedUpdate = true;
	}
    }
}
function drawCubes() {
	var geometry = new THREE.Geometry();
    var pickingGeometry = new THREE.Geometry();
    var pickingMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );
    var defaultMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors, transparent: true} );

    // var geom = new THREE.BoxGeometry( 20,20,20 ); //this is where the size of the cube is determined 9,9,9 originally 

    var hideGeom = new THREE.BoxGeometry(1,1,1);
    var color = new THREE.Color();

    var matrix = new THREE.Matrix4();
    var quaternion = new THREE.Quaternion();

    for ( var i = 0; i < nNodes; i ++ ) {

		var marco = 7;
		var position = new THREE.Vector3();
		if (layerNum[i] == 7){
			position.x = posX[i]*marco;
			position.y = posY[i] - 30;

	
		} else {
			position.x = posX[i];
			position.y = posY[i];
		}
		
		//change this only for layernum[i]==7
		position.z = posZ[i];

		var rotation = new THREE.Euler();
		rotation.x = 0;
		rotation.y = 0;
		rotation.z = 0;

		var scale = new THREE.Vector3();
		scale.x = 1;
		scale.y = 1;
		scale.z = 1;
	
		quaternion.setFromEuler( rotation, false );
		matrix.compose( position, quaternion, scale );
		var geom;

		// Check if the current cube belongs to the output layer
		if (layerNum[i] == 7) {
			// For cubes in the output layer, use a larger size
			geom = new THREE.BoxGeometry(50, 50, 50); // Adjust the size as needed
		} else {
			// For other cubes, use the original size
			geom = new THREE.BoxGeometry(9, 9, 9);
		}

		if (isComputed){
			var v = allNodeOutputs[i];
			var colorNum = math.round(v*99);
			r = redLookup[colorNum];
			g = greenLookup[colorNum];
			b = blueLookup[colorNum];
			applyVertexColors( geom, color.setRGB( r,g,b ) );
		} else {
			applyVertexColors( geom, color.setRGB( 0,0,0 ) );
		}
		
		geometry.merge( geom, matrix );

		// give the geom's vertices a color corresponding to the "id"

		applyVertexColors( geom, color.setHex( i ) );

		pickingGeometry.merge( geom, matrix );

		pickingData[ i ] = {
			position: position,
			rotation: rotation,
			scale: scale, 
			id: i
		};

    }

    var drawnObject = new THREE.Mesh( geometry, defaultMaterial);
    drawnObject.name = 'cubes';
    scene.add( drawnObject );

    pickingScene.add( new THREE.Mesh( pickingGeometry, pickingMaterial ) );		
}

function drawEdges() {
    //console.log('draw edges');
    var lineMat = new THREE.LineBasicMaterial({
	color: 0x0000ff,
	transparent:true, 
	linewidth: 2
    });
    var lineGeom = new THREE.Geometry();
    lineGeom.dynamic = true;
    var line = new THREE.Line(lineGeom, lineMat);
    line.name = 'edges';
    scene.add(line);
}
function updateInfoBoxPos() {
    var infobox = document.getElementById("infobox");
    var boxHeight = infobox.clientHeight;
    var boxWidth = infobox.clientWidth;
    var bot = Math.min(window.innerHeight - mousepx.y + 20, window.innerHeight - boxHeight);
    infobox.style.bottom = bot + "px";
    infobox.style.left = mousepx.x - boxWidth/2 + "px";
    
}

function drawFilter() {
    var i,j,f,x,y,colorNum,r,g,b,ro,co;
    var pixelSize = 20;
    var squareWidth, totalWidth=0;
    var boxWidth = 200;
    //console.log('filterNum = ' + filterNum);
    
    //var filterImage = document.getElementById("filterImage");
    var inputImage = document.getElementById("inputImage");
    filterCanvasContainer.style.height = "0px";
    inputCanvasContainer.style.height = "0px";
    if (layerNum[interID]==0) {			
	//input
	//filterImage.style.backgroundColor = "red";
    } else if (layerNum[interID]==1) {
		//log
		// console.log("drawFilter() triggered");
	// conv1
	squareWidth = pixelSize*filterSize_1; 
	totalWidth = squareWidth;
	filterCtx.canvas.width = totalWidth;
	filterCtx.canvas.height = squareWidth;
	filterCanvasContainer.style.width = totalWidth + "px";
	filterCanvasContainer.style.height = squareWidth + "px";
	for (i=0;i<filterSize_1;i++){
	    for (j=0;j<filterSize_1;j++){
		weight = conv_nodes[0][filterNum].e(i+1,j+1);
		colorNum = math.round(conv_weights_1a[filterNum][i][j]*99);
		r=0;
		g = math.round(greenLookup[colorNum]*255);
		b = math.round(blueLookup[colorNum]*255);
		filterCtx.fillStyle = "rgba(" + r + "," + g + "," + b + ", 1.0";
		filterCtx.fillRect(i*pixelSize, j*pixelSize, pixelSize, pixelSize);
	    }
	}

	// Draw dividing line on filterCanvas
    filterCtx.strokeStyle = "rgba(255, 255, 255, 1.0)"; // White color
    filterCtx.lineWidth = 10; // Thicker line
    filterCtx.beginPath();
    filterCtx.moveTo(totalWidth, 0);
    filterCtx.lineTo(totalWidth, squareWidth);
    filterCtx.stroke();


	inputCtx.canvas.width = totalWidth;
	inputCtx.canvas.height = squareWidth;
	inputCanvasContainer.style.width = totalWidth + "px";
	inputCanvasContainer.style.height = squareWidth + "px";
	x=0;y=0;
	for (j=1; j<=nPixels; j++){
	    ind_below = j-1;
	    temp_below = allNodeNums[ind_below]-1;
	    var row_below = temp_below % 32;
	    var col_below = math.floor(temp_below/32);
	    if (row_below > row-1 && row_below < row + 5 && col_below > col-1 && col_below < col + 5) {
		colorNum = math.round(allNodeOutputs[ind_below]*99);
		r=0;
		g = math.round(greenLookup[colorNum]*255);
		b = math.round(blueLookup[colorNum]*255);
		inputCtx.fillStyle = "rgba(" + r + "," + g + "," + b + ", 1.0";
		inputCtx.fillRect(x*pixelSize, y*pixelSize, pixelSize, pixelSize);
		x++; if (x == filterSize_1) { x=0; y++; }
	    }
	}
	    // Draw dividing line on inputCanvas
		inputCtx.strokeStyle = "rgba(255, 255, 255, 1.0)"; // White color
		inputCtx.lineWidth = 10; // Thicker line
		inputCtx.beginPath();
		inputCtx.moveTo(totalWidth, 0);
		inputCtx.lineTo(totalWidth, squareWidth);
		inputCtx.stroke();
    } else if (layerNum[interID]==2) {
	//nodeType = "Downsampling layer 1";
    } else if (layerNum[interID]==3) {
	// conv2
	squareWidth = pixelSize*filterSize_2; 
	totalWidth = nKeepers[filterNum]*pixelSize*filterSize_2;
	filterCtx.canvas.width = totalWidth;
	filterCtx.canvas.height = squareWidth;
	filterCanvasContainer.style.width = totalWidth + "px";
	filterCanvasContainer.style.height = squareWidth + "px";
	//filterCtx.fillRect(10,10,300,50);
	var keeperCount = 0
	var reverseKeeperCount = nKeepers[filterNum]-1;;
	for (f=0;f<nConvFilters_1;f++){
	    if (keepers.e(f+1,filterNum+1)){
			for (i=0;i<filterSize_1;i++){
				for (j=0;j<filterSize_1;j++){
					weight = conv_nodes[1][filterNum][keeperCount].e(i+1,j+1);
					colorNum = math.round(conv_weights_2a[filterNum][f][i][j]*99);									
					r=0;
					g = math.round(greenLookup[colorNum]*255);
					b = math.round(blueLookup[colorNum]*255);
					filterCtx.fillStyle = "rgba(" + r + "," + g + "," + b + ", 1.0";
					filterCtx.fillRect(reverseKeeperCount*squareWidth+i*pixelSize, j*pixelSize, pixelSize, pixelSize);
				}
			}
			keeperCount++;
			reverseKeeperCount--;

			// Draw dividing line
			if (keeperCount < nKeepers[filterNum]) {
				filterCtx.strokeStyle = "rgba(255, 255, 255, 1.0)"; // White color
				filterCtx.lineWidth = 10; // Thicker line
				filterCtx.beginPath();
				filterCtx.moveTo((reverseKeeperCount+1)*squareWidth, 0);
				filterCtx.lineTo((reverseKeeperCount+1)*squareWidth, filterSize_1*pixelSize);
				filterCtx.stroke();
			}
	    }
	}

	
	inputCtx.canvas.width = totalWidth;
	inputCtx.canvas.height = squareWidth;
	inputCanvasContainer.style.height = squareWidth + "px";
	inputCanvasContainer.style.width = totalWidth + "px";
	x=0;y=0;

	// Draw horizontal dividing line at the top of filterCanvas
	filterCtx.strokeStyle = "rgba(255, 255, 255, 1.0)"; // White color
	filterCtx.lineWidth = 10; // Thicker line
	filterCtx.beginPath();
	filterCtx.moveTo(0, 0);
	filterCtx.lineTo(totalWidth, 0);
	filterCtx.stroke();

	keeperCount = nKeepers[filterNum]-1;
	for (j=1; j<=nConvNodes_1_down; j++){
	    ind_below = nPixels+nConvNodes_1+j-1;
	    temp_below = allNodeNums[ind_below]-1;
	    filterNum_below = math.floor((ind_below-nPixels-nConvNodes_1)/(14*14));
	    var row_below = temp_below % 14;
	    var col_below = math.floor(temp_below/14);
	    if (keepers.e(filterNum_below+1,filterNum+1)==1) {
			if (row_below > row-1 && row_below < row + 5 && col_below > col-1 && col_below < col + 5) {
				colorNum = math.round(allNodeOutputs[ind_below]*99);
				r = math.round(redLookup[colorNum]*255);
				g = math.round(greenLookup[colorNum]*255);
				b = math.round(blueLookup[colorNum]*255);
				inputCtx.fillStyle = "rgba(" + r + "," + g + "," + b + ", 1.0";
				inputCtx.fillRect(keeperCount*squareWidth+x*pixelSize, y*pixelSize, pixelSize, pixelSize);
				x++; if (x == filterSize_1) { x=0; y++; }
				if (y == filterSize_1) { y=0; keeperCount--; }
			}
	    }
		// Draw dividing line
		if (x == 0 && y == 0 && keeperCount >= 0) {
			inputCtx.strokeStyle = "rgba(225, 225, 225, 1.0)"; // Change this to the color you want for the dividing line
			inputCtx.lineWidth = 10; // Change this to the thickness you want for the dividing line
			inputCtx.beginPath();
			inputCtx.moveTo((keeperCount+1)*squareWidth, 0);
			inputCtx.lineTo((keeperCount+1)*squareWidth, filterSize_1*pixelSize);
			inputCtx.stroke();
		}
	}
    } else if (layerNum[interID]==4) {
	//nodeType = "Downsampling layer 2";
    } else if (layerNum[interID]==5) {
	//nodeType = "Fully-connected layer 1";
    } else if (layerNum[interID]==6) {
	//nodeType = "Fully-connected layer 2";
    } else if (layerNum[interID]==7) {
	//nodeType = "Output layer";
    }
    
    if (totalWidth==0) {
	imageInputContainer.style.opacity = 0;
    } else {
	imageInputContainer.style.opacity = 1;
    }
    
    boxWidth = math.max(boxWidth, totalWidth);
    infobox.style.width = boxWidth + "px";
    
    if (boxWidth-totalWidth>0){
	inputImage.style.float = "left";
	//var marginLeft = math.round((boxWidth-totalWidth)/2);
	//inputCanvasContainer.style.paddingLeft = marginLeft + "px";
	//filterCanvasContainer.style.paddingLeft = marginLeft + "px";
    } else {
	inputImage.style.float = "none";
	//inputCanvasContainer.style.paddingLeft = 0;
	//filterCanvasContainer.style.paddingLeft = 0;
    }
    
}
