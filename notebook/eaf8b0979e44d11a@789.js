// https://observablehq.com/@davidalencia/playing-pacman-with-neat@789
import define1 from "./b4b821d169d4ff8e@263.js";
import define2 from "./e93997d5089d7165@2289.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["bestPlayer_196.json",new URL("./files/b447b2f6bb7de9f10cea176616fe6f7db930531f4100c415c988f14449995ea5af66ac5d8dee35f823bd0d8ed39cfbd20b392a60b6d34b3f79f48c85c21ee7d3",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# Playing Pacman with NEAT`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Importamos todas las utilidades para este cuaderno.`
)});
  const child1 = runtime.module(define1);
  main.import("log", child1);
  main.import("consoleHook", child1);
  const child2 = runtime.module(define2);
  main.import("slider", child2);
  main.import("select", child2);
  main.variable(observer("Chart")).define("Chart", ["require"], function(require){return(
require('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.bundle.min.js')
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Definimos algunas funciones que nos seran utiles mas adelante.`
)});
  main.variable(observer("rand")).define("rand", function(){return(
function rand(arr) {
  let i = Math.floor(arr.length*Math.random())
  return arr[i]
}
)});
  main.variable(observer("randGaussian")).define("randGaussian", function(){return(
function randGaussian(mu, sigma) {
  const x = Math.random()
  let left = 1/Math.sqrt(2*Math.PI*(sigma**2))
  const right = Math.exp((x-mu)**2/(-2*(sigma**2)))
  return left*right
}
)});
  main.variable(observer("sigmoid")).define("sigmoid", function(){return(
x=>1/(1+Math.exp(x))
)});
  main.variable(observer("Vertex")).define("Vertex", function(){return(
class Vertex {
  constructor(id){
    this.id = id
    this.outEdges = []
    this.inEdges = []
  }
}
)});
  main.variable(observer("Edge")).define("Edge", function(){return(
class Edge {

  /**
   * Constructor de aristas.
   * @param {Number} outV Vertice desde donde sale la arista
   * @param {Number} inV Vertice donde entra la arista
   * @param {Number} weight Peso de la arista. Default: Math.random()
   */
  constructor(outV, inV, weight){
    Edge._innovD = Edge._innovD || [];
    Edge._innovN = Edge._innovN || 0;
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
)});
  main.variable(observer("dGraph")).define("dGraph", ["Vertex","Edge"], function(Vertex,Edge){return(
class dGraph {
  constructor(){
    this.edges = []
    this.vertex = []
    this.vertexIds =  new Set()
    this.ordered = null
  }
  _createOrGetVertex(id){
    if(!this.vertex[id]){
      this.vertex[id] = new Vertex(id)
      this.isOrdered = false
    }
    this.vertexIds.add(id)
    return this.vertex[id]
  }

  /**
   * Función para agregar una arista.
   * @param {Number} outV Indice de vertice desde donde sale la arista
   * @param {Number} inV Indice del vertice donde entra la arista
   * @param {Number} weight Peso de la arista. Default: Math.random()
   */
  addEdge(outV, inV, weight=Math.random()){
    this.ordered = null
    outV = this._createOrGetVertex(outV)
    inV = this._createOrGetVertex(inV)
    const edge = new Edge(outV, inV, weight)
    this.edges.push(edge)
    inV.inEdges.push(edge)
    outV.outEdges.push(edge)
  }

  /**
   * Función para eliminar una arista.
   * @param {Edge} e Arista que se desea elimiar
   */
  deleteEdge(e){
    this.ordered = null
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
   * Devuelve un vértice nuevo dentro de la gráfica.
   */
  createVertex(){
    this.ordered = null
    let id =  this.vertex.length
    while(this.vertexIds.has(id))
      id++
    this.vertex[id] = new Vertex(id)
    this.vertexIds.add(id)
    return this.vertex[id]
  }

  /**
   * Método para convertir a cadena la gráfica.
   */
  toString(){
    let s = ""
    for(const edge of this.edges)
      s += edge.outV.id +"->"+ edge.inV.id + "\n"
    return s
  }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## dGraph

Para implementar NEAT, utilizo una gráfica dirigida. Asi que primero habra que implementar una gráfica
dirigida.`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### toposort
Parte importante del algoritmo NEAT, es no crear ciclos cuando mutamos la gráfica.
La forma en que yo lo evito es utilizando un topo-orden. 
Dado un topo orden podemos evitar crear ciclos solo creando conexiones hacia adelante.

La creación de un topo-orden consiste en tomar vertices sin colorear, aplicar dfs coloreando el subconjunto, le aplicamos reversa a la lista y lo agregamos al inicio del orden.`
)});
  main.variable(observer()).define(["dGraph"], function(dGraph){return(
Object.setPrototypeOf(dGraph.prototype, {
  /**
   * Regresa un arreglo de los vertices ordenados por topo sort
   * @returns {[Vertex]} Arreglo de vertices.
   */
  toposort(){
    if(this.ordered)
      return this.ordered
    this.vertex = this.vertex.filter(x=>x)
    const dfs = (at, V, visitedNodes) => {
      V[at] = true
      if(this.vertex[at])
        for(const edge of this.vertex[at].inEdges)
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
    this.ordered = ordering.reverse().map(x=>this.vertex[x]).filter(x=>x)
    return this.ordered
  }
})
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Genoma
Genome hace buena parte del trabajo pesado.
Para ejecutar NEAT, nos sera util que la misma clase Genome pueda crear a sus descendientes.
Tenemos que tomar a ambos padres y juntar sus genomas. 
Si el número de inovación es distinto entonces guarda la arista, si el número es el mismo toma una al azar.
Despues muta las aristas de dos formas primero el peso de esta, y luego, con una menor probabilidad,
agregamos un nodo en esta arista.
Finalmente creamos conexiones nuevas entre vertices sin conectar.
`
)});
  main.variable(observer("Genome")).define("Genome", ["dGraph","randGaussian"], function(dGraph,randGaussian){return(
class Genome {
  constructor(inputs, outputs, bias=true){
    inputs = inputs +1
    this.fitness = null
    this.inputLen = inputs
    this.outputLen = outputs
    this.dGraph = new dGraph()
    for(let i=0; i<inputs; i++)
      for(let j=0; j<outputs; j++)
        this.dGraph.addEdge(i, inputs+j)

  }
  mutateWeights(radioactivity){
    const orderedVertex = this.dGraph.toposort()
    for(const vertex of orderedVertex){
      for(const edge of vertex.outEdges)
        if(Math.random()<radioactivity)
          edge.weight += randGaussian(0, 0.25) -1
    }
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

  connections() {
    const edges = []
    for(const vertex of this.dGraph.toposort())
      for(const edge of vertex.outEdges)
        edges.push(edge)
    edges.sort((a,b)=>a.innovN-b.innovN)
    return edges
  }

  static unmutedChild(mother, father){
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
    let mEdges = mother.connections()
    let fEdges = father.connections()
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

  static offSpring(mother, father, alpha=0.1){
    let child = Genome.unmutedChild(mother, father)
    child.mutateWeights(alpha)
    child.mutateNewConnections(0.0001*alpha)
    child.mutateConnections(0.001*alpha)
    return child
  }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### feed
Tambien parece lógico que este genoma pueda realizar el feed forward. 
Como desconocemos la topologia general de la red neuronal, tenemos que calcular neurona por neurona.`
)});
  main.variable(observer()).define(["Genome","sigmoid"], function(Genome,sigmoid){return(
Object.setPrototypeOf(Genome.prototype, {
   _feed(neurons, v){
    if(neurons[v.id]!=Infinity)
      return neurons[v.id]
    let sum = 0
    for(const edge of v.inEdges)
      sum += this._feed(neurons, edge.outV)*edge.weight
    neurons[v.id] = sigmoid(sum)
    return neurons[v.id]
  },

  feed(input){
    const neuronsValues = new Float32Array(this.dGraph.vertex.length).fill(Infinity)
    const orderedVertex = this.dGraph.toposort()
    input = [1, ...input]
    if(input.length!=this.inputLen){
      throw Error("input must be same as size as defined in constructor")
    }
    for(let i=0; i<this.inputLen; i++)
      neuronsValues[i] = input[i]
    for(const vertex of orderedVertex)
      this._feed(neuronsValues, vertex)
    let Y = new Float32Array(this.outputLen)
    for(let i=0; i<this.outputLen; i++)
      Y[i] = neuronsValues[this.inputLen+i]
    return Y
  } ,

  feedBatch(batch){
    let Y = []
    let newBatch = new Array()
    for(let i=0; i<batch.length; i++)
      newBatch[i] = batch[i].slice()
    for(const input of newBatch)
      Y.push(this.feed(input))
    return Y
  }
})
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Especies
Para poder "proteger la inovación", separamos en especies. 
Si una especie es muy distinta de otra no son agregadas a esta especie.
`
)});
  main.variable(observer("Specie")).define("Specie", ["rand"], function(rand){return(
class Specie {
    /**
     * @param {Genome} genome Genoma que se considera el primer miembro de la
     * especie.
     * @param {float} delta La distancia maxima entre miembros de la especie.
     */
    constructor(genome, delta){
        this.delta =  delta
        this.specimens = [genome]
        this.length = 1
    }
    /**
     * Dado un genoma si pertenece a esta especie lo agrega auna lista de 
     * especimenes. Si forma parte de la misma especie regresa `true`.
     * Si no regresa `false`.
     * @param {Genome} genome El especimen a agregar.
     * @returns {Boolean} Regresa `true` si forma parte de la misma especie
     * `false` en otro caso.
     */
    addGenome(genome){
        let is = this.is(genome)
        if(is){
            this.specimens.push(genome)
            this.length++
        }
        return is
    }

    /**
     * Revisa si un genoma dado esta en esta especie. Utilizando la 
     * función definida por NEAT, donde D son los genes que no encagan
     * con ninguno, E los genes que no encagan al final de las 
     * conecciones.
     * \delta= c1*E/N+c2*D/N+c1*W 
     * @param {Genome} genome El especimen que sera verificado.
     * @returns {Boolean} Regresa si esta o no en la especie.
     */
    is(genome, c1=2, c2=2, c3=1){
        let E = 0,
            D = 0,
            W = 0;
        let specimen = rand(this.specimens)
        let sConnections = specimen.connections()
        let gConnections = genome.connections()
        let six = 0
        let gix = 0 
        while(six<sConnections.length && gix<gConnections.length){
            if(sConnections[six].innovN == gConnections[gix].innovN){
                W += Math.abs(sConnections[six].weight - gConnections[gix].weight)
                six++
                gix++
            }
            else  if(sConnections[six].innovN < gConnections[gix].innovN){
                D++
                six++
            }
            else {
                D++
                gix++
            }
        }
        while(six<sConnections.length){
            E++
            six++
        }
        while(gix<gConnections.length){
            E++
            gix++
        }
        let N = Math.max(gix, six)
        W = W/N 
        N = N>20? N : 1
        let distance = (c1*E + c2*D)/N + W*c3
        return distance<this.delta
    }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## NEAT
Neat consiste en crear una población, mantener a los mas fuertes y los reproducirlos.
Dividi las étapas de NEAT en cuatro, una por cada estación del año.
En verano las especies crecen, se alimentan y son probadas contra el ambiente. Es decir calcula el fitness de cada genoma.
Conforme el otoño llega, las especies envejecen y es posible distingirlas entre ellas.
Como en invierno, los especimenes mas debiles de cada especie mueren. i.e. eliminaremos a los elementos con peor fitness de cada especie.
Y finalmente en primavera reproducimos a los miembros de las especies.
`
)});
  main.variable(observer("NEAT")).define("NEAT", ["Genome","Specie","rand"], function(Genome,Specie,rand){return(
class NEAT {
  constructor(inN, outN, populationSize, alpha=0.01) {
    this.alpha = alpha
    this.inN = inN
    this.outN = outN
    this.populationSize = populationSize
    this.population = []
    this.species = []
    this.stepix = 0
    for (let i = 0; i < populationSize; i++)
      this.population.push(new Genome(inN, outN))
  }

  /**
   * Como en verano las especies crecen, se alimentan y son probadas contra
   * el ambiente.
   * Calcula el fitness de la poblaci\'on
   * @param {Array} X - Arreglo de entradas a evaluar por las redes 
   * neuronales.
   * @param {Array} Y - Resultados que se esperan obtener eventualmente 
   * de las redes neuronales.
   * @param {Function} fitness - Funci\'on que genera el fitness para cada
   * red neuronal. Recibe tres argumentos (n, X, Y), donde X y Y son los
   * arreglos descritos arriba y n es una red neuronal
  */
  summer(X, Y, fitness) {
    this.population.forEach(x => {
      try{
        x.fitness = fitness(x, X, Y)
      }
      catch(e){
        x.fitness=-1
      }
    })
  }

  /**
   * Conforme el otoño llega, las especies envejecen y es posible separarlas 
   * en distintos tipos.
   * Separamos a toda nuestra poblaci\'on en distintas especies
   */
  autumn(delta) {
    this.species = [new Specie(this.population[0], delta)]
    for(let i=1; i<this.population.length; i++){
      let hasSpecie = false
      let j = 0
      while(!hasSpecie && j<this.species.length){
        hasSpecie = this.species[j++].addGenome(this.population[i])
      }
      if(!hasSpecie)
        this.species.push(new Specie(this.population[i], delta))
    }
  }

  /**
   * Como en invierno, los especimenes mas debiles de cada especie mueren.
   * Es decir eliminaremos a los elementos con peor fitness de cada especie.
   */
  winter() { 
    let fprom = 0
    for(const specimen of this.population)
      fprom += fprom.fitness
    fprom = fprom / this.population.length
    for(const specie of this.species){
      specie.specimens.sort((a,b)=>b.fitness-a.fitness)
      if(specie.specimens.length>1){
        let newLen = Math.ceil(specie.specimens.length*0.2)
        specie.specimens.length = newLen
      }
    }

  }

  /**
   * En primavera las especimenes que sobrevivieron el invierno, estan al 
   * final de su vida y buscan con quien reproducirse.
   * Reproducimos a cada especie y substituimos a nuestra población.
   */
  spring() {
    this.population = []
    for(const specie of this.species){
      for(let i =0; i<specie.length; i++){
        //Elegir a los mejores candidatos
        
        let mother = rand(specie.specimens)
        let father = rand(specie.specimens)
        this.population.push(Genome.offSpring(mother, father, this.alpha))
      }
    }
  }

  step(fitness, X, Y) {
    this.stepix += 0.01
    if(fitness)
      this.summer(X, Y, fitness)
    this.autumn(1+this.stepix)
    this.winter()
    this.spring()

    if(fitness)
      this.summer(X, Y, fitness)
    this.population.sort((a, b) => b.fitness - a.fitness)
  }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`# Probando con XOR`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Como es tradición, XOR funcionara como la primera preuba de que se genera la no linearidad`
)});
  main.variable(observer("X_XOR")).define("X_XOR", function(){return(
[
  [0,0],
  [0,1],
  [1,0],
  [1,1]
]
)});
  main.variable(observer("Y_XOR")).define("Y_XOR", function(){return(
[
  [0],
  [1],
  [1],
  [0]
]
)});
  main.variable(observer("fitnessXOR")).define("fitnessXOR", function(){return(
function fitnessXOR(n, X, Y){
  function mse(y, yP){
    let s = 0
    for(let i=0; i<y.length; i++)
      for(let j=0; j<y[i].length; j++)
        s += (y[i][j]-yP[i][j])**2
    return s/y.length
  }
  return  1/mse(Y, n.feedBatch(X))
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Creamos una sistema NEAT. Con 2 entradas, 1 salida y una población de 50.`
)});
  main.variable(observer("XORneat")).define("XORneat", ["NEAT"], function(NEAT){return(
new NEAT(2,1,50, 0.01)
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Entrenamos la red hasta que el fitness sea mayor a 20. 20 es un número en el que he observado ya esta resuelto xor. Esto suele tardar unas 50,000 generaciones pero puede variar mucho.`
)});
  main.variable(observer("dataXOR")).define("dataXOR", ["XORneat","fitnessXOR","X_XOR","Y_XOR"], function*(XORneat,fitnessXOR,X_XOR,Y_XOR)
{
  let fitness = [{fitness:0}]
  let i = 0
  while(fitness[fitness.length-1].fitness<20){
    XORneat.step(fitnessXOR, X_XOR, Y_XOR)
    i++
    if(i%1000==0){
      fitness.push({i, fitness: XORneat.population[0].fitness})
      yield fitness
    }
  }  
  yield fitness
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`Podemos ver los resultados de entranar a la red neuronal tomando al primer especimen de NEAT y evaluandolo
en X.`
)});
  main.variable(observer()).define(["dataXOR","XORneat"], function(dataXOR,XORneat)
{
  if(dataXOR[dataXOR.length-1].fitness<20)
    return "Entrenando red neuronal"
  else    
    return XORneat.population[0]
}
);
  main.variable(observer("XORchart")).define("XORchart", ["html","Chart","dataXOR"], function*(html,Chart,dataXOR)
{
  const container = html`<canvas id="myChart" width="400" height="200"></canvas>`;
  const myChart = new Chart(container, {
      type: 'line',
      data: {
          labels: dataXOR.map(x=>x.i),
          datasets: [{
              label: 'Fitness',
              data: dataXOR.map(x=>x.fitness),
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
          }]
      },
      options: {
            responsive: true,
            title: {
              display: true,
              text: 'Fitness vs generación'
            },
            scales: {
              xAxes: [{
                display: true,
              }],
              yAxes: [{
                display: true,
                type: 'logarithmic',
              }]
            }
        }
  });
  
  yield container;
}
);
  main.variable(observer()).define(["dataXOR","XORneat","X_XOR","md","Y_XOR"], function(dataXOR,XORneat,X_XOR,md,Y_XOR)
{
   if(dataXOR[dataXOR.length-1].fitness<20)
    return "Entrenando red neuronal"
  const salida = XORneat
    .population[0]
    .feedBatch(X_XOR)
    .reduce((acc, x)=>acc+","+x)
  const salidaRedondeada = XORneat
    .population[0]
    .feedBatch(X_XOR)
    .map(x=>Math.round(x))
    .reduce((acc, x)=>acc+","+x)
  
  return md`## Resultados de la red neuronal
  La salida esperada es (${Y_XOR.reduce((acc, x)=>acc+","+x)}).

  La salida sin redondear que obtenemos de la red neuronal es:

  (${salida}).

  Si redondeamos la salida podemos ver mas claramente, que nuestra red neuronal calcula correctamente XOR:
  (${salidaRedondeada}).`
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`# Pacman
Antes de poder crear una red neuronal para jugar Pacman, necesitamos un Pacman.
Aqui hay uno para que juegen con "WASD"`
)});
  main.variable(observer()).define(["p5","Pacman"], function(p5,Pacman){return(
p5(sketch => {
let pacman = null
let tileset = null
  
sketch.preload = function (){
  let tilesetURL = 'https://raw.githubusercontent.com/davidalencia/pacman-neat/main/pacman/tileset.png'
  tileset = sketch.loadImage(tilesetURL);
}

sketch.keyTyped = function(){
  if(sketch.key == 'w')
    pacman.setDirection('U')
  else if(sketch.key == 'a')
    pacman.setDirection('L')
  else if(sketch.key == 's')
    pacman.setDirection('D')
  else if(sketch.key == 'd')
    pacman.setDirection('R') 
}

sketch.setup =  function(){
  sketch.noLoop()
  let startBtn = sketch.createButton('play');
  startBtn.position(135, 10);
  startBtn.mouseClicked(()=>{
    if(sketch._loop){
      sketch.noLoop()
      startBtn.html("play")
    }
    else{ 
      sketch.loop()
      startBtn.html("pause")
    }
  });
  sketch.frameRate(3)
  sketch.createCanvas(336, 432);
  pacman = new Pacman(tileset, sketch)
  pacman.newLevel(0)
}
sketch.draw = function() {
  pacman.draw() 
}
})
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Para dibujar Pacman y jugarlo utilizo p5.js, una popular biblioteca para poder dibujar.`
)});
  main.variable(observer("P5")).define("P5", ["require"], function(require){return(
require('https://unpkg.com/p5@1.2.0/lib/p5.js')
)});
  main.variable(observer("p5")).define("p5", ["DOM","P5"], function(DOM,P5){return(
function* p5(sketch) {
  const element = DOM.element('div');
  
  // p5.js really likes its target element to already be in the DOM, not just
  // floating around detached. So, before we call P5, we yield it, which puts
  // in the DOM.
  yield element;
  
  // This is ‘instance mode’ in p5 jargon: instead of relying on lots of
  // globals, we create a sketch that has its own copy of everything under p5.
  const instance = new P5(sketch, element, true);
  
  // This is the tricky part: when you run P5(sketch, element), it starts a
  // loop that updates the drawing a bunch of times a second. If we were just
  // to call P5 repeatedly with different arguments, the loops would all keep
  // running, one on top of the other. So what we do is we use this cell
  // as a generator, and then when that generator is interrupted, like
  // when you update the code in the sketch() method, then we call instance.remove()
  // to clean it up.
  try {
    while (true) {
      yield element;
    }
  } finally {
    instance.remove();
  }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Definimos el tamaño de nuestro "tile"
`
)});
  main.variable(observer("tileSize")).define("tileSize", function(){return(
12
)});
  main.variable(observer()).define(["md"], function(md){return(
md`
Todos los nivieles inician igual, con la misma estructura.
Por eso podemos definir el mapa de antemano y utilizarlo para todos nuestros niveles.`
)});
  main.variable(observer("mapa")).define("mapa", function(){return(
[
  [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [2, 11,11,11,11,11,11,11,11,11,11,11,11,45,44,11,11,11,11,11,11,11,11,11,11,11,11,1],
  [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,27,26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [4, 0,25,16,16,24, 0,25,16,16,16,24, 0,27,26, 0,25,16,16,16,24, 0,25,16,16,24, 0, 3],
  [4, 0,27,-1,-1,26, 0,27,-1,-1,-1,26, 0,27,26, 0,27,-1,-1,-1,26, 0,27,-1,-1,26, 0, 3],
  [4, 0,29,23,23,28, 0,29,23,23,23,28, 0,29,28, 0,29,23,23,23,28, 0,29,23,23,28, 0, 3],
  [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [4, 0,25,16,16,24, 0,25,24, 0,25,16,16,16,16,16,16,24, 0,25,24, 0,25,16,16,24, 0, 3],
  [4, 0,29,23,23,28, 0,27,26, 0,29,23,23,37,36,23,23,28, 0,27,26, 0,29,23,23,28, 0, 3],
  [4, 0, 0, 0, 0, 0, 0,27,26, 0, 0, 0, 0,27,26, 0, 0, 0, 0,27,26, 0, 0, 0, 0, 0, 0, 3],
  [6,13,13,13,13,24, 0,27,38,16,16,24, 0,27,26, 0,25,16,16,39,26, 0,25,13,13,13,13, 5],
  [-1,-1,-1,-1,-1,4, 0,27,36,23,23,28,-1,29,28,-1,29,23,23,37,26, 0, 3,-1,-1,-1,-1,-1],
  [-1,-1,-1,-1,-1,4, 0,27,26,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,27,26, 0, 3,-1,-1,-1,-1,-1],
  [-1,-1,-1,-1,-1,4, 0,27,26,-1,31,13,35,50,50,34,13,30,-1,27,26, 0, 3,-1,-1,-1,-1,-1],
 [12,12,12,12,12,28, 0,29,28,-1, 3,-1,-1,-1,-1,-1,-1, 4,-1,29,28, 0,29,12,12,12,12,12],
  [-1,-1,-1,-1,-1,-1,0,-1,-1,-1, 3,-1,-1,-1,-1,-1,-1, 4,-1,-1,-1, 0,-1,-1,-1,-1,-1,-1],
 [13,13,13,13,13,24, 0,25,24,-1, 3,-1,-1,-1,-1,-1,-1, 4,-1,25,24, 0,25,13,13,13,13,13],
  [-1,-1,-1,-1,-1,4, 0,27,26,-1,33,12,12,12,12,12,12,32,-1,27,26, 0, 3,-1,-1,-1,-1,-1],
  [-1,-1,-1,-1,-1,4, 0,27,26,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,27,26, 0, 3,-1,-1,-1,-1,-1],
  [-1,-1,-1,-1,-1,4, 0,27,26,-1,25,16,16,16,16,16,16,24,-1,27,26, 0, 3,-1,-1,-1,-1,-1],
  [2,12,12,12,12,28, 0,29,28,-1,29,23,23,24,25,23,23,28,-1,29,28, 0,29,12,12,12,12, 1],
  [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,27,26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [4, 0,25,16,16,24, 0,25,16,16,16,24, 0,27,26, 0,25,16,16,16,24, 0,25,16,16,24, 0, 3],
  [4, 0,29,23,37,26, 0,29,23,23,23,28, 0,29,28, 0,29,23,23,23,28, 0,27,36,23,28, 0, 3],
  [4, 0, 0, 0,27,26, 0, 0, 0, 0, 0, 0, 0,-1,-1, 0, 0, 0, 0, 0, 0, 0,27,26, 0, 0, 0, 3],
  [8,16,24, 0,27,26, 0,25,24, 0,25,16,16,16,16,16,16,24, 0,25,24, 0,27,26, 0,25,16, 7],
 [10,23,28, 0,29,28, 0,27,26, 0,29,23,23,37,36,23,23,28, 0,27,26, 0,29,28, 0,29,23, 9],
  [4, 0, 0, 0, 0, 0, 0,27,26, 0, 0, 0, 0,27,26, 0, 0, 0, 0,27,26, 0, 0, 0, 0, 0, 0, 3],
  [4, 0, 21,16,16,16,16,39,38,16,16,24,0,27,26, 0, 25,16,16,39,38,16,16,16,16,20,0, 3],
  [4, 0, 19,23,23,23,23,23,23,23,23,28,0,29,28, 0, 29,23,23,23,23,23,23,23,23,18,0, 3],
  [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [6,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14, 5]
]
)});
  main.variable(observer("Pacman")).define("Pacman", ["mapa","tileSize"], function(mapa,tileSize){return(
class Pacman {
  constructor(tileset, sketch){
    if(sketch)
      sketch.background(0);
    this.mapa = mapa.map(x=>x.slice())
    this.sketch = sketch
    this.x = 13
    this.y = 26
    this.tileset = tileset
    this.uneatenPoints = 0
    this.level = 0
    this.direction = 'L'
    this.close = false
    this.score = 0
  }
  
  _indexTiles(i){
    let xTile = i%33
    let yTile = Math.floor(i/33)
    return {'x': xTile*tileSize+4, 'y':yTile*tileSize+5}
  }
  
  _drawTile(dx, dy, i){
    let {x, y} =  this._indexTiles(i)
    this.sketch.image(this.tileset, dx, dy, tileSize, tileSize, x, y, tileSize, tileSize);
  }
  
  drawMaze(){
    for (let alfa = 0; alfa<this.mapa.length; alfa++)
      for (let beta = 0; beta<this.mapa[alfa].length; beta++)
        if(this.mapa[alfa][beta]>0)
          this._drawTile(beta*tileSize, alfa*tileSize, this.mapa[alfa][beta]+213)
  }
  
  drawPoints(){
    for (let alfa = 0; alfa<this.mapa.length; alfa++)
      for (let beta = 0; beta<this.mapa[alfa].length; beta++)
        if(this.mapa[alfa][beta]==0)
          this._drawTile(beta*tileSize, alfa*tileSize, 16)
        else if(this.mapa[alfa][beta]==-1)
          this._drawTile(beta*tileSize, alfa*tileSize, 300)
          
  }
  
  newLevel(){
    this.drawMaze()
    this.uneatenPoints = 246
  }
  
  drawPacman(){
    this.close = !this.close
    let pac = {x: 4, y:198}  
    if (!this.close)
      if(this.direction == 'R')
        pac = {x:292, y:174}
      else if(this.direction == 'D')
        pac = {x:313, y:174}
      else if(this.direction == 'U')
        pac = {x:26, y:270}
      else
        pac = {x:4, y:270}
    this.sketch.image(this.tileset, 
          this.x*tileSize, //dx
          this.y*tileSize, //dy
          tileSize*1.6, 
          tileSize*1.5, 
          pac.x, //sx
          pac.y, //sy
          tileSize*2, 
          tileSize*2);
  }
  
  valid(x, y){
      return this.mapa[y][x]<1
  }
  
  setDirection(dir){
    const R = (dir == 'R' && this.valid(this.x+1, this.y) && this.direction != 'L')
    const D = (dir == 'D' && this.valid(this.x, this.y+1) && this.direction != 'U')
    const U = (dir == 'U' && this.valid(this.x, this.y-1) && this.direction != 'D')
    const L = (dir == 'L' && this.valid(this.x-1, this.y) && this.direction != 'R')
    if(R || D || U || L)
      this.direction = dir
  }
  
  move(){
    if(this.direction == 'R' && this.valid(this.x+1, this.y))
      if(this.x==25 && this.y==17)
        this.x=1
      else
        this.x++
    else if(this.direction == 'D' && this.valid(this.x, this.y+1))
      this.y++
    else if(this.direction == 'U' && this.valid(this.x, this.y-1))
      this.y--
    else if(this.direction == 'L' && this.valid(this.x-1, this.y))
      if(this.x==1 && this.y==17)
        this.x=25
      else
        this.x--
    if(this.mapa[this.y][this.x]==0){
      this.mapa[this.y][this.x]=-1
      this.score++
    }
  }

  update(){
    if(this.uneatenPoints==0)
      this.newLevel()
    this.move()
  }
  
  draw(){
    this.update()
    if(this.sketch){
      this.drawMaze()
      this.drawPoints()
      this.drawPacman()
      this.sketch.fill(255, 255, 252, 255);
      this.sketch.text(`score: ${this.score}`, 10, 20);
    }
    
  }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`# Jugando Pacman con NEAT
Ya con Pacman definido, podemos empezar a entrenar la red neuronal.
Para definir NEAT necesitamos las entradas en este caso 952 (una por casilla) y 4 salidas una por cada dirección.`
)});
  main.define("initial pacmanNEAT", ["NEAT"], function(NEAT)
{
  //28x31
  let neat = new NEAT(11*11-1, 4, 50)
//  for(const genome of neat.population)
//    for(const edge of genome.dGraph.edges)
//      edge.weight = 0
  return neat
}
);
  main.variable(observer("mutable pacmanNEAT")).define("mutable pacmanNEAT", ["Mutable", "initial pacmanNEAT"], (M, _) => new M(_));
  main.variable(observer("pacmanNEAT")).define("pacmanNEAT", ["mutable pacmanNEAT"], _ => _.generator);
  main.variable(observer()).define(["md"], function(md){return(
md`Vamos a crear una función que nos permita ver como juega cada individuo`
)});
  main.variable(observer("automaticPlay")).define("automaticPlay", ["p5","Pacman","getNewDirection"], function(p5,Pacman,getNewDirection){return(
function automaticPlay(genome){
  return p5(sketch => {
    let pacman = null
    let tileset = null
  
    sketch.preload = function (){
      let tilesetURL = 'https://raw.githubusercontent.com/davidalencia/pacman-neat/main/pacman/tileset.png'
      tileset = sketch.loadImage(tilesetURL);
    }

    sketch.setup =  function(){
      sketch.noLoop()
      let startBtn = sketch.createButton('play');
      startBtn.position(135, 10);
      startBtn.mouseClicked(()=>{
        if(sketch._loop){
          sketch.noLoop()
          startBtn.html("play")
        }
        else{ 
          sketch.loop()
          startBtn.html("pause")
        }
      });
      sketch.frameRate(3)
      sketch.createCanvas(336, 432);
      pacman = new Pacman(tileset, sketch)
      pacman.newLevel(0)
    }
    sketch.draw = function() {
      pacman.setDirection(getNewDirection(genome, pacman))
      pacman.draw() 
    }
})
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Necisitamos normalizar el tablero, para facilitar el trabajo de la red neuronal.`
)});
  main.variable(observer("normalizePacman")).define("normalizePacman", function(){return(
function normalizePacman(pacman){
  const input =  new Float32Array(120)
  let salto = 0
  for(let i=-5;i<=5;i++)
    for(let j=-5;j<=5; j++){
      let val = Infinity
      if(i==0&&j==0){
        salto = -1
        continue
      }
      let ix = (j+5)*11+i+5+salto 
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
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Definimos una función para poder encontrar la nueva dirección, dados un genoma y un pacman`
)});
  main.variable(observer("getNewDirection")).define("getNewDirection", ["normalizePacman"], function(normalizePacman){return(
function getNewDirection(genome, pacman){
  let input = normalizePacman(pacman)
  let output = genome.feed(input)
  let outI = output.indexOf(Math.max(...output));
  let movements = ['U','L','D','R']
  return movements[outI]
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Necesitamos definir una funcion fitness para poder calcular que tan buena son los individuos`
)});
  main.variable(observer("pacmanFitness")).define("pacmanFitness", ["Pacman","getNewDirection"], function(Pacman,getNewDirection){return(
genome => new Promise((res, rej)=>{
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
 res(pacman.score)
})
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Por el momento no tiene un gran comportamiento, pero es un inicio.`
)});
  main.variable(observer()).define(["automaticPlay","pacmanNEAT"], function(automaticPlay,pacmanNEAT){return(
automaticPlay(pacmanNEAT.population[0])
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Entrenando para la posteridad
Entrenar a una red neuronal tarda tiempo.
Y si cada vez que abrimos este cuaderno perdemos los pesos, perderiamos mucho tiempo entrenando.
Sin embargo podemos crear algunas funciones para poder descargar los pesos y cargarlos.`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### descargar i.e. Genome->JSON`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Primero una funcion que transforme un Genome en algo que si puede ser convertido en JSON. 
La forma actual tiene referencias circulares lo que evita que esto sea posible.

Podriamos convertirlo directamente en una cadena formato JSON. 
Pero Observablehq nos permite descargar cualquier objeto como un archivo tipo JSON.`
)});
  main.variable(observer("Genome2JSONable")).define("Genome2JSONable", function(){return(
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
)});
  main.variable(observer()).define(["Genome2JSONable","pacmanNEAT"], function(Genome2JSONable,pacmanNEAT){return(
Genome2JSONable(pacmanNEAT.population[0])
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Cargar i.e. JSON->Genome
Ahora necesitamos un método que transforme este objeto que se parece a un Genoma y lo convierta en uno propio.
De nuevo ignoraremos el paso de parse del JSON a objecto, pues js se encargara de eso`
)});
  main.variable(observer("Object2Genome")).define("Object2Genome", ["dGraph","Genome"], function(dGraph,Genome){return(
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
)});
  main.variable(observer()).define(["Object2Genome","Genome2JSONable","pacmanNEAT"], function(Object2Genome,Genome2JSONable,pacmanNEAT){return(
Object2Genome(Genome2JSONable(pacmanNEAT.population[0]))
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Entrenar o cargar
Podemos descargar el modelo o entrenarlo.

Ya existe uno en github.`
)});
  main.variable(observer("viewof modelSelect")).define("viewof modelSelect", ["select"], function(select){return(
select({
  title: "Modelo",
  description: "Escoge si quieres entrenar el modelo o Cargarlo.",
  options: ["Entrenar", "Cargar"],
  value: "Cargar"
})
)});
  main.variable(observer("modelSelect")).define("modelSelect", ["Generators", "viewof modelSelect"], (G, _) => G.input(_));
  main.variable(observer("viewof epochsPacman")).define("viewof epochsPacman", ["slider"], function(slider){return(
slider({
  min: 10, 
  max: 20000, 
  step: 50, 
  value: 50, 
  title: "Generaciones de NEAT"
})
)});
  main.variable(observer("epochsPacman")).define("epochsPacman", ["Generators", "viewof epochsPacman"], (G, _) => G.input(_));
  main.variable(observer("bestPlayer")).define("bestPlayer", ["modelSelect","epochsPacman","pacmanNEAT","pacmanFitness","FileAttachment","Object2Genome"], async function*(modelSelect,epochsPacman,pacmanNEAT,pacmanFitness,FileAttachment,Object2Genome)
{
  if(modelSelect==="Entrenar"){
    for(let i=0; i<epochsPacman; i++){
      for(const genome of pacmanNEAT.population)
        genome.fitness = await pacmanFitness(genome)
      pacmanNEAT.population.sort((a,b)=>b.fitness-a.fitness)
      yield {player: pacmanNEAT.population[0], generation: i}
      pacmanNEAT.step()
    }
    yield {player: pacmanNEAT.population[0], generation: epochsPacman}
  }
  else {
    let obj = await FileAttachment("bestPlayer_196.json").json()
    console.log(obj)
    yield {player: Object2Genome(obj), generation: 0}
  }
}
);
  main.variable(observer()).define(["automaticPlay","bestPlayer"], function(automaticPlay,bestPlayer){return(
automaticPlay(bestPlayer.player)
)});
  return main;
}
