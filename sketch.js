const X = [
  [0,0],
  [0,1],
  [1,0],
  [1,1]
]
const Y = [
  [0],
  [1],
  [1],
  [0]
]
let pacman = null
let tileset = null

function fitness(n, X, Y){
  function mse(y, yP){
    let s = 0
    for(let i=0; i<y.length; i++)
      for(let j=0; j<y[i].length; j++)
        s += (y[i][j]-yP[i][j])**2
    return s/y.length
  }
  return  1/mse(Y, n.feedBatch(X))
}

function preload(){
  tileset = loadImage('pacman/tileset.png');
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

function setup(){
  //Paman setup
  frameRate(3)
  createCanvas(336, 432);
  pacman = new Pacman(tileset)
  pacman.newLevel(0)

  //Neat setup
  let neat = new NEAT(2,1,50)
  for(let i=0; i<2000; i++){
    neat.step(fitness, X, Y)
    console.log(neat.population[0].fitness);
  }
  console.log(neat.population[0]);
  console.log(neat.population[0].feedBatch(X))
  console.log(Y); 
}

function draw() {
  pacman.draw() 
}
