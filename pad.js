function pad ( num, size ) {
  return ( Math.pow( 10, size ) + ~~num ).toString().substring( 1 );
}

module.exports = pad;
