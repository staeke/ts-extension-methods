## Typescript Extension Methods

Good news! Typescript/Javascript already has extension methods. And they work well with latest version of TS and your editor. Take a look at [./src/index.ts](./src/index.ts) on how to do.

**NOTE THOUGH**: It's probably wise to include all extensions upfront, rather than through dynamic `import`s, at least for interface extensions, since otherwise you'd be modifying already used prototypes, thereby likely invalidating optimizations done by JIT compilers for Javascript (TurboFan, IonMonkey).

### Some more background

There's been a lot of talk about Typescript Extension methods in many places. Primarily at https://github.com/microsoft/TypeScript/issues/9, but lots of other places too.

The TL;DR of that thread is something like (my summary):

1. Community: Extension methods are nice/a must. Let's get them. We want to do `myFoo.myExtension()`
1. Ryan Cavanaugh: Ok, but should they be based on actual extensions of existing prototypes (`Foo.prototype.myExtension`) or some kind of callsite rewriting (like `myExtension(myFoo)`)? (https://github.com/microsoft/TypeScript/issues/9#issuecomment-52329918)
1. Community: Callsite rewriting, cause namespace pollution sucks!
1. Ryan Cavanaugh: Ok, but callsite rewriting is really hard and has very weird behavior in the context under which Typescript needs to operate (see e.g. https://github.com/microsoft/TypeScript/issues/9#issuecomment-74302592 and https://github.com/microsoft/TypeScript/issues/9#issuecomment-263978824). Like, we just won't do this.
1. Community: Oh shit...but...how about X? 
1. Ryan Cavanaugh: I don't see how X solves the problems. Or it's too big of a change to Typescript without TC39 sync. 
1. goto 5
1. [eventually] Thread locked


### Maybe a Typescript language service plugin?

Now, personally I think the most important thing extension methods bring is **discovery**. I can type a `.` after a variable and see a list of suggestions (auto-complete). And, that list can be expanded with new methods. This is powerful. Of course we can already write functions that accomplish essentially the same by simply passing free functions and pass arguments to them, but the discovery is harder. And the code is less beautiful. So I created this suggestion https://github.com/microsoft/TypeScript/issues/35280, but Ryan Cavanaugh thought the perf budget for such a dev support would be too high. So I set up to create a plugin myself. Only to realize that...

### We actually already have extension methods

Remember bullet 3. above. We just ditched prototype extension, the natural Javascript way of extending objects. With the risk of missing some arguments, I think the cons amount to:

  1. namespace pollution (e.g. inheritance collision)
  1. possible performance implications?

But, `symbol`s are meant to deal with problem 1. So to see if that worked, I created this repo just as a proof of concept. Extensions to classes extend their respective prototypes, but not with `string`s, but `symbol`s. Thus there can be no collision. There is actually also an even simpler solution, where you can index these prototypes directly with the function, but that's not compatible with current Typescript, which requires indexed properties to be of `number`/`string`/`symbol`. If that allowed function too it would work fine. So something like

```ts
// myExtension.ts
export function myExtension(this: Foo) { ... }
Foo.prototype[myExtension] = myExtension;

// foo.ts
import { myExtension } from './myExtension'
...
foo[myExtension]();
```

Extensions to interfaces extend `Object` (yes `Object`, read on...).

### What about performance?

  Extending `Object` may sound weird. We could end up with 1000 methods or more on `Object.prototype`. I created a performance test [./src/perftest.js](./src/perftest.js), to examine the performance difference between a prototype with 1000 methods (indexed by `symbol`) vs just one. If we allow for warmup there is no statistical difference. neither in V8 (Safari/Chrome/Node) nor SpiderMonkey (Firefox). Focusing on V8, that applies to TurboFan (the optimized compiler), but not to Ignition (the bytecode interpreter) where the big prototype is 8-13% slower on my machine. I argue this is negligable still, since any hot (reasonably coded code path) would run in TurboFan, and extension method access for interfaces is very likely not a significant part of a typicaly CPU consumption. 
  
  Furthermore, extensions allow for working with just interfaces and plain objects (from JSON deserialization), without converting to custom model classes. This skips an extra conversion step, likely gaining performance.

### Other things to note

- These extensions are perfectly visible on `.` style auto-complete via Typescript's Language Service. But, they currently require typescript@next (probably until 3.9) - they work partially well with prior versions.
- There's no "magic Typescript" involved. The fundamentals are perfectly valid Javascript.
- The extension methods are NOT visible in e.g. Chrome's or Node's auto-complete. This makes sense as the REPL has no universal way of reaching the symbol required to access the member. However, they are there if you list keys of the prototype
- If console/REPL access is a desire, it would be possible to, during development, provide some kind of global utility as another prototype on `Object` like `ext`. This could return a `Proxy` that could scan all the symbols available through the prototype chain and provide non-symbol style accessors for everything that doesn't collide. Thus you could type something like `Date.ext.isLeapYear()`, rather than `Date[isLeapYear]()` in the REPL. Exercise left to the reader. 
