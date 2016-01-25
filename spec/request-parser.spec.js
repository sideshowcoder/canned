var RequestParser = require('../lib/request-parser');

describe("request parser", function() {
  var parser;

  beforeEach(function() {
    parser = new RequestParser();
  })

  it("does something useful", function(done) {
    var fake_content = '//! body: {"frog_count": 200}';
    res = parser.parse(fake_content);
    expect(res).toEqual({
      frog_count: 200
    });
    done();
  })

  it("returns an empty object if there are no params", function(done) {
    var fake_file_content = '//! statusCode: 418\n' +
                            '//! customHeaders: {"Authorization": "13r098asflj"}\n' +
                            '//! customHeaders: {"Location": "https://example.com"}';

    res = parser.parseEntry(fake_file_content);
    expect(res).toEqual({});
    done();
  })

   it("Should accept request body", function(done) {
    var mock_text = '//! statusCode: 418\n' +
                    '//! customHeaders: {"Authorization": "Bearer xyz"}\n' +
                    '//! customHeaders: {"Location": "Wimbledon Common"}\n' +
                    '//! body: {"colour": "green"}';
    var parsedMeta = parser.parseEntry(mock_text);

    expect(parsedMeta).toEqual({
      colour: "green"
    });
    done();
  })
})
