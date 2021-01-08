class NEAT {
  constructor(inN, outN, populationSize) {
    this.inN = inN
    this.outN = outN
    this.populationSize = populationSize
    this.population = []
    this.species = []
    for (let i = 0; i < populationSize; i++)
      this.population.push(new Genome(inN, outN))
  }

  /**
   * Dado un especimen regresa el indice de la primera especie con la
   * que su delta es menor a epsilon. Se toma un ejemplar arbitrario
   * por especie para comparar. En caso de no encajar en ninguna especie
   * se regresara el siguiente indice en la lista
   * @param {Genome} especimen Ejemplar a comparar.
   * @return {Number} Indice de la especie correspondiente.
   */
  findSpecie(){

  }

  /**
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
      x.fitness = fitness(x, X, Y)
    })
  }

  /**
   * Separamos a toda nuestra poblaci\'on en distintas especies
   */
  autumn() {
    let oldSpecies = this.species
    this.species = []
    for(const genome of this.population){
      // encuentra un set 
    }
  }
  winter() { }
  spring() { }

  step(fitness, X, Y) {
    if (fitness)
      this.summer(X, Y, fitness)
    this.autumn()
    this.winter()
    this.spring()

    //Oto\~no 
    //separar en especies (sets)

    //Invierno 
    //Asesinar a los debiles

    // Primavera
    // Reproducir aleatoriamente dentro de la misma especie 


    this.population.sort((a, b) => b.fitness - a.fitness)
    console.log(this.population);
  }
}