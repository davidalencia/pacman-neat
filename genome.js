const sigmoid = x=>1/(1+Math.exp(x))

class Genome {
  constructor(inputs, outputs, bias=true){
    this.error = null
    this.neurons = []
    this.inputs = []
    this.hidden = []
    this.outputs = []
    this.calculated = []

    for(let i=0; i<inputs+bias; i++)
      this._addNeuron(Neuron.Type.input)
    for(let i=0; i<outputs; i++){
      let n = this._addNeuron(Neuron.Type.output)
      for(const inN of this.inputs)
        this._addConnection(inN, n)
    }    
  }
  _addConnection(inN, outN, weight=Math.random()){
    return outN.addConnection(inN, weight)
  }

  _addNeuron(type, nN=this.neurons.length, layer){
    const n = new Neuron(nN, type, layer)
    this.neurons[n.id] = n
    if(type == Neuron.Type.input){
      this.inputs.push(n)
      n.layer = 0
    }
    else if(type == Neuron.Type.hidden){
      this.hidden.push(n)
      this.calculated.push(n)
    }
    else {
      this.outputs.push(n)
      this.calculated.push(n)
      n.layer = Infinity
    }
    return n
  }

  _feed(nN, neurons){
    if(neurons[nN] != Infinity)
      return neurons[nN]
    neurons[nN] = sigmoid(
      this.neurons[nN].connections.reduce((acc, cCon)=>{
        return acc + this._feed(cCon.inN.id, neurons)*cCon.weight
    }, 0))
    return neurons[nN]
  }

  feed(input){
    const neurons = new Float32Array(this.neurons.length)
    neurons.fill(Infinity)
    neurons[0] = 1
    for(let i=0; i<this.inputs.length-1; i++)
      neurons[i+1]=input[i]
    const Y = new Array(this.outputs.length)
    for(let i=0; i<this.outputs.length; i++){
      Y[i] = this._feed(this.outputs[i].id, neurons)
    }
    return Y
  }

  connectionIterator(){
    let connections = []
    for(const n of this.neurons)
      for(const conn of n.connections)
        connections.push(conn)
    connections.sort((a, b)=>a.innovn-b.innovN)
    let i = 0
    return {
      next: function(){
        return i<connections.length? 
          {value: connections[i++], done: false}:
          {done: true}
      },
      done: function(){
        return i>=connections.length
      }
    }
  }

  mutateWeights(radioactivity){
    const it = this.connectionIterator()
    while(!it.done())
      if(Math.random()<radioactivity)
        it.next().value.weight += randomGaussian(0, 0.25)
      else 
        it.next()
  }

  mutateConnections(radioactivity){
    const it = this.connectionIterator()
    while(!it.done())
      if(Math.random()<radioactivity){
        const originalConn =  it.next().value
        const n = this._addNeuron(Neuron.Type.hidden)
        n.layer = originalConn.inN.layer + 1
        if(originalConn.outN.type == Neuron.Type.hidden)
          originalConn.outN.layer = n.layer+1
        this._addConnection(originalConn.inN, n, 1)
        originalConn.inN = n
      }
      else 
        it.next()
  }

  mutateNewConnections(radioactivity){
    for(const n of this.neurons){
      if(n.type == Neuron.Type.input || Math.random()>radioactivity)
        continue
      const alreadyConnected = new Set()
      n.connections.forEach(x=>alreadyConnected.add(x.inN.id))
      const posibleOuts = this.neurons.filter(x=>{
        return x.layer < n.layer
      }).filter(x =>{
        return !alreadyConnected.has(x.id)
      })
      //console.log(n.id);
      //console.log(posibleOuts);
      /*Posible outs listo
        elegimos un ix de los posibles
        y creamos una coneccion con un peso aleatorio
      */
    }

  }

  static unmutedChild(mother, father){
    const child = new Genome(0, 0, false)
    const motherIt = mother.connectionIterator()
    const fatherIt = father.connectionIterator()
    const addedNeurons = {}

    function addNeuron(n){
      if(!(n.id in addedNeurons))
        addedNeurons[n.id]  = child._addNeuron(n.type, n.id, n.layer)
      return addedNeurons[n.id]
    }

    function addConnection(conn){      
      child._addConnection(addNeuron(conn.inN), addNeuron(conn.outN), conn.weight)
    }

    let mConn = motherIt.next()
    let fConn = fatherIt.next()
    while(!mConn.done && !fConn.done){
      if(mConn.value.innovN == fConn.value.innovN){
        if(Math.random>0.5){
          addConnection(mConn.value)
        }
        else {
          addConnection(fConn.value)
        }
        mConn = motherIt.next()
        fConn = fatherIt.next()
      }
      else if(mConn.value.innovN<fConn.value.innovN){
        addConnection(mConn.value)
        mConn = motherIt.next()
      }
      else {
        addConnection(fConn.value)
        fConn = fatherIt.next()
      }
    }
    while(!mConn.done){
      addConnection(mConn.value)
      mConn = motherIt.next()
    }
    while(!fConn.done){
      addConnection(fConn.value)
      fConn = fatherIt.next()
    }

    return child
  }

  static offSpring(mother, father){
    const child = Genome.unmutedChild(mother, father)
    child.mutateWeights(0.5)
    child.mutateConnections(0.4)
    child.mutateNewConnections(0.5)
    return child
  }
}

