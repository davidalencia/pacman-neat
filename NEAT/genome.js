const sigmoid = x=>1/(1+Math.exp(x))

class Genome {
  constructor(inputs, outputs, bias=true){
    inputs = inputs +1
    this.inputLen = inputs
    this.outputLen = outputs
    this.dGraph = new dGraph()
    for(let i=0; i<inputs; i++)
      for(let j=0; j<outputs; j++)
        this.dGraph.addEdge(i, inputs+j)

  }
  
  _feed(neurons, v){
    if(neurons[v.id]!=Infinity)
      return neurons[v.id]
    let sum = 0
    for(const edge of v.inEdges)
      sum += this._feed(neurons, edge.outV)*edge.weight
    console.log(sum);
    neurons[v.id] = sigmoid(sum)
    return neurons[v.id]
  }

  feed(input){
    const neuronsValues = new Float32Array(this.dGraph.vertex.length).fill(Infinity)
    const orderedVertex = this.dGraph.toposort()
    input.unshift(1)
    if(input.length!=this.inputLen)
      throw Error("input must be same as size as defined in constructor")
    for(let i=0; i<this.inputLen; i++)
      neuronsValues[i] = input[i]
    for(const vertex of orderedVertex)
      this._feed(neuronsValues, vertex)
    let Y = new Float32Array(this.outputLen)
    for(let i=0; i<this.outputLen; i++)
      Y[i] = neuronsValues[this.inputLen+i]
    return Y
  }

  feedBatch(batch){

  }


  mutateWeights(radioactivity){

  }

  mutateConnections(radioactivity){

  }

  mutateNewConnections(radioactivity){

  }

  static unmutedChild(mother, father){
   
  }

  static offSpring(mother, father){

  }
}

let g = new Genome(2, 1)

console.log(g);
console.log(g.feed([0,1]));