X = [
  [0,0],
  [0,1],
  [1,0],
  [1,1]
]
Y = [
  [0],
  [1],
  [1],
  [0]
]

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

function setup(){
  let neat = new NEAT(2,1,30)
  neat.step(fitness, X, Y)
}
