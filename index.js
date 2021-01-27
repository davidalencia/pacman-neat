const NEAT = require('./NEAT/NEAT')
const Pacman = require('./pacman/pacman')
const fs = require('fs')

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

function normalizePacman(mapa){
  const input =  new Float32Array(868*4)
  mapa.slice(3).flat().forEach((x, j)=>{
    let i;
    if(x==0)
      i=0
    else if(x==-1)
      i=1
    else
      i=2
    input[i+j*4]=1
  })
  return input
}


function getNewDirection(genome, pacman){
  let input = normalizePacman(pacman.mapa)
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
  while(scoreC<3){
    pacman.setDirection(getNewDirection(genome, pacman))
    pacman.move()
    if(pScore==pacman.score)
      scoreC++
    else
      scoreC = 0
    pScore = pacman.score
  }
  return pacman.score
}

let pacmanNEAT = new NEAT(868*4, 4, 50)
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
    console.log(`generation: ${bestPlayer.generation}: ${bestPlayer.player.fitness}. ${pacmanNEAT.species.length} especies`);
  }
  pacmanNEAT.step()
}