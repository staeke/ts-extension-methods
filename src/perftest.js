// Big has 1000 members in its prototype
function Big() {}
let symBig;
for(let i = 0; i < 1000; i++) {
    const s = Symbol('small')
    if (i === 500)
        symBig = s;
    Big.prototype[s] = function() {return 0;}
}

// Small just has one member in its prototype
function Small() {}
const symSmall = Symbol('big');
Small.prototype[symSmall] = function() {return 0;};

// Access a member function 1M times (also some math overhead and looping)
const NO_TIMES = 10000000;

function testSmallInner(obj) {
    let a = 0;
    for (let i = 0; i < NO_TIMES; i++) {
        a = a + obj[symSmall]();
    }
}

function testSmall(obj) {
    console.time('Small');
    testSmallInner(obj);
    console.timeEnd('Small');
}

function testBigInner(obj) {
    let a = 0;
    for (let i = 0; i < NO_TIMES; i++) {
        a = a + obj[symBig]();
    }
}

function testBig(obj) {
    console.time('Big');
    testBigInner(obj);
    console.timeEnd('Big');
}

// testSmall();
// testBig();

// Wait for any code optimization to finish
// setTimeout(() => {
testSmallInner(new Small());
testBigInner(new Big());
testSmallInner(new Small());
testBigInner(new Big());

const big = new Big();
const small = new Small();

console.log('TurboFan:');
testSmall(small);
testBig(big);

// see https://blog.logrocket.com/how-javascript-works-optimizing-the-v8-compiler-for-efficiency/
const TURBO_FAN_LIMIT = 4;
for (let i = 0; i < TURBO_FAN_LIMIT; i++) {
    big['x' + i] = 0;
    small['x' + i] = 0;
    testSmallInner(small);
    testBigInner(big);
}

console.log('\nIgnition:');
testSmall(small);
testBig(big);

