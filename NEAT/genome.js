const sigmoid = x=>1/(1+Math.exp(x))

function randGaussian(mu, sigma) {
  const x = Math.random()
  let left = 1/Math.sqrt(2*Math.PI*(sigma**2))
  const right = Math.exp((x-mu)**2/(-2*(sigma**2)))
  return left*right
}

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
    let Y = []
    for(const input of batch)
      Y.push(this.feed(input))
    return Y
  }


  mutateWeights(radioactivity){
    const orderedVertex = this.dGraph.toposort()
    for(const vertex of orderedVertex)
      for(edge of vertex.outEdges)
        if(Math.random()<radioactivity)
          edge.weight += randGaussian(0, 0.25) -1
  }

  mutateConnections(radioactivity){
    const orderedVertex = this.dGraph.toposort()
    const edges = []
    for(const vertex of orderedVertex)
      for(const edge of vertex.outEdges)
        edges.push(edge)
    for(const edge of edges)
      if(Math.random()<radioactivity){
        this.dGraph.deleteEdge(edge)
        const v = this.dGraph.createVertex()
        this.dGraph.addEdge(edge.outV.id, v.id, 1)
        this.dGraph.addEdge(v.id, edge.inV.id, edge.weight)
      }

  }

  mutateNewConnections(radioactivity){
    const orderedVertex = this.dGraph.toposort()
    for(let i=0; i<orderedVertex.length; i++)
      if(Math.random()<radioactivity){
        const existentes = new Set(orderedVertex[i].outEdges.map(x=>x.inV.id))
        for(let j=0; j<this.inputLen; j++)
          existentes.add(j)
        let posibleConnections = orderedVertex.slice(i+1)
          .filter(x=>!existentes.has(x.id)) 
        if(posibleConnections.length>0){
          let j = Math.floor(posibleConnections.length*Math.random())
          let connectionV =  posibleConnections[j]        
          this.dGraph.addEdge(orderedVertex[i].id, connectionV.id)
        }
      }
  }

  static unmutedChild(mother, father){
    function connections(genome) {
      const edges = []
      for(const vertex of genome.dGraph.toposort())
        for(const edge of vertex.outEdges)
          edges.push(edge)
      edges.sort((a,b)=>a.innovN-b.innovN)
      return edges
    }
    function checkOrder(sort, a, b) {
      let aix = -1
      let bix = -1
      for(let i=0; i<sort.length; i++){
        if(sort[i].id==a)
          aix = i
        if(sort[i].id==b)
          bix = i
      }
      return aix<bix
    }
    let child = new Genome(mother.inputLen-1, mother.outputLen)
    child.dGraph = new dGraph()
    let mEdges = connections(mother)
    let fEdges = connections(father)
    let mVertex = mother.dGraph.toposort()
    let fVertex = mother.dGraph.toposort()
    let toposort;
    if(mVertex>fVertex)
      toposort = mVertex
    else  
      toposort = fVertex
    
    let mix = 0
    let fix = 0
    while(mix<mEdges.length && fix<fEdges.length){
      if(mEdges[mix].innovN==fEdges[fix].innovN){
        let edge = Math.random()>0.5? mEdges[mix]: fEdges[fix]
        if(checkOrder(toposort, edge.outV.id, edge.inV.id))
          child.dGraph.addEdge(edge.outV.id, edge.inV.id, edge.weight)
        mix++
        fix++
      }
      else if(mEdges[mix].innovN<fEdges[fix].innovN){
        let edge = mEdges[mix]
        if(checkOrder(toposort, edge.outV.id, edge.inV.id))
          child.dGraph.addEdge(edge.outV.id, edge.inV.id, edge.weight)
        mix++
      }
      else {
        let edge = fEdges[fix]
        if(checkOrder(toposort, edge.outV.id, edge.inV.id))
          child.dGraph.addEdge(edge.outV.id, edge.inV.id, edge.weight)
        fix++
      }
    }
    while(mix<mEdges.length){
      let edge = mEdges[mix]
      if(checkOrder(toposort, edge.outV.id, edge.inV.id))
        child.dGraph.addEdge(edge.outV.id, edge.inV.id, edge.weight)
      mix++
    }
    while(fix<fEdges.length){
      let edge = fEdges[fix]
      if(checkOrder(toposort, edge.outV.id, edge.inV.id))
        child.dGraph.addEdge(edge.outV.id, edge.inV.id, edge.weight)
      fix++
    }    
    return child    
  }

  static offSpring(mother, father){

  }
}

let f = new Genome(2, 1)
f.mutateConnections(1)
f.mutateNewConnections(1)
console.log(f);
console.log(f.dGraph.toString());
// let m = new Genome(2, 1)
// m.mutateConnections(1)
// m.mutateNewConnections(0.5)
// console.log(f.dGraph.toString());
// console.log("...................");
// console.log(m.dGraph.toString());
// console.log(".......................");

// console.log(Genome.unmutedChild(m, f).dGraph.toString());