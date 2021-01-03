class Neuron {
    static Type = Object.freeze({
        "input":1,
        "hidden":2,
        "output":3
      })
    static innovD = []
    static innovN = 0

    constructor(id, type, layer=null){
        this.id = id
        this.connections = []
        this.type = type
        this.layer = layer
        if(!Neuron.innovD[this.id])
            Neuron.innovD[this.id] = []
    }
    addConnection(inN, weight){
        if(!Neuron.innovD[this.id][inN.id])
          Neuron.innovD[this.id][inN.id] = ++Neuron.innovN
        const innovN = Neuron.innovD[this.id][inN.id]
        const conn = {
          outN: this,
          inN,
          weight,
          innovN,
          ix: this.connections.length
        }
        this.connections.push(conn)
        return conn
      }
}

