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

// Player colors
var RAINBOW_UPDATE = 3;
var NUM_RAINBOW    = 6;
var RED     = "lightcoral";
var ORANGE  = "lightsalmon";
var YELLOW  = "khaki";
var GREEN   = "palegreen";
var BLUE    = "powderblue";
var VIOLET  = "plum";
var WHITE   = "white";
var RAINBOW = "rainbow";

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

function Segment(color) {
  var self = this;
  self.body = new createjs.Shape();
  self.body.graphics.beginFill(color).drawRect(0, 0, BLOCK_W, BLOCK_H);
  self.x = 0;
  self.y = 0;

  self.recolor = function(c) {
    self.body.graphics.beginFill(c).drawRect(0, 0, BLOCK_W, BLOCK_H);
  }

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
  self.color = GREEN;

  // for rainbow only
  self.colorCounter = 0;
  self.colorUpdateCounter = 0;

  self.addSegment = function() {
    var segment;
    if (self.color != RAINBOW) {
      segment = new Segment(self.color);
    } else {
      segment = new Segment(WHITE);
    }
    self.body.addChild(segment.body);
    self.segments.push(segment);
  }

  // create snake head
  self.addSegment();
  self.segments[0].x = WIDTH/BLOCK_W/2;
  self.segments[0].y = HEIGHT/BLOCK_H/2;
  self.segments[0].update();

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
      case PLAYER_LEFT:  dx -= self.speed; break;
      case PLAYER_RIGHT: dx += self.speed; break;
      case PLAYER_UP:    dy -= self.speed; break;
      case PLAYER_DOWN:  dy += self.speed; break;
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
    self.segments[0].update();

  }

  self.update = function() {
    self.move(self.state);
    
    // use to make colors appear to cycle
    self.colorCounter = (self.colorCounter + 1) % NUM_RAINBOW; 

    // use to tell when to update colors
    self.colorUpdateCounter = (self.colorUpdateCounter + 1) % RAINBOW_UPDATE;

    for (var i = 0; i < self.segments.length; i++) {
      var s = self.segments[i];
      if (self.color == RAINBOW && 
        self.colorUpdateCounter % RAINBOW_UPDATE == 0) {
        var idx = (i + self.colorCounter) % 6;
        switch (idx) {
          case 0: s.recolor(VIOLET);  break;
          case 1: s.recolor(BLUE);    break;
          case 2: s.recolor(GREEN);   break;
          case 3: s.recolor(YELLOW);  break;
          case 4: s.recolor(ORANGE);  break;
          case 5: s.recolor(RED);     break;
        }
      }
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
    self.color = GREEN;

    self.body.removeAllChildren();
    self.segments = [];

    // create snake head
    self.addSegment();
    self.segments[0].x = WIDTH/BLOCK_W/2;
    self.segments[0].y = HEIGHT/BLOCK_H/2;
    self.segments[0].update();

    self.movedSince = false;

  }

  self.recolor = function(color) {
    self.color = color;
    if (color == RAINBOW) return; // special coloring in update for rainbow
    for (var i = 0; i < self.segments.length; i++) {
      self.segments[i].recolor(color); 
    }
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
      switch (scoreMngr.score) {
        case 5: player.recolor(YELLOW);    break;
        case 10: player.recolor(RED);      break;
        case 25: player.recolor(VIOLET);   break;
        case 50: player.recolor(BLUE);     break;
        case 75: player.recolor(WHITE);    break;
        case 100: player.recolor(RAINBOW); break;
      }
    }
  }
  stage.update()
}


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBSb2xhbmQgRm9uZ1xuLy8gU25ha2VzXG4vLyAxLzExLzE5XG5cbnZhciBXSURUSCA9IDY0MDtcbnZhciBIRUlHSFQgPSA0ODA7XG5cbnZhciBCTE9DS19IID0gMjA7XG52YXIgQkxPQ0tfVyA9IDIwO1xuXG4vLyBLZXljb2Rlc1xudmFyIExFRlQgID0gMzc7XG52YXIgVVAgICAgPSAzODtcbnZhciBSSUdIVCA9IDM5O1xudmFyIERPV04gID0gNDA7XG5cbnZhciBNICAgICA9IDc3O1xudmFyIFAgICAgID0gODA7XG52YXIgUiAgICAgPSA4MjtcblxuLy8gR2FtZSBzdGF0ZXNcbnZhciBJTklUICAgPSBcImluaXRcIjtcbnZhciBHQU1FICAgPSBcImdhbWVcIjtcbnZhciBQQVVTRUQgPSBcInBhdXNlXCI7XG52YXIgRU5EICAgID0gXCJlbmRcIjtcblxuLy8gUGxheWVyIHN0YXRlc1xudmFyIFBMQVlFUl9JRExFICA9IFwiUExBWUVSX0lETEVcIjtcbnZhciBQTEFZRVJfVVAgICAgPSBcIlBMQVlFUl9VUFwiO1xudmFyIFBMQVlFUl9MRUZUICA9IFwiUExBWUVSX0xFRlRcIjtcbnZhciBQTEFZRVJfUklHSFQgPSBcIlBMQVlFUl9SSUdIVFwiO1xudmFyIFBMQVlFUl9ET1dOICA9IFwiUExBWUVSX0RPV05cIjtcbnZhciBQTEFZRVJfTFUgICAgPSBcIlBMQVlFUl9MVVwiO1xudmFyIFBMQVlFUl9MRCAgICA9IFwiUExBWUVSX0xEXCI7XG52YXIgUExBWUVSX1JVICAgID0gXCJQTEFZRVJfUlVcIjtcbnZhciBQTEFZRVJfUkQgICAgPSBcIlBMQVlFUl9SRFwiO1xudmFyIFBMQVlFUl9VTCAgICA9IFwiUExBWUVSX1VMXCI7XG52YXIgUExBWUVSX0RMICAgID0gXCJQTEFZRVJfRExcIjtcbnZhciBQTEFZRVJfVVIgICAgPSBcIlBMQVlFUl9VUlwiO1xudmFyIFBMQVlFUl9EUiAgICA9IFwiUExBWUVSX0RSXCI7XG5cbi8vIFBsYXllciBjb2xvcnNcbnZhciBSQUlOQk9XX1VQREFURSA9IDM7XG52YXIgTlVNX1JBSU5CT1cgICAgPSA2O1xudmFyIFJFRCAgICAgPSBcImxpZ2h0Y29yYWxcIjtcbnZhciBPUkFOR0UgID0gXCJsaWdodHNhbG1vblwiO1xudmFyIFlFTExPVyAgPSBcImtoYWtpXCI7XG52YXIgR1JFRU4gICA9IFwicGFsZWdyZWVuXCI7XG52YXIgQkxVRSAgICA9IFwicG93ZGVyYmx1ZVwiO1xudmFyIFZJT0xFVCAgPSBcInBsdW1cIjtcbnZhciBXSElURSAgID0gXCJ3aGl0ZVwiO1xudmFyIFJBSU5CT1cgPSBcInJhaW5ib3dcIjtcblxuLy8gVmFyaWFibGVzXG52YXIgc3RhZ2U7XG52YXIgcGxheWVyO1xudmFyIGdhbWVTdGF0ZTtcbnZhciBnYW1lT3ZlclRleHQ7XG52YXIgc2NvcmVNbmdyO1xudmFyIGZvb2RNbmdyO1xudmFyIGJnbXVzaWM7XG52YXIgbXV0ZWQ7XG4gIFxudmFyIGtleXMgPSB7fVxuXG5kb2N1bWVudC5vbmtleWRvd24gPSBvbmtleWRvd247XG5kb2N1bWVudC5vbmtleXVwID0gb25rZXl1cDtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBJbml0aWFsaXphdGlvbiBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBwbGFuZShvcmlneCwgb3JpZ3kpIHtcbiAgdmFyIHBsYW5lID0gbmV3IGNyZWF0ZWpzLkNvbnRhaW5lcigpO1xuICBmdW5jdGlvbiBkcmF3KHgseSwgY29sb3IpIHtcbiAgICB2YXIgc3F1YXJlID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG4gICAgc3F1YXJlLmdyYXBoaWNzXG4gICAgICAuYmVnaW5GaWxsKGNvbG9yKVxuICAgICAgLmRyYXdSZWN0KG9yaWd4K3gqQkxPQ0tfVywgb3JpZ3kreSpCTE9DS19ILCBCTE9DS19XLCBCTE9DS19IKTtcbiAgICBwbGFuZS5hZGRDaGlsZChzcXVhcmUpO1xuICB9XG5cbiAgdmFyIG1hc2sgPSBbXG4gICAgWzEsIDEsIDAsIDAsIDAsIDEsIDEsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICAgIFsxLCAyLCAxLCAwLCAwLCAxLCAyLCAyLCAxLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgICBbMSwgMiwgMiwgMSwgMCwgMCwgMSwgMiwgMiwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgWzAsIDEsIDIsIDIsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDAsIDAsIDBdLFxuICAgIFsxLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAxLCAxLCAwXSxcbiAgICBbMSwgMSwgMSwgMiwgMiwgMiwgMiwgMiwgMiwgMSwgMiwgMSwgMiwgMSwgMiwgMiwgMV0sXG4gICAgWzAsIDAsIDAsIDEsIDEsIDEsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDFdLFxuICAgIFswLCAwLCAwLCAwLCAwLCAxLCAyLCAyLCAyLCAxLCAxLCAxLCAxLCAxLCAxLCAxLCAwXSxcbiAgICBbMCwgMCwgMCwgMCwgMSwgMiwgMiwgMiwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgWzAsIDAsIDAsIDAsIDEsIDIsIDIsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICAgIFswLCAwLCAwLCAxLCAyLCAyLCAxLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgICBbMCwgMCwgMCwgMSwgMSwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMCAsMCwgMCwgMCwgMF0sXG4gIF07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXNrLmxlbmd0aDsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBtYXNrW2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICBpZiAgICAgIChtYXNrW2ldW2pdID09IDEpIGRyYXcoaixpLFwiIzIyMjIyMlwiKTtcbiAgICAgIGVsc2UgaWYgKG1hc2tbaV1bal0gPT0gMikgZHJhdyhqLGksXCIjMTExMTExXCIpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwbGFuZTtcbn1cblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgdmFyIHF1ZXVlID0gbmV3IGNyZWF0ZWpzLkxvYWRRdWV1ZSgpO1xuICBxdWV1ZS5pbnN0YWxsUGx1Z2luKGNyZWF0ZWpzLlNvdW5kKTtcbiAgcXVldWUub24oXCJjb21wbGV0ZVwiLCBzZXR1cCwgdGhpcyk7XG4gIHF1ZXVlLmxvYWRGaWxlKHtpZDpcIm11c2ljXCIsIHNyYzpcImF1ZGlvL2JyaW5naXQubXAzXCJ9KTtcbn1cblxuZnVuY3Rpb24gc2V0dXAoKSB7XG4gIGdhbWVTdGF0ZSA9IElOSVQ7XG5cbiAgc3RhZ2UgPSBuZXcgY3JlYXRlanMuU3RhZ2UoXCJkZW1vQ2FudmFzXCIpO1xuICBiZyA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuICBiZy5ncmFwaGljcy5iZWdpbkZpbGwoXCJibGFja1wiKS5kcmF3UmVjdCgwLCAwLCBXSURUSCwgSEVJR0hUKTtcbiAgc3RhZ2UuYWRkQ2hpbGQoYmcpO1xuICBcbiAgdmFyIHBsYW5leCA9IChXSURUSCAtIDE3ICogQkxPQ0tfVykgLyAyO1xuICB2YXIgcGxhbmV5ID0gIChIRUlHSFQgLSAxMiAqIEJMT0NLX0gpIC8gMjtcbiAgdmFyIGJncGxhbmUgPSBwbGFuZShwbGFuZXgsIHBsYW5leSk7XG4gIHN0YWdlLmFkZENoaWxkKGJncGxhbmUpO1xuXG4gIHBsYXllciA9IG5ldyBTbmFrZSgpO1xuICBzdGFnZS5hZGRDaGlsZChwbGF5ZXIuYm9keSk7XG5cbiAgZ2FtZU92ZXJUZXh0ID0gbmV3IGNyZWF0ZWpzLlRleHQoXG4gICAgXCJHYW1lIE92ZXIgKHByZXNzIFIgdG8gcmVzdGFydClcIiwgXCIyNHB4IFxcXCJDb3VyaWVyIE5ld1xcXCJcIiwgXCJ3aGl0ZVwiKTtcbiAgZ2FtZU92ZXJUZXh0LnggPSBXSURUSCAvIDIgLSAyMDA7XG4gIGdhbWVPdmVyVGV4dC55ID0gSEVJR0hUIC8gMjtcblxuICBmb29kTW5nciA9IG5ldyBGb29kTW5ncigpO1xuICBzdGFnZS5hZGRDaGlsZChmb29kTW5nci5ib2R5KTtcblxuICBzY29yZU1uZ3IgPSBuZXcgU2NvcmVNbmdyKCk7XG4gIHN0YWdlLmFkZENoaWxkKHNjb3JlTW5nci5ib2R5KTtcblxuICBtdXRlZCA9IGZhbHNlO1xuXG4gIGNyZWF0ZWpzLlRpY2tlci5hZGRFdmVudExpc3RlbmVyKFwidGlja1wiLCBoYW5kbGVUaWNrKTtcbn1cblxuZnVuY3Rpb24gU2NvcmVNbmdyKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgc2VsZi5ib2R5ID0gbmV3IGNyZWF0ZWpzLlRleHQoXCJTY29yZTogMFwiLCBcIjI0cHggXFxcIkNvdXJpZXIgTmV3XFxcIlwiLCBcIndoaXRlXCIpO1xuICBzZWxmLmJvZHkueCA9IDA7XG4gIHNlbGYuYm9keS55ID0gMDtcblxuICBzZWxmLnNjb3JlID0gMDtcblxuICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuYm9keS50ZXh0ID0gXCJTY29yZTogXCIgKyBzZWxmLnNjb3JlO1xuICB9XG5cbiAgc2VsZi5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuc2NvcmUgPSAwO1xuICB9XG59XG5cbmZ1bmN0aW9uIFNlZ21lbnQoY29sb3IpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLmJvZHkgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcbiAgc2VsZi5ib2R5LmdyYXBoaWNzLmJlZ2luRmlsbChjb2xvcikuZHJhd1JlY3QoMCwgMCwgQkxPQ0tfVywgQkxPQ0tfSCk7XG4gIHNlbGYueCA9IDA7XG4gIHNlbGYueSA9IDA7XG5cbiAgc2VsZi5yZWNvbG9yID0gZnVuY3Rpb24oYykge1xuICAgIHNlbGYuYm9keS5ncmFwaGljcy5iZWdpbkZpbGwoYykuZHJhd1JlY3QoMCwgMCwgQkxPQ0tfVywgQkxPQ0tfSCk7XG4gIH1cblxuICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuYm9keS54ID0gc2VsZi54ICogQkxPQ0tfVztcbiAgICBzZWxmLmJvZHkueSA9IHNlbGYueSAqIEJMT0NLX0g7XG4gIH1cblxuICBzZWxmLmNvbGxpc2lvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICByZXR1cm4gKHggPT0gc2VsZi54ICYmIHkgPT0gc2VsZi55KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBTbmFrZSgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHNlbGYuYm9keSA9IG5ldyBjcmVhdGVqcy5Db250YWluZXIoKTtcbiAgc2VsZi5zZWdtZW50cyA9IFtdO1xuXG4gIHNlbGYuc3BlZWQgPSAxO1xuICBzZWxmLnN0YXRlID0gUExBWUVSX0lETEU7XG4gIHNlbGYuY29sb3IgPSBHUkVFTjtcblxuICAvLyBmb3IgcmFpbmJvdyBvbmx5XG4gIHNlbGYuY29sb3JDb3VudGVyID0gMDtcbiAgc2VsZi5jb2xvclVwZGF0ZUNvdW50ZXIgPSAwO1xuXG4gIHNlbGYuYWRkU2VnbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWdtZW50O1xuICAgIGlmIChzZWxmLmNvbG9yICE9IFJBSU5CT1cpIHtcbiAgICAgIHNlZ21lbnQgPSBuZXcgU2VnbWVudChzZWxmLmNvbG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VnbWVudCA9IG5ldyBTZWdtZW50KFdISVRFKTtcbiAgICB9XG4gICAgc2VsZi5ib2R5LmFkZENoaWxkKHNlZ21lbnQuYm9keSk7XG4gICAgc2VsZi5zZWdtZW50cy5wdXNoKHNlZ21lbnQpO1xuICB9XG5cbiAgLy8gY3JlYXRlIHNuYWtlIGhlYWRcbiAgc2VsZi5hZGRTZWdtZW50KCk7XG4gIHNlbGYuc2VnbWVudHNbMF0ueCA9IFdJRFRIL0JMT0NLX1cvMjtcbiAgc2VsZi5zZWdtZW50c1swXS55ID0gSEVJR0hUL0JMT0NLX0gvMjtcbiAgc2VsZi5zZWdtZW50c1swXS51cGRhdGUoKTtcblxuICBzZWxmLm1vdmVkU2luY2UgPSBmYWxzZTtcblxuICBzZWxmLnVwZGF0ZVN0YXRlID0gZnVuY3Rpb24oa2V5Q29kZSkge1xuICAgIGlmICghc2VsZi5tb3ZlZFNpbmNlKSByZXR1cm47XG4gICAgc2VsZi5tb3ZlZFNpbmNlID0gZmFsc2U7XG4gICAgc3dpdGNoIChrZXlDb2RlKSB7XG4gICAgICBjYXNlIExFRlQ6ICBcbiAgICAgICAgaWYgKHNlbGYuc3RhdGUgIT0gUExBWUVSX1JJR0hUKSBzZWxmLnN0YXRlID0gUExBWUVSX0xFRlQ7ICBcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFJJR0hUOiBcbiAgICAgICAgaWYgKHNlbGYuc3RhdGUgIT0gUExBWUVSX0xFRlQpICBzZWxmLnN0YXRlID0gUExBWUVSX1JJR0hUOyAgXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBVUDogICAgXG4gICAgICAgIGlmIChzZWxmLnN0YXRlICE9IFBMQVlFUl9ET1dOKSAgc2VsZi5zdGF0ZSA9IFBMQVlFUl9VUDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIERPV046ICBcbiAgICAgICAgaWYgKHNlbGYuc3RhdGUgIT0gUExBWUVSX1VQKSAgICBzZWxmLnN0YXRlID0gUExBWUVSX0RPV047XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHNlbGYubW92ZSA9IGZ1bmN0aW9uKGRpcikge1xuICAgIHNlbGYubW92ZWRTaW5jZSA9IHRydWU7XG4gICAgdmFyIGR4ID0gMDtcbiAgICB2YXIgZHkgPSAwO1xuICAgIHN3aXRjaCAoZGlyKSB7XG4gICAgICBjYXNlIFBMQVlFUl9MRUZUOiAgZHggLT0gc2VsZi5zcGVlZDsgYnJlYWs7XG4gICAgICBjYXNlIFBMQVlFUl9SSUdIVDogZHggKz0gc2VsZi5zcGVlZDsgYnJlYWs7XG4gICAgICBjYXNlIFBMQVlFUl9VUDogICAgZHkgLT0gc2VsZi5zcGVlZDsgYnJlYWs7XG4gICAgICBjYXNlIFBMQVlFUl9ET1dOOiAgZHkgKz0gc2VsZi5zcGVlZDsgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIGlsbHVzaW9uIG9mIG1vdmVtZW50IGJ5IHJlbW92aW5nIGxhc3QgZWxlbWVudCBhbmQgXG4gICAgLy8gbW92aW5nIGl0IHRvIG5ldyBwb3NpdGlvbiBvZiBoZWFkXG4gICAgaWYgKHNlbGYuc2VnbWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgdmFyIGxhc3QgPSBzZWxmLnNlZ21lbnRzLnBvcCgpO1xuICAgICAgbGFzdC54ID0gc2VsZi5zZWdtZW50c1swXS54ICsgZHg7XG4gICAgICBsYXN0LnkgPSBzZWxmLnNlZ21lbnRzWzBdLnkgKyBkeTtcblxuICAgICAgc2VsZi5zZWdtZW50cyA9IFtsYXN0XS5jb25jYXQoc2VsZi5zZWdtZW50cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuc2VnbWVudHNbMF0ueCArPSBkeDtcbiAgICAgIHNlbGYuc2VnbWVudHNbMF0ueSArPSBkeTtcbiAgICB9XG4gICAgc2VsZi5zZWdtZW50c1swXS51cGRhdGUoKTtcblxuICB9XG5cbiAgc2VsZi51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLm1vdmUoc2VsZi5zdGF0ZSk7XG4gICAgXG4gICAgLy8gdXNlIHRvIG1ha2UgY29sb3JzIGFwcGVhciB0byBjeWNsZVxuICAgIHNlbGYuY29sb3JDb3VudGVyID0gKHNlbGYuY29sb3JDb3VudGVyICsgMSkgJSBOVU1fUkFJTkJPVzsgXG5cbiAgICAvLyB1c2UgdG8gdGVsbCB3aGVuIHRvIHVwZGF0ZSBjb2xvcnNcbiAgICBzZWxmLmNvbG9yVXBkYXRlQ291bnRlciA9IChzZWxmLmNvbG9yVXBkYXRlQ291bnRlciArIDEpICUgUkFJTkJPV19VUERBVEU7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuc2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzID0gc2VsZi5zZWdtZW50c1tpXTtcbiAgICAgIGlmIChzZWxmLmNvbG9yID09IFJBSU5CT1cgJiYgXG4gICAgICAgIHNlbGYuY29sb3JVcGRhdGVDb3VudGVyICUgUkFJTkJPV19VUERBVEUgPT0gMCkge1xuICAgICAgICB2YXIgaWR4ID0gKGkgKyBzZWxmLmNvbG9yQ291bnRlcikgJSA2O1xuICAgICAgICBzd2l0Y2ggKGlkeCkge1xuICAgICAgICAgIGNhc2UgMDogcy5yZWNvbG9yKFZJT0xFVCk7ICBicmVhaztcbiAgICAgICAgICBjYXNlIDE6IHMucmVjb2xvcihCTFVFKTsgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAyOiBzLnJlY29sb3IoR1JFRU4pOyAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMzogcy5yZWNvbG9yKFlFTExPVyk7ICBicmVhaztcbiAgICAgICAgICBjYXNlIDQ6IHMucmVjb2xvcihPUkFOR0UpOyAgYnJlYWs7XG4gICAgICAgICAgY2FzZSA1OiBzLnJlY29sb3IoUkVEKTsgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gY2hlY2sgYm91bmRzIG9mIHBsYXllciwgaWYgZmFsc2UsIHBsYXllciBpcyBkZWFkIVxuICBzZWxmLmNoZWNrQm91bmRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEoc2VsZi5zZWdtZW50c1swXS54ID49IDAgJiYgXG4gICAgICAgICAgc2VsZi5zZWdtZW50c1swXS55ID49IDAgJiYgXG4gICAgICAgICAgc2VsZi5zZWdtZW50c1swXS54IDwgV0lEVEgvQkxPQ0tfVyAmJiBcbiAgICAgICAgICBzZWxmLnNlZ21lbnRzWzBdLnkgPCBIRUlHSFQvQkxPQ0tfSCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTsgXG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgc2VsZi5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHMgPSBzZWxmLnNlZ21lbnRzW2ldO1xuICAgICAgaWYgKHNlbGYuc2VnbWVudHNbMF0uY29sbGlzaW9uKHMueCwgcy55KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBzZWxmLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5zdGF0ZSA9IFBMQVlFUl9JRExFO1xuICAgIHNlbGYuY29sb3IgPSBHUkVFTjtcblxuICAgIHNlbGYuYm9keS5yZW1vdmVBbGxDaGlsZHJlbigpO1xuICAgIHNlbGYuc2VnbWVudHMgPSBbXTtcblxuICAgIC8vIGNyZWF0ZSBzbmFrZSBoZWFkXG4gICAgc2VsZi5hZGRTZWdtZW50KCk7XG4gICAgc2VsZi5zZWdtZW50c1swXS54ID0gV0lEVEgvQkxPQ0tfVy8yO1xuICAgIHNlbGYuc2VnbWVudHNbMF0ueSA9IEhFSUdIVC9CTE9DS19ILzI7XG4gICAgc2VsZi5zZWdtZW50c1swXS51cGRhdGUoKTtcblxuICAgIHNlbGYubW92ZWRTaW5jZSA9IGZhbHNlO1xuXG4gIH1cblxuICBzZWxmLnJlY29sb3IgPSBmdW5jdGlvbihjb2xvcikge1xuICAgIHNlbGYuY29sb3IgPSBjb2xvcjtcbiAgICBpZiAoY29sb3IgPT0gUkFJTkJPVykgcmV0dXJuOyAvLyBzcGVjaWFsIGNvbG9yaW5nIGluIHVwZGF0ZSBmb3IgcmFpbmJvd1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgc2VsZi5zZWdtZW50c1tpXS5yZWNvbG9yKGNvbG9yKTsgXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIEZvb2QoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5ib2R5ID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG4gIHNlbGYuYm9keS5ncmFwaGljcy5iZWdpbkZpbGwoXCJSZWRcIikuZHJhd1JlY3QoMCwgMCwgQkxPQ0tfVywgQkxPQ0tfSCk7XG4gIHNlbGYueCA9IDA7XG4gIHNlbGYueSA9IDA7XG5cbiAgc2VsZi51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmJvZHkueCA9IHNlbGYueCAqIEJMT0NLX1c7XG4gICAgc2VsZi5ib2R5LnkgPSBzZWxmLnkgKiBCTE9DS19IO1xuICB9XG5cbiAgc2VsZi5jb2xsaXNpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgcmV0dXJuICh4ID09IHNlbGYueCAmJiB5ID09IHNlbGYueSk7XG4gIH1cblxufVxuXG5mdW5jdGlvbiBGb29kTW5ncigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLmJvZHkgPSBuZXcgY3JlYXRlanMuQ29udGFpbmVyKCk7XG4gIHNlbGYuZm9vZHMgPSBbXTtcbiAgc2VsZi5NQVhfRk9PRCA9IDEwO1xuICBcbiAgc2VsZi5hZGRGb29kID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvb2QgPSBuZXcgRm9vZCgpO1xuICAgIGZvb2QueCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIFdJRFRIL0JMT0NLX1cpO1xuICAgIGZvb2QueSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIEhFSUdIVC9CTE9DS19IKTtcbiAgICBzZWxmLmJvZHkuYWRkQ2hpbGQoZm9vZC5ib2R5KTtcbiAgICBzZWxmLmZvb2RzLnB1c2goZm9vZCk7XG4gIH1cblxuICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHdoaWxlIChzZWxmLmJvZHkuY2hpbGRyZW4ubGVuZ3RoIDwgc2VsZi5NQVhfRk9PRCkge1xuICAgICAgc2VsZi5hZGRGb29kKCk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5mb29kcy5sZW5ndGg7IGkrKykge1xuICAgICAgc2VsZi5mb29kc1tpXS51cGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICBzZWxmLmNvbGxpc2lvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuZm9vZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBmb29kID0gc2VsZi5mb29kc1tpXTtcbiAgICAgIGlmIChmb29kLmNvbGxpc2lvbih4LHkpKSB7XG4gICAgICAgIHNlbGYuYm9keS5yZW1vdmVDaGlsZEF0KGkpO1xuICAgICAgICBzZWxmLmZvb2RzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHNlbGYucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmJvZHkucmVtb3ZlQWxsQ2hpbGRyZW4oKTtcbiAgICBzZWxmLmZvb2RzID0gW107XG4gIH1cblxufVxuXG5mdW5jdGlvbiByZXNldCgpIHtcbiAgcGxheWVyLnJlc2V0KCk7XG4gIHNjb3JlTW5nci5yZXNldCgpO1xuICBmb29kTW5nci5yZXNldCgpO1xuICBzdGFnZS5yZW1vdmVDaGlsZChnYW1lT3ZlclRleHQpO1xuICBnYW1lU3RhdGUgPSBJTklUO1xuXG4gIC8vIHJlc3RhcnQgdHJhY2tcbiAgYmdtdXNpYy5wb3NpdGlvbiA9IDA7XG4gIGJnbXVzaWMucGF1c2VkID0gdHJ1ZTtcbn1cbiAgICBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEhhbmRsZSBLZXlzXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gb25rZXlkb3duKGV2ZW50KSB7XG4gIGtleXNbZXZlbnQua2V5Q29kZV0gPSB0cnVlO1xuXG4gIGlmIChldmVudC5rZXlDb2RlID09IE0gJiYgYmdtdXNpYykge1xuICAgIG11dGVkID0gIW11dGVkO1xuICAgIGJnbXVzaWMudm9sdW1lID0gKGJnbXVzaWMudm9sdW1lICsgMSkgJSAyO1xuICB9XG5cbiAgaWYgKGdhbWVTdGF0ZSA9PSBJTklUICYmIFxuICAgIChrZXlzW1VQXSB8fCBrZXlzW0RPV05dIHx8IGtleXNbTEVGVF0gfHwga2V5c1tSSUdIVF0pKSB7XG4gICAgLy8gKHJlKXN0YXJ0IHRoZSBtdXNpYyB3aGVuIHBsYXllciBtYWtlcyB0aGVpciBtb3ZlXG4gICAgaWYgKCFiZ211c2ljKSB7XG4gICAgICBiZ211c2ljID0gY3JlYXRlanMuU291bmQucGxheShcIm11c2ljXCIsIHsgbG9vcDogLTEgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJnbXVzaWMucGF1c2VkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChtdXRlZCkgYmdtdXNpYy52b2x1bWUgPSAwO1xuICAgIGVsc2UgICAgICAgYmdtdXNpYy52b2x1bWUgPSAxO1xuICAgIGdhbWVTdGF0ZSA9IEdBTUU7XG4gIH1cblxuICBpZiAoZ2FtZVN0YXRlID09IEdBTUUpIHtcbiAgICBwbGF5ZXIudXBkYXRlU3RhdGUoZXZlbnQua2V5Q29kZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25rZXl1cChldmVudCkge1xuICBrZXlzW2V2ZW50LmtleUNvZGVdID0gZmFsc2U7XG5cbiAgaWYgKGdhbWVTdGF0ZSA9PSBHQU1FIHx8IGdhbWVTdGF0ZSA9PSBQQVVTRUQpIHtcbiAgICBpZiAoZXZlbnQua2V5Q29kZSA9PSBQKSB7XG4gICAgICBzd2l0Y2ggKGdhbWVTdGF0ZSkge1xuICAgICAgICBjYXNlIEdBTUU6ICAgZ2FtZVN0YXRlID0gUEFVU0VEOyBicmVhaztcbiAgICAgICAgY2FzZSBQQVVTRUQ6IGdhbWVTdGF0ZSA9IEdBTUU7IGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChnYW1lU3RhdGUgPT0gSU5JVCB8fCBnYW1lU3RhdGUgPT0gR0FNRSkge1xuICAgIGZvciAodmFyIGtleSBpbiBbVVAsIExFRlQsIERPV04sIFJJR0hUXSkge1xuICAgICAgaWYgKGtleXNba2V5XSkge1xuICAgICAgICBwbGF5ZXIudXBkYXRlU3RhdGUoZXZlbnQua2V5Q29kZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGdhbWVTdGF0ZSA9PSBFTkQgJiYgZXZlbnQua2V5Q29kZSA9PSBSKSB7XG4gICAgcmVzZXQoKTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBTdGFnZSB1cGRhdGVcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBlbmRHYW1lKCkge1xuICBnYW1lU3RhdGUgPSBFTkQ7XG4gIHN0YWdlLmFkZENoaWxkKGdhbWVPdmVyVGV4dCk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVRpY2soZXZlbnQpIHtcbiAgaWYgKGdhbWVTdGF0ZSA9PSBHQU1FIHx8IGdhbWVTdGF0ZSA9PSBJTklUKSB7XG4gICAgZm9vZE1uZ3IudXBkYXRlKCk7XG4gICAgcGxheWVyLnVwZGF0ZSgpO1xuICAgIHNjb3JlTW5nci51cGRhdGUoKTtcbiAgICBpZiAoIXBsYXllci5jaGVja0JvdW5kcygpKSB7XG4gICAgICBlbmRHYW1lKCk7XG4gICAgfVxuICAgIGlmIChmb29kTW5nci5jb2xsaXNpb24ocGxheWVyLnNlZ21lbnRzWzBdLngsIHBsYXllci5zZWdtZW50c1swXS55KSkge1xuICAgICAgc2NvcmVNbmdyLnNjb3JlICs9IDE7XG4gICAgICBwbGF5ZXIuYWRkU2VnbWVudCgpO1xuICAgICAgc3dpdGNoIChzY29yZU1uZ3Iuc2NvcmUpIHtcbiAgICAgICAgY2FzZSA1OiBwbGF5ZXIucmVjb2xvcihZRUxMT1cpOyAgICBicmVhaztcbiAgICAgICAgY2FzZSAxMDogcGxheWVyLnJlY29sb3IoUkVEKTsgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyNTogcGxheWVyLnJlY29sb3IoVklPTEVUKTsgICBicmVhaztcbiAgICAgICAgY2FzZSA1MDogcGxheWVyLnJlY29sb3IoQkxVRSk7ICAgICBicmVhaztcbiAgICAgICAgY2FzZSA3NTogcGxheWVyLnJlY29sb3IoV0hJVEUpOyAgICBicmVhaztcbiAgICAgICAgY2FzZSAxMDA6IHBsYXllci5yZWNvbG9yKFJBSU5CT1cpOyBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgc3RhZ2UudXBkYXRlKClcbn1cblxuIl19
