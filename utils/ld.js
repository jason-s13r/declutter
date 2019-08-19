const { parseJson } = require('./loop-parse');

const parse = text => {
  const input = text.replace(/[\r\n]/g, '');
  const schemaInput = input.replace(/[\ ]/g, '');
  const schema = parseJson(schemaInput);
  const json = parseJson(input);
  if (!json) {
    return schema;
  }
  if (!schema) {
    return json;
  }
  return {
    ...json,
    '@context': schema['@context'],
    '@type': schema['@type']
  };
};

module.exports.parse = parse;
module.exports.parseArray = textArray => textArray.map(parse);
