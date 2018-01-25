"use strict";
import { MyDb } from "./test/Common/MyDb";

// import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

// const expressionBuilder = new ExpressionBuilder();
// const result = expressionBuilder.Parse('{Prop1: 123, Prop2: "345", Prop3: "1" + 2 + 3}');
// // tslint:disable-next-line:no-console
// console.log(result);

const db = new MyDb({});
const result = db.orders.toString();
// tslint:disable-next-line:no-console
console.log(result);

const a = [1, 2, 3, 4, 5, 6, 7, 8];
const a2 = [9, 10];
const b = a.fullJoin(a2, (o) => o % 4 === 0, (o) => o % 4 === 0, (o, o2) => ({ a: o, b: o2 }));
for (const c of b)
    console.log(c);
