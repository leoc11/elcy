import { MockConnection } from "../src/Mock/MockConnection";
import { IQuery } from "../src/Query/IQuery";
const oldQ = MockConnection.prototype.query;
MockConnection.prototype.query = function (...commands: IQuery[]) {
    console.log(JSON.stringify(commands));
    return oldQ.apply(this, commands);
};
