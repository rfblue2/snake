/// Roland Fong
// Snakes
// 1/11/19

var WIDTH = 640;
var HEIGHT = 480;

var BLOCK_H = 20;
var BLOCK_W = 20;

// Keycodes
var LEFT  = 37;
var UP    = 38;
var RIGHT = 39;
var DOWN  = 40;

var M     = 77;
var P     = 80;
var R     = 82;

// Game states
var INIT   = "init";
var GAME   = "game";
var PAUSED = "pause";
var END    = "end";

// Player states
var PLAYER_IDLE  = "PLAYER_IDLE";
var PLAYER_UP    = "PLAYER_UP";
var PLAYER_LEFT  = "PLAYER_LEFT";
var PLAYER_RIGHT = "PLAYER_RIGHT";
var PLAYER_DOWN  = "PLAYER_DOWN";
var PLAYER_LU    = "PLAYER_LU";
var PLAYER_LD    = "PLAYER_LD";
var PLAYER_RU    = "PLAYER_RU";
var PLAYER_RD    = "PLAYER_RD";
var PLAYER_UL    = "PLAYER_UL";
var PLAYER_DL    = "PLAYER_DL";
var PLAYER_UR    = "PLAYER_UR";
var PLAYER_DR    = "PLAYER_DR";

// Variables
var stage;
var player;
var gameState;
var gameOverText;
var scoreMngr;
var foodMngr;
var bgmusic;
var muted;
  
var keys = {}

document.onkeydown = onkeydown;
document.onkeyup = onkeyup;

//////////////////////////////////////////////////////////////////////////////
// Initialization 
//////////////////////////////////////////////////////////////////////////////

function plane(origx, origy) {
  var plane = new createjs.Container();
  function draw(x,y, color) {
    var square = new createjs.Shape();
    square.graphics
      .beginFill(color)
      .drawRect(origx+x*BLOCK_W, origy+y*BLOCK_H, BLOCK_W, BLOCK_H);
    plane.addChild(square);
  }

  var mask = [
    [1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0],
    [1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 1, 2, 1, 2, 2, 1],
    [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [0, 0, 0, 0, 0, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0 ,0, 0, 0, 0],
  ];

  for (var i = 0; i < mask.length; i++) {
    for (var j = 0; j < mask[i].length; j++) {
      if      (mask[i][j] == 1) draw(j,i,"#222222");
      else if (mask[i][j] == 2) draw(j,i,"#111111");
    }
  }

  return plane;
}

function init() {
  var queue = new createjs.LoadQueue();
  queue.installPlugin(createjs.Sound);
  queue.on("complete", setup, this);
  queue.loadFile({id:"music", src:"audio/bringit.mp3"});
}

function setup() {
  gameState = INIT;

  stage = new createjs.Stage("demoCanvas");
  bg = new createjs.Shape();
  bg.graphics.beginFill("black").drawRect(0, 0, WIDTH, HEIGHT);
  stage.addChild(bg);
  
  var planex = (WIDTH - 17 * BLOCK_W) / 2;
  var planey =  (HEIGHT - 12 * BLOCK_H) / 2;
  var bgplane = plane(planex, planey);
  stage.addChild(bgplane);

  player = new Snake();
  stage.addChild(player.body);

  gameOverText = new createjs.Text(
    "Game Over (press R to restart)", "24px \"Courier New\"", "white");
  gameOverText.x = WIDTH / 2 - 200;
  gameOverText.y = HEIGHT / 2;

  foodMngr = new FoodMngr();
  stage.addChild(foodMngr.body);

  scoreMngr = new ScoreMngr();
  stage.addChild(scoreMngr.body);

  muted = false;

  createjs.Ticker.addEventListener("tick", handleTick);
}

function ScoreMngr() {
  var self = this;

  self.body = new createjs.Text("Score: 0", "24px \"Courier New\"", "white");
  self.body.x = 0;
  self.body.y = 0;

  self.score = 0;

  self.update = function() {
    self.body.text = "Score: " + self.score;
  }

  self.reset = function() {
    self.score = 0;
  }
}

function Segment() {
  var self = this;
  self.body = new createjs.Shape();
  self.body.graphics.beginFill("Chartreuse").drawRect(0, 0, BLOCK_W, BLOCK_H);
  self.x = 0;
  self.y = 0;

  self.update = function() {
    self.body.x = self.x * BLOCK_W;
    self.body.y = self.y * BLOCK_H;
  }

  self.collision = function(x, y) {
    return (x == self.x && y == self.y);
  }
}

function Snake() {
  var self = this;

  self.body = new createjs.Container();
  self.segments = [];

  self.speed = 1;
  self.state = PLAYER_IDLE;

  self.addSegment = function() {
    var segment = new Segment();
    self.body.addChild(segment.body);
    self.segments.push(segment);
  }

  // create head
  self.addSegment();
  self.segments[0].body.x = 1 * BLOCK_W;
  self.segments[0].body.y = 1 * BLOCK_H;

  self.movedSince = false;

  self.updateState = function(keyCode) {
    if (!self.movedSince) return;
    self.movedSince = false;
    switch (keyCode) {
      case LEFT:  
        if (self.state != PLAYER_RIGHT) self.state = PLAYER_LEFT;  
        break;
      case RIGHT: 
        if (self.state != PLAYER_LEFT)  self.state = PLAYER_RIGHT;  
        break;
      case UP:    
        if (self.state != PLAYER_DOWN)  self.state = PLAYER_UP;
        break;
      case DOWN:  
        if (self.state != PLAYER_UP)    self.state = PLAYER_DOWN;
        break;
    }
  }

  self.move = function(dir) {
    self.movedSince = true;
    var dx = 0;
    var dy = 0;
    switch (dir) {
      case PLAYER_LEFT:
        dx -= self.speed;
        break;
      case PLAYER_RIGHT:
        dx += self.speed;
        break;
      case PLAYER_UP:
        dy -= self.speed;
        break;
      case PLAYER_DOWN:
        dy += self.speed;
        break;
    }

    // create illusion of movement by removing last element and 
    // moving it to new position of head
    if (self.segments.length > 1) {
      var last = self.segments.pop();
      last.x = self.segments[0].x + dx;
      last.y = self.segments[0].y + dy;

      self.segments = [last].concat(self.segments);
    } else {
      self.segments[0].x += dx;
      self.segments[0].y += dy;
    }

  }

  self.update = function() {
    self.move(self.state);
    for (var s of self.segments) {
      s.update();
    }
  }

  // check bounds of player, if false, player is dead!
  self.checkBounds = function() {
    if (!(self.segments[0].x >= 0 && 
          self.segments[0].y >= 0 && 
          self.segments[0].x < WIDTH/BLOCK_W && 
          self.segments[0].y < HEIGHT/BLOCK_H)) {
      return false; 
    }
    for (var i = 1; i < self.segments.length; i++) {
      var s = self.segments[i];
      if (self.segments[0].collision(s.x, s.y)) {
        return false;
      }
    }

    return true;
  }

  self.reset = function() {
    self.state = PLAYER_IDLE;

    self.body.removeAllChildren();
    self.segments = [];

    self.addSegment();
    self.segments[0].body.x = 1 * BLOCK_W;
    self.segments[0].body.y = 1 * BLOCK_H;

    self.movedSince = false;

  }

}

function Food() {
  var self = this;
  self.body = new createjs.Shape();
  self.body.graphics.beginFill("Red").drawRect(0, 0, BLOCK_W, BLOCK_H);
  self.x = 0;
  self.y = 0;

  self.update = function() {
    self.body.x = self.x * BLOCK_W;
    self.body.y = self.y * BLOCK_H;
  }

  self.collision = function(x, y) {
    return (x == self.x && y == self.y);
  }

}

function FoodMngr() {
  var self = this;
  self.body = new createjs.Container();
  self.foods = [];
  self.MAX_FOOD = 10;
  
  self.addFood = function() {
    var food = new Food();
    food.x = Math.floor(Math.random() * WIDTH/BLOCK_W);
    food.y = Math.floor(Math.random() * HEIGHT/BLOCK_H);
    self.body.addChild(food.body);
    self.foods.push(food);
  }

  self.update = function() {
    while (self.body.children.length < self.MAX_FOOD) {
      self.addFood();
    }
    for (var i = 0; i < self.foods.length; i++) {
      self.foods[i].update();
    }
  }

  self.collision = function(x, y) {
    for (var i = 0; i < self.foods.length; i++) {
      var food = self.foods[i];
      if (food.collision(x,y)) {
        self.body.removeChildAt(i);
        self.foods.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  self.reset = function() {
    self.body.removeAllChildren();
    self.foods = [];
  }

}

function reset() {
  player.reset();
  scoreMngr.reset();
  foodMngr.reset();
  stage.removeChild(gameOverText);
  gameState = INIT;

  // restart track
  bgmusic.position = 0;
  bgmusic.paused = true;
}
    
//////////////////////////////////////////////////////////////////////////////
//  Handle Keys
//////////////////////////////////////////////////////////////////////////////

function onkeydown(event) {
  keys[event.keyCode] = true;

  if (event.keyCode == M && bgmusic) {
    muted = !muted;
    bgmusic.volume = (bgmusic.volume + 1) % 2;
  }

  if (gameState == INIT && 
    (keys[UP] || keys[DOWN] || keys[LEFT] || keys[RIGHT])) {
    // (re)start the music when player makes their move
    if (!bgmusic) {
      bgmusic = createjs.Sound.play("music", { loop: -1 });
    } else {
      bgmusic.paused = false;
    }
    if (muted) bgmusic.volume = 0;
    else       bgmusic.volume = 1;
    gameState = GAME;
  }

  if (gameState == GAME) {
    player.updateState(event.keyCode);
  }
}

function onkeyup(event) {
  keys[event.keyCode] = false;

  if (gameState == GAME || gameState == PAUSED) {
    if (event.keyCode == P) {
      switch (gameState) {
        case GAME:   gameState = PAUSED; break;
        case PAUSED: gameState = GAME; break;
      }
    }
  }

  if (gameState == INIT || gameState == GAME) {
    for (var key in [UP, LEFT, DOWN, RIGHT]) {
      if (keys[key]) {
        player.updateState(event.keyCode);
      }
    }
  } else if (gameState == END && event.keyCode == R) {
    reset();
  }
}

//////////////////////////////////////////////////////////////////////////////
//  Stage update
//////////////////////////////////////////////////////////////////////////////

function endGame() {
  gameState = END;
  stage.addChild(gameOverText);
}

function handleTick(event) {
  if (gameState == GAME || gameState == INIT) {
    foodMngr.update();
    player.update();
    scoreMngr.update();
    if (!player.checkBounds()) {
      endGame();
    }
    if (foodMngr.collision(player.segments[0].x, player.segments[0].y)) {
      scoreMngr.score += 1;
      player.addSegment();
    }
  }
  stage.update()
}

