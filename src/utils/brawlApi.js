// utils/brawlApi.js
const fetch = require('node-fetch');
const BRAWL_TOKEN = process.env.BRAWL_TOKEN;

async function getPlayer(tag) {
  const encoded = encodeURIComponent(tag); // converts # to %23
  const res = await fetch(`https://api.brawlstars.com/v1/players/${encoded}`, {
    headers: {
      Authorization: `Bearer ${BRAWL_TOKEN}`,
      Accept: 'application/json'
    }
  });

  if (res.status === 404) throw new Error('Player not found');
  if (res.status === 429) throw new Error('Rate limit exceeded');
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data;
}

module.exports = { getPlayer };
