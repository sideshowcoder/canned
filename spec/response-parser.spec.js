var ResponseParser = require('../lib/response-parser');

describe("response parser", function() {
  var parser;

  beforeEach(function() {
    parser = new ResponseParser();
  })

  it("does something useful", function(done) {
    var fake_content = "//! statusCode: 200";
    res = parser.parse(fake_content);
    expect(res).toEqual({
      statusCode: 200
    });
    done();
  })

  it("does something useful", function(done) {
    var fake_content = '//! customHeaders: {"Authorization": "13r098asflj"}';
    res = parser.parse(fake_content);
    expect(res).toEqual({
      customHeaders: {
        Authorization: "13r098asflj"
      }
    });
    done();
  })

  it("combines for ultimate badassery", function(done) {
    var fake_file_content = '//! statusCode: 418\n' +
                            '//! customHeaders: {"Authorization": "13r098asflj"}\n' +
                            '//! customHeaders: {"Location": "https://example.com"}';

    res = parser.parseEntry(fake_file_content);
    expect(res).toEqual({
      statusCode: 418,
      customHeaders: {
        Authorization: "13r098asflj",
        Location: "https://example.com"
      }
    });
    done();
  })

   it("Should accept request body", function(done) {
    var mock_text = '//! statusCode: 418\n' +
                    '//! customHeaders: {"Authorization": "Bearer xyz"}\n' +
                    '//! customHeaders: {"Location": "Wimbledon Common"}\n' +
                    '//! body: {"colour": "green"}';
    var parsedMeta = parser.parseEntry(mock_text);

    expect(parsedMeta).toEqual({
      statusCode: 418,
      customHeaders: {
        Authorization: 'Bearer xyz',
        Location: 'Wimbledon Common'
      }
    });
    done();
  })
})
