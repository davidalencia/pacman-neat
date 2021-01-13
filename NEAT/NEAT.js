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
      x.fitness = fitness(x, X, Y)
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
    for(const specie of this.species){
      specie.specimens.sort((a,b)=>b.fitness-a.fitness)
      if(specie.specimens.length>3){
        let newLen = Math.ceil(specie.specimens.length*0.4)
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
        let mother =  random(specie.specimens)
        let father = random(specie.specimens)
        this.population.push(Genome.offSpring(mother, father))
      }
    }
  }

  step(fitness, X, Y) {
    if (fitness)
      this.summer(X, Y, fitness)
    this.autumn(0.5)
    this.winter()
    this.spring()

    this.summer(X, Y, fitness)
    this.population.sort((a, b) => b.fitness - a.fitness)
  }
}