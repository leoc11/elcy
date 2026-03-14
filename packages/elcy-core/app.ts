
import "./src/Startup";

import * as chai from "chai";
import * as chaiPromise from "chai-as-promised";
import "mocha";
import * as sinonChai from "sinon-chai";
import { DefaultResultCacheManager } from "./src/Cache/DefaultResultCacheManager";
import { GenericType, ValueType } from "./src/Common/Type";
import { Uuid } from "./src/Data/Uuid";
import { Timer } from "./src/Logger/Timer";
import { mockContext } from "./test/Mock/MockContext";
import { AutoDetail, AutoParent, Order, OrderDetail, OrderDetailProperty } from "./test/Common/Model";
import { AutoDetailDesc } from "./test/Common/Model/AutoDetailDesc";
import { MyDb } from "./test/Common/MyDb";

chai.use(sinonChai);
chai.use(chaiPromise);

const db = new MyDb();
// const db = new SchemaContext();
mockContext(db);

type KeysExceptType<T, TProp> = { [P in keyof T]: T[P] extends TProp ? never : P }[keyof T];

const getRelationData2 = <M, S, SKey extends KeysExceptType<S, ValueType>>(asd: GenericType<M>, source: S, relationProperty: SKey, r: S[SKey]) => r;
(async () => {
  try {
    const order = new Order({ OrderId: Uuid.new(), TotalAmount: 10000 });
    const order2 = new Order({ OrderId: Uuid.new(), TotalAmount: 10000 });
    const orderDetail = new OrderDetail({ OrderId: order.OrderId, OrderDetailId: Uuid.new(), name: "test1" });
    const orderDetail2 = new OrderDetail({ OrderId: order.OrderId, OrderDetailId: Uuid.new(), name: "test2" });
    const orderDetail3 = new OrderDetail({ OrderId: order2.OrderId, OrderDetailId: Uuid.new(), name: "test3" });
    db.attach(order);
    db.attach(order2);
    db.attach(orderDetail);
    db.attach(orderDetail2);
    db.attach(orderDetail3);

    // delete
    db.delete(orderDetail);
    // update
    order.TotalAmount = 20000;
    // insert
    db.orderDetails.new({ OrderDetailId: Uuid.new(), OrderId: order.OrderId, name: "test2", quantity: 1 });
    // delete relation
    db.relationDelete(order, "OrderDetails", orderDetail2);
    // change relation (delete, add)
    orderDetail3.Order = order;

    const effected = await db.saveChanges();

    const a = 2;
  }
  catch (e) {
    console.log(e.message);
  }
})();

// (async () => {
//   try {
//     const a = new ExplicitAsyncEnumerable<number>();
//     let i = 0;
//     const st = setInterval(function () {
//       a.push(++i);
//       if (i === 5) {
//         a.done();
//         clearInterval(st);
//       }
//     }, 1000);

//     for await (const d of a) {
//       console.log(d);
//       if (d === 1)
//         await new Promise((res) => {
//           setTimeout(res, 2000);
//         });
//     }

//     for await (const d of a) {
//       console.log(d);
//     }
//     const f = 1;
//   }
//   catch (e) {
//     console.log(e.message);
//   }
// })();
