const NEAT = require('./NEAT/NEAT')
const Pacman = require('./pacman/pacman')
const fs = require('fs')

const delta = 8

function Genome2JSONable(genome){
  let edges = genome.dGraph.edges.map(edge =>{
    return {
      inV: edge.inV.id,
      outV: edge.outV.id,
      weight: edge.weight
    }
  })
  let genomeb = Object.assign({}, genome, {dGraph: null, edges})
  return genomeb
}

function Object2Genome(obj){
  if(obj.dGraph ==null){
    let graph = new dGraph() 
    for(const edge of obj.edges)
      graph.addEdge(edge.outV, edge.inV, edge.weight)
    obj.dGraph = graph
  }
  delete obj.edges
  obj.__proto__ = Genome.prototype;
  return obj
}

function normalizePacman(pacman){
  const input =  new Float32Array((delta*2+1)**2-1)
  let salto = 0
  for(let i=-delta;i<=delta;i++)
    for(let j=-delta;j<=delta; j++){
      let val = Infinity
      if(i==0&&j==0){
        salto = -1
        continue
      }
      let ix = (j+delta)*11+i+delta+salto 
      let y = pacman.y+j
      let x = pacman.x+i
      if(y<3||x<0||y>=33||x>=28)
        val = -1
      else if(pacman.mapa[y][x] == -1)
        val = 0
      else if(pacman.mapa[y][x] == 0)
        val = 1
      else 
        val = -1
      input[ix]=val
    }
  return input
}


function getNewDirection(genome, pacman){
  let input = normalizePacman(pacman)
  let i = (pacman.y-3)*28+pacman.x
  input[i] = 1
  let output = genome.feed(input)
  let outI = output.indexOf(Math.max(...output));
  let movements = ['U','L','D','R']
  return movements[outI]
}


pacmanFitness = genome => {
  let pacman = new Pacman()
  let pScore = pacman.score
  let scoreC = 0
  let stay = 0
  let lastPos = {x: pacman.x, y: pacman.y}
  while(scoreC<20 && stay<3){
    if(pacman.score>244)
      return Infinity
    pacman.setDirection(getNewDirection(genome, pacman))
    pacman.move()
    if(pScore==pacman.score)
      scoreC++
    else
      scoreC = 0
    
    if(lastPos.x==pacman.x && lastPos.y==pacman.y)
      stay++
    else
      stay = 0
    pScore = pacman.score
  }
  return pacman.score
}

let pacmanNEAT = new NEAT((delta*2+1)**2-1, 4, 200, 0.01)
let bestPlayer = {player: pacmanNEAT.population[0], generation: 0}
const epochsPacman = 1000000
for(let i=0; i<epochsPacman; i++){
  for(const genome of pacmanNEAT.population)
    genome.fitness = pacmanFitness(genome)
  pacmanNEAT.population.sort((a,b)=>b.fitness-a.fitness)
  bestPlayer = {player: pacmanNEAT.population[0], generation: i}
  if(i%5==0){
    if(i%200==0){
      let player = bestPlayer.player
      let i = bestPlayer.i
      try{
        let json = JSON.stringify(Genome2JSONable(player))
        fs.writeFileSync('./bestPlayer.json', json)
        console.log(`best player from generation: ${bestPlayer.generation} with ${bestPlayer.player.fitness} points has been saved in bestPlayer.json`);
      }
      catch(e){
        console.log(e);
      }
    }
    console.log(`generation: ${bestPlayer.generation}: Points: ${bestPlayer.player.fitness}. Especies: ${pacmanNEAT.species.length}.`);
  }
  pacmanNEAT.step()
}