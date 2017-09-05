var _this = this;
var basic = (function () {
    var eqexp = function (param1, operator, param2) {
        if (operator == "==") {
            return param1 == param2;
        }
        else if (operator == ".") {
            return param1[param2];
        }
    };
    var eqexp2 = function (param1, operator, param2) {
        var result = "";
        if (operator == "==") {
            result = param1 + "=" + param2;
        }
        else if (operator == ".") {
            result = param1 + "." + param2;
        }
        return "(" + result + ")";
    };
    var source = [];
    _this.source = function (array) {
        source = array;
    };
    var getParamName = function (fn, index) {
        var fnString = fn.toString();
        var regexp = new RegExp("[ ]*(function[ ]*)?[(]?([a-z][a-z0-9, \s]*)", "i");
        var result = fnString.match(regexp);
        result = result[2].split(",");
        var params = [];
        for (var i = 0; i < index && i < result.length; i++) {
            params.push(result[i].trim());
        }
        return params;
    };
    var getFunctionBody = function (fn) {
        var fnString = fn.toString();
        return fnString.substring(fnString.indexOf('{') + 1, fnString.lastIndexOf("}") - 1);
    };
    var getNewFunction = function (fn, keepParam, addParams) {
        var params = getParamName(fn, keepParam);
        var completeArguments = [];
        for (var paramname in addParams) {
            params.push(paramname);
            completeArguments.push(addParams[paramname]);
        }
        var body = getFunctionBody(fn);
        var fn1 = eval("((" + params.join(",") + ") => {" + body + "})");
        return function () {
            var args = [];
            for (var i = 0; i < keepParam; i++) {
                if (arguments.length > i)
                    args.push(arguments[i]);
                else
                    args.push(undefined);
            }
            args = args.concat(completeArguments);
            return fn1.apply(this, args);
        };
    };
    _this.where = function (fn, scope) {
        scope.eq = eqexp;
        var fn1 = getNewFunction(fn, 1, scope);
        var result = [];
        source.forEach(function (item) {
            if (fn1(item))
                result.push(item);
        });
        return result;
    };
    _this.where1 = function (fn, scope) {
        scope.eq = eqexp2;
        var fn1 = getNewFunction(fn, 1, scope);
        return fn1("TBL1");
    };
    return _this;
})();
var button = document.createElement('button');
button.textContent = "Say Hello";
button.onclick = function () {
    var a = "1";
    basic.source([{ Name: "1" }, { Name: "2" }]);
    var result = basic.where1(function (o, eq, a) { return eq(eq(o, ".", "Name"), "==", a); }, { a: a });
    console.log(result);
    alert(result);
};
document.body.appendChild(button);
function parse(fnBody) {
    var blocks = [
        { Start: "(", End: ")", AllowInsideBlock: true },
        { Start: "\"", End: "\"", AllowInsideBlock: false },
        { Start: "'", End: "'", AllowInsideBlock: false },
        "&&",
        "||"
    ];
    var result = [];
    var currentBLock = "";
    var endBlocks = "";
    for (var i = 0; i < fnBody.length; i++) {
        var char = fnBody[i];
        if (char == "(") {
        }
    }
}
// example expected usage
// will use proxy object like in where preparation.
IQueryable < Order > asd;
OrderDatabase.Orders.Select(
// select all property
function (o) { return o; }, 
// select included property
function (o) { return o.OrderId; }, function (o) { return o.CreatedDate; }, function (o) { return o.CreatedBy; }, 
// include
function (o) { return o.OrderDetails; }, function (o) { return o.Customer; }, 
// include OrderDetails.Product.ProductType and filter and sort
function (o) { return o.OrderDetails.Select(function (od) { return od.Product.ProductType; })
    .Where(function (od) { return od.Quantity >= 20; })
    .SortBy(function (od) { return od.Amount; }); }).Where(function (o) { return o.Amount > 10; }).Finalize();
(_a = (_b = (_c = Enumerable([])).Select.apply(_c, )).Where.apply(_b, )).OrderBy.apply(_a, .).Skip(10).Take(10)
    .First()
    .Last()
    .Sum(),
        .Avg(),
        .Count(),
        .GroupBy()
        .OrderBy()
        .Finalize();
var _a, _b, _c;
// to be consider
// .SelectObj<ObjectType>((<T>(source: T): any)): ObjectType
// .SelectMany<OT>((<T>(source: T): IQueryable<OT>)) : IQueryable<OT>
/// GetAll().Products.With("Name", "Id", "Price", "Orders.").Having("Name").Equal.to.("123")
//    .and.Having("Price").Over(23).End(); 
//# sourceMappingURL=test.js.map