import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

const a = new ExpressionBuilder();

const result = a.Parse("1 - 1 - 1");
// tslint:disable-next-line:no-console
console.log(result);
