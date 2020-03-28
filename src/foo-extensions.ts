import {IFoo} from './foo';

// Nice to place the symbol close to the implementation for Go To IDE functionality
export const fooExtension = Symbol('fooExtension');
function someMethodImpl(this: IFoo, n:number) {
    console.log('I am a Foo:', this, '...and here is a number', n);
}

declare module './foo' {
    export interface IFoo {
        [fooExtension]:typeof someMethodImpl;
    }
}
(Object.prototype as IFoo)[fooExtension] = someMethodImpl;



