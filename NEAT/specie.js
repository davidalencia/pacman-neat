/**
 * Almacena y compara especimenes para formar una especie
 */
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
        let specimen = random(this.specimens)
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