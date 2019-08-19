const loopParse = (json, iterations) => {
  try {
    return JSON.parse(json);
  } catch (e) {
    let column = 0;
    let m = e.message.match(/position (\d+) ?/);
    if (m) {
      column = Number(m[1]);
    } else {
      m = e.message.match(/column (\d+) ?/);
      column = Number(m[1]) - 1;
    }
    const left = json.substring(0, column).replace(/,$/, '');
    const right = json.substring(column + 1);
    if (iterations <= 0) {
      return null;
    }
    return loopParse(left + right, iterations - 1);
  }
};

module.exports.parseJson = text => loopParse(text, text.length + 1);
