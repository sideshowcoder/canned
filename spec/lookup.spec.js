"use strict";

var lookup = require('../lib/lookup')

describe('lookup', function () {
  it('should generate a list of paths in the correct order', function (done) {
    var testPath = '/api/2/customer/123/invoice/321/'
    var expectedPaths = [
      '/api/2/customer/123/invoice/321/',
      '/api/2/customer/123/invoice/any/',
      '/api/2/customer/any/invoice/321/',
      '/api/2/customer/any/invoice/any/',
      '/api/any/customer/123/invoice/321/',
      '/api/any/customer/123/invoice/any/',
      '/api/any/customer/any/invoice/321/',
      '/api/any/customer/any/invoice/any/'
    ]
    expect(lookup(testPath, 'any')).toEqual(expectedPaths)
    done()
  });
});
