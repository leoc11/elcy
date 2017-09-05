import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

const a = new ExpressionBuilder();

const result = a.Parse("compare1 ? compare2 ? true2 : false2 : compare3 ? true3 : false3");
// tslint:disable-next-line:no-console
console.log(result);
