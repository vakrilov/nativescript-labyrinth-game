import Physics = require("nativescript-physics-js");
import application = require('application');
import accService = require("native-script-accelerometer");
import { Page } from "ui";


const gravity_scale = 0.003;

var init = false;
var gameEnded = false;

var gravity;
var page: Page; 
export function pageLoaded(args) {
    if (init) {
        return;
    }
    init = true; 
    
    // Get references to container and meta-info views
    page = args.object;
    var container = page.getViewById("container");
    var metaText = page.getViewById("meta");
    
    // Create physics world and configure NS renderer
    var world = Physics({sleepDisabled: true});
    world.add(Physics.renderer('ns', {
        container: container,
        metaText: metaText,
        meta: true
    }));
    
    addWall(world, 5, 150, 10, 300);
    addWall(world, 295, 150, 10, 300);
    addWall(world, 150, 5, 300, 10);
    addWall(world, 150, 295, 300, 10);
    addWall(world, 150, 225, 10, 150); // Middle
    
    addTarget(world, 225, 225);
    addBall(world, 50, 250);

    var query = Physics.query({
        $or: [
            { bodyA: { label: 'ball' }, bodyB: { label: 'target' } }
            ,{ bodyB: { label: 'target' }, bodyA: { label: 'ball' } }
        ]
    });

    world.on('collisions:detected', function( data, e ){
        // find the first collision that matches the query
        var found = Physics.util.find( data.collisions, query );
        if ( found ){
            win(world);
        }
    });


    // Add behaviors
    gravity = Physics.behavior('constant-acceleration', { acc: { x: 0, y: 0 } });
    world.add([
        Physics.behavior('edge-collision-detection', { aabb: Physics.aabb(0, 0, 300, 300) }),
        Physics.behavior('body-collision-detection'),
        Physics.behavior('body-impulse-response'),
        Physics.behavior('sweep-prune'),
        gravity
    ]);

    setTimeout(function() {
        try {
            accService.startAccelometerUpdates(gravityUpdate);
        }
        catch (ex) {
            alert(ex.message)
        }
    }, 100);


    // Start ticking...
    world.on('step', function() { world.render() });
    setInterval(function() { world.step(Date.now()); }, 20);
}

function addWall(world, x: number, y: number, width: number, height:number, angle: number = 0){
      world.add(Physics.body('rectangle', { 
        treatment: 'static',
        x: x,
        y: y,
        width: width,
        height: height,
        angle: angle,
        styles: { color: "orange" }
    }));  
}

function addBall(world, x: number, y: number){
    var ball = Physics.body('circle', {
        label: "ball",
        x: x,
        y: y,
        radius: 15,
        styles: { image: "~/images/ball.png" }
    });
    ball.restitution = 0.3;

    world.add(ball);
}

function addTarget(world, x: number, y: number){
    world.add(Physics.body('circle', {
        label: "target",
        treatment: 'static',
        x: x,
        y: y,
        radius: 20,
        styles: { image: "~/images/target.png" }
    }));
}

function gravityUpdate(data) {
    //console.log("data: " + JSON.stringify(data));
    var xAcc = -data.x * gravity_scale;
    var yacc = data.y * gravity_scale;
    gravity.setAcceleration({ x: xAcc, y: yacc });
}

function win(world){
    if(!gameEnded){
        gameEnded = true;
        world.pause();
        accService.stopAccelometerUpdates();
        page.getViewById("win").visibility = "visible";
    }
}