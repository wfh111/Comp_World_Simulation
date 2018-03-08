var socket = io.connect("http://24.16.255.56:8888");
var AM = new AssetManager();
var sheetHeight = 600;
var gameScore = 0;
var bound_box = false;
//var bound_box = true; //To test
var gameEngine = new GameEngine();
var asteroids_destroyed = 0;
var currentClosestDist = 1000;
var currentAsteroid = null;
var currentClosestPos = 2;
var bullets = [];
var asteroidSpawner;
var ship;



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
socket.on("load", function (theShip, theAsteroids, theScore, theBullets) {
	ship = theShip;
	asteroidSpawner = theAsteroids; 
	asteroids_destroyed = theScore;
	bullets = theBullets;
	for(i = 0; i < bullets.length; i++) {
		gameEngine.addEntity(bullets[i]);
	}
});

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
	if(!this.game.running || (!this.game.running && this.game.over)) return;
    this.ctx.drawImage(this.spritesheet, this.x, this.y);
};

Background.prototype.update = function () {
//	if(!this.game.running || (!this.game.running && this.game.over)) return;
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
	this.ctx.fillText("ASTEROIDS DESTROYED: " + this.score, this.x, this.y);
	Entity.call(this, game, x, y);
}

//Score.prototype = new Entity();
Score.prototype.constructor = Score;
Score.prototype.update = function() {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	this.score = asteroids_destroyed;
	this.ctx.fillText("ASTEROIDS DESTROYED: " + this.score, this.x, this.y);
	//Entity.prototype.update.call(this);
};
Score.prototype.draw = function() {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	this.ctx.fillText("ASTEROIDS DESTROYED: " + this.score, this.x, this.y);
};

function Info(game, color, x, y) {
	this.color = color;
	this.x = x;
	this.y = y;
	this.ctx = game.ctx;
	this.ctx.font = "15px Arial";
	this.ctx.fillStyle = color;
	this.ctx.fillText("Press S to SAVE", this.x, this.y);
	this.ctx.fillText("Press L to LOAD", this.x + 15, this.y + 15);
	Entity.call(this, game, x, y);
}

//Score.prototype = new Entity();
Info.prototype.constructor = Info;
Info.prototype.update = function() {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	//Entity.prototype.update.call(this);
};
Info.prototype.draw = function() {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	this.ctx.fillText("Press S to SAVE", this.x, this.y);
	this.ctx.fillText("Press L to LOAD", this.x, this.y + 15);
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
	if(!this.game.running && !this.game.noSG) return;
	if (this.game.running && this.game.over) {
		console.log("in game over update");
		this.game.running = false;
	}
}

gameOver.prototype.draw = function(ctx) {
	if(!this.game.running && !this.game.noSG) return;
	if(!this.game.running && this.game.over) { //need variable for when pepsi man is caught
		ctx.drawImage(this.img, this.x, this.y);
		ctx.font = "15pt Arial";
		ctx.fillStyle = "black";
		ctx.fillText("Game Over!", 390, 420);
		ctx.fillText("Asteroids destroyed: " + asteroids_destroyed, 390, 450); //Need to add score variable, need to pass in score parameter?
	}

}

//original animation spritesheet, 189, 230, 5, 0.10, 14, true,1
function Ship(game, spritesheet) {
    this.animation = new Animation(spritesheet, 0, 0, 398, 250, .08, 19, true);
    this.speed = 0;
    this.game = game;
    this.ctx = game.ctx;
    this.live = true;
    this.counter = 0;
    Entity.call(this, game, 410, 410);
	this.boundingbox = new BoundingBox(this.x, this.y, this.animation.frameWidth, this.animation.frameHeight);
}

Ship.prototype = new Entity();
Ship.prototype.constructor = Ship;

Ship.prototype.draw = function () {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	if (bound_box) {
      this.ctx.strokeStyle = "yellow";
      this.ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
  }
	this.animation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y, 0.3);
	Entity.prototype.draw.call(this);
}

Ship.prototype.update = function () {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	if(currentAsteroid != null && !currentAsteroid.live) {
		currentClosestDist = 1000;
	}
    for (var i = 0; i < this.game.asteroids.length; i++) {
    	var ob = this.game.asteroids[i];
    	if((ob instanceof Meteor || ob instanceof Meteor_Fast || ob instanceof Meteor_Slow) && this.boundingbox.collide(ob.boundingbox) && ob.live) {
    		this.live = false;
		}
    	if(ob.live) {
    		if((this.boundingbox.left - ob.boundingbox.right) < currentClosestDist && ob.pos === 0) {
    			currentClosestDist = this.boundingbox.left - ob.boundingbox.right;
    			currentAsteroid = ob;
        		currentClosestPos = ob.pos;
    		} 
    		if((this.boundingbox.top - ob.boundingbox.bottom) < currentClosestDist && ob.pos === 1) {
    			currentClosestDist = this.boundingbox.top - ob.boundingbox.bottom;
    			currentAsteroid = ob;
        		currentClosestPos = ob.pos;
    		} 
    		if((ob.boundingbox.left - this.boundingbox.right) < currentClosestDist && ob.pos === 2) {
    			currentClosestDist = ob.boundingbox.left - this.boundingbox.right;
    			currentAsteroid = ob;
        		currentClosestPos = ob.pos;
    		} 
    		if((ob.boundingbox.top - this.boundingbox.bottom) < currentClosestDist && ob.pos === 3) {
    			currentClosestDist = ob.boundingbox.top - this.boundingbox.bottom;
    			currentAsteroid = ob;
        		currentClosestPos = ob.pos;
    		}
    	}
    }
	if(this.counter % 60 === 0) {
		var b = new Bullet(gameEngine, AM.getAsset("./img/bullet.png"))
		bullets.push(b)
		gameEngine.addEntity(b);
	}
	this.boundingbox = new BoundingBox(this.x + 15, this.y + 15, this.animation.frameWidth - 315, this.animation.frameHeight - 215);
	if (!this.live) {
		this.game.over = true;
		this.game.noSG = true;
	}
	Entity.prototype.update.call(this);
	this.counter += 1;
	if(this.game.saveButton) {
		console.log("The save key was pressed");
		socket.emit("save", { studentname: "Walter Hanson", statename: "alpha", theShip: ship, theAsteroids: asteroidSpawner, theScore: asteroids_destroyed, theBullets: bullets });
	}
	if(this.game.loadButton) {
		console.log("The load key was pressed");
		socket.emit("load", { studentname: "Walter Hanson", statename: "alpha" });
	}
}

function Meteor_Slow (game, spritesheet, pos) {
	this.animation = new Animation(spritesheet, 0, 540, 480, 320, 1, 1, true, false);
	this.speed = 50;
	this.ctx = game.ctx;
	this.live = true;
	this.hp = 3;
	this.pos = pos;
	if (pos === 0) {
		Entity.call(this, game, -200, 410);
	} else if(pos === 1) {
		Entity.call(this, game, 425, -200);
	}else if(pos === 2) {
		Entity.call(this, game, 1000, 410);
	}else if(pos === 3) {
		Entity.call(this, game, 425, 1020);
	}
	this.boundingbox = new BoundingBox(this.x + 10, this.y + 2, this.animation.frameWidth - 420, this.animation.frameHeight - 250);
};

Meteor_Slow.prototype = new Entity();
Meteor_Slow.prototype.constructor = Meteor_Slow;

Meteor_Slow.prototype.update = function() {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	if(this.pos === 0) {
		this.x += this.game.clockTick * this.speed;
	} else if(this.pos === 1) {
		this.y += this.game.clockTick * this.speed;
	} else if(this.pos === 2) {
		this.x -= this.game.clockTick * this.speed;
	} else if(this.pos === 3) {
		this.y -= this.game.clockTick * this.speed;
	}
	this.boundingbox = new BoundingBox(this.x + 10, this.y + 2, this.animation.frameWidth - 420, this.animation.frameHeight - 250);
	if(this.hp === 0 && this.live) {
		this.live = false;
		asteroids_destroyed += 1;
	}
	Entity.prototype.update.call(this);
};

Meteor_Slow.prototype.draw = function () {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	if (bound_box) {
      this.ctx.strokeStyle = "yellow";
      this.ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
  }
	if(this.live){
		this.animation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y, 0.18);//0.4
	    Entity.prototype.draw.call(this);
	}

};

function Meteor_Fast (game, spritesheet, pos) {
	this.speed = 180;
	this.ctx = game.ctx;
	this.live = true;
	this.hp = 1;
	this.pos = pos;
	if (pos === 0) {
		this.animation = new Animation(spritesheet, 0, 2050, 970, 400, 1, 1, true, false);
		Entity.call(this, game, -200, 420);
	} else if(pos === 1) {
		this.animation = new Animation(spritesheet, 0, 2500, 400, 970, 1, 1, true, false);
		Entity.call(this, game, 440, -200);
	}else if(pos === 2) {
		this.animation = new Animation(spritesheet, 0, 0, 970, 400, 1, 1, true, false);
		Entity.call(this, game, 1000, 420);
	}else if(pos === 3) {
		this.animation = new Animation(spritesheet, 30, 1000, 400, 970, 1, 1, true, false);
		Entity.call(this, game, 440, 1020);
	}
	this.boundingbox = new BoundingBox(this.x + 4, this.y + 10, this.animation.frameWidth - 900, this.animation.frameHeight - 375);
};

Meteor_Fast.prototype = new Entity();
Meteor_Fast.prototype.constructor = Meteor_Fast;

Meteor_Fast.prototype.update = function() {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	if(this.pos === 0) {
		this.x += this.game.clockTick * this.speed;
		this.boundingbox = new BoundingBox(this.x + 20, this.y + 10, this.animation.frameWidth - 900, this.animation.frameHeight - 375);
	} else if(this.pos === 1) {
		this.y += this.game.clockTick * this.speed;
		this.boundingbox = new BoundingBox(this.x + 10, this.y + 20, this.animation.frameWidth - 375, this.animation.frameHeight - 900);
	} else if(this.pos === 2) {
		this.x -= this.game.clockTick * this.speed;
		this.boundingbox = new BoundingBox(this.x + 4, this.y + 15, this.animation.frameWidth - 900, this.animation.frameHeight - 375);
	} else if(this.pos === 3) {
		this.y -= this.game.clockTick * this.speed;
		this.boundingbox = new BoundingBox(this.x + 10, this.y + 10, this.animation.frameWidth - 375, this.animation.frameHeight - 900);
	}
	if(this.hp === 0 && this.live) {
		this.live = false;
		asteroids_destroyed += 1;
	}
	Entity.prototype.update.call(this);
};

Meteor_Fast.prototype.draw = function () {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	if (bound_box) {
      this.ctx.strokeStyle = "yellow";
      this.ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
  }
	if(this.live){
		this.animation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y, 0.1);//0.4
	    Entity.prototype.draw.call(this);
	}

};

function Meteor (game, spritesheet, pos) {
	this.animation = new Animation(spritesheet, 0, 855, 130, 185, .1, 4, true, false);
	this.speed = 100;
	this.ctx = game.ctx;
	this.live = true;
	this.hp = 1;
	this.pos = pos;
	if (pos === 0) {
		Entity.call(this, game, -200, 425);
	} else if(pos === 1) {
		Entity.call(this, game, 455, -200);
	}else if(pos === 2) {
		Entity.call(this, game, 1000, 425);
	}else if(pos === 3) {
		Entity.call(this, game, 455, 1020);
	}
	this.boundingbox = new BoundingBox(this.x, this.y , this.animation.frameWidth, this.animation.frameHeight);
};

Meteor.prototype = new Entity();
Meteor.prototype.constructor = Meteor;

Meteor.prototype.update = function() {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	if(this.pos === 0) {
		this.x += this.game.clockTick * this.speed;
	} else if(this.pos === 1) {
		this.y += this.game.clockTick * this.speed;
	} else if(this.pos === 2) {
		this.x -= this.game.clockTick * this.speed;
	} else if(this.pos === 3) {
		this.y -= this.game.clockTick * this.speed;
	}
	this.boundingbox = new BoundingBox(this.x + 3, this.y + 10, this.animation.frameWidth - 110, this.animation.frameHeight - 170);
	if(this.hp === 0 && this.live) {
		this.live = false;
		asteroids_destroyed += 1;
	}
	Entity.prototype.update.call(this);
};

Meteor.prototype.draw = function () {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	if (bound_box) {
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
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	if(this.counter >= 70){
		this.counter = 0;
		var type = Math.floor(Math.random() * 100) + 1;
		  type %= 40;
//		  type = 8; //Testing individual obstacles
		  var pos = Math.floor(Math.random() * 100) + 1;
		  pos %= 4;
//		  pos = 3; //Testing position
		  while (pos === this.previous) {
			  var pos = Math.floor(Math.random() * 100) + 1;
			  pos %= 4;
		  }
		  this.previous = pos;
		  if(type < 24) {
			  this.asteroids.push(new Meteor(this.game, this.spritesheet, pos));
		  } else if(type >= 35) {
		      this.asteroids.push(new Meteor_Slow(this.game, this.spritesheet, pos));
		  } else if(type >= 24 && type < 35) {
		  		this.asteroids.push(new Meteor_Fast(this.game, this.spritesheet, pos));
		  }
	}
	var numAsteroid = this.asteroids.length;
	for(i = 0; i < numAsteroid; i++) {
		this.asteroids[i].update();
	}
	this.counter++;
};

Asteroid_Spawner.prototype.draw = function () {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	var numAsteroid = this.asteroids.length;
	for(i = 0; i < numAsteroid; i++) {
		this.asteroids[i].draw();
	}
};

// bullet
function Bullet(game, spritesheet, ship) {
    this.animation = new Animation(spritesheet, 0, 0, 300, 300, 1, 1, true, true);
    this.pos = currentClosestPos;
    if (this.pos === 0) {
        this.x = 380;
        this.y = 420;
	} else if(this.pos === 1) {
	    this.x = 435;
	    this.y = 390;
	}else if(this.pos === 2) {
	    this.x = 490;
	    this.y = 420;
	}else if(this.pos === 3) {
	    this.x = 435;
	    this.y = 460;
	}
    this.speed = 100;
    this.game = game;
    this.live = true;
    this.ctx = game.ctx;
	this.boundingbox = new BoundingBox(this.x, this.y, this.animation.frameWidth, this.animation.frameHeight);
}

Bullet.prototype.draw = function () {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
	if (bound_box) {
      this.ctx.strokeStyle = "yellow";
      this.ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
	}
	if(this.live){
	this.animation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y, 0.15);
	}
}

Bullet.prototype.update = function () {
	if(!this.game.running || (!this.game.running && this.game.over)) return;
    if (this.pos === 0) {
    	this.x -= this.game.clockTick * this.speed;
	} else if(this.pos === 1) {
		this.y -= this.game.clockTick * this.speed;
	}else if(this.pos === 2) {
		this.x += this.game.clockTick * this.speed;
	}else if(this.pos === 3) {
		this.y += this.game.clockTick * this.speed;
	}

	this.boundingbox = new BoundingBox(this.x + 25, this.y + 15, this.animation.frameWidth - 287, this.animation.frameHeight - 290);
	for (var i = 0; i < this.game.asteroids.length; i++) {
		var ob = this.game.asteroids[i];
		if(this.boundingbox.collide(ob.boundingbox) && this.live && ob.live) {
			this.live = false;
			ob.hp -= 1;
		}
	}
}

AM.queueDownload("./img/background.jpg");
AM.queueDownload("./img/gameover.png");
AM.queueDownload("./img/bullet.png");
AM.queueDownload("./img/ufo.png");
AM.queueDownload("./img/meteors.png");


AM.downloadAll(function () {
    var canvas = document.getElementById("gameWorld");
    var ctx = canvas.getContext("2d");
//    var gameEngine = new GameEngine();


    gameEngine.running = true;
    gameEngine.over = false;
    gameEngine.noSG = false;
    var GO = new gameOver(gameEngine, AM.getAsset("./img/gameover.png"), 0, 0);
    gameEngine.addEntity(GO);
    console.log(GO);

    gameEngine.init(ctx);
    gameEngine.start();
    gameEngine.addEntity(new Background(gameEngine, AM.getAsset("./img/background.jpg")));
    asteroidSpawner = new Asteroid_Spawner(gameEngine, AM.getAsset("./img/meteors.png"));
    gameEngine.addEntity(asteroidSpawner);
    gameEngine.asteroids = asteroidSpawner.asteroids;
    ship = new Ship(gameEngine, AM.getAsset("./img/ufo.png"));
    gameEngine.addEntity(ship);
    gameEngine.addEntity(new Score(gameEngine, asteroids_destroyed, "white", 700, 950));
    gameEngine.addEntity(new Info(gameEngine, "white", 800, 20));

    console.log("All Done!");
});
