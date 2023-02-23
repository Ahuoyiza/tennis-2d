var tennisCanvas = document.getElementById('tennisCanvas');
var context2D = tennisCanvas.getContext('2d'); 
var tennis_bg = document.getElementById('tennis_bg');
var tennisContext_bg = tennis_bg.getContext('2d');

var tennisBall;
var bouncingSurfaces; //walls;
var tableTop, bat, net, floor;
var m = 1;
var g = 200;
var vfac = 0.9;
//var vfac = 1;
var t0;
var dt;
var force;
var acc;
var animId;
// table model
var tableX1, tableY1, tableX2, tableY2;
var floorX1, floorY1, floorX2, floorY2;
var netX1, netY1, netX2, netY2;
var batX1, batX2, batY1, batY2; // coordinates of the bat
var tennisLength = 300, tennisHeight = 75, batLength = 25, netHeight = 20;

var batHeight = 15; 
var ballSize = 3;

var scaleY , scaleX;

var playerOffset = 20;
var ballPosX, ballPosY; // intial position of ball;
// approximmate measurement in cm.
var offset
var screenNet;
var screenRatioX = 0.6, screenRatioY = 0.3; // percentage of space occupied by the table
// approximmate measurement in cm.
var batPosX, batPosY;
var screenX, screenY;
var batDir1, batDir2;
// track the gesture oof the player. click, drag, and mouse up, time between mouse down 
// and up gives an idea of its velocity.
//var gestureTime1, gestureTime2; // the time for the gesture enables us calculate velocity
//var gestureVelocity;
//var gestureStart;

window.onload = init; 

function tennisSetup(){
// The ball will bounce on four primary surfaces: surfaces table top, floor, bat, and net. these will be set up
// lines or wall objects.

// scale the dimensions to fit the 60 percent of the screen, assumming the game will be played full screen most of the time
var device = document.querySelector('#tennisCanvas');
screenX = device.width;
screenY = device.height;
scaleX = Math.floor((screenX * screenRatioX)/tennisLength);
scaleY = Math.floor((screenY * screenRatioY)/tennisHeight);

var tempX = scaleX * tennisLength/2;
var screenMidX = screenX/2;  
tableX1 =  screenMidX - tempX; // left end of table
tableX2 =  screenMidX  + tempX;// right end of table

tableY1 = tableY2 = screenY - (scaleY*tennisHeight);
// screen numbering starts top to down, so the max screen point is at the bottom for web canvas element. Subtractiing
// the height of the table from the screen height gives the Y postion of the tennis board and since it is horizontal, it
// Y1 and Y2 have the same value.

netX1 = netX2 = screenMidX;
netY1 = tableY1;
screenNet = (netHeight * scaleY);
netY2 = tableY1 - screenNet; 
// net starts at the middle of the screen, its height is the height of the net and the table.

ballRadius = ballSize * (scaleX + scaleY)/2;

offset = playerOffset * scaleX;
ballPosX = tableX1 - offset;
ballPosY = 4 * ballRadius; // just touching the top of the screen.
// initial postion of the ball .
/*================================================================
batX1 = ballPosX - offset/2; 
batY1 = netY2 - screenNet;

batX2 = batX1;
batY2 = batY1 - (batHeight * scaleY);
// the initial screen postion of the bat is twice the height of the net from the board.
// the bat is defined in its local dimension, since it is moveable, it can be positioned anywhere. its original
// orientation is vertical the bottom being at (0,0) local coordinates while the top is at (0, batHeight* scaleY)

//batX1 = tableX1 - playerOffset , batX2 = 0
// batX1 + playerOffset * (right - left); right/left is 1 or zero
======================================================================*/
floorX1 = 0, floorX2 =  screenX; 
floorY1 = floorY2 = screenY; // the last bounce surface is at the bottom of the creen.

}

function init() {
// get the size of the canvas and use 60 percent of it as the size of the table and 30 percent of the height as the
// height of the table. 
// Standard table size : 274.5 x 152.5 x 74.5 , assume 300 x 150 x 75 and use these ratios

    tennisSetup();
	
	tennisBall = new Ball(ballRadius,'#0000ff',m,0,true);
	tennisBall.pos2D = new Vector2D(ballPosX,ballPosY);	
	tennisBall.draw(context2D);
	 
	bouncingSurfaces = new Array();
    
	tableTop = new Wall(new Vector2D(tableX1,tableY1),new Vector2D(tableX2,tableY2));
	
	tableTop.draw(tennisContext_bg);
	bouncingSurfaces.push(tableTop);
	tableTop.hit = false;
	tableTop.name = "table";
    
	//remember to remove this after coding================================
	var temp2 = new Wall( new Vector2D(screenX,0), new Vector2D(screenX,screenY));
	temp2.draw(tennisContext_bg);
	bouncingSurfaces.push(temp2);

	net = new Wall(new Vector2D(netX1,netY1),new Vector2D(netX2,netY2));
  	net.hit = false;
	net.name = "net";

    net.draw(tennisContext_bg);
	bouncingSurfaces.push(net);
	// wall 3
	floor = new Wall(new Vector2D(floorX1,floorY1),new Vector2D(floorX2,floorY2));
	floor.draw(tennisContext_bg);
	bouncingSurfaces.push(floor);
	// wall 4
	/*
	bat = new Wall(new Vector2D(batX1,batY1),new Vector2D(batX2,batY2));
    bat.draw(context2D);
	bouncingSurfaces.push(bat);
	*/
	initBat();
	// check which side of the wall the ball is
	checkSide();
	//set up event listener	
	addEventListener('mousedown',onDown,false);
	addEventListener('mousemove',onMouseMove,false);
	addEventListener('mouseup',onUp,false);
	// make the ball move
	initAnim();
}

function initBat(){

	var X1 = ballPosX - offset/2; 
	var Y1 = netY2 - screenNet;
	
	var X2 = X1;
    var scrHeight = (batHeight * scaleY);
	var Y2 = Y1 - scrHeight;

    
	bat = new Wall(new Vector2D(X1,Y1),new Vector2D(X2,Y2));
	
	bat.gestureStart = bat.swing = false;
	bat.hit= false; // add this flag to the whole wall class.
	bat.moved = 0;
	bat.height = scrHeight;
	bat.mass = 30; // ratio of ball mass to bat mass
	var wallName = "name";
	bat.name = wallName; // to know when the bat was hit.
	bat.draw(context2D);
	bouncingSurfaces.push(bat);
}
function checkSide(){
	for (var i=0; (i<bouncingSurfaces.length); i++){
		var wall = bouncingSurfaces[i];	
		var wdir = wall.dir;			   
		var ballp1 = wall.p1.subtract(tennisBall.pos2D);
		var proj1 = ballp1.projection(wdir);                
		var dist = ballp1.addScaled(wdir.unit(), proj1*(-1));   
		setSide(dist,wall);
	}
}		
function setSide(dist,wall){
	if (dist.dotProduct(wall.normal) > 0){
		wall.side = 1;
	}else{
		wall.side = -1;
	}
}	
function onDown(evt){
	//tennisBall.velo2D = new Vector2D(0,0);
	//addEventListener('mouseup',onUp,false);	
	//tennisBall.radius = 1;	
	
	// if batSwing is off ( finished) , clicking again gives u the start of another swing
	bat.batDir1 = new Vector2D(evt.clientX,evt.clientY);
	bat.velocity = new Vector2D(0,0);	
	//addEventListener('mousemove',onMouseMove,false);
	//stop();	
	bat.gestureStart = true; 
	bat.swing = false;
	bat.moved = 0;

	t =  new Date().getTime();	// optimize to avoid creating new dates and vectors.
	bat.gestureTime1 = t;
}

function onUp(evt){

	/*============================Remember to implement=================================================
	// When the swipe or gesture vector is reversed, x2 < x1, the bat should be drawn parrallel to the 
	// swipe vector and this move should apply a rotational torque on the ball equal to the swipe magnitude 
	// multiplied by the radius of the ball. This should cause the ball to rotate in the browser window and 
	// also cause a modification of the force calculation. Total force = linear mv and rotational kinetic.
	======================================================================================================  */
	if( bat.gestureStart ){
		
		bat.batDir2 = new Vector2D(evt.clientX,evt.clientY);
		
		var temp = new Date().getTime();
		bat.gestureTime2 = temp;
		var elapsedTime = 0.001* (bat.gestureTime2 - bat.gestureTime1);

		
		bat.displacement = new Vector2D(bat.batDir2.x - bat.batDir1.x, bat.batDir2.y - bat.batDir1.y);
		 
		var t = bat.displacement.clone();
		bat.velocity = t;
		
		var b;
		if( elapsedTime > 0 && bat.velocity.length() != 0){
		    b = bat.displacement.multiply(1/elapsedTime);
		bat.velocity = b;
		}
		
		

		if(bat.batDir1.x > bat.batDir2.x){
			console.log("revere hit")
			return;
		}
		
		//gestureForce = gestureVelocity.length/elapsedTime; 
		// a measure of the force . Since F = ma, a = f/m. 
        
		// calculate the orientation of the bat, which is perpendicular to this vector
			//bat.orientation = bat.displacement.perp(1,0).
			bat.orientation = new Vector2D(-bat.displacement.y, bat.displacement.x);
			bat.orientation = bat.orientation.unit(); //.multiply(bat.height/2).
			bat.orientation = bat.orientation.multiply(bat.height/2);
			
			bat.p2 = bat.batDir2.add( bat.orientation); 
			bat.p1 = bat.batDir2.addScaled(bat.orientation,-1);

			var momentum =  bat.velocity.unit().multiply(bat.velocity.length()); //  force transfer from bat is mass x velocity
			bat.impact = momentum;

			console.log("Forward hit", bat.velocity.x, bat.velocity.y, bat.impact.x, bat.impact.y);
	
		// add two differnt half-lines to the spot
		bat.gestureStart = false;
		bat.swing = true;
	}


    
	
	//removeEventListener('mouseup',onUp,false);
	//removeEventListener('mousemove',onMouseMove,false);
	
	checkSide();	
	//initAnim();		
}	

function onBatSwing()
{
	// Follow the vector from the point of mouse down 
	// batswing occurs on mouse up. check to add effects of rotaiton
	 	bat.draw(context2D);

 
}
function onMouseMove(evt){
	
	 
	//var dvec = new Vector2D(evt.clientX-tennisBall.x,evt.clientY-tennisBall.y);
	//batDir2 = new Vector2D(evt.clientX, evt.clientY);
	//tennisBall.radius = dvec.length();
	//moveObject(tennisBall);	
}
function initAnim(){
	t0 = new Date().getTime(); 
	animFrame();
}
function animFrame(){
	animId = requestAnimationFrame(animFrame,tennisCanvas);
	onTimer(); 
}
function onTimer(){
	var t1 = new Date().getTime(); 
	dt = 0.001*(t1-t0); 
	t0 = t1;
	if (dt>0.2) {dt=0;};	
	//dt = 0.1;
	
	move();
}
function move(){
    //moveObject(bat);	
    // the mousemove event should move the bat
    // all the gesture calculations should be done on the mouse event listeners.		
	moveObject(tennisBall);

	testBallBounce(tennisBall);
	
	onBatSwing(); 
	// swing the bat after the ball starts moving. move object clears the screeen
	// do not call before moveobject else it will not display.
	testBallBounce(tennisBall);
	calcForce();
	updateAccel();
	updateVelo(tennisBall);	
}
function moveObject(obj){
	obj.pos2D = obj.pos2D.addScaled(obj.velo2D,dt);	
	context2D.clearRect(0, 0, screenX, screenY);
	obj.draw(context2D);	// this context doesnt draw but the background does. recheck
	
	if(((obj.pos2D.x - obj.radius) > screenX) || (obj.pos2D.x + obj.radius) < 0 )
	{
		tennisBall.pos2D = new Vector2D(ballPosX,ballPosY);	
		tennisBall.velo2D = new Vector2D(0,0);	
		initAnim();

	} // use SCREENMIN for portability
	
	//bat.draw(context2D); // redraw bat because both ball and bat are on the same canvas.
}	
function testBallBounce(obj)
{
	var hasHitAWall = false;
	for (var i=0; (i<bouncingSurfaces.length && hasHitAWall==false); i++){
		var wall = bouncingSurfaces[i];		
		var  wdir = wall.dir;
		var ballp1 = wall.p1.subtract(obj.pos2D);
		var ballp2 = wall.p2.subtract(obj.pos2D);
		var proj1 = ballp1.projection(wdir);                
		var proj2 = ballp2.projection(wdir);
		var dist = ballp1.addScaled(wdir.unit(), proj1*(-1));
		var test = ((Math.abs(proj1) < wdir.length()) && (Math.abs(proj2) < wdir.length()));
		
		var testTunneling;	

		if (wall.side*dist.dotProduct(wall.normal) < 0){
			testTunneling = true;
		}else{
			testTunneling = false;
		}	
		setSide(dist,wall);	
		// confirm the side the normal is pointing relative to the ball.

		if (( (dist.length() < obj.radius) || (testTunneling) ) &&  test){
			var angle = Vector2D.angleBetween(obj.velo2D, wdir);
			var normal = wall.normal;
			if (normal.dotProduct(obj.velo2D) > 0){
				normal.scaleBy(-1);
			}
			var deltaS = (obj.radius+dist.dotProduct(normal))/Math.sin(angle);
			var displ = obj.velo2D.para(deltaS);
			obj.pos2D = obj.pos2D.subtract(displ);			
			var vcor = 1-acc.dotProduct(displ)/obj.velo2D.lengthSquared();
			var Velo = obj.velo2D.multiply(vcor);
			var normalVelo = dist.para(Velo.projection(dist));
			var tangentVelo = Velo.subtract(normalVelo);
			obj.velo2D = tangentVelo.addScaled(normalVelo,-vfac);
			if (testTunneling){
				wall.side *= -1;
			}
			hasHitAWall = true;
			wall.hit = true; // this attribute added by the bat prototype is added to the wall class.
		}
		else if (Math.abs(ballp1.length()) < obj.radius){
			bounceOffEndpoint(obj,wall.p1);
			hasHitAWall = true;
		}
		else if (Math.abs(ballp2.length()) < obj.radius){
			bounceOffEndpoint(obj,wall.p2);
			hasHitAWall = true;
		}	
	}
}

function bounceOffEndpoint(obj,pEndpoint){
	var distp = obj.pos2D.subtract(pEndpoint);
	// move particle so that it just touches the endpoint			
	var L = obj.radius-distp.length();
	var vrel = obj.velo2D.length();
	obj.pos2D = obj.pos2D.addScaled(obj.velo2D,-L/vrel);
	// normal velocity vector just before the impact
	var normalVelo = obj.velo2D.project(distp);
	// tangential velocity vector
	var tangentVelo = obj.velo2D.subtract(normalVelo);
	// normal velocity vector after collision
	normalVelo.scaleBy(-vfac);
	// final velocity vector after collision
	obj.velo2D = normalVelo.add(tangentVelo);			
}
function calcForce(){
	force = Forces.constantGravity(m,g);
	if(bat.hit)
	{
		force = Forces.add([force,bat.impact]);
		bat.hit = false;
	}
	
	// transfer the impact to the ball since
}	
function updateAccel(){
	acc = force.multiply(1/m);
}	
function updateVelo(obj){
	// this applies the standar Euler integeration. May need to siwth to 
	// second or fourth order Runge-Kutta integrator to improve efficency of the game
	// when the force on the bat is high.
	obj.velo2D = obj.velo2D.addScaled(acc,dt);				
}
function updateBatVelo()
{
	// remember effects of rotation and damping
}
function stop(){
	cancelAnimationFrame(animId);
}
