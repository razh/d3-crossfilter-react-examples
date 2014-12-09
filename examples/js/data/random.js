/**
 * https://github.com/mikolalysenko/gauss-random
 */
export function randomGaussian() {
  return Math.sqrt( -2 * Math.log( Math.random() ) ) * Math.cos( 2 * Math.PI * Math.random() );
}
