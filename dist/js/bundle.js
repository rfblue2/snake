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
  queue.loadFile({id:"music", src:"../audio/bringit.mp3"});
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

  if (gameState == INIT) {
    // (re)start the music when player makes their move
    if (!bgmusic) {
      bgmusic = createjs.Sound.play("music", { loop: -1 });
    } else {
      bgmusic.paused = false;
    }
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


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gUm9sYW5kIEZvbmdcbi8vIFNuYWtlc1xuLy8gMS8xMS8xOVxuXG52YXIgV0lEVEggPSA2NDA7XG52YXIgSEVJR0hUID0gNDgwO1xuXG52YXIgQkxPQ0tfSCA9IDIwO1xudmFyIEJMT0NLX1cgPSAyMDtcblxuLy8gS2V5Y29kZXNcbnZhciBMRUZUICA9IDM3O1xudmFyIFVQICAgID0gMzg7XG52YXIgUklHSFQgPSAzOTtcbnZhciBET1dOICA9IDQwO1xuXG52YXIgUCAgICAgPSA4MDtcbnZhciBSICAgICA9IDgyO1xuXG4vLyBHYW1lIHN0YXRlc1xudmFyIElOSVQgICA9IFwiaW5pdFwiO1xudmFyIEdBTUUgICA9IFwiZ2FtZVwiO1xudmFyIFBBVVNFRCA9IFwicGF1c2VcIjtcbnZhciBFTkQgICAgPSBcImVuZFwiO1xuXG4vLyBQbGF5ZXIgc3RhdGVzXG52YXIgUExBWUVSX0lETEUgID0gXCJQTEFZRVJfSURMRVwiO1xudmFyIFBMQVlFUl9VUCAgICA9IFwiUExBWUVSX1VQXCI7XG52YXIgUExBWUVSX0xFRlQgID0gXCJQTEFZRVJfTEVGVFwiO1xudmFyIFBMQVlFUl9SSUdIVCA9IFwiUExBWUVSX1JJR0hUXCI7XG52YXIgUExBWUVSX0RPV04gID0gXCJQTEFZRVJfRE9XTlwiO1xudmFyIFBMQVlFUl9MVSAgICA9IFwiUExBWUVSX0xVXCI7XG52YXIgUExBWUVSX0xEICAgID0gXCJQTEFZRVJfTERcIjtcbnZhciBQTEFZRVJfUlUgICAgPSBcIlBMQVlFUl9SVVwiO1xudmFyIFBMQVlFUl9SRCAgICA9IFwiUExBWUVSX1JEXCI7XG52YXIgUExBWUVSX1VMICAgID0gXCJQTEFZRVJfVUxcIjtcbnZhciBQTEFZRVJfREwgICAgPSBcIlBMQVlFUl9ETFwiO1xudmFyIFBMQVlFUl9VUiAgICA9IFwiUExBWUVSX1VSXCI7XG52YXIgUExBWUVSX0RSICAgID0gXCJQTEFZRVJfRFJcIjtcblxuLy8gVmFyaWFibGVzXG52YXIgc3RhZ2U7XG52YXIgcGxheWVyO1xudmFyIGdhbWVTdGF0ZTtcbnZhciBnYW1lT3ZlclRleHQ7XG52YXIgc2NvcmVNbmdyO1xudmFyIGZvb2RNbmdyO1xudmFyIGJnbXVzaWM7XG4gIFxudmFyIGtleXMgPSB7fVxuXG5kb2N1bWVudC5vbmtleWRvd24gPSBvbmtleWRvd247XG5kb2N1bWVudC5vbmtleXVwID0gb25rZXl1cDtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBJbml0aWFsaXphdGlvbiBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBwbGFuZShvcmlneCwgb3JpZ3kpIHtcbiAgdmFyIHBsYW5lID0gbmV3IGNyZWF0ZWpzLkNvbnRhaW5lcigpO1xuICBmdW5jdGlvbiBkcmF3KHgseSwgY29sb3IpIHtcbiAgICB2YXIgc3F1YXJlID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG4gICAgc3F1YXJlLmdyYXBoaWNzXG4gICAgICAuYmVnaW5GaWxsKGNvbG9yKVxuICAgICAgLmRyYXdSZWN0KG9yaWd4K3gqQkxPQ0tfVywgb3JpZ3kreSpCTE9DS19ILCBCTE9DS19XLCBCTE9DS19IKTtcbiAgICBwbGFuZS5hZGRDaGlsZChzcXVhcmUpO1xuICB9XG5cbiAgdmFyIG1hc2sgPSBbXG4gICAgWzEsIDEsIDAsIDAsIDAsIDEsIDEsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICAgIFsxLCAyLCAxLCAwLCAwLCAxLCAyLCAyLCAxLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgICBbMSwgMiwgMiwgMSwgMCwgMCwgMSwgMiwgMiwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgWzAsIDEsIDIsIDIsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDAsIDAsIDBdLFxuICAgIFsxLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAxLCAxLCAwXSxcbiAgICBbMSwgMSwgMSwgMiwgMiwgMiwgMiwgMiwgMiwgMSwgMiwgMSwgMiwgMSwgMiwgMiwgMV0sXG4gICAgWzAsIDAsIDAsIDEsIDEsIDEsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDFdLFxuICAgIFswLCAwLCAwLCAwLCAwLCAxLCAyLCAyLCAyLCAxLCAxLCAxLCAxLCAxLCAxLCAxLCAwXSxcbiAgICBbMCwgMCwgMCwgMCwgMSwgMiwgMiwgMiwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgWzAsIDAsIDAsIDAsIDEsIDIsIDIsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICAgIFswLCAwLCAwLCAxLCAyLCAyLCAxLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgICBbMCwgMCwgMCwgMSwgMSwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMCAsMCwgMCwgMCwgMF0sXG4gIF07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXNrLmxlbmd0aDsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBtYXNrW2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICBpZiAgICAgIChtYXNrW2ldW2pdID09IDEpIGRyYXcoaixpLFwiIzIyMjIyMlwiKTtcbiAgICAgIGVsc2UgaWYgKG1hc2tbaV1bal0gPT0gMikgZHJhdyhqLGksXCIjMTExMTExXCIpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwbGFuZTtcbn1cblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgdmFyIHF1ZXVlID0gbmV3IGNyZWF0ZWpzLkxvYWRRdWV1ZSgpO1xuICBxdWV1ZS5pbnN0YWxsUGx1Z2luKGNyZWF0ZWpzLlNvdW5kKTtcbiAgcXVldWUub24oXCJjb21wbGV0ZVwiLCBzZXR1cCwgdGhpcyk7XG4gIHF1ZXVlLmxvYWRGaWxlKHtpZDpcIm11c2ljXCIsIHNyYzpcIi4uL2F1ZGlvL2JyaW5naXQubXAzXCJ9KTtcbn1cblxuZnVuY3Rpb24gc2V0dXAoKSB7XG4gIGdhbWVTdGF0ZSA9IElOSVQ7XG5cbiAgc3RhZ2UgPSBuZXcgY3JlYXRlanMuU3RhZ2UoXCJkZW1vQ2FudmFzXCIpO1xuICBiZyA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuICBiZy5ncmFwaGljcy5iZWdpbkZpbGwoXCJibGFja1wiKS5kcmF3UmVjdCgwLCAwLCBXSURUSCwgSEVJR0hUKTtcbiAgc3RhZ2UuYWRkQ2hpbGQoYmcpO1xuICBcbiAgdmFyIHBsYW5leCA9IChXSURUSCAtIDE3ICogQkxPQ0tfVykgLyAyO1xuICB2YXIgcGxhbmV5ID0gIChIRUlHSFQgLSAxMiAqIEJMT0NLX0gpIC8gMjtcbiAgdmFyIGJncGxhbmUgPSBwbGFuZShwbGFuZXgsIHBsYW5leSk7XG4gIHN0YWdlLmFkZENoaWxkKGJncGxhbmUpO1xuXG4gIHBsYXllciA9IG5ldyBTbmFrZSgpO1xuICBzdGFnZS5hZGRDaGlsZChwbGF5ZXIuYm9keSk7XG5cbiAgZ2FtZU92ZXJUZXh0ID0gbmV3IGNyZWF0ZWpzLlRleHQoXG4gICAgXCJHYW1lIE92ZXIgKHByZXNzIFIgdG8gcmVzdGFydClcIiwgXCIyNHB4IFxcXCJDb3VyaWVyIE5ld1xcXCJcIiwgXCJ3aGl0ZVwiKTtcbiAgZ2FtZU92ZXJUZXh0LnggPSBXSURUSCAvIDIgLSAyMDA7XG4gIGdhbWVPdmVyVGV4dC55ID0gSEVJR0hUIC8gMjtcblxuICBmb29kTW5nciA9IG5ldyBGb29kTW5ncigpO1xuICBzdGFnZS5hZGRDaGlsZChmb29kTW5nci5ib2R5KTtcblxuICBzY29yZU1uZ3IgPSBuZXcgU2NvcmVNbmdyKCk7XG4gIHN0YWdlLmFkZENoaWxkKHNjb3JlTW5nci5ib2R5KTtcblxuICBjcmVhdGVqcy5UaWNrZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRpY2tcIiwgaGFuZGxlVGljayk7XG59XG5cbmZ1bmN0aW9uIFNjb3JlTW5ncigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHNlbGYuYm9keSA9IG5ldyBjcmVhdGVqcy5UZXh0KFwiU2NvcmU6IDBcIiwgXCIyNHB4IFxcXCJDb3VyaWVyIE5ld1xcXCJcIiwgXCJ3aGl0ZVwiKTtcbiAgc2VsZi5ib2R5LnggPSAwO1xuICBzZWxmLmJvZHkueSA9IDA7XG5cbiAgc2VsZi5zY29yZSA9IDA7XG5cbiAgc2VsZi51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmJvZHkudGV4dCA9IFwiU2NvcmU6IFwiICsgc2VsZi5zY29yZTtcbiAgfVxuXG4gIHNlbGYucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLnNjb3JlID0gMDtcbiAgfVxufVxuXG5mdW5jdGlvbiBTZWdtZW50KCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYuYm9keSA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuICBzZWxmLmJvZHkuZ3JhcGhpY3MuYmVnaW5GaWxsKFwiQ2hhcnRyZXVzZVwiKS5kcmF3UmVjdCgwLCAwLCBCTE9DS19XLCBCTE9DS19IKTtcbiAgc2VsZi54ID0gMDtcbiAgc2VsZi55ID0gMDtcblxuICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuYm9keS54ID0gc2VsZi54ICogQkxPQ0tfVztcbiAgICBzZWxmLmJvZHkueSA9IHNlbGYueSAqIEJMT0NLX0g7XG4gIH1cblxuICBzZWxmLmNvbGxpc2lvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICByZXR1cm4gKHggPT0gc2VsZi54ICYmIHkgPT0gc2VsZi55KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBTbmFrZSgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHNlbGYuYm9keSA9IG5ldyBjcmVhdGVqcy5Db250YWluZXIoKTtcbiAgc2VsZi5zZWdtZW50cyA9IFtdO1xuXG4gIHNlbGYuc3BlZWQgPSAxO1xuICBzZWxmLnN0YXRlID0gUExBWUVSX0lETEU7XG5cbiAgc2VsZi5hZGRTZWdtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlZ21lbnQgPSBuZXcgU2VnbWVudCgpO1xuICAgIHNlbGYuYm9keS5hZGRDaGlsZChzZWdtZW50LmJvZHkpO1xuICAgIHNlbGYuc2VnbWVudHMucHVzaChzZWdtZW50KTtcbiAgfVxuXG4gIC8vIGNyZWF0ZSBoZWFkXG4gIHNlbGYuYWRkU2VnbWVudCgpO1xuICBzZWxmLnNlZ21lbnRzWzBdLmJvZHkueCA9IDEgKiBCTE9DS19XO1xuICBzZWxmLnNlZ21lbnRzWzBdLmJvZHkueSA9IDEgKiBCTE9DS19IO1xuXG4gIHNlbGYubW92ZWRTaW5jZSA9IGZhbHNlO1xuXG4gIHNlbGYudXBkYXRlU3RhdGUgPSBmdW5jdGlvbihrZXlDb2RlKSB7XG4gICAgaWYgKCFzZWxmLm1vdmVkU2luY2UpIHJldHVybjtcbiAgICBzZWxmLm1vdmVkU2luY2UgPSBmYWxzZTtcbiAgICBzd2l0Y2ggKGtleUNvZGUpIHtcbiAgICAgIGNhc2UgTEVGVDogIFxuICAgICAgICBpZiAoc2VsZi5zdGF0ZSAhPSBQTEFZRVJfUklHSFQpIHNlbGYuc3RhdGUgPSBQTEFZRVJfTEVGVDsgIFxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUklHSFQ6IFxuICAgICAgICBpZiAoc2VsZi5zdGF0ZSAhPSBQTEFZRVJfTEVGVCkgIHNlbGYuc3RhdGUgPSBQTEFZRVJfUklHSFQ7ICBcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFVQOiAgICBcbiAgICAgICAgaWYgKHNlbGYuc3RhdGUgIT0gUExBWUVSX0RPV04pICBzZWxmLnN0YXRlID0gUExBWUVSX1VQO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRE9XTjogIFxuICAgICAgICBpZiAoc2VsZi5zdGF0ZSAhPSBQTEFZRVJfVVApICAgIHNlbGYuc3RhdGUgPSBQTEFZRVJfRE9XTjtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgc2VsZi5tb3ZlID0gZnVuY3Rpb24oZGlyKSB7XG4gICAgc2VsZi5tb3ZlZFNpbmNlID0gdHJ1ZTtcbiAgICB2YXIgZHggPSAwO1xuICAgIHZhciBkeSA9IDA7XG4gICAgc3dpdGNoIChkaXIpIHtcbiAgICAgIGNhc2UgUExBWUVSX0xFRlQ6XG4gICAgICAgIGR4IC09IHNlbGYuc3BlZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQTEFZRVJfUklHSFQ6XG4gICAgICAgIGR4ICs9IHNlbGYuc3BlZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQTEFZRVJfVVA6XG4gICAgICAgIGR5IC09IHNlbGYuc3BlZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQTEFZRVJfRE9XTjpcbiAgICAgICAgZHkgKz0gc2VsZi5zcGVlZDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIGlsbHVzaW9uIG9mIG1vdmVtZW50IGJ5IHJlbW92aW5nIGxhc3QgZWxlbWVudCBhbmQgXG4gICAgLy8gbW92aW5nIGl0IHRvIG5ldyBwb3NpdGlvbiBvZiBoZWFkXG4gICAgaWYgKHNlbGYuc2VnbWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgdmFyIGxhc3QgPSBzZWxmLnNlZ21lbnRzLnBvcCgpO1xuICAgICAgbGFzdC54ID0gc2VsZi5zZWdtZW50c1swXS54ICsgZHg7XG4gICAgICBsYXN0LnkgPSBzZWxmLnNlZ21lbnRzWzBdLnkgKyBkeTtcblxuICAgICAgc2VsZi5zZWdtZW50cyA9IFtsYXN0XS5jb25jYXQoc2VsZi5zZWdtZW50cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuc2VnbWVudHNbMF0ueCArPSBkeDtcbiAgICAgIHNlbGYuc2VnbWVudHNbMF0ueSArPSBkeTtcbiAgICB9XG5cbiAgfVxuXG4gIHNlbGYudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5tb3ZlKHNlbGYuc3RhdGUpO1xuICAgIGZvciAodmFyIHMgb2Ygc2VsZi5zZWdtZW50cykge1xuICAgICAgcy51cGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICAvLyBjaGVjayBib3VuZHMgb2YgcGxheWVyLCBpZiBmYWxzZSwgcGxheWVyIGlzIGRlYWQhXG4gIHNlbGYuY2hlY2tCb3VuZHMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIShzZWxmLnNlZ21lbnRzWzBdLnggPj0gMCAmJiBcbiAgICAgICAgICBzZWxmLnNlZ21lbnRzWzBdLnkgPj0gMCAmJiBcbiAgICAgICAgICBzZWxmLnNlZ21lbnRzWzBdLnggPCBXSURUSC9CTE9DS19XICYmIFxuICAgICAgICAgIHNlbGYuc2VnbWVudHNbMF0ueSA8IEhFSUdIVC9CTE9DS19IKSkge1xuICAgICAgcmV0dXJuIGZhbHNlOyBcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBzZWxmLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcyA9IHNlbGYuc2VnbWVudHNbaV07XG4gICAgICBpZiAoc2VsZi5zZWdtZW50c1swXS5jb2xsaXNpb24ocy54LCBzLnkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHNlbGYucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLnN0YXRlID0gUExBWUVSX0lETEU7XG5cbiAgICBzZWxmLmJvZHkucmVtb3ZlQWxsQ2hpbGRyZW4oKTtcbiAgICBzZWxmLnNlZ21lbnRzID0gW107XG5cbiAgICBzZWxmLmFkZFNlZ21lbnQoKTtcbiAgICBzZWxmLnNlZ21lbnRzWzBdLmJvZHkueCA9IDEgKiBCTE9DS19XO1xuICAgIHNlbGYuc2VnbWVudHNbMF0uYm9keS55ID0gMSAqIEJMT0NLX0g7XG5cbiAgICBzZWxmLm1vdmVkU2luY2UgPSBmYWxzZTtcblxuICB9XG5cbn1cblxuZnVuY3Rpb24gRm9vZCgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLmJvZHkgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcbiAgc2VsZi5ib2R5LmdyYXBoaWNzLmJlZ2luRmlsbChcIlJlZFwiKS5kcmF3UmVjdCgwLCAwLCBCTE9DS19XLCBCTE9DS19IKTtcbiAgc2VsZi54ID0gMDtcbiAgc2VsZi55ID0gMDtcblxuICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuYm9keS54ID0gc2VsZi54ICogQkxPQ0tfVztcbiAgICBzZWxmLmJvZHkueSA9IHNlbGYueSAqIEJMT0NLX0g7XG4gIH1cblxuICBzZWxmLmNvbGxpc2lvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICByZXR1cm4gKHggPT0gc2VsZi54ICYmIHkgPT0gc2VsZi55KTtcbiAgfVxuXG59XG5cbmZ1bmN0aW9uIEZvb2RNbmdyKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYuYm9keSA9IG5ldyBjcmVhdGVqcy5Db250YWluZXIoKTtcbiAgc2VsZi5mb29kcyA9IFtdO1xuICBzZWxmLk1BWF9GT09EID0gMTA7XG4gIFxuICBzZWxmLmFkZEZvb2QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm9vZCA9IG5ldyBGb29kKCk7XG4gICAgZm9vZC54ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogV0lEVEgvQkxPQ0tfVyk7XG4gICAgZm9vZC55ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogSEVJR0hUL0JMT0NLX0gpO1xuICAgIHNlbGYuYm9keS5hZGRDaGlsZChmb29kLmJvZHkpO1xuICAgIHNlbGYuZm9vZHMucHVzaChmb29kKTtcbiAgfVxuXG4gIHNlbGYudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgd2hpbGUgKHNlbGYuYm9keS5jaGlsZHJlbi5sZW5ndGggPCBzZWxmLk1BWF9GT09EKSB7XG4gICAgICBzZWxmLmFkZEZvb2QoKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLmZvb2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzZWxmLmZvb2RzW2ldLnVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIHNlbGYuY29sbGlzaW9uID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5mb29kcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGZvb2QgPSBzZWxmLmZvb2RzW2ldO1xuICAgICAgaWYgKGZvb2QuY29sbGlzaW9uKHgseSkpIHtcbiAgICAgICAgc2VsZi5ib2R5LnJlbW92ZUNoaWxkQXQoaSk7XG4gICAgICAgIHNlbGYuZm9vZHMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc2VsZi5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuYm9keS5yZW1vdmVBbGxDaGlsZHJlbigpO1xuICAgIHNlbGYuZm9vZHMgPSBbXTtcbiAgfVxuXG59XG5cbmZ1bmN0aW9uIHJlc2V0KCkge1xuICBwbGF5ZXIucmVzZXQoKTtcbiAgc2NvcmVNbmdyLnJlc2V0KCk7XG4gIGZvb2RNbmdyLnJlc2V0KCk7XG4gIHN0YWdlLnJlbW92ZUNoaWxkKGdhbWVPdmVyVGV4dCk7XG4gIGdhbWVTdGF0ZSA9IElOSVQ7XG5cbiAgLy8gcmVzdGFydCB0cmFja1xuICBiZ211c2ljLnBvc2l0aW9uID0gMDtcbiAgYmdtdXNpYy5wYXVzZWQgPSB0cnVlO1xufVxuICAgIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgSGFuZGxlIEtleXNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBvbmtleWRvd24oZXZlbnQpIHtcbiAga2V5c1tldmVudC5rZXlDb2RlXSA9IHRydWU7XG5cbiAgaWYgKGdhbWVTdGF0ZSA9PSBJTklUKSB7XG4gICAgLy8gKHJlKXN0YXJ0IHRoZSBtdXNpYyB3aGVuIHBsYXllciBtYWtlcyB0aGVpciBtb3ZlXG4gICAgaWYgKCFiZ211c2ljKSB7XG4gICAgICBiZ211c2ljID0gY3JlYXRlanMuU291bmQucGxheShcIm11c2ljXCIsIHsgbG9vcDogLTEgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJnbXVzaWMucGF1c2VkID0gZmFsc2U7XG4gICAgfVxuICAgIGdhbWVTdGF0ZSA9IEdBTUU7XG4gIH1cblxuICBpZiAoZ2FtZVN0YXRlID09IEdBTUUpIHtcbiAgICBwbGF5ZXIudXBkYXRlU3RhdGUoZXZlbnQua2V5Q29kZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25rZXl1cChldmVudCkge1xuICBrZXlzW2V2ZW50LmtleUNvZGVdID0gZmFsc2U7XG5cbiAgaWYgKGdhbWVTdGF0ZSA9PSBHQU1FIHx8IGdhbWVTdGF0ZSA9PSBQQVVTRUQpIHtcbiAgICBpZiAoZXZlbnQua2V5Q29kZSA9PSBQKSB7XG4gICAgICBzd2l0Y2ggKGdhbWVTdGF0ZSkge1xuICAgICAgICBjYXNlIEdBTUU6ICAgZ2FtZVN0YXRlID0gUEFVU0VEOyBicmVhaztcbiAgICAgICAgY2FzZSBQQVVTRUQ6IGdhbWVTdGF0ZSA9IEdBTUU7IGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChnYW1lU3RhdGUgPT0gSU5JVCB8fCBnYW1lU3RhdGUgPT0gR0FNRSkge1xuICAgIGZvciAodmFyIGtleSBpbiBbVVAsIExFRlQsIERPV04sIFJJR0hUXSkge1xuICAgICAgaWYgKGtleXNba2V5XSkge1xuICAgICAgICBwbGF5ZXIudXBkYXRlU3RhdGUoZXZlbnQua2V5Q29kZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGdhbWVTdGF0ZSA9PSBFTkQgJiYgZXZlbnQua2V5Q29kZSA9PSBSKSB7XG4gICAgcmVzZXQoKTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBTdGFnZSB1cGRhdGVcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBlbmRHYW1lKCkge1xuICBnYW1lU3RhdGUgPSBFTkQ7XG4gIHN0YWdlLmFkZENoaWxkKGdhbWVPdmVyVGV4dCk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVRpY2soZXZlbnQpIHtcbiAgaWYgKGdhbWVTdGF0ZSA9PSBHQU1FIHx8IGdhbWVTdGF0ZSA9PSBJTklUKSB7XG4gICAgZm9vZE1uZ3IudXBkYXRlKCk7XG4gICAgcGxheWVyLnVwZGF0ZSgpO1xuICAgIHNjb3JlTW5nci51cGRhdGUoKTtcbiAgICBpZiAoIXBsYXllci5jaGVja0JvdW5kcygpKSB7XG4gICAgICBlbmRHYW1lKCk7XG4gICAgfVxuICAgIGlmIChmb29kTW5nci5jb2xsaXNpb24ocGxheWVyLnNlZ21lbnRzWzBdLngsIHBsYXllci5zZWdtZW50c1swXS55KSkge1xuICAgICAgc2NvcmVNbmdyLnNjb3JlICs9IDE7XG4gICAgICBwbGF5ZXIuYWRkU2VnbWVudCgpO1xuICAgIH1cbiAgfVxuICBzdGFnZS51cGRhdGUoKVxufVxuXG4iXX0=
