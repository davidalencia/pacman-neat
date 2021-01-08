pacman = null
tileset = null

function preload(){
  tileset = loadImage('game/tileset.png');
}

function setup() {
  frameRate(3)
  createCanvas(336, 432);
  pacman = new Pacman(tileset)
  pacman.newLevel(0)
}

function keyTyped(){
  if(key == 'w')
    pacman.setDirection('U')
  else if(key == 'a')
    pacman.setDirection('L')
  else if(key == 's')
    pacman.setDirection('D')
  else if(key == 'd')
    pacman.setDirection('R')
  
}

function draw() {
  pacman.draw()
  //image(tileset, 20, 20)
  
}