function setup(){
    g = new Genome(2, 1)
    g2 = new Genome(2, 1)
    off = Genome.offSpring(g, g2)
    console.log(off);
}
