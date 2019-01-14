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


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gUm9sYW5kIEZvbmdcbi8vIFNuYWtlc1xuLy8gMS8xMS8xOVxuXG52YXIgV0lEVEggPSA2NDA7XG52YXIgSEVJR0hUID0gNDgwO1xuXG52YXIgQkxPQ0tfSCA9IDIwO1xudmFyIEJMT0NLX1cgPSAyMDtcblxuLy8gS2V5Y29kZXNcbnZhciBMRUZUICA9IDM3O1xudmFyIFVQICAgID0gMzg7XG52YXIgUklHSFQgPSAzOTtcbnZhciBET1dOICA9IDQwO1xuXG52YXIgTSAgICAgPSA3NztcbnZhciBQICAgICA9IDgwO1xudmFyIFIgICAgID0gODI7XG5cbi8vIEdhbWUgc3RhdGVzXG52YXIgSU5JVCAgID0gXCJpbml0XCI7XG52YXIgR0FNRSAgID0gXCJnYW1lXCI7XG52YXIgUEFVU0VEID0gXCJwYXVzZVwiO1xudmFyIEVORCAgICA9IFwiZW5kXCI7XG5cbi8vIFBsYXllciBzdGF0ZXNcbnZhciBQTEFZRVJfSURMRSAgPSBcIlBMQVlFUl9JRExFXCI7XG52YXIgUExBWUVSX1VQICAgID0gXCJQTEFZRVJfVVBcIjtcbnZhciBQTEFZRVJfTEVGVCAgPSBcIlBMQVlFUl9MRUZUXCI7XG52YXIgUExBWUVSX1JJR0hUID0gXCJQTEFZRVJfUklHSFRcIjtcbnZhciBQTEFZRVJfRE9XTiAgPSBcIlBMQVlFUl9ET1dOXCI7XG52YXIgUExBWUVSX0xVICAgID0gXCJQTEFZRVJfTFVcIjtcbnZhciBQTEFZRVJfTEQgICAgPSBcIlBMQVlFUl9MRFwiO1xudmFyIFBMQVlFUl9SVSAgICA9IFwiUExBWUVSX1JVXCI7XG52YXIgUExBWUVSX1JEICAgID0gXCJQTEFZRVJfUkRcIjtcbnZhciBQTEFZRVJfVUwgICAgPSBcIlBMQVlFUl9VTFwiO1xudmFyIFBMQVlFUl9ETCAgICA9IFwiUExBWUVSX0RMXCI7XG52YXIgUExBWUVSX1VSICAgID0gXCJQTEFZRVJfVVJcIjtcbnZhciBQTEFZRVJfRFIgICAgPSBcIlBMQVlFUl9EUlwiO1xuXG4vLyBWYXJpYWJsZXNcbnZhciBzdGFnZTtcbnZhciBwbGF5ZXI7XG52YXIgZ2FtZVN0YXRlO1xudmFyIGdhbWVPdmVyVGV4dDtcbnZhciBzY29yZU1uZ3I7XG52YXIgZm9vZE1uZ3I7XG52YXIgYmdtdXNpYztcbnZhciBtdXRlZDtcbiAgXG52YXIga2V5cyA9IHt9XG5cbmRvY3VtZW50Lm9ua2V5ZG93biA9IG9ua2V5ZG93bjtcbmRvY3VtZW50Lm9ua2V5dXAgPSBvbmtleXVwO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEluaXRpYWxpemF0aW9uIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmZ1bmN0aW9uIHBsYW5lKG9yaWd4LCBvcmlneSkge1xuICB2YXIgcGxhbmUgPSBuZXcgY3JlYXRlanMuQ29udGFpbmVyKCk7XG4gIGZ1bmN0aW9uIGRyYXcoeCx5LCBjb2xvcikge1xuICAgIHZhciBzcXVhcmUgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcbiAgICBzcXVhcmUuZ3JhcGhpY3NcbiAgICAgIC5iZWdpbkZpbGwoY29sb3IpXG4gICAgICAuZHJhd1JlY3Qob3JpZ3greCpCTE9DS19XLCBvcmlneSt5KkJMT0NLX0gsIEJMT0NLX1csIEJMT0NLX0gpO1xuICAgIHBsYW5lLmFkZENoaWxkKHNxdWFyZSk7XG4gIH1cblxuICB2YXIgbWFzayA9IFtcbiAgICBbMSwgMSwgMCwgMCwgMCwgMSwgMSwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgWzEsIDIsIDEsIDAsIDAsIDEsIDIsIDIsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICAgIFsxLCAyLCAyLCAxLCAwLCAwLCAxLCAyLCAyLCAxLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgICBbMCwgMSwgMiwgMiwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMCwgMCwgMF0sXG4gICAgWzEsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDEsIDEsIDBdLFxuICAgIFsxLCAxLCAxLCAyLCAyLCAyLCAyLCAyLCAyLCAxLCAyLCAxLCAyLCAxLCAyLCAyLCAxXSxcbiAgICBbMCwgMCwgMCwgMSwgMSwgMSwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMV0sXG4gICAgWzAsIDAsIDAsIDAsIDAsIDEsIDIsIDIsIDIsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDBdLFxuICAgIFswLCAwLCAwLCAwLCAxLCAyLCAyLCAyLCAxLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgICBbMCwgMCwgMCwgMCwgMSwgMiwgMiwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgWzAsIDAsIDAsIDEsIDIsIDIsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICAgIFswLCAwLCAwLCAxLCAxLCAxLCAwLCAwLCAwLCAwLCAwLCAwLCAwICwwLCAwLCAwLCAwXSxcbiAgXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG1hc2subGVuZ3RoOyBpKyspIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1hc2tbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgIGlmICAgICAgKG1hc2tbaV1bal0gPT0gMSkgZHJhdyhqLGksXCIjMjIyMjIyXCIpO1xuICAgICAgZWxzZSBpZiAobWFza1tpXVtqXSA9PSAyKSBkcmF3KGosaSxcIiMxMTExMTFcIik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBsYW5lO1xufVxuXG5mdW5jdGlvbiBpbml0KCkge1xuICB2YXIgcXVldWUgPSBuZXcgY3JlYXRlanMuTG9hZFF1ZXVlKCk7XG4gIHF1ZXVlLmluc3RhbGxQbHVnaW4oY3JlYXRlanMuU291bmQpO1xuICBxdWV1ZS5vbihcImNvbXBsZXRlXCIsIHNldHVwLCB0aGlzKTtcbiAgcXVldWUubG9hZEZpbGUoe2lkOlwibXVzaWNcIiwgc3JjOlwiYXVkaW8vYnJpbmdpdC5tcDNcIn0pO1xufVxuXG5mdW5jdGlvbiBzZXR1cCgpIHtcbiAgZ2FtZVN0YXRlID0gSU5JVDtcblxuICBzdGFnZSA9IG5ldyBjcmVhdGVqcy5TdGFnZShcImRlbW9DYW52YXNcIik7XG4gIGJnID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG4gIGJnLmdyYXBoaWNzLmJlZ2luRmlsbChcImJsYWNrXCIpLmRyYXdSZWN0KDAsIDAsIFdJRFRILCBIRUlHSFQpO1xuICBzdGFnZS5hZGRDaGlsZChiZyk7XG4gIFxuICB2YXIgcGxhbmV4ID0gKFdJRFRIIC0gMTcgKiBCTE9DS19XKSAvIDI7XG4gIHZhciBwbGFuZXkgPSAgKEhFSUdIVCAtIDEyICogQkxPQ0tfSCkgLyAyO1xuICB2YXIgYmdwbGFuZSA9IHBsYW5lKHBsYW5leCwgcGxhbmV5KTtcbiAgc3RhZ2UuYWRkQ2hpbGQoYmdwbGFuZSk7XG5cbiAgcGxheWVyID0gbmV3IFNuYWtlKCk7XG4gIHN0YWdlLmFkZENoaWxkKHBsYXllci5ib2R5KTtcblxuICBnYW1lT3ZlclRleHQgPSBuZXcgY3JlYXRlanMuVGV4dChcbiAgICBcIkdhbWUgT3ZlciAocHJlc3MgUiB0byByZXN0YXJ0KVwiLCBcIjI0cHggXFxcIkNvdXJpZXIgTmV3XFxcIlwiLCBcIndoaXRlXCIpO1xuICBnYW1lT3ZlclRleHQueCA9IFdJRFRIIC8gMiAtIDIwMDtcbiAgZ2FtZU92ZXJUZXh0LnkgPSBIRUlHSFQgLyAyO1xuXG4gIGZvb2RNbmdyID0gbmV3IEZvb2RNbmdyKCk7XG4gIHN0YWdlLmFkZENoaWxkKGZvb2RNbmdyLmJvZHkpO1xuXG4gIHNjb3JlTW5nciA9IG5ldyBTY29yZU1uZ3IoKTtcbiAgc3RhZ2UuYWRkQ2hpbGQoc2NvcmVNbmdyLmJvZHkpO1xuXG4gIG11dGVkID0gZmFsc2U7XG5cbiAgY3JlYXRlanMuVGlja2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0aWNrXCIsIGhhbmRsZVRpY2spO1xufVxuXG5mdW5jdGlvbiBTY29yZU1uZ3IoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBzZWxmLmJvZHkgPSBuZXcgY3JlYXRlanMuVGV4dChcIlNjb3JlOiAwXCIsIFwiMjRweCBcXFwiQ291cmllciBOZXdcXFwiXCIsIFwid2hpdGVcIik7XG4gIHNlbGYuYm9keS54ID0gMDtcbiAgc2VsZi5ib2R5LnkgPSAwO1xuXG4gIHNlbGYuc2NvcmUgPSAwO1xuXG4gIHNlbGYudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5ib2R5LnRleHQgPSBcIlNjb3JlOiBcIiArIHNlbGYuc2NvcmU7XG4gIH1cblxuICBzZWxmLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5zY29yZSA9IDA7XG4gIH1cbn1cblxuZnVuY3Rpb24gU2VnbWVudCgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLmJvZHkgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcbiAgc2VsZi5ib2R5LmdyYXBoaWNzLmJlZ2luRmlsbChcIkNoYXJ0cmV1c2VcIikuZHJhd1JlY3QoMCwgMCwgQkxPQ0tfVywgQkxPQ0tfSCk7XG4gIHNlbGYueCA9IDA7XG4gIHNlbGYueSA9IDA7XG5cbiAgc2VsZi51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmJvZHkueCA9IHNlbGYueCAqIEJMT0NLX1c7XG4gICAgc2VsZi5ib2R5LnkgPSBzZWxmLnkgKiBCTE9DS19IO1xuICB9XG5cbiAgc2VsZi5jb2xsaXNpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgcmV0dXJuICh4ID09IHNlbGYueCAmJiB5ID09IHNlbGYueSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gU25ha2UoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBzZWxmLmJvZHkgPSBuZXcgY3JlYXRlanMuQ29udGFpbmVyKCk7XG4gIHNlbGYuc2VnbWVudHMgPSBbXTtcblxuICBzZWxmLnNwZWVkID0gMTtcbiAgc2VsZi5zdGF0ZSA9IFBMQVlFUl9JRExFO1xuXG4gIHNlbGYuYWRkU2VnbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWdtZW50ID0gbmV3IFNlZ21lbnQoKTtcbiAgICBzZWxmLmJvZHkuYWRkQ2hpbGQoc2VnbWVudC5ib2R5KTtcbiAgICBzZWxmLnNlZ21lbnRzLnB1c2goc2VnbWVudCk7XG4gIH1cblxuICAvLyBjcmVhdGUgaGVhZFxuICBzZWxmLmFkZFNlZ21lbnQoKTtcbiAgc2VsZi5zZWdtZW50c1swXS5ib2R5LnggPSAxICogQkxPQ0tfVztcbiAgc2VsZi5zZWdtZW50c1swXS5ib2R5LnkgPSAxICogQkxPQ0tfSDtcblxuICBzZWxmLm1vdmVkU2luY2UgPSBmYWxzZTtcblxuICBzZWxmLnVwZGF0ZVN0YXRlID0gZnVuY3Rpb24oa2V5Q29kZSkge1xuICAgIGlmICghc2VsZi5tb3ZlZFNpbmNlKSByZXR1cm47XG4gICAgc2VsZi5tb3ZlZFNpbmNlID0gZmFsc2U7XG4gICAgc3dpdGNoIChrZXlDb2RlKSB7XG4gICAgICBjYXNlIExFRlQ6ICBcbiAgICAgICAgaWYgKHNlbGYuc3RhdGUgIT0gUExBWUVSX1JJR0hUKSBzZWxmLnN0YXRlID0gUExBWUVSX0xFRlQ7ICBcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFJJR0hUOiBcbiAgICAgICAgaWYgKHNlbGYuc3RhdGUgIT0gUExBWUVSX0xFRlQpICBzZWxmLnN0YXRlID0gUExBWUVSX1JJR0hUOyAgXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBVUDogICAgXG4gICAgICAgIGlmIChzZWxmLnN0YXRlICE9IFBMQVlFUl9ET1dOKSAgc2VsZi5zdGF0ZSA9IFBMQVlFUl9VUDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIERPV046ICBcbiAgICAgICAgaWYgKHNlbGYuc3RhdGUgIT0gUExBWUVSX1VQKSAgICBzZWxmLnN0YXRlID0gUExBWUVSX0RPV047XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHNlbGYubW92ZSA9IGZ1bmN0aW9uKGRpcikge1xuICAgIHNlbGYubW92ZWRTaW5jZSA9IHRydWU7XG4gICAgdmFyIGR4ID0gMDtcbiAgICB2YXIgZHkgPSAwO1xuICAgIHN3aXRjaCAoZGlyKSB7XG4gICAgICBjYXNlIFBMQVlFUl9MRUZUOlxuICAgICAgICBkeCAtPSBzZWxmLnNwZWVkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUExBWUVSX1JJR0hUOlxuICAgICAgICBkeCArPSBzZWxmLnNwZWVkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUExBWUVSX1VQOlxuICAgICAgICBkeSAtPSBzZWxmLnNwZWVkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUExBWUVSX0RPV046XG4gICAgICAgIGR5ICs9IHNlbGYuc3BlZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSBpbGx1c2lvbiBvZiBtb3ZlbWVudCBieSByZW1vdmluZyBsYXN0IGVsZW1lbnQgYW5kIFxuICAgIC8vIG1vdmluZyBpdCB0byBuZXcgcG9zaXRpb24gb2YgaGVhZFxuICAgIGlmIChzZWxmLnNlZ21lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHZhciBsYXN0ID0gc2VsZi5zZWdtZW50cy5wb3AoKTtcbiAgICAgIGxhc3QueCA9IHNlbGYuc2VnbWVudHNbMF0ueCArIGR4O1xuICAgICAgbGFzdC55ID0gc2VsZi5zZWdtZW50c1swXS55ICsgZHk7XG5cbiAgICAgIHNlbGYuc2VnbWVudHMgPSBbbGFzdF0uY29uY2F0KHNlbGYuc2VnbWVudHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLnNlZ21lbnRzWzBdLnggKz0gZHg7XG4gICAgICBzZWxmLnNlZ21lbnRzWzBdLnkgKz0gZHk7XG4gICAgfVxuXG4gIH1cblxuICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYubW92ZShzZWxmLnN0YXRlKTtcbiAgICBmb3IgKHZhciBzIG9mIHNlbGYuc2VnbWVudHMpIHtcbiAgICAgIHMudXBkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gY2hlY2sgYm91bmRzIG9mIHBsYXllciwgaWYgZmFsc2UsIHBsYXllciBpcyBkZWFkIVxuICBzZWxmLmNoZWNrQm91bmRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEoc2VsZi5zZWdtZW50c1swXS54ID49IDAgJiYgXG4gICAgICAgICAgc2VsZi5zZWdtZW50c1swXS55ID49IDAgJiYgXG4gICAgICAgICAgc2VsZi5zZWdtZW50c1swXS54IDwgV0lEVEgvQkxPQ0tfVyAmJiBcbiAgICAgICAgICBzZWxmLnNlZ21lbnRzWzBdLnkgPCBIRUlHSFQvQkxPQ0tfSCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTsgXG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgc2VsZi5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHMgPSBzZWxmLnNlZ21lbnRzW2ldO1xuICAgICAgaWYgKHNlbGYuc2VnbWVudHNbMF0uY29sbGlzaW9uKHMueCwgcy55KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBzZWxmLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5zdGF0ZSA9IFBMQVlFUl9JRExFO1xuXG4gICAgc2VsZi5ib2R5LnJlbW92ZUFsbENoaWxkcmVuKCk7XG4gICAgc2VsZi5zZWdtZW50cyA9IFtdO1xuXG4gICAgc2VsZi5hZGRTZWdtZW50KCk7XG4gICAgc2VsZi5zZWdtZW50c1swXS5ib2R5LnggPSAxICogQkxPQ0tfVztcbiAgICBzZWxmLnNlZ21lbnRzWzBdLmJvZHkueSA9IDEgKiBCTE9DS19IO1xuXG4gICAgc2VsZi5tb3ZlZFNpbmNlID0gZmFsc2U7XG5cbiAgfVxuXG59XG5cbmZ1bmN0aW9uIEZvb2QoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5ib2R5ID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG4gIHNlbGYuYm9keS5ncmFwaGljcy5iZWdpbkZpbGwoXCJSZWRcIikuZHJhd1JlY3QoMCwgMCwgQkxPQ0tfVywgQkxPQ0tfSCk7XG4gIHNlbGYueCA9IDA7XG4gIHNlbGYueSA9IDA7XG5cbiAgc2VsZi51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmJvZHkueCA9IHNlbGYueCAqIEJMT0NLX1c7XG4gICAgc2VsZi5ib2R5LnkgPSBzZWxmLnkgKiBCTE9DS19IO1xuICB9XG5cbiAgc2VsZi5jb2xsaXNpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgcmV0dXJuICh4ID09IHNlbGYueCAmJiB5ID09IHNlbGYueSk7XG4gIH1cblxufVxuXG5mdW5jdGlvbiBGb29kTW5ncigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLmJvZHkgPSBuZXcgY3JlYXRlanMuQ29udGFpbmVyKCk7XG4gIHNlbGYuZm9vZHMgPSBbXTtcbiAgc2VsZi5NQVhfRk9PRCA9IDEwO1xuICBcbiAgc2VsZi5hZGRGb29kID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvb2QgPSBuZXcgRm9vZCgpO1xuICAgIGZvb2QueCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIFdJRFRIL0JMT0NLX1cpO1xuICAgIGZvb2QueSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIEhFSUdIVC9CTE9DS19IKTtcbiAgICBzZWxmLmJvZHkuYWRkQ2hpbGQoZm9vZC5ib2R5KTtcbiAgICBzZWxmLmZvb2RzLnB1c2goZm9vZCk7XG4gIH1cblxuICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHdoaWxlIChzZWxmLmJvZHkuY2hpbGRyZW4ubGVuZ3RoIDwgc2VsZi5NQVhfRk9PRCkge1xuICAgICAgc2VsZi5hZGRGb29kKCk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5mb29kcy5sZW5ndGg7IGkrKykge1xuICAgICAgc2VsZi5mb29kc1tpXS51cGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICBzZWxmLmNvbGxpc2lvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuZm9vZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBmb29kID0gc2VsZi5mb29kc1tpXTtcbiAgICAgIGlmIChmb29kLmNvbGxpc2lvbih4LHkpKSB7XG4gICAgICAgIHNlbGYuYm9keS5yZW1vdmVDaGlsZEF0KGkpO1xuICAgICAgICBzZWxmLmZvb2RzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHNlbGYucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmJvZHkucmVtb3ZlQWxsQ2hpbGRyZW4oKTtcbiAgICBzZWxmLmZvb2RzID0gW107XG4gIH1cblxufVxuXG5mdW5jdGlvbiByZXNldCgpIHtcbiAgcGxheWVyLnJlc2V0KCk7XG4gIHNjb3JlTW5nci5yZXNldCgpO1xuICBmb29kTW5nci5yZXNldCgpO1xuICBzdGFnZS5yZW1vdmVDaGlsZChnYW1lT3ZlclRleHQpO1xuICBnYW1lU3RhdGUgPSBJTklUO1xuXG4gIC8vIHJlc3RhcnQgdHJhY2tcbiAgYmdtdXNpYy5wb3NpdGlvbiA9IDA7XG4gIGJnbXVzaWMucGF1c2VkID0gdHJ1ZTtcbn1cbiAgICBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEhhbmRsZSBLZXlzXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gb25rZXlkb3duKGV2ZW50KSB7XG4gIGtleXNbZXZlbnQua2V5Q29kZV0gPSB0cnVlO1xuXG4gIGlmIChldmVudC5rZXlDb2RlID09IE0gJiYgYmdtdXNpYykge1xuICAgIG11dGVkID0gIW11dGVkO1xuICAgIGJnbXVzaWMudm9sdW1lID0gKGJnbXVzaWMudm9sdW1lICsgMSkgJSAyO1xuICB9XG5cbiAgaWYgKGdhbWVTdGF0ZSA9PSBJTklUICYmIFxuICAgIChrZXlzW1VQXSB8fCBrZXlzW0RPV05dIHx8IGtleXNbTEVGVF0gfHwga2V5c1tSSUdIVF0pKSB7XG4gICAgLy8gKHJlKXN0YXJ0IHRoZSBtdXNpYyB3aGVuIHBsYXllciBtYWtlcyB0aGVpciBtb3ZlXG4gICAgaWYgKCFiZ211c2ljKSB7XG4gICAgICBiZ211c2ljID0gY3JlYXRlanMuU291bmQucGxheShcIm11c2ljXCIsIHsgbG9vcDogLTEgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJnbXVzaWMucGF1c2VkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChtdXRlZCkgYmdtdXNpYy52b2x1bWUgPSAwO1xuICAgIGVsc2UgICAgICAgYmdtdXNpYy52b2x1bWUgPSAxO1xuICAgIGdhbWVTdGF0ZSA9IEdBTUU7XG4gIH1cblxuICBpZiAoZ2FtZVN0YXRlID09IEdBTUUpIHtcbiAgICBwbGF5ZXIudXBkYXRlU3RhdGUoZXZlbnQua2V5Q29kZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25rZXl1cChldmVudCkge1xuICBrZXlzW2V2ZW50LmtleUNvZGVdID0gZmFsc2U7XG5cbiAgaWYgKGdhbWVTdGF0ZSA9PSBHQU1FIHx8IGdhbWVTdGF0ZSA9PSBQQVVTRUQpIHtcbiAgICBpZiAoZXZlbnQua2V5Q29kZSA9PSBQKSB7XG4gICAgICBzd2l0Y2ggKGdhbWVTdGF0ZSkge1xuICAgICAgICBjYXNlIEdBTUU6ICAgZ2FtZVN0YXRlID0gUEFVU0VEOyBicmVhaztcbiAgICAgICAgY2FzZSBQQVVTRUQ6IGdhbWVTdGF0ZSA9IEdBTUU7IGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChnYW1lU3RhdGUgPT0gSU5JVCB8fCBnYW1lU3RhdGUgPT0gR0FNRSkge1xuICAgIGZvciAodmFyIGtleSBpbiBbVVAsIExFRlQsIERPV04sIFJJR0hUXSkge1xuICAgICAgaWYgKGtleXNba2V5XSkge1xuICAgICAgICBwbGF5ZXIudXBkYXRlU3RhdGUoZXZlbnQua2V5Q29kZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGdhbWVTdGF0ZSA9PSBFTkQgJiYgZXZlbnQua2V5Q29kZSA9PSBSKSB7XG4gICAgcmVzZXQoKTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBTdGFnZSB1cGRhdGVcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBlbmRHYW1lKCkge1xuICBnYW1lU3RhdGUgPSBFTkQ7XG4gIHN0YWdlLmFkZENoaWxkKGdhbWVPdmVyVGV4dCk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVRpY2soZXZlbnQpIHtcbiAgaWYgKGdhbWVTdGF0ZSA9PSBHQU1FIHx8IGdhbWVTdGF0ZSA9PSBJTklUKSB7XG4gICAgZm9vZE1uZ3IudXBkYXRlKCk7XG4gICAgcGxheWVyLnVwZGF0ZSgpO1xuICAgIHNjb3JlTW5nci51cGRhdGUoKTtcbiAgICBpZiAoIXBsYXllci5jaGVja0JvdW5kcygpKSB7XG4gICAgICBlbmRHYW1lKCk7XG4gICAgfVxuICAgIGlmIChmb29kTW5nci5jb2xsaXNpb24ocGxheWVyLnNlZ21lbnRzWzBdLngsIHBsYXllci5zZWdtZW50c1swXS55KSkge1xuICAgICAgc2NvcmVNbmdyLnNjb3JlICs9IDE7XG4gICAgICBwbGF5ZXIuYWRkU2VnbWVudCgpO1xuICAgIH1cbiAgfVxuICBzdGFnZS51cGRhdGUoKVxufVxuXG4iXX0=
