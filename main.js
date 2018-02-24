var AM = new AssetManager();
var sheetHeight = 600;
var gameScore = 0;
var bound_box = false;
//var bound_box = true; //To test
var gameEngine = new GameEngine();


function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, frameDuration, frames, loop, reverse) {
    this.spriteSheet = spriteSheet;
    this.startX = startX;
    this.startY = startY;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight = frameHeight;
    this.frames = frames;
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.reverse = reverse;
}

Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
        }
    } else if (this.isDone()) {
        return;
    }
    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var vindex = 0;
    if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) {
        index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
        vindex++;
    }
    while ((index + 1) * this.frameWidth > this.spriteSheet.width) {
        index -= Math.floor(this.spriteSheet.width / this.frameWidth);
        vindex++;
    }

    var locX = x;
    var locY = y;
    var offset = vindex === 0 ? this.startX : 0;
    ctx.drawImage(this.spriteSheet,
                  index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  locX, locY,
                  this.frameWidth * scaleBy,
                  this.frameHeight * scaleBy);
}

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
}

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
}

// no inheritance
function Background(game, spritesheet) {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.spritesheet = spritesheet;
    this.game = game;
    this.ctx = game.ctx;
};

Background.prototype.draw = function () {
    this.ctx.drawImage(this.spritesheet, this.x, this.y);
};

Background.prototype.update = function () {
}

function BoundingBox(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.left = x;
    this.top = y;
    this.right = this.left + width;
    this.bottom = this.top + height;
}

BoundingBox.prototype.collide = function (oth) {
    if (this.right > oth.left && this.left < oth.right && this.top < oth.bottom && this.bottom > oth.top) return true;
    return false;
}

function Score(game, score, color, x, y) {
	this.color = color;
	this.x = x;
	this.y = y;
	this.ctx = game.ctx;
	this.score = score;
	this.ctx.font = "15px Arial";
	this.ctx.fillStyle = color;
	this.ctx.fillText("SCORE: " + this.score, this.x, this.y);
	Entity.call(this, game, x, y);
}

//Score.prototype = new Entity();
Score.prototype.constructor = Score;
Score.prototype.update = function() {
	gameScore += Math.floor(background_speed) * multiplier;
	this.score = gameScore
	this.ctx.fillText("SCORE: " + this.score, this.x, this.y);
	//Entity.prototype.update.call(this);
};
Score.prototype.draw = function() {
	this.ctx.fillText("SCORE: " + this.score, this.x, this.y);
};

function gameOver(game, img, x, y) {
	this.img = img;
	this.x = x;
	this.y = y;
	Entity.call(this, game, x, y);
}

gameOver.prototype = new Entity();
gameOver.prototype.constructor = gameOver;

gameOver.prototype.update = function() {
	if (this.game.running && this.game.over) {
		this.game.running = false;
	}
}

gameOver.prototype.draw = function(ctx) {
	if(!this.game.running && !this.game.noSG) return;
	if(!this.game.running && this.game.over) { //need variable for when pepsi man is caught
		ctx.drawImage(this.img, this.x, this.y);
		ctx.font = "15pt Arial";
		ctx.fillStyle = "black";
		ctx.fillText("YOU GOT COKED!", 112, 100);
		ctx.fillText("Your Score: " + gameScore, 112, 150); //Need to add score variable, need to pass in score parameter?
		ctx.font = "20pt Arial";
		ctx.fillText("COKE HAS TAKEN OVER!", 40, 550);
	}

}

//original animation spritesheet, 189, 230, 5, 0.10, 14, true,1
function PepsiMan(game, spritesheet) {
    this.animation = new Animation(spritesheet, 0, 0, 338, 540, 0.05, 14, true);
    this.x = 500;
    this.y = 150;
    this.speed = 4;
    this.game = game;
    this.ctx = game.ctx;
	this.boundingbox = new BoundingBox(this.x, this.y, this.animation.frameWidth, this.animation.frameHeight);
}

PepsiMan.prototype.draw = function () {
	if (bound_box) {
//      this.ctx.strokeStyle = "red";
//      this.ctx.strokeRect(this.x, this.y, this.animation.frameWidth, this.animation.frameHeight);
      this.ctx.strokeStyle = "yellow";
      this.ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
  }
	this.animation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y, 0.2);
}

PepsiMan.prototype.update = function () {
//    gameEngine.addEntity(new Bullet(gameEngine, AM.getAsset("./img/pep16v2.png"), this));
    for (var i = 0; i < this.game.asteroids.length; i++) {
    	var ob = this.game.asteroids[i];
    	if(ob instanceof Meteor && this.boundingbox.collide(ob.boundingbox) && ob.live) {
    		this.y += this.game.clockTick * ob.speed;
    		this.stuck = true;
    		this.spike = ob;
		}
    }
}

function Meteor (game, spritesheet, lane) {
	this.animation = new Animation(spritesheet, 0, 990, 320, 185, .03, 14, true, false);
	this.speed = 120;
	this.ctx = game.ctx;
	this.live = true;
	if (lane === left_lane) {
    	Entity.call(this, game, 80, -200);
    } else if (lane === middle_lane) {
    	Entity.call(this, game, 170, -200);
    } else {
    	Entity.call(this, game, 257, -200);
    }
	this.boundingbox = new BoundingBox(this.x, this.y , this.animation.frameWidth - 255, this.animation.frameHeight - 148);
};

Meteor.prototype = new Entity();
Meteor.prototype.constructor = Meteor;

Meteor.prototype.update = function() {
	this.speed =  115 * background_speed;
	this.y += this.game.clockTick * this.speed;
	this.boundingbox = new BoundingBox(this.x, this.y , this.animation.frameWidth - 255, this.animation.frameHeight - 148);
	Entity.prototype.update.call(this);
};

Meteor.prototype.draw = function () {
	if (bound_box) {
//      this.ctx.strokeStyle = "red";
//      this.ctx.strokeRect(this.x, this.y, this.animation.frameWidth, this.animation.frameHeight);
      this.ctx.strokeStyle = "yellow";
      this.ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
  }
	if(this.live){
		this.animation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y, 0.2);//0.4
	    Entity.prototype.draw.call(this);
	}

};

function Asteroid_Spawner(game, spritesheet) {
	this.asteroids = [];
	this.game = game;
	this.spritesheet = spritesheet;
	this.counter = 0;
	this.previous = -1;
};

Asteroid_Spawner.prototype = new Entity();
Asteroid_Spawner.prototype.constructor = Asteroid_Spawner;

Asteroid_Spawner.prototype.update = function () {
	this.asteroids.push(new Meteor(this.game, this.spritesheet, current_lane));
	var numAsteroid = this.asteroids.length;
	for(i = 0; i < numAsteroid; i++) {
		this.asteroids[i].update();
	}
	this.counter++;
};

Asteroid_Spawner.prototype.draw = function () {
	var numAsteroid = this.asteroids.length;
	for(i = 0; i < numAsteroid; i++) {
		this.asteroids[i].draw();
	}
};

// bullet
function Bullet(game, spritesheet, ship) {
    this.animation = new Animation(spritesheet, 0, 0, 155.75, 156, 0.05, 16, true, true);
    this.x = ship.x + 20;
    this.y = ship.y - 5;
    this.speed = 4;
    this.game = game;
    this.live = true;
    this.ctx = game.ctx;
	this.boundingbox = new BoundingBox(this.x, this.y, this.animation.frameWidth, this.animation.frameHeight);
}

Bullet.prototype.draw = function () {
	if (bound_box) {
      this.ctx.strokeStyle = "yellow";
      this.ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
	}
	if(this.live){
	this.animation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y, 0.15);
	}
}

Bullet.prototype.update = function () {
	this.boundingbox = new BoundingBox(this.x, this.y + 4, this.animation.frameWidth - 130, this.animation.frameHeight - 80);
	for (var i = 0; i < this.game.asteroid.length; i++) {
		var ob = this.game.asteroid[i];
		if(ob instanceof Meteor && this.boundingbox.collide(ob.boundingbox) && this.live && ob.live) {
			this.live = false;
			ob.live = false;
		}
	}
}

AM.queueDownload("./img/bg3.png");


AM.downloadAll(function () {
    var canvas = document.getElementById("gameWorld");
    var ctx = canvas.getContext("2d");
//    var gameEngine = new GameEngine();


    gameEngine.running = false;
    gameEngine.over = false;
    gameEngine.noSG = false;
    var SG = new startScreen(gameEngine, AM.getAsset("./img/newpepsi.jpg"), 0, 0);
    gameEngine.addEntity(SG);
    console.log(SG);

    var GO = new gameOver(gameEngine, AM.getAsset("./img/newcoke.jpg"), 0, 0);
    gameEngine.addEntity(GO);
    console.log(GO);

    gameEngine.init(ctx);
    gameEngine.start();
    var powerups = new Powerup_Spawner(gameEngine, AM.getAsset("./img/Powerups.png"));
    var obstacleSpawner = new Obstacle_Spawner(gameEngine, AM.getAsset("./img/obstacles.png"));
    chaser = new OminousFigure(gameEngine, AM.getAsset("./img/coke_sideways_figure.png"));
    gameEngine.addEntity(new Background(gameEngine, AM.getAsset("./img/bg3.png")));
    gameEngine.addEntity(obstacleSpawner);
    gameEngine.obstacles = obstacleSpawner.obstacles;
    gameEngine.addEntity(powerups);
    gameEngine.powerups = powerups.powerups;
    gameEngine.addEntity(new PepsiMan(gameEngine, AM.getAsset("./img/theboy.png")));
    gameEngine.addEntity(chaser);
    //gameEngine.addEntity(new Bullet(gameEngine, AM.getAsset("./img/pep16v2.png")));
    gameEngine.addEntity(new Score(gameEngine, gameScore, "yellow", 280, 480));
    gameEngine.addEntity(new LevelDisplay(gameEngine, "yellow", 170, 200));

    console.log("All Done!");
});
