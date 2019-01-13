// Roland Fong
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
  gameState = GAME;

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
  gameState = GAME;
}
    
//////////////////////////////////////////////////////////////////////////////
//  Handle Keys
//////////////////////////////////////////////////////////////////////////////

function onkeydown(event) {
  keys[event.keyCode] = true;
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

  if (gameState == GAME) {
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
  if (gameState == GAME) {
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


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBSb2xhbmQgRm9uZ1xuLy8gU25ha2VzXG4vLyAxLzExLzE5XG5cbnZhciBXSURUSCA9IDY0MDtcbnZhciBIRUlHSFQgPSA0ODA7XG5cbnZhciBCTE9DS19IID0gMjA7XG52YXIgQkxPQ0tfVyA9IDIwO1xuXG4vLyBLZXljb2Rlc1xudmFyIExFRlQgID0gMzc7XG52YXIgVVAgICAgPSAzODtcbnZhciBSSUdIVCA9IDM5O1xudmFyIERPV04gID0gNDA7XG5cbnZhciBQICAgICA9IDgwO1xudmFyIFIgICAgID0gODI7XG5cbi8vIEdhbWUgc3RhdGVzXG52YXIgR0FNRSAgID0gXCJnYW1lXCI7XG52YXIgUEFVU0VEID0gXCJwYXVzZVwiO1xudmFyIEVORCAgICA9IFwiZW5kXCI7XG5cbi8vIFBsYXllciBzdGF0ZXNcbnZhciBQTEFZRVJfSURMRSAgPSBcIlBMQVlFUl9JRExFXCI7XG52YXIgUExBWUVSX1VQICAgID0gXCJQTEFZRVJfVVBcIjtcbnZhciBQTEFZRVJfTEVGVCAgPSBcIlBMQVlFUl9MRUZUXCI7XG52YXIgUExBWUVSX1JJR0hUID0gXCJQTEFZRVJfUklHSFRcIjtcbnZhciBQTEFZRVJfRE9XTiAgPSBcIlBMQVlFUl9ET1dOXCI7XG52YXIgUExBWUVSX0xVICAgID0gXCJQTEFZRVJfTFVcIjtcbnZhciBQTEFZRVJfTEQgICAgPSBcIlBMQVlFUl9MRFwiO1xudmFyIFBMQVlFUl9SVSAgICA9IFwiUExBWUVSX1JVXCI7XG52YXIgUExBWUVSX1JEICAgID0gXCJQTEFZRVJfUkRcIjtcbnZhciBQTEFZRVJfVUwgICAgPSBcIlBMQVlFUl9VTFwiO1xudmFyIFBMQVlFUl9ETCAgICA9IFwiUExBWUVSX0RMXCI7XG52YXIgUExBWUVSX1VSICAgID0gXCJQTEFZRVJfVVJcIjtcbnZhciBQTEFZRVJfRFIgICAgPSBcIlBMQVlFUl9EUlwiO1xuXG4vLyBWYXJpYWJsZXNcbnZhciBzdGFnZTtcbnZhciBwbGF5ZXI7XG52YXIgZ2FtZVN0YXRlO1xudmFyIGdhbWVPdmVyVGV4dDtcbnZhciBzY29yZU1uZ3I7XG52YXIgZm9vZE1uZ3I7XG4gIFxudmFyIGtleXMgPSB7fVxuXG5kb2N1bWVudC5vbmtleWRvd24gPSBvbmtleWRvd247XG5kb2N1bWVudC5vbmtleXVwID0gb25rZXl1cDtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBJbml0aWFsaXphdGlvbiBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBwbGFuZShvcmlneCwgb3JpZ3kpIHtcbiAgdmFyIHBsYW5lID0gbmV3IGNyZWF0ZWpzLkNvbnRhaW5lcigpO1xuICBmdW5jdGlvbiBkcmF3KHgseSwgY29sb3IpIHtcbiAgICB2YXIgc3F1YXJlID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG4gICAgc3F1YXJlLmdyYXBoaWNzXG4gICAgICAuYmVnaW5GaWxsKGNvbG9yKVxuICAgICAgLmRyYXdSZWN0KG9yaWd4K3gqQkxPQ0tfVywgb3JpZ3kreSpCTE9DS19ILCBCTE9DS19XLCBCTE9DS19IKTtcbiAgICBwbGFuZS5hZGRDaGlsZChzcXVhcmUpO1xuICB9XG5cbiAgdmFyIG1hc2sgPSBbXG4gICAgWzEsIDEsIDAsIDAsIDAsIDEsIDEsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICAgIFsxLCAyLCAxLCAwLCAwLCAxLCAyLCAyLCAxLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgICBbMSwgMiwgMiwgMSwgMCwgMCwgMSwgMiwgMiwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgWzAsIDEsIDIsIDIsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDAsIDAsIDBdLFxuICAgIFsxLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAxLCAxLCAwXSxcbiAgICBbMSwgMSwgMSwgMiwgMiwgMiwgMiwgMiwgMiwgMSwgMiwgMSwgMiwgMSwgMiwgMiwgMV0sXG4gICAgWzAsIDAsIDAsIDEsIDEsIDEsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDFdLFxuICAgIFswLCAwLCAwLCAwLCAwLCAxLCAyLCAyLCAyLCAxLCAxLCAxLCAxLCAxLCAxLCAxLCAwXSxcbiAgICBbMCwgMCwgMCwgMCwgMSwgMiwgMiwgMiwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgWzAsIDAsIDAsIDAsIDEsIDIsIDIsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICAgIFswLCAwLCAwLCAxLCAyLCAyLCAxLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgICBbMCwgMCwgMCwgMSwgMSwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMCAsMCwgMCwgMCwgMF0sXG4gIF07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXNrLmxlbmd0aDsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBtYXNrW2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICBpZiAgICAgIChtYXNrW2ldW2pdID09IDEpIGRyYXcoaixpLFwiIzIyMjIyMlwiKTtcbiAgICAgIGVsc2UgaWYgKG1hc2tbaV1bal0gPT0gMikgZHJhdyhqLGksXCIjMTExMTExXCIpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwbGFuZTtcbn1cblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgZ2FtZVN0YXRlID0gR0FNRTtcblxuICBzdGFnZSA9IG5ldyBjcmVhdGVqcy5TdGFnZShcImRlbW9DYW52YXNcIik7XG4gIGJnID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG4gIGJnLmdyYXBoaWNzLmJlZ2luRmlsbChcImJsYWNrXCIpLmRyYXdSZWN0KDAsIDAsIFdJRFRILCBIRUlHSFQpO1xuICBzdGFnZS5hZGRDaGlsZChiZyk7XG4gIFxuICB2YXIgcGxhbmV4ID0gKFdJRFRIIC0gMTcgKiBCTE9DS19XKSAvIDI7XG4gIHZhciBwbGFuZXkgPSAgKEhFSUdIVCAtIDEyICogQkxPQ0tfSCkgLyAyO1xuICB2YXIgYmdwbGFuZSA9IHBsYW5lKHBsYW5leCwgcGxhbmV5KTtcbiAgc3RhZ2UuYWRkQ2hpbGQoYmdwbGFuZSk7XG5cbiAgcGxheWVyID0gbmV3IFNuYWtlKCk7XG4gIHN0YWdlLmFkZENoaWxkKHBsYXllci5ib2R5KTtcblxuICBnYW1lT3ZlclRleHQgPSBuZXcgY3JlYXRlanMuVGV4dChcbiAgICBcIkdhbWUgT3ZlciAocHJlc3MgUiB0byByZXN0YXJ0KVwiLCBcIjI0cHggXFxcIkNvdXJpZXIgTmV3XFxcIlwiLCBcIndoaXRlXCIpO1xuICBnYW1lT3ZlclRleHQueCA9IFdJRFRIIC8gMiAtIDIwMDtcbiAgZ2FtZU92ZXJUZXh0LnkgPSBIRUlHSFQgLyAyO1xuXG4gIGZvb2RNbmdyID0gbmV3IEZvb2RNbmdyKCk7XG4gIHN0YWdlLmFkZENoaWxkKGZvb2RNbmdyLmJvZHkpO1xuXG4gIHNjb3JlTW5nciA9IG5ldyBTY29yZU1uZ3IoKTtcbiAgc3RhZ2UuYWRkQ2hpbGQoc2NvcmVNbmdyLmJvZHkpO1xuXG4gIGNyZWF0ZWpzLlRpY2tlci5hZGRFdmVudExpc3RlbmVyKFwidGlja1wiLCBoYW5kbGVUaWNrKTtcbn1cblxuZnVuY3Rpb24gU2NvcmVNbmdyKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgc2VsZi5ib2R5ID0gbmV3IGNyZWF0ZWpzLlRleHQoXCJTY29yZTogMFwiLCBcIjI0cHggXFxcIkNvdXJpZXIgTmV3XFxcIlwiLCBcIndoaXRlXCIpO1xuICBzZWxmLmJvZHkueCA9IDA7XG4gIHNlbGYuYm9keS55ID0gMDtcblxuICBzZWxmLnNjb3JlID0gMDtcblxuICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuYm9keS50ZXh0ID0gXCJTY29yZTogXCIgKyBzZWxmLnNjb3JlO1xuICB9XG5cbiAgc2VsZi5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuc2NvcmUgPSAwO1xuICB9XG59XG5cbmZ1bmN0aW9uIFNlZ21lbnQoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5ib2R5ID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG4gIHNlbGYuYm9keS5ncmFwaGljcy5iZWdpbkZpbGwoXCJDaGFydHJldXNlXCIpLmRyYXdSZWN0KDAsIDAsIEJMT0NLX1csIEJMT0NLX0gpO1xuICBzZWxmLnggPSAwO1xuICBzZWxmLnkgPSAwO1xuXG4gIHNlbGYudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5ib2R5LnggPSBzZWxmLnggKiBCTE9DS19XO1xuICAgIHNlbGYuYm9keS55ID0gc2VsZi55ICogQkxPQ0tfSDtcbiAgfVxuXG4gIHNlbGYuY29sbGlzaW9uID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHJldHVybiAoeCA9PSBzZWxmLnggJiYgeSA9PSBzZWxmLnkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIFNuYWtlKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgc2VsZi5ib2R5ID0gbmV3IGNyZWF0ZWpzLkNvbnRhaW5lcigpO1xuICBzZWxmLnNlZ21lbnRzID0gW107XG5cbiAgc2VsZi5zcGVlZCA9IDE7XG4gIHNlbGYuc3RhdGUgPSBQTEFZRVJfSURMRTtcblxuICBzZWxmLmFkZFNlZ21lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VnbWVudCA9IG5ldyBTZWdtZW50KCk7XG4gICAgc2VsZi5ib2R5LmFkZENoaWxkKHNlZ21lbnQuYm9keSk7XG4gICAgc2VsZi5zZWdtZW50cy5wdXNoKHNlZ21lbnQpO1xuICB9XG5cbiAgLy8gY3JlYXRlIGhlYWRcbiAgc2VsZi5hZGRTZWdtZW50KCk7XG4gIHNlbGYuc2VnbWVudHNbMF0uYm9keS54ID0gMSAqIEJMT0NLX1c7XG4gIHNlbGYuc2VnbWVudHNbMF0uYm9keS55ID0gMSAqIEJMT0NLX0g7XG5cbiAgc2VsZi5tb3ZlZFNpbmNlID0gZmFsc2U7XG5cbiAgc2VsZi51cGRhdGVTdGF0ZSA9IGZ1bmN0aW9uKGtleUNvZGUpIHtcbiAgICBpZiAoIXNlbGYubW92ZWRTaW5jZSkgcmV0dXJuO1xuICAgIHNlbGYubW92ZWRTaW5jZSA9IGZhbHNlO1xuICAgIHN3aXRjaCAoa2V5Q29kZSkge1xuICAgICAgY2FzZSBMRUZUOiAgXG4gICAgICAgIGlmIChzZWxmLnN0YXRlICE9IFBMQVlFUl9SSUdIVCkgc2VsZi5zdGF0ZSA9IFBMQVlFUl9MRUZUOyAgXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBSSUdIVDogXG4gICAgICAgIGlmIChzZWxmLnN0YXRlICE9IFBMQVlFUl9MRUZUKSAgc2VsZi5zdGF0ZSA9IFBMQVlFUl9SSUdIVDsgIFxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVVA6ICAgIFxuICAgICAgICBpZiAoc2VsZi5zdGF0ZSAhPSBQTEFZRVJfRE9XTikgIHNlbGYuc3RhdGUgPSBQTEFZRVJfVVA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBET1dOOiAgXG4gICAgICAgIGlmIChzZWxmLnN0YXRlICE9IFBMQVlFUl9VUCkgICAgc2VsZi5zdGF0ZSA9IFBMQVlFUl9ET1dOO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBzZWxmLm1vdmUgPSBmdW5jdGlvbihkaXIpIHtcbiAgICBzZWxmLm1vdmVkU2luY2UgPSB0cnVlO1xuICAgIHZhciBkeCA9IDA7XG4gICAgdmFyIGR5ID0gMDtcbiAgICBzd2l0Y2ggKGRpcikge1xuICAgICAgY2FzZSBQTEFZRVJfTEVGVDpcbiAgICAgICAgZHggLT0gc2VsZi5zcGVlZDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBMQVlFUl9SSUdIVDpcbiAgICAgICAgZHggKz0gc2VsZi5zcGVlZDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBMQVlFUl9VUDpcbiAgICAgICAgZHkgLT0gc2VsZi5zcGVlZDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBMQVlFUl9ET1dOOlxuICAgICAgICBkeSArPSBzZWxmLnNwZWVkO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgaWxsdXNpb24gb2YgbW92ZW1lbnQgYnkgcmVtb3ZpbmcgbGFzdCBlbGVtZW50IGFuZCBcbiAgICAvLyBtb3ZpbmcgaXQgdG8gbmV3IHBvc2l0aW9uIG9mIGhlYWRcbiAgICBpZiAoc2VsZi5zZWdtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICB2YXIgbGFzdCA9IHNlbGYuc2VnbWVudHMucG9wKCk7XG4gICAgICBsYXN0LnggPSBzZWxmLnNlZ21lbnRzWzBdLnggKyBkeDtcbiAgICAgIGxhc3QueSA9IHNlbGYuc2VnbWVudHNbMF0ueSArIGR5O1xuXG4gICAgICBzZWxmLnNlZ21lbnRzID0gW2xhc3RdLmNvbmNhdChzZWxmLnNlZ21lbnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5zZWdtZW50c1swXS54ICs9IGR4O1xuICAgICAgc2VsZi5zZWdtZW50c1swXS55ICs9IGR5O1xuICAgIH1cblxuICB9XG5cbiAgc2VsZi51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLm1vdmUoc2VsZi5zdGF0ZSk7XG4gICAgZm9yICh2YXIgcyBvZiBzZWxmLnNlZ21lbnRzKSB7XG4gICAgICBzLnVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNoZWNrIGJvdW5kcyBvZiBwbGF5ZXIsIGlmIGZhbHNlLCBwbGF5ZXIgaXMgZGVhZCFcbiAgc2VsZi5jaGVja0JvdW5kcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghKHNlbGYuc2VnbWVudHNbMF0ueCA+PSAwICYmIFxuICAgICAgICAgIHNlbGYuc2VnbWVudHNbMF0ueSA+PSAwICYmIFxuICAgICAgICAgIHNlbGYuc2VnbWVudHNbMF0ueCA8IFdJRFRIL0JMT0NLX1cgJiYgXG4gICAgICAgICAgc2VsZi5zZWdtZW50c1swXS55IDwgSEVJR0hUL0JMT0NLX0gpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7IFxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHNlbGYuc2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzID0gc2VsZi5zZWdtZW50c1tpXTtcbiAgICAgIGlmIChzZWxmLnNlZ21lbnRzWzBdLmNvbGxpc2lvbihzLngsIHMueSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgc2VsZi5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuc3RhdGUgPSBQTEFZRVJfSURMRTtcblxuICAgIHNlbGYuYm9keS5yZW1vdmVBbGxDaGlsZHJlbigpO1xuICAgIHNlbGYuc2VnbWVudHMgPSBbXTtcblxuICAgIHNlbGYuYWRkU2VnbWVudCgpO1xuICAgIHNlbGYuc2VnbWVudHNbMF0uYm9keS54ID0gMSAqIEJMT0NLX1c7XG4gICAgc2VsZi5zZWdtZW50c1swXS5ib2R5LnkgPSAxICogQkxPQ0tfSDtcblxuICAgIHNlbGYubW92ZWRTaW5jZSA9IGZhbHNlO1xuXG4gIH1cblxufVxuXG5mdW5jdGlvbiBGb29kKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYuYm9keSA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuICBzZWxmLmJvZHkuZ3JhcGhpY3MuYmVnaW5GaWxsKFwiUmVkXCIpLmRyYXdSZWN0KDAsIDAsIEJMT0NLX1csIEJMT0NLX0gpO1xuICBzZWxmLnggPSAwO1xuICBzZWxmLnkgPSAwO1xuXG4gIHNlbGYudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5ib2R5LnggPSBzZWxmLnggKiBCTE9DS19XO1xuICAgIHNlbGYuYm9keS55ID0gc2VsZi55ICogQkxPQ0tfSDtcbiAgfVxuXG4gIHNlbGYuY29sbGlzaW9uID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHJldHVybiAoeCA9PSBzZWxmLnggJiYgeSA9PSBzZWxmLnkpO1xuICB9XG5cbn1cblxuZnVuY3Rpb24gRm9vZE1uZ3IoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5ib2R5ID0gbmV3IGNyZWF0ZWpzLkNvbnRhaW5lcigpO1xuICBzZWxmLmZvb2RzID0gW107XG4gIHNlbGYuTUFYX0ZPT0QgPSAxMDtcbiAgXG4gIHNlbGYuYWRkRm9vZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmb29kID0gbmV3IEZvb2QoKTtcbiAgICBmb29kLnggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBXSURUSC9CTE9DS19XKTtcbiAgICBmb29kLnkgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBIRUlHSFQvQkxPQ0tfSCk7XG4gICAgc2VsZi5ib2R5LmFkZENoaWxkKGZvb2QuYm9keSk7XG4gICAgc2VsZi5mb29kcy5wdXNoKGZvb2QpO1xuICB9XG5cbiAgc2VsZi51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB3aGlsZSAoc2VsZi5ib2R5LmNoaWxkcmVuLmxlbmd0aCA8IHNlbGYuTUFYX0ZPT0QpIHtcbiAgICAgIHNlbGYuYWRkRm9vZCgpO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuZm9vZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHNlbGYuZm9vZHNbaV0udXBkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgc2VsZi5jb2xsaXNpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLmZvb2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZm9vZCA9IHNlbGYuZm9vZHNbaV07XG4gICAgICBpZiAoZm9vZC5jb2xsaXNpb24oeCx5KSkge1xuICAgICAgICBzZWxmLmJvZHkucmVtb3ZlQ2hpbGRBdChpKTtcbiAgICAgICAgc2VsZi5mb29kcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzZWxmLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5ib2R5LnJlbW92ZUFsbENoaWxkcmVuKCk7XG4gICAgc2VsZi5mb29kcyA9IFtdO1xuICB9XG5cbn1cblxuZnVuY3Rpb24gcmVzZXQoKSB7XG4gIHBsYXllci5yZXNldCgpO1xuICBzY29yZU1uZ3IucmVzZXQoKTtcbiAgZm9vZE1uZ3IucmVzZXQoKTtcbiAgc3RhZ2UucmVtb3ZlQ2hpbGQoZ2FtZU92ZXJUZXh0KTtcbiAgZ2FtZVN0YXRlID0gR0FNRTtcbn1cbiAgICBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEhhbmRsZSBLZXlzXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gb25rZXlkb3duKGV2ZW50KSB7XG4gIGtleXNbZXZlbnQua2V5Q29kZV0gPSB0cnVlO1xuICBpZiAoZ2FtZVN0YXRlID09IEdBTUUpIHtcbiAgICBwbGF5ZXIudXBkYXRlU3RhdGUoZXZlbnQua2V5Q29kZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25rZXl1cChldmVudCkge1xuICBrZXlzW2V2ZW50LmtleUNvZGVdID0gZmFsc2U7XG5cbiAgaWYgKGdhbWVTdGF0ZSA9PSBHQU1FIHx8IGdhbWVTdGF0ZSA9PSBQQVVTRUQpIHtcbiAgICBpZiAoZXZlbnQua2V5Q29kZSA9PSBQKSB7XG4gICAgICBzd2l0Y2ggKGdhbWVTdGF0ZSkge1xuICAgICAgICBjYXNlIEdBTUU6ICAgZ2FtZVN0YXRlID0gUEFVU0VEOyBicmVhaztcbiAgICAgICAgY2FzZSBQQVVTRUQ6IGdhbWVTdGF0ZSA9IEdBTUU7IGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChnYW1lU3RhdGUgPT0gR0FNRSkge1xuICAgIGZvciAodmFyIGtleSBpbiBbVVAsIExFRlQsIERPV04sIFJJR0hUXSkge1xuICAgICAgaWYgKGtleXNba2V5XSkge1xuICAgICAgICBwbGF5ZXIudXBkYXRlU3RhdGUoZXZlbnQua2V5Q29kZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGdhbWVTdGF0ZSA9PSBFTkQgJiYgZXZlbnQua2V5Q29kZSA9PSBSKSB7XG4gICAgcmVzZXQoKTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBTdGFnZSB1cGRhdGVcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBlbmRHYW1lKCkge1xuICBnYW1lU3RhdGUgPSBFTkQ7XG4gIHN0YWdlLmFkZENoaWxkKGdhbWVPdmVyVGV4dCk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVRpY2soZXZlbnQpIHtcbiAgaWYgKGdhbWVTdGF0ZSA9PSBHQU1FKSB7XG4gICAgZm9vZE1uZ3IudXBkYXRlKCk7XG4gICAgcGxheWVyLnVwZGF0ZSgpO1xuICAgIHNjb3JlTW5nci51cGRhdGUoKTtcbiAgICBpZiAoIXBsYXllci5jaGVja0JvdW5kcygpKSB7XG4gICAgICBlbmRHYW1lKCk7XG4gICAgfVxuICAgIGlmIChmb29kTW5nci5jb2xsaXNpb24ocGxheWVyLnNlZ21lbnRzWzBdLngsIHBsYXllci5zZWdtZW50c1swXS55KSkge1xuICAgICAgc2NvcmVNbmdyLnNjb3JlICs9IDE7XG4gICAgICBwbGF5ZXIuYWRkU2VnbWVudCgpO1xuICAgIH1cbiAgfVxuICBzdGFnZS51cGRhdGUoKVxufVxuXG4iXX0=
