const webshot = require('webshot-node');
const fs = require('fs');

var options = {
  shotSize: {
    width: 'all',
    height: 'all'
  },
  captureSelector:
    '#controlLayer'
};

const screenshotPath = './screenshots/webpage.png';

async function takeScreenshot(f){
  console.log("Attempting to screenshot...")
  webshot('https://foxholestats.com/', screenshotPath, options, function(err){
    if(!err){
      console.log("Succesfully taken a screenshot")
      f()
      return Promise.resolve();
    }
    else{
      console.log("There was an error taking a screenshot");
      return Promise.reject("Unable to take screenshot");
    }
  });
};

const Discord = require('discord.js');
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
  retryLimit: 2
});

require("dotenv").config();
const token = process.env.TOKEN;

console.log(token);

const prefix = '.';

channelID = '';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setActivity(`${prefix}help`, {type: 'LISTENING'});

  fs.readFile('./data/imageChannel.txt', {encoding: 'utf8', flag: 'r'}, (err, data) => {
    if(!err){
      console.log(`data:${data};`);
      channelID = data;

      console.log(`ChanID:${channelID};`);

      setInterval(() => {
        update(client.channels.cache.get(channelID));
      }, 1800000);
    }
    else{
      console.log('There was an error while reading the file.')
    }
  });
});

async function update(chan){
  //chan.send("Loading Image...");
  try{
    await takeScreenshot(() => {
      try{
        const promise = fs.promises.readFile(screenshotPath);
        Promise.resolve(promise).then(function(buffer){
          chan.send({files: [{attachment: buffer}]});
        }).catch(err => {console.log(err)});
      }
      catch(err){
        console.log("The image took too long to upload. Please try again.");
        chan.send("The image took too long to upload. Please try again.");
      }
    });
  }
  catch(err){
    console.log("There was an error in uploading the image. Please try again.");
    chan.send("There was an error in uploading the image. Please try again.");
  }
};

async function bind(chanID){
  channelID = chanID;
  fs.writeFileSync('./data/imageChannel.txt', channelID);
};

client.on('messageCreate', async msg => {
  var lower = msg.content.toLowerCase();
  if(lower.startsWith(prefix)){
    var sub = lower.substring(prefix.length)

    if(sub.startsWith('status')){
      msg.channel.send("This bot is online!");
    }
    else if(sub.startsWith('update')){
      update(msg.channel);
    }
    else if(sub.startsWith('restart')){
        msg.channel.send("Restarting...");
        setTimeout(process.exit, 1000);
    }
    else if(sub.startsWith('ping')){
      msg.channel.send(`Latency: ${client.ws.ping} ms`);
    }
    else if(sub.startsWith('bind')){
      var bindStr = sub.split("bind").pop().substring(1);
      //console.log(bindStr);
      if(bindStr === ''){
        msg.channel.send(`Incorrent usage of command. Proper usage: ${prefix}bind <Channel ID | 'here'>`)
      }
      else{
        var chan;
        if(bindStr !== 'here'){
          chan = client.channels.cache.get(bindStr).id;
        }
        else{
          chan = msg.channelId;
        }
        if(typeof chan !== 'undefined' && chan){
          bind(chan);
          msg.channel.send(`Bound to #${client.channels.cache.get(chan).name}, ID: ${chan}`);
        }
        else{
          msg.channel.send(`Incorrent usage of command. Proper usage: ${prefix}bind <Channel ID | 'here'>`)
        }
      }
    }
    else if(sub.startsWith('help')){
      const helpEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Help')
        .setDescription(`Command Prefix: ${prefix}`)
        .addField(prefix+'help', "Returns this help message", false)
        .addField(prefix+'status', "Returns whether this bot is online", false)
        .addField(prefix+'ping', "Returns the round-trip latency from the bot to Discord's servers", false)
        .addField(prefix+'restart', "Restarts the bot", false)
        .addField(prefix+"bind <Channel ID | 'here'>", "Binds the bot to send messages to the specified channel", false)
        .addField(prefix+'update', "Generates a new screenshot from https://foxholestats.com/ and uploads it here", false)
      ;

      msg.channel.send({embeds: [helpEmbed]});
    }
  }
});

client.login(token);
