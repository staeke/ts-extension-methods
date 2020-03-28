export const add = Symbol('add');
function addImpl(this: Date, dateOrMs: number | Date) {
    return new Date(+this + +dateOrMs);
}

export const addDays = Symbol('addDays');
function addDaysImpl(this: Date, days: number) {
    return this[add](days * 24 * 60 * 60 * 1000);
}

declare global {
    export interface Date {
        [add]: typeof addImpl;
        [addDays]: typeof addDaysImpl;
    }
}

Date.prototype[add] = addImpl;
Date.prototype[addDays] = addDaysImpl;
