import { Client, GatewayIntentBits } from 'discord.js';
import config from './config.json' assert { type: "json" };
import fetch from 'node-fetch';

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
    const channel = client.channels.cache.find(channel => channel.name === config.channel);

    setInterval(async () => {
        const response = await fetch('');
        
        channel.send('Test!');
    }, 5000);
});

// Login to Discord with your client's token
client.login(config.token);
