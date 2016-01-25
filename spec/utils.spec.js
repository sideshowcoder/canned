var utils = require('../lib/utils');

describe('recursiveMerge', function() {
    it("adds properties to the target object", function(done) {
        var first = {},
            second = { "horses": "best of all the animals" };

        utils.recursiveMerge(first, second);

        expect(first).toEqual(second);

        done();
    })

    it("merges properties on the target object without clobbering", function(done) {
        var first = {"animals": {"frogs": "jump a lot"}},
            second = { "animals" : { "horses": "best of all the animals" } };

        utils.recursiveMerge(first, second);

        expect(first).toEqual({"animals": {"frogs": "jump a lot", "horses": "best of all the animals"}});

        done();
    })
})
