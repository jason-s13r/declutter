const fetch = require('node-fetch');

const TELEGRAPH_URL = 'https://api.telegra.ph/';

const post = async (url, body) => {
  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
};

module.exports.createAccount = async ({ author_name, author_url, short_name }) => {
  const request = await post(`${TELEGRAPH_URL}/createAccount`, {
    author_name,
    author_url,
    short_name: short_name.substring(0, 31)
  });
  const body = await request.json();
  return body.result;
};

module.exports.createPage = async (title, content, { author_name, author_url, access_token }) => {
  const request = await post(`${TELEGRAPH_URL}/createPage`, {
    access_token,
    author_name,
    author_url,
    content,
    title,
    return_content: false
  });
  const body = await request.json();
  return body.result;
};
