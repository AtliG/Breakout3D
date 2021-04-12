/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir notkun á lyklaborðsatburðum til að hreyfa spaða
//
//    Hjálmtýr Hafsteinsson, janúar 2021
/////////////////////////////////////////////////////////////////
var canvas;
var gl;
var vPosition;
var colorLoc;
var cubeBuffer;
var numVertices = 6;

var halfWidth = 15;
var depth = 50;
var height = 10;

// Hnútar veggsins
var vertices = [
    vec4( -halfWidth,  0.0, 0.0, 1.0 ),
    vec4(  halfWidth,  0.0, 0.0, 1.0 ),
    vec4(  halfWidth,  1.0, 0.0, 1.0 ),
    vec4(  halfWidth,  1.0, 0.0, 1.0 ),
    vec4( -halfWidth,  1.0, 0.0, 1.0 ),
    vec4( -halfWidth,  0.0, 0.0, 1.0 ),
// Hnútar gólfsins (strax á eftir)
    vec4( -halfWidth,  0.0, 10.0, 1.0 ),
    vec4(  halfWidth,  0.0, 10.0, 1.0 ),
    vec4(  halfWidth,  0.0,  0.0, 1.0 ),
    vec4(  halfWidth,  0.0,  0.0, 1.0 ),
    vec4( -halfWidth,  0.0,  0.0, 1.0 ),
    vec4( -halfWidth,  0.0, 10.0, 1.0 )
];

// Mynsturhnit fyrir vegg
var texCoords = [
    vec2(  0.0, 0.0 ),
    vec2( 10.0, 0.0 ),
    vec2( 10.0, 3.0 ),
    vec2( 10.0, 3.0 ),
    vec2(  0.0, 3.0 ),
    vec2(  0.0, 0.0 ),
// Mynsturhnit fyrir gólf
    vec2(  0.0,  0.0 ),
    vec2( 10.0,  0.0 ),
    vec2( 10.0, 10.0 ),
    vec2( 10.0, 10.0 ),
    vec2(  0.0, 10.0 ),
    vec2(  0.0,  0.0 )
];


var zView = 5.0;        // Staðsetning áhorfanda í z-hniti
var yView = 10.0;
var xView = 0.0;
var eyesep = 0.09;
var proLoc;
var mvLoc;

var gameOver = false;
var lives = 3;
var paddleZ = 0.5
var paddleColor = vec4(1.0, 0.0, 0.0, 1.0);
var xmove = 0.0;

var numVerticesCube = 36;
var cubeVertices = [
    // front side:
    vec3( -0.5,  0.5,  0.5 ), vec3( -0.5, -0.5,  0.5 ), vec3(  0.5, -0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ), vec3(  0.5,  0.5,  0.5 ), vec3( -0.5,  0.5,  0.5 ),
    // right side:
    vec3(  0.5,  0.5,  0.5 ), vec3(  0.5, -0.5,  0.5 ), vec3(  0.5, -0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 ), vec3(  0.5,  0.5, -0.5 ), vec3(  0.5,  0.5,  0.5 ),
    // bottom side:
    vec3(  0.5, -0.5,  0.5 ), vec3( -0.5, -0.5,  0.5 ), vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5, -0.5, -0.5 ), vec3(  0.5, -0.5, -0.5 ), vec3(  0.5, -0.5,  0.5 ),
    // top side:
    vec3(  0.5,  0.5, -0.5 ), vec3( -0.5,  0.5, -0.5 ), vec3( -0.5,  0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ), vec3(  0.5,  0.5,  0.5 ), vec3(  0.5,  0.5, -0.5 ),
    // back side:
    vec3( -0.5, -0.5, -0.5 ), vec3( -0.5,  0.5, -0.5 ), vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ), vec3(  0.5, -0.5, -0.5 ), vec3( -0.5, -0.5, -0.5 ),
    // left side:
    vec3( -0.5,  0.5, -0.5 ), vec3( -0.5, -0.5, -0.5 ), vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5,  0.5 ), vec3( -0.5,  0.5,  0.5 ), vec3( -0.5,  0.5, -0.5 )
];

var shotPosX = 0.0;
var shotPosZ = -1.1;
var shotColor = vec4(0.0, 0.0, 1.0, 1.0);

var shotAngle = 0.0;
var shotSpeed = 0.2;
var shotVector;
var shotFired = false;

var boxBuffer;
var boxes = [];
var numOfBoxes = 8;
var boxColor = vec4(0.0, 1.0, 0.0, 1.0);
var boxGrid = [
    // Top row:
    [vec2( -9.55, -45.0 ), vec2( -7.1, -45.0 ), vec2( -4.65, -45.0 ),
    vec2( -2.2, -45.0 ), vec2(  0.45,  -45.0 ), vec2( 2.9,  -45.0 ),
    vec2(  5.35,  -45.0 ), vec2(  7.8, -45.0 )],
    // Second row:
    [vec2( -9.55,  -40.0 ), vec2( -7.1, -40.0 ), vec2( -4.65, -40.0 ),
    vec2( -2.2, -40.0 ), vec2(  0.45,  -40.0 ), vec2( 2.9,  -40.0 ),
    vec2(  5.35,  -40.0 ), vec2(  7.8, -40.0 )],
    // Third row:
    [vec2( -9.55,  -35.0 ), vec2( -7.1, -35.0 ), vec2( -4.65, -35.0 ),
    vec2( -2.2, -35.0 ), vec2(  0.45,  -35.0 ), vec2( 2.9,  -35.0 ),
    vec2(  5.35,  -35.0 ), vec2(  7.8, -35.0 )],
		// Fourth row:
    [vec2( -9.55,  -30.0 ), vec2( -7.1, -30.0 ), vec2( -4.65, -30.0 ),
    vec2( -2.2, -30.0 ), vec2(  0.45,  -30.0 ), vec2( 2.9,  -30.0 ),
    vec2(  5.35,  -30.0 ), vec2(  7.8, -30.0 )],

];

function fillBoxGrid() {
	numOfBoxes = Math.ceil(Math.random()*(20-10)+10);

	var gridSlots = [];

	for(var i = 0; i < numOfBoxes; i++) {
		var randomRow = Math.floor(Math.random()*4);
		var randomCol = Math.floor(Math.random()*8);

		while (gridSlots.includes([randomRow, randomCol])) {
			randomRow = Math.floor(Math.random()*3);
			randomCol = Math.floor(Math.random()*8);
		}

		gridSlots.push([randomRow, randomCol])
		
		var box = {
			offset: boxGrid[randomRow][randomCol],
			isShot: false
		};

		boxes.push(box);
	}
}

var frameBuffer;

var frame = [
  vec4(-15.0, -20.0,  5.0, 1.0),
  vec4(-15.0, -10.0,  5.0, 1.0),
  vec4( 15.0, -10.0,  5.0, 1.0),
  vec4( 15.0, -20.0,  5.0, 1.0),
  vec4(-15.0, -20.0, -50.0, 1.0),
  vec4(-15.0, -10.0,  -50.0, 1.0),
  vec4( 15.0, -10.0,  -50.0, 1.0),
  vec4( 15.0, -20.0, -50.0, 1.0)
];

var lines = [frame[0], frame[1], frame[2], frame[3], frame[3], frame[0],
             frame[4], frame[5], frame[5], frame[6], frame[6], frame[7], frame[7], frame[4],
             frame[0], frame[4], frame[1], frame[5], frame[2], frame[6], frame[3], frame[7]
            ];

window.onload = function init() {

	canvas = document.getElementById( "gl-canvas" );
	
	gl = WebGLUtils.setupWebGL( canvas );
	if ( !gl ) { alert( "WebGL isn't available" ); }
	
	fillBoxGrid();

	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

	gl.enable(gl.DEPTH_TEST);

	//
	//  Load shaders and initialize attribute buffers
	//
	var program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );

	cubeBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cubeVertices), gl.DYNAMIC_DRAW );

	frameBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, frameBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(lines), gl.STATIC_DRAW )

	// Load the data into the GPU
	// Associate out shader variables with our data buffer
	vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );

	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
	
	var tBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );

	proLoc = gl.getUniformLocation( program, "projection" );
	mvLoc = gl.getUniformLocation( program, "modelview" );
	colorLoc = gl.getUniformLocation(program, "rColor")
	
	// Setjum ofanvarpsfylki hér í upphafi
	var proj = perspective( 100.0, 0.9, 1.0, 500.0 );
	gl.uniformMatrix4fv(proLoc, false, flatten(proj));
	
	// Event listener for keyboard
	window.addEventListener("keydown", function(e){
		switch( e.keyCode ) {
			case 32:
				spawnShot();
				shotFired = true;
				return;
			case 37:	// vinstri ör
				xmove += -0.24;
				break;
			case 39:	// hægri ör
				xmove += 0.24;
				break;
		}
	} );

	render();
}

function paddleWallCollision() {
	if(xmove-2.5-0.1 <= -halfWidth) {
		xmove = -halfWidth +2.6;
	}

	if(xmove+2.5-0.1 >= halfWidth) {
		xmove = halfWidth - 2.4;
	}
}

function drawPaddle(mv) {
	gl.uniform4fv( colorLoc, paddleColor );
	
	gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

	paddleWallCollision();

	mv = mult( mv, translate( xmove, -20.0, paddleZ ) );
	mv = mult( mv, scalem( 5.0, 1.0, 1.0 ) );

	gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
	gl.drawArrays( gl.TRIANGLES, 0, numVerticesCube );
}

function drawBox(mv, offset) {
	gl.uniform4fv( colorLoc, boxColor );
	
	gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

	mv = mult(mv, translate(offset[0], -20.0, offset[1]));
	mv = mult(mv, scalem(2.0, 1.0, 1.0));


	gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
	gl.drawArrays( gl.TRIANGLES, 0, numVerticesCube );

}

function drawBoxes(mv) {
	for (var i = 0; i < numOfBoxes; i++) {
		var box = boxes[i];
		if (!box.isShot) {
			drawBox(mv, box.offset);
		}
	}
}

function spawnShot() {
	if (shotFired) {
		return;
	}

	shotAngle = Math.floor(Math.random()*(110 - 70) + 70);
	shotAngle = shotAngle*(Math.PI/180);

	var xSpeed = Math.cos(shotAngle)*shotSpeed;
	var zSpeed = -Math.sin(shotAngle)*shotSpeed;

	shotVector = vec2(xSpeed, zSpeed);

	shotPosX = xmove;
}

function shotWallCollision() {
	// Wall collision checks
 	if (shotPosX < -halfWidth || shotPosX > halfWidth) {
		if(shotVector[0] < 0) console.log('Hit left wall!')
		else console.log('Hit right wall!')
		shotVector[0] *= -1;
	}

	if (shotPosZ < -50) {
		console.log('Hit back wall!')
		shotVector[1] *= -1;
	}

	if (shotPosZ > 5) {
		console.log('Oh no, hit bottom!');
		lives -= 1
		if (lives < 1) {
			gameOver = true;
		}
		shotFired = false;
		shotPosZ = -1.1;
		shotPosX = 0.0;
	}
}

function shotPaddleCollision() {
	// Paddle collison checks
	if (paddleZ - 0.5 <= shotPosZ  && shotPosZ <= paddleZ + 0.5) {
		if (xmove - 2.5 - 0.1 <= shotPosX && shotPosX <= xmove + 2.5 - 0.1) {
			console.log('Collided!')
			shotVector[1] *= -1;
		}
	}
}

function shotBoxCollision() {
 	boxes.forEach((box) => {
		if (!box.isShot) {
			if (box.offset[1] - 0.5 <= shotPosZ && shotPosZ <= box.offset[1] + 0.5) {
				console.log('z position matches');
				if (box.offset[0] - 2 <= shotPosX && shotPosX <= box.offset[0] + 2) {
					shotVector[1] *= -1;
					box.isShot = true;
				}
			}
		}
	});
}

function updateShot(mv) {
	shotPosX += shotVector[0];
	shotPosZ += shotVector[1];
	gl.uniform4fv( colorLoc, shotColor );
	gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer);
	gl.vertexAttribPointer(vPosition, 3,gl.FLOAT, false, 0,0);

	mv = mult(mv, translate(shotPosX, -20.0, shotPosZ));

	gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
	gl.drawArrays( gl.TRIANGLES, 0, numVerticesCube );

	shotWallCollision();
	shotBoxCollision();
	shotPaddleCollision();
}

function checkIfGameOver() {
	var over = true;
	boxes.forEach((box) => {
		if (!box.isShot) {
			over = false;
			return;
		}
	});
	if (over) {
		gameOver = true;
	}
}

function drawFrame(mv) {
	gl.bindBuffer(gl.ARRAY_BUFFER, frameBuffer);
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

	gl.uniform4fv( colorLoc, vec4(1.0, 1.0, 1.0, 1.0) );
	gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
	gl.drawArrays(gl.LINES, 0, 22);
}

function render() {
	gl.clear( gl.COLOR_BUFFER_BIT |  gl.DEPTH_BUFFER_BIT);

	mv = lookAt( vec3(xView, yView, zView),
								vec3(0.0, 1.0, 0.0),
								vec3(0.0, 1.0, 0.0) );
	gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

	document.getElementById("Lives").innerHTML = "Lives left: " + lives;

	drawFrame(mv);

	drawPaddle(mv);

	if (!gameOver) {

		drawBoxes(mv);

		if (shotFired) {
			updateShot(mv);
		}

		checkIfGameOver();
	}

	requestAnimFrame( render );
}
