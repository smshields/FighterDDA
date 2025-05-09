Constants = require('./Constants');

// Random Number Generator with a seed (for reproducibility)
class RNG {


    
    static seed = Constants.RNG_SEED;
    static state = Constants.RNG_SEED;
    

    static next() {
        // Simple linear congruential generator (LCG) for randomness
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;
        this.state = (a * this.state + c) % m;
        return this.state / m;
    }

    static next10Power(power) {
        return (Math.pow(10, power)) * this.next();
    }

    static positiveNegativeRandom(){
        if(this.next() > .5){
            return 1;
        } else {
            return -1;
        }
    }
}

module.exports = RNG;
