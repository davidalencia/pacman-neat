function rand(arr) {
  let i = Math.floor(arr.length*Math.random())
  return arr[i]
}

function randGaussian(mu, sigma) {
  const x = Math.random()
  let left = 1/Math.sqrt(2*Math.PI*(sigma**2))
  const right = Math.exp((x-mu)**2/(-2*(sigma**2)))
  return left*right
}

module.exports = {rand, randGaussian}