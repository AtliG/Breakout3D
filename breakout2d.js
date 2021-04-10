/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir notkun á lyklaborðsatburðum til að hreyfa spaða
//
//    Hjálmtýr Hafsteinsson, janúar 2021
/////////////////////////////////////////////////////////////////
var canvas;
var gl;
var vPosition;
var locColor;

var paddleBuffer;
var paddle = [
        vec2( -0.1, -0.9 ),
        vec2( -0.1, -0.86 ),
        vec2(  0.1, -0.86 ),
        vec2(  0.1, -0.9 ) 
    ];
var paddleColor = vec4(1.0, 0.0, 0.0, 1.0);
var xmove = 0.0;

var shotBuffer;
var shot = []; 
var shotCirclePoints = 20;
var shotRadius = 0.02;
var shotCenter = vec2(0.0, 0.0);
var shotColor = vec4(0.0, 1.0, 0.0, 1.0);

var shotAngle = 0.0;
var shotSpeed = 0.02;
var shotVector;
var shotFired = false;

var boxBuffer;
var boxes = [];
var numOfBoxes = 8;
var boxColor = vec4(0.0, 0.0, 1.0, 1.0);

window.onload = function init() {

	canvas = document.getElementById( "gl-canvas" );
	
	gl = WebGLUtils.setupWebGL( canvas );
	if ( !gl ) { alert( "WebGL isn't available" ); }
	
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

	//
	//  Load shaders and initialize attribute buffers
	//
	var program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );
	
	// Load the data into the GPU
	paddleBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, paddleBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(paddle), gl.DYNAMIC_DRAW );

	shotBuffer = gl.createBuffer();
	//gl.bindBuffer( gl.ARRAY_BUFFER, shotBuffer );
	//gl.bufferData( gl.ARRAY_BUFFER, flatten(shot), gl.DYNAMIC_DRAW );
	
	createBoxes();
	boxBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(boxes), gl.STATIC_DRAW );

	// Associate out shader variables with our data buffer
	vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );

	locColor = gl.getUniformLocation(program, "rColor")

	// Event listener for keyboard
	window.addEventListener("keydown", function(e){
		switch( e.keyCode ) {
			case 32:
				xmove = 0.0;
				spawnShot();
				console.log(shot[3]);
				shotFired = true;
				return;
			case 37:	// vinstri ör
				xmove = -0.04;
				break;
			case 39:	// hægri ör
				xmove = 0.04;
				break;
			default:
				xmove = 0.0;
		}
		movePaddle(xmove)
	} );

	render();
}

function movePaddle(xmove) {
	if (paddle[0][0] < -1 && xmove < 0) {
		xmove = 0.0;
	}
	if (paddle[2][0] > 1 && xmove > 0) {
		xmove = 0.0;
	}
	for (i=0; i<4; i++) {
			paddle[i][0] += xmove;
	}

	gl.bindBuffer( gl.ARRAY_BUFFER, paddleBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(paddle), gl.DYNAMIC_DRAW );
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.uniform4fv( locColor, flatten(paddleColor) );
	gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
}

function createBoxes() {
	var boxesPerRow = numOfBoxes/2;
	var spaceLength = (2.0*0.3)/(boxesPerRow+ 1);
	var boxLength = (2.0*0.7)/boxesPerRow;

	console.log(spaceLength)
	boxes.push(createBox(spaceLength, boxLength, -1, 0.9));
	for (i = 1; i < boxesPerRow; i++) {
		boxes.push(createBox(spaceLength, boxLength, 
			boxes[i-1].coords[2][0], boxes[i-1].coords[0][1]));
	}

	for (i = boxesPerRow; i < numOfBoxes; i++) {
		boxes.push(createBox(spaceLength, boxLength, 
			boxes[i-1].coords[2][0], boxes[i-1].coords[0][1]));
	}
}

function createBox(spaceLength, boxLength, xOffset, yOffset) {
	var x1 = xOffset+spaceLength;
	var x2 = x1 + boxLength;
	var y1 = yOffset - 0.08;
	var y2 = yOffset;

	const boxCords = {
		shotDown: false,
		coords: [ vec2(x1, y1),
						  vec2(x1, y2),
							vec2(x2, y2),
							vec2(x2, y1)
						],
	}

	return boxCords;
}

function drawBoxes() {
	for (var i = 0; i < numOfBoxes; i++) {
		var box = boxes[i];
		if (!box.shotDown) {
			gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );
			gl.bufferSubData( gl.ARRAY_BUFFER, i*4, flatten(box.coords) );
			gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0);
			gl.uniform4fv( locColor, flatten(boxColor) );
			gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
		}
	}
}

function createShotVertices(center, radius) {
	shot = [];

	shot.push( center );

	var dAngle = 2*Math.PI/shotCirclePoints;
	for( i=shotCirclePoints; i>=0; i-- ) {
		a = i*dAngle;
		var p = vec2( radius*Math.sin(a) + center[0], radius*Math.cos(a) + center[1] );
		shot.push(p);
	}	
}

function spawnShot() {
	if (shotFired) {
		return;
	}

	shotAngle = Math.floor(Math.random()*(110 - 70) + 70);
	shotAngle = shotAngle*(Math.PI/180);
	console.log(shotAngle)

	var xSpeed = Math.cos(shotAngle)*shotSpeed;
	var ySpeed = Math.sin(shotAngle)*shotSpeed;

	shotVector = vec2(xSpeed, ySpeed);

	// Generate starting position relative to paddle.
	xInit = (paddle[0][0]+paddle[2][0])/2;
	yInit = (paddle[1][1]+paddle[2][1])/2;

	shotCenter = vec2(xInit+shotRadius, yInit+shotRadius);

	createShotVertices(shotCenter, shotRadius);
	//shot = [
			//vec2(xInit - 0.02, yInit),
			//vec2(xInit + 0.02, yInit),
			//vec2(xInit + 0.02, yInit + 0.04),
			//vec2(xInit - 0.02, yInit + 0.04),
		//];
	
	gl.bindBuffer( gl.ARRAY_BUFFER, shotBuffer )
	gl.bufferData( gl.ARRAY_BUFFER, flatten(shot), gl.DYNAMIC_DRAW );
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.uniform4fv( locColor, flatten(shotColor) );
	gl.drawArrays( gl.TRIANGLE_FAN, 0, shotCirclePoints+2 );
}

function shotWallCollision() {
	// Wall collision checks
 	if (shotCenter[0] - shotRadius < -1 || shotCenter[0] + shotRadius > 1) {
		shotVector[0] *= -1;
	}

	if (shotCenter[1] + shotRadius > 1) {
		shotVector[1] *= -1;
	}

	if (shotCenter[1] - shotRadius < -1) {
		shotFired = false;
	}
}

function shotPaddleCollision() {
	// Paddle collison checks
	if (paddle[0][1] < shotCenter[1] && shotCenter[1] - shotRadius <= paddle[1][1]) {
		if (paddle[0][0] <= shotCenter[0] && shotCenter[0] <= paddle[2][0]) {
			// TODO: collison;
			console.log('Collided!')
			shotVector[1] *= -1;
		}
	}
}

function updateShot() {
	shotCenter = vec2(shot[0][0] + shotVector[0],
										shot[0][1] + shotVector[1])
	
	createShotVertices(shotCenter, shotRadius);

	shotWallCollision();
	shotPaddleCollision();
	
	gl.bindBuffer( gl.ARRAY_BUFFER, shotBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(shot), gl.DYNAMIC_DRAW );
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.uniform4fv( locColor, flatten(shotColor) );
	gl.drawArrays( gl.TRIANGLE_FAN, 0, shotCirclePoints+2 );
}
 
function render() {
	gl.clear( gl.COLOR_BUFFER_BIT |  gl.DEPTH_BUFFER_BIT);

	gl.bindBuffer( gl.ARRAY_BUFFER, paddleBuffer )
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.uniform4fv( locColor, flatten(paddleColor) );
	gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );

	drawBoxes();

	if (shotFired) {
		updateShot();
	}

	window.requestAnimFrame(render);
}
