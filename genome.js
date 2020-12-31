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

const neuronType = Object.freeze({
  "input":1,
  "hidden":2,
  "output":3
})

class Neuron {
  static innovD = []
  static innovN = 0
  constructor(id, type, f=x=>1/(1+Math.exp(x))){
    this.id = id
    this.connections = []
    this.type = type
    this.f = f
  }
  addConnection(inN, weight){
    if(!Neuron.innovD[this.id])
      Neuron.innovD[this.id] = []
    if(!Neuron.innovD[this.id][inN.id])
      Neuron.innovD[this.id][inN.id] = ++Neuron.innovN
    const innovN = Neuron.innovD[this.id][inN.id]
    const conn = {
      outN: this,
      inN,
      weight,
      innovN
    }
    this.connections.push(conn)
    return conn
  }
}

class Genome {

  constructor(inputs, outputs, bias=true){ 
    this.error = null
    this.neurons = []
    this.inputs = []
    this.hidden = []
    this.outputs = []
    this.calculated = []
    
    for(let i=0; i<inputs+bias; i++)
      this._addNeuron(neuronType.input)
    for(let i=0; i<outputs; i++){
      let n = this._addNeuron(neuronType.output)
      for(const inN of this.inputs)
        this._addConnection(inN, n)
    } 
  }

  static offspring(mother, father){
    const child = new Genome(0, 0, false)
    const motherIt = mother.connectionIterator()
    const fatherIt = father.connectionIterator()
    const addedNeurons = {}

    function addNeuron(n){
      if(!(n.id in addedNeurons)){
        n = child._addNeuron(n.type, n.id, n.f)
        addedNeurons[n.id] = n
        return n
      }
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
    while(!mConn.done)
      addConnection(mConn.value)
    while(!fConn.done)
      addConnection(fConn.value)
    
    
    return child.mutate()
  }

  _addConnection(inN, outN, weight=Math.random()){
    let conn = outN.addConnection(inN, weight)
  }

  _addNeuron(type, nN=this.neurons.length, f){
    const n = new Neuron(nN, type, f)
    this.neurons.push(n)
    if(type == neuronType.input)
      this.inputs.push(n)
    else if(type == neuronType.hidden){
      this.hidden.push(n)
      this.calculated.push(n)
    }
    else {
      this.outputs.push(n)
      this.calculated.push(n)
    }
    return n
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

  _feed(nN, neurons){
    if(neurons[nN] != Infinity)
      return neurons[nN]
    neurons[nN] = this.neurons[nN].f(
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

  mutate(p = 0.1){
    const self = this
    return new Promise(async res=>{
      const it = this.connectionIterator()
      while(!it.done()){
        const conn = it.next().value
        conn.weight += (await tf.randomNormal([1]).data());
        if(Math.random()<p){
          const n = this._addNeuron(neuronType.hidden)
          this._addConnection(conn.inN, n)
          conn.inN = n
        }
      }

      const hiddenOut =  this.outputs.concat(this.hidden)
      const randN = Math.floor(Math.random()*hiddenOut.length)
      hiddenOut[randN].connections.map(x=>x.inN.id).reduce(x=>{
        
      })

      res(self)
    })
  }
}

g = new Genome(2, 1)
g2 = new Genome(2, 1)
child = Genome.offspring(g, g2);
child.then(console.log)
console.log("............g..................");
console.log(g);
//console.log(g2);