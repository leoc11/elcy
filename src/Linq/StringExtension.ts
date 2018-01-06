import "./EnumerableExtension";
declare global {
    // tslint:disable-next-line:interface-name
    interface String {
        like(pattern: string): void;
    }
}

String.prototype.like = function(this: string, pattern: string) {
    const regex = new RegExp("^" + pattern.replace(/([\^\\//$.+\(\)\{\}])/ig, "[\$1]").replace(/\[!/ig, "[^").replace(/[_]/ig, ".").replace(/[%]/ig, ".*") + "$");
    return regex.test(this);
};
