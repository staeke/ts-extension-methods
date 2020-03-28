import { IFoo } from './foo';
import { addDays, add } from './date-extensions';
import { fooExtension } from './foo-extensions';

let foo = { bar: 'test' } as IFoo;
foo[fooExtension](123);

const d = new Date();
const weekLater = d[addDays](7);
console.log('A week from now is', weekLater);
