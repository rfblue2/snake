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

function init() {
  gameState = GAME;

  stage = new createjs.Stage("demoCanvas");
  bg = new createjs.Shape();
  bg.graphics.beginFill("black").drawRect(0, 0, WIDTH, HEIGHT);
  stage.addChild(bg);

  player = new Snake();
  stage.addChild(player.body);

  gameOverText = new createjs.Text("Game Over", "24px Arial", "white");
  gameOverText.x = WIDTH / 2;
  gameOverText.y = HEIGHT / 2;

  foodMngr = new FoodMngr();
  stage.addChild(foodMngr.body);

  scoreMngr = new ScoreMngr();
  stage.addChild(scoreMngr.body);

  createjs.Ticker.addEventListener("tick", handleTick);
}

function ScoreMngr() {
  var self = this;

  self.body = new createjs.Text("Score: 0", "24px Arial", "white");
  self.body.x = 0;
  self.body.y = 0;

  self.score = 0;

  self.update = function() {
    self.body.text = "Score: " + self.score;
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

  if (event.keyCode == P) {
    switch (gameState) {
      case GAME:   gameState = PAUSED; break;
      case PAUSED: gameState = GAME; break;
    }
  }

  if (gameState == GAME) {
    for (var key in [UP, LEFT, DOWN, RIGHT]) {
      if (keys[key]) {
        player.updateState(event.keyCode);
      }
    }
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


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBSb2xhbmQgRm9uZ1xuLy8gU25ha2VzXG4vLyAxLzExLzE5XG5cbnZhciBXSURUSCA9IDY0MDtcbnZhciBIRUlHSFQgPSA0ODA7XG5cbnZhciBCTE9DS19IID0gMjA7XG52YXIgQkxPQ0tfVyA9IDIwO1xuXG4vLyBLZXljb2Rlc1xudmFyIExFRlQgID0gMzc7XG52YXIgVVAgICAgPSAzODtcbnZhciBSSUdIVCA9IDM5O1xudmFyIERPV04gID0gNDA7XG5cbnZhciBQICAgICA9IDgwO1xuXG4vLyBHYW1lIHN0YXRlc1xudmFyIEdBTUUgICA9IFwiZ2FtZVwiO1xudmFyIFBBVVNFRCA9IFwicGF1c2VcIjtcbnZhciBFTkQgICAgPSBcImVuZFwiO1xuXG4vLyBQbGF5ZXIgc3RhdGVzXG52YXIgUExBWUVSX0lETEUgID0gXCJQTEFZRVJfSURMRVwiO1xudmFyIFBMQVlFUl9VUCAgICA9IFwiUExBWUVSX1VQXCI7XG52YXIgUExBWUVSX0xFRlQgID0gXCJQTEFZRVJfTEVGVFwiO1xudmFyIFBMQVlFUl9SSUdIVCA9IFwiUExBWUVSX1JJR0hUXCI7XG52YXIgUExBWUVSX0RPV04gID0gXCJQTEFZRVJfRE9XTlwiO1xudmFyIFBMQVlFUl9MVSAgICA9IFwiUExBWUVSX0xVXCI7XG52YXIgUExBWUVSX0xEICAgID0gXCJQTEFZRVJfTERcIjtcbnZhciBQTEFZRVJfUlUgICAgPSBcIlBMQVlFUl9SVVwiO1xudmFyIFBMQVlFUl9SRCAgICA9IFwiUExBWUVSX1JEXCI7XG52YXIgUExBWUVSX1VMICAgID0gXCJQTEFZRVJfVUxcIjtcbnZhciBQTEFZRVJfREwgICAgPSBcIlBMQVlFUl9ETFwiO1xudmFyIFBMQVlFUl9VUiAgICA9IFwiUExBWUVSX1VSXCI7XG52YXIgUExBWUVSX0RSICAgID0gXCJQTEFZRVJfRFJcIjtcblxuLy8gVmFyaWFibGVzXG52YXIgc3RhZ2U7XG52YXIgcGxheWVyO1xudmFyIGdhbWVTdGF0ZTtcbnZhciBnYW1lT3ZlclRleHQ7XG52YXIgc2NvcmVNbmdyO1xudmFyIGZvb2RNbmdyO1xuICBcbnZhciBrZXlzID0ge31cblxuZG9jdW1lbnQub25rZXlkb3duID0gb25rZXlkb3duO1xuZG9jdW1lbnQub25rZXl1cCA9IG9ua2V5dXA7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gSW5pdGlhbGl6YXRpb24gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgZ2FtZVN0YXRlID0gR0FNRTtcblxuICBzdGFnZSA9IG5ldyBjcmVhdGVqcy5TdGFnZShcImRlbW9DYW52YXNcIik7XG4gIGJnID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG4gIGJnLmdyYXBoaWNzLmJlZ2luRmlsbChcImJsYWNrXCIpLmRyYXdSZWN0KDAsIDAsIFdJRFRILCBIRUlHSFQpO1xuICBzdGFnZS5hZGRDaGlsZChiZyk7XG5cbiAgcGxheWVyID0gbmV3IFNuYWtlKCk7XG4gIHN0YWdlLmFkZENoaWxkKHBsYXllci5ib2R5KTtcblxuICBnYW1lT3ZlclRleHQgPSBuZXcgY3JlYXRlanMuVGV4dChcIkdhbWUgT3ZlclwiLCBcIjI0cHggQXJpYWxcIiwgXCJ3aGl0ZVwiKTtcbiAgZ2FtZU92ZXJUZXh0LnggPSBXSURUSCAvIDI7XG4gIGdhbWVPdmVyVGV4dC55ID0gSEVJR0hUIC8gMjtcblxuICBmb29kTW5nciA9IG5ldyBGb29kTW5ncigpO1xuICBzdGFnZS5hZGRDaGlsZChmb29kTW5nci5ib2R5KTtcblxuICBzY29yZU1uZ3IgPSBuZXcgU2NvcmVNbmdyKCk7XG4gIHN0YWdlLmFkZENoaWxkKHNjb3JlTW5nci5ib2R5KTtcblxuICBjcmVhdGVqcy5UaWNrZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRpY2tcIiwgaGFuZGxlVGljayk7XG59XG5cbmZ1bmN0aW9uIFNjb3JlTW5ncigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHNlbGYuYm9keSA9IG5ldyBjcmVhdGVqcy5UZXh0KFwiU2NvcmU6IDBcIiwgXCIyNHB4IEFyaWFsXCIsIFwid2hpdGVcIik7XG4gIHNlbGYuYm9keS54ID0gMDtcbiAgc2VsZi5ib2R5LnkgPSAwO1xuXG4gIHNlbGYuc2NvcmUgPSAwO1xuXG4gIHNlbGYudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5ib2R5LnRleHQgPSBcIlNjb3JlOiBcIiArIHNlbGYuc2NvcmU7XG4gIH1cbn1cblxuZnVuY3Rpb24gU2VnbWVudCgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLmJvZHkgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcbiAgc2VsZi5ib2R5LmdyYXBoaWNzLmJlZ2luRmlsbChcIkNoYXJ0cmV1c2VcIikuZHJhd1JlY3QoMCwgMCwgQkxPQ0tfVywgQkxPQ0tfSCk7XG4gIHNlbGYueCA9IDA7XG4gIHNlbGYueSA9IDA7XG5cbiAgc2VsZi51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmJvZHkueCA9IHNlbGYueCAqIEJMT0NLX1c7XG4gICAgc2VsZi5ib2R5LnkgPSBzZWxmLnkgKiBCTE9DS19IO1xuICB9XG5cbiAgc2VsZi5jb2xsaXNpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgcmV0dXJuICh4ID09IHNlbGYueCAmJiB5ID09IHNlbGYueSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gU25ha2UoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBzZWxmLmJvZHkgPSBuZXcgY3JlYXRlanMuQ29udGFpbmVyKCk7XG4gIHNlbGYuc2VnbWVudHMgPSBbXTtcblxuICBzZWxmLnNwZWVkID0gMTtcbiAgc2VsZi5zdGF0ZSA9IFBMQVlFUl9JRExFO1xuXG4gIHNlbGYuYWRkU2VnbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWdtZW50ID0gbmV3IFNlZ21lbnQoKTtcbiAgICBzZWxmLmJvZHkuYWRkQ2hpbGQoc2VnbWVudC5ib2R5KTtcbiAgICBzZWxmLnNlZ21lbnRzLnB1c2goc2VnbWVudCk7XG4gIH1cblxuICAvLyBjcmVhdGUgaGVhZFxuICBzZWxmLmFkZFNlZ21lbnQoKTtcbiAgc2VsZi5zZWdtZW50c1swXS5ib2R5LnggPSAxICogQkxPQ0tfVztcbiAgc2VsZi5zZWdtZW50c1swXS5ib2R5LnkgPSAxICogQkxPQ0tfSDtcblxuICBzZWxmLm1vdmVkU2luY2UgPSBmYWxzZTtcblxuICBzZWxmLnVwZGF0ZVN0YXRlID0gZnVuY3Rpb24oa2V5Q29kZSkge1xuICAgIGlmICghc2VsZi5tb3ZlZFNpbmNlKSByZXR1cm47XG4gICAgc2VsZi5tb3ZlZFNpbmNlID0gZmFsc2U7XG4gICAgc3dpdGNoIChrZXlDb2RlKSB7XG4gICAgICBjYXNlIExFRlQ6ICBcbiAgICAgICAgaWYgKHNlbGYuc3RhdGUgIT0gUExBWUVSX1JJR0hUKSBzZWxmLnN0YXRlID0gUExBWUVSX0xFRlQ7ICBcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFJJR0hUOiBcbiAgICAgICAgaWYgKHNlbGYuc3RhdGUgIT0gUExBWUVSX0xFRlQpICBzZWxmLnN0YXRlID0gUExBWUVSX1JJR0hUOyAgXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBVUDogICAgXG4gICAgICAgIGlmIChzZWxmLnN0YXRlICE9IFBMQVlFUl9ET1dOKSAgc2VsZi5zdGF0ZSA9IFBMQVlFUl9VUDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIERPV046ICBcbiAgICAgICAgaWYgKHNlbGYuc3RhdGUgIT0gUExBWUVSX1VQKSAgICBzZWxmLnN0YXRlID0gUExBWUVSX0RPV047XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHNlbGYubW92ZSA9IGZ1bmN0aW9uKGRpcikge1xuICAgIHNlbGYubW92ZWRTaW5jZSA9IHRydWU7XG4gICAgdmFyIGR4ID0gMDtcbiAgICB2YXIgZHkgPSAwO1xuICAgIHN3aXRjaCAoZGlyKSB7XG4gICAgICBjYXNlIFBMQVlFUl9MRUZUOlxuICAgICAgICBkeCAtPSBzZWxmLnNwZWVkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUExBWUVSX1JJR0hUOlxuICAgICAgICBkeCArPSBzZWxmLnNwZWVkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUExBWUVSX1VQOlxuICAgICAgICBkeSAtPSBzZWxmLnNwZWVkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUExBWUVSX0RPV046XG4gICAgICAgIGR5ICs9IHNlbGYuc3BlZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSBpbGx1c2lvbiBvZiBtb3ZlbWVudCBieSByZW1vdmluZyBsYXN0IGVsZW1lbnQgYW5kIFxuICAgIC8vIG1vdmluZyBpdCB0byBuZXcgcG9zaXRpb24gb2YgaGVhZFxuICAgIGlmIChzZWxmLnNlZ21lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHZhciBsYXN0ID0gc2VsZi5zZWdtZW50cy5wb3AoKTtcbiAgICAgIGxhc3QueCA9IHNlbGYuc2VnbWVudHNbMF0ueCArIGR4O1xuICAgICAgbGFzdC55ID0gc2VsZi5zZWdtZW50c1swXS55ICsgZHk7XG5cbiAgICAgIHNlbGYuc2VnbWVudHMgPSBbbGFzdF0uY29uY2F0KHNlbGYuc2VnbWVudHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLnNlZ21lbnRzWzBdLnggKz0gZHg7XG4gICAgICBzZWxmLnNlZ21lbnRzWzBdLnkgKz0gZHk7XG4gICAgfVxuXG4gIH1cblxuICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYubW92ZShzZWxmLnN0YXRlKTtcbiAgICBmb3IgKHZhciBzIG9mIHNlbGYuc2VnbWVudHMpIHtcbiAgICAgIHMudXBkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gY2hlY2sgYm91bmRzIG9mIHBsYXllciwgaWYgZmFsc2UsIHBsYXllciBpcyBkZWFkIVxuICBzZWxmLmNoZWNrQm91bmRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEoc2VsZi5zZWdtZW50c1swXS54ID49IDAgJiYgXG4gICAgICAgICAgc2VsZi5zZWdtZW50c1swXS55ID49IDAgJiYgXG4gICAgICAgICAgc2VsZi5zZWdtZW50c1swXS54IDwgV0lEVEgvQkxPQ0tfVyAmJiBcbiAgICAgICAgICBzZWxmLnNlZ21lbnRzWzBdLnkgPCBIRUlHSFQvQkxPQ0tfSCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTsgXG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgc2VsZi5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHMgPSBzZWxmLnNlZ21lbnRzW2ldO1xuICAgICAgaWYgKHNlbGYuc2VnbWVudHNbMF0uY29sbGlzaW9uKHMueCwgcy55KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxufVxuXG5mdW5jdGlvbiBGb29kKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYuYm9keSA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuICBzZWxmLmJvZHkuZ3JhcGhpY3MuYmVnaW5GaWxsKFwiUmVkXCIpLmRyYXdSZWN0KDAsIDAsIEJMT0NLX1csIEJMT0NLX0gpO1xuICBzZWxmLnggPSAwO1xuICBzZWxmLnkgPSAwO1xuXG4gIHNlbGYudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5ib2R5LnggPSBzZWxmLnggKiBCTE9DS19XO1xuICAgIHNlbGYuYm9keS55ID0gc2VsZi55ICogQkxPQ0tfSDtcbiAgfVxuXG4gIHNlbGYuY29sbGlzaW9uID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHJldHVybiAoeCA9PSBzZWxmLnggJiYgeSA9PSBzZWxmLnkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIEZvb2RNbmdyKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYuYm9keSA9IG5ldyBjcmVhdGVqcy5Db250YWluZXIoKTtcbiAgc2VsZi5mb29kcyA9IFtdO1xuICBzZWxmLk1BWF9GT09EID0gMTA7XG4gIFxuICBzZWxmLmFkZEZvb2QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm9vZCA9IG5ldyBGb29kKCk7XG4gICAgZm9vZC54ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogV0lEVEgvQkxPQ0tfVyk7XG4gICAgZm9vZC55ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogSEVJR0hUL0JMT0NLX0gpO1xuICAgIHNlbGYuYm9keS5hZGRDaGlsZChmb29kLmJvZHkpO1xuICAgIHNlbGYuZm9vZHMucHVzaChmb29kKTtcbiAgfVxuXG4gIHNlbGYudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgd2hpbGUgKHNlbGYuYm9keS5jaGlsZHJlbi5sZW5ndGggPCBzZWxmLk1BWF9GT09EKSB7XG4gICAgICBzZWxmLmFkZEZvb2QoKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLmZvb2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzZWxmLmZvb2RzW2ldLnVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIHNlbGYuY29sbGlzaW9uID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5mb29kcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGZvb2QgPSBzZWxmLmZvb2RzW2ldO1xuICAgICAgaWYgKGZvb2QuY29sbGlzaW9uKHgseSkpIHtcbiAgICAgICAgc2VsZi5ib2R5LnJlbW92ZUNoaWxkQXQoaSk7XG4gICAgICAgIHNlbGYuZm9vZHMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbn1cbiAgICBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEhhbmRsZSBLZXlzXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gb25rZXlkb3duKGV2ZW50KSB7XG4gIGtleXNbZXZlbnQua2V5Q29kZV0gPSB0cnVlO1xuICBpZiAoZ2FtZVN0YXRlID09IEdBTUUpIHtcbiAgICBwbGF5ZXIudXBkYXRlU3RhdGUoZXZlbnQua2V5Q29kZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25rZXl1cChldmVudCkge1xuICBrZXlzW2V2ZW50LmtleUNvZGVdID0gZmFsc2U7XG5cbiAgaWYgKGV2ZW50LmtleUNvZGUgPT0gUCkge1xuICAgIHN3aXRjaCAoZ2FtZVN0YXRlKSB7XG4gICAgICBjYXNlIEdBTUU6ICAgZ2FtZVN0YXRlID0gUEFVU0VEOyBicmVhaztcbiAgICAgIGNhc2UgUEFVU0VEOiBnYW1lU3RhdGUgPSBHQU1FOyBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoZ2FtZVN0YXRlID09IEdBTUUpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gW1VQLCBMRUZULCBET1dOLCBSSUdIVF0pIHtcbiAgICAgIGlmIChrZXlzW2tleV0pIHtcbiAgICAgICAgcGxheWVyLnVwZGF0ZVN0YXRlKGV2ZW50LmtleUNvZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBTdGFnZSB1cGRhdGVcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBlbmRHYW1lKCkge1xuICBnYW1lU3RhdGUgPSBFTkQ7XG4gIHN0YWdlLmFkZENoaWxkKGdhbWVPdmVyVGV4dCk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVRpY2soZXZlbnQpIHtcbiAgaWYgKGdhbWVTdGF0ZSA9PSBHQU1FKSB7XG4gICAgZm9vZE1uZ3IudXBkYXRlKCk7XG4gICAgcGxheWVyLnVwZGF0ZSgpO1xuICAgIHNjb3JlTW5nci51cGRhdGUoKTtcbiAgICBpZiAoIXBsYXllci5jaGVja0JvdW5kcygpKSB7XG4gICAgICBlbmRHYW1lKCk7XG4gICAgfVxuICAgIGlmIChmb29kTW5nci5jb2xsaXNpb24ocGxheWVyLnNlZ21lbnRzWzBdLngsIHBsYXllci5zZWdtZW50c1swXS55KSkge1xuICAgICAgc2NvcmVNbmdyLnNjb3JlICs9IDE7XG4gICAgICBwbGF5ZXIuYWRkU2VnbWVudCgpO1xuICAgIH1cbiAgfVxuICBzdGFnZS51cGRhdGUoKVxufVxuXG4iXX0=
