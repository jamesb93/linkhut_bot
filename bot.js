const axios = require('axios');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.TG_KEY, { polling: true });

bot.onText(/(https?|ftp):\/\/[^\s/$.?#].[^\s]*/i, (msg, match) => {
	const id = msg.chat.id;
	const url = match[0];
	fetchWebsiteMetadata(url)
	.then(metadata => {
		if (metadata) {
			postToLinkhut(url, metadata.title, metadata.description);
		}
	});
})

function postToLinkhut(url, title, description) {
	const urlStr = `&url=${encodeURIComponent(url)}`
	const safeTitle = title ? title : 'placeholder title';
	const titleStr = `&description=${encodeURIComponent(safeTitle)}`

	const safeDesc = description ? description : 'placeholder description';
	const descStr = `&extended=${encodeURIComponent(safeDesc)}`;

	const api = "https://api.ln.ht/v1/posts/add?"

	const post = `${api}${urlStr}${titleStr}${descStr}&toread=yes`
	const headers = {
		'Authorization': `Bearer ${process.env.LH_KEY}`,
		'Content-Type': 'application/json',
	};

	axios.get(post, { headers })
	.then(response => {
		console.log(response.data);
	})
	.catch(error => {
		console.error('Error making GET request:', error);
	});
}

async function fetchWebsiteMetadata(url) {
	try {
	  const response = await axios.get(url);
	  const html = response.data;
	  const $ = cheerio.load(html);
  
	  const title = $('title').text().trim();
	  const description = $('meta[name="description"]').attr('content');
  
	  return { title, description };
	} catch (error) {
	  console.error('Error fetching website metadata:', error);
	  return null;
	}
  }