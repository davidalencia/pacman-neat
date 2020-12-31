neuronType = Object.freeze({
  "input":1,
  "hidden":2,
  "output":3
})

function sigmoid(x){
  return 1/(1+Math.exp(x))
}
function randn_bm(min, max, skew) {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) num = randn_bm(min, max, skew); // resample between 0 and 1 if out of range
  num = Math.pow(num, skew); // Skew
  num *= max - min; // Stretch to fill range
  num += min; // offset to min
  return num;
}

class Genome {
  constructor(father){ 
    this.error = null
    this.neurons = {}
    this.connections = {}
    this.inputs = []
    this.outputs = []
    if(!father){
      this.addNeuron(neuronType.input, 0)
      return
    }
    for(const nN of father.inputs)
      this.addNeuron(neuronType.input, nN)
    for(const nN of father.outputs)
      this.addNeuron(neuronType.output, nN)
  }

  addConnection(inN, outN, weight=Math.random()){
    if(this.connections[outN] === undefined)
      this.connections[outN] = []
      this.connections[outN].push({
      inN,
      weight,
      enable: true,
    })
  }

  addNeuron(type, nN=Object.keys(this.neurons).length, f=sigmoid){
    if(type == 1){
      this.inputs.push(nN)
      for(let outN of this.outputs)
        this.addConnection(nN, outN)
    }
    else if(type == 3){
      this.outputs.push(nN)
      for(let inN of this.inputs)
        this.addConnection(inN, nN)
    }

    this.neurons[nN] = {
      type,
      n:nN,
      f
    }
    return nN
  }

  _feed(nN, neurons){
    if(neurons[nN] || neurons[nN] == 0)
      return neurons[nN]
    neurons[nN] = this.neurons[nN].f(this.connections[nN].reduce((acc, cCon)=>{
      if(!cCon.enable)
        return acc
      return acc + this._feed(cCon.inN, neurons)*cCon.weight
    }, 0))
    return neurons[nN]
  }

  feed(input){
    const neurons = Array(Object.keys(this.neurons).length)
    neurons[0] = 1
    for(const inI in    input)
      neurons[inI-(-1)] = input[inI]
    let Y = new Array(this.outputs.length)
    let alpha = 0
    for(const out of this.outputs)
      Y[alpha++] = this._feed(out, neurons)
    return Y  
  }
}


class NEAT{
  constructor(basicGenome, populationSize, evaluate){
    this.populationSize = populationSize
    this.evaluate = evaluate
    this.population = []
    this.innovations = []
    for(const key in basicGenome.connections)
      for(const con of basicGenome.connections[key])
        this.innovations.push({in: con.inN, out:Number(key)})
    for(let alpha=0; alpha<populationSize; alpha++)
      this.population.push(new Genome(basicGenome))
  }

  offspring(father, mother, WRadioactivity, CRadioactivity){
    const child = new Genome()
    child.neurons = Object.assign({}, father.neurons, mother.neurons)
    child.outputs = father.outputs
    child.inputs = father.inputs
    let newConnection;
    for(const key in this.innovations){
      let connection = this.innovations[key]
      if(Math.random()>0.5 
          && connection.out in father.connections 
          && connection.in in father.connections[connection.out])
        newConnection = father.connections[connection.out][connection.in]
      else if(connection.out in mother.connections 
          && connection.in in mother.connections[connection.out])
        newConnection = mother.connections[connection.out][connection.in]
      
      newConnection.weight += tf.randomNormal([1]).dataSync()[0]
      if(child.connections[connection.out] === undefined)
        child.connections[connection.out] = []
      child.connections[connection.out].push(newConnection)
    }
    this._mutate(child, WRadioactivity, CRadioactivity)
    return child
  }

  _mutate(g, WRadioactivity, CRadioactivity){
    console.log(g.connections);
    for(const outN in g.connections){
      //busca inN y crea conneccion con peso aleatorio
      
      
      // let posibleConn = Object.values(g.neurons).filter(x=>{
        
      //   if(g.outputs.includes(x.n))
      //     return false
        
      //   if(x.n == outN)
      //     return false
      //   //console.log(x);
      //   //console.log(x);
      //   //console.log(g.connections[outN]);
      //   // if(x.n in g.connections[outN])
      //   //   return false
      //   //console.log("....");
      //   return true
      // })
      // console.log(outN);
      // console.log(posibleConn);
      // console.log("...............")

      //revisa cada conneccion y crea una neurona nueva
      for(const inN in g.connections[outN]){
        let conn = g.connections[outN][inN]
        if(Math.random()<CRadioactivity){
          console.log(inN, outN);
          conn.enable = false
          const nN = g.addNeuron(neuronType.hidden)
          g.addConnection(inN, nN)
          g.addConnection(nN, outN, conn.weight)
        }
      }
    }   
  }

  nextGeneration(WRadioactivity, CRadioactivity){
    this.population.forEach(x=>x.error=this.evaluate(x))
    this.population.sort((a,b)=>a.error-b.error)
    console.log(this.population);
    const newPopulation = new Array(this.populationSize)
    for(let alpha=0; alpha<this.populationSize; alpha++){
      const child = this.offspring(this.population[0], this.population[1], WRadioactivity, CRadioactivity)
      newPopulation[alpha] = child
    }
    this.population = newPopulation
  }
  
}

g = new Genome()
g.addNeuron(neuronType.input)
g.addNeuron(neuronType.input)
g.addNeuron(neuronType.output)

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
function evaluate(g){
  predicted = X.map(x => g.feed(x))
  return tf.losses.meanSquaredError(Y, predicted).dataSync()[0]
}


evolution = new NEAT(g, 3, evaluate)
//console.log(evolution);
evolution.nextGeneration(0.1, 0.2)
evolution.nextGeneration(0.1, 0.2)
evolution.nextGeneration(0.1, 0.2)
//console.log(evolution);