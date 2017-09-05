import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

const a = new ExpressionBuilder();

const result = a.Parse2("1 - 1 - 1");
// tslint:disable-next-line:no-console
console.log(result.ToString());
