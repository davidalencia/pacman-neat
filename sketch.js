function setup(){
    g = new Genome(2, 1)
    g2 = new Genome(2, 1)
    off = Genome.offSpring(g, g2)
    console.log("..........................")
    off2 = Genome.offSpring(g, g2)
    console.log("..........................")

    console.log(off);
    console.log("..........................")

    console.log(Genome.offSpring(off, off2));
}
