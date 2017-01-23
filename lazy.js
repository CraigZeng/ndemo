

function Sequence () {

}


Sequence.prototype.map = function (fn) {
    var seq = new Sequence();
    seq.parent = this;
    seq.get = function (i) {
        return fn(seq.parent.get(i));
    };
    return seq;
};

Sequence.prototype.filter = function (fn) {
    var seq = new Sequence();
    var arr = [];
    var prev = 0;
    seq.parent = this;
    seq.get = function (i) {
        if (i < arr.length) {
            return arr[i];
        } else {
            var tmp;
            while(arr.length <= i && (tmp =seq.parent.get(prev++))) {
                if(fn(tmp)) {
                    arr.push(tmp);
                }
            }
            return arr[i];
        }
    };
    return seq;
};

Sequence.prototype.take = function (n) {
    var seq = new Sequence();
    var count = 0;
    seq.parent = this;
    seq.get = function (i) {
        return count++ < n ? seq.parent.get(i) : undefined;
    };
    return seq;
};

Sequence.prototype.each = function (fn) {
    var i = 0, tmp;
    while(tmp = this.get(i++)) {
        fn(tmp);
    }
};

Sequence.prototype.get = function (n) {
    return this.parent ? this.parent.get(n) : this.source[n];
};

function Lazy(source) {
    var seq = new Sequence();
    seq.source = source;
    return seq;
}



(function test() {
    Lazy([1,2,3,4,5,6,7,8,9])
        .filter(i => i > 5)
        .map(i => i * 2)
        .filter(i => i < 15)
        .take(3)
        .each(i => console.log(i))    
})()

