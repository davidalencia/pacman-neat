/**
 * Clase de vertices para gráficas
 */
class Vertex {
  constructor(id){
    this.id = id
    this.outEdges = []
    this.inEdges = []
  }
}

/**
 * Clase de arista para una gráfica
 */
class Edge {
  static _innovD = []
  static _innovN = 0

  /**
   * Constructor de aristas.
   * @param {Number} outV Vertice desde donde sale la arista
   * @param {Number} inV Vertice donde entra la arista
   * @param {Number} weight Peso de la arista. Default: Math.random()
   */
  constructor(inV, outV, weight){
    this.outV = outV
    this.inV = inV
    this.weight =  weight

    if(!Edge._innovD[outV.id])
      Edge._innovD[outV.id] = []
    if(!Edge._innovD[outV.id][inV.id])
      Edge._innovD[outV.id][inV.id] = ++Edge._innovN
    this.innovN =  Edge._innovD[outV.id][inV.id]
  }
}

/**
 * Clase de graficas dirigidas
 */
class dGraph {
  constructor(){
    this.edges = []
    this.vertex = []
    this.isOrdered = true
  }
  _createOrGetVertex(id){
    if(!this.vertex[id]){
      this.vertex[id] = new Vertex(id)
      this.isOrdered = false
    }
    return this.vertex[id]
  }

  /**
   * Función para agregar una arista.
   * @param {Number} outV Indice de vertice desde donde sale la arista
   * @param {Number} inV Indice del vertice donde entra la arista
   * @param {Number} weight Peso de la arista. Default: Math.random()
   */
  addEdge(outV, inV, weight=Math.random()){
    this.isOrdered = false
    outV = this._createOrGetVertex(outV)
    inV = this._createOrGetVertex(inV)
    const edge = new Edge(inV, outV, weight)
    this.edges.push(edge)
    inV.inEdges.push(edge)
    outV.outEdges.push(edge)
  }

  /**
   * Función para eliminar una arista.
   * @param {Edge} e Arista que se desea elimiar
   */
  deleteEdge(e){
    this.isOrdered = false
    function _deleteEdge(e, arr) {
      let filtered = []
      for(const edge of arr)
        if(edge!=e) filtered.push(edge)
      return filtered
    }
    e.outV.outEdges = _deleteEdge(e, e.outV.outEdges)
    e.inV.inEdges = _deleteEdge(e, e.inV.inEdges)
    this.edges = _deleteEdge(e, this.edges)
  }

  /**
   * Regresa un arreglo de los vertices ordenados por topo sort
   * @returns {[Vertex]} Arreglo de vertices.
   */
  toposort(){
    if(this.isOrdered)
      return this.vertex
    const dfs = (at, V, visitedNodes) => {
      V[at] = true
      for(const edge of this.vertex[at].outEdges)
        if(!V[edge.outV.id])
          dfs(edge.outV.id, V, visitedNodes)
      visitedNodes.push(at)
    }

    const N = this.vertex.length
    const V = Array(N).fill(false)
    const ordering = Array(N)
    let i = N - 1
    for(let at=0; at<N; at++){
      if(V[at]==false){
        const visitedNodes = []
        dfs(at, V, visitedNodes)
        for(const nodeId of visitedNodes){
          ordering[i] = nodeId
          i = i -1
        }
      }
    } 
    this.vertex = ordering.reverse().map(x=>this.vertex[x])
    return this.vertex
  }

}
