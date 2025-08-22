const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const messageStore = [];

function storeMessage(msg) {
  messageStore.push({
    id: msg.id,
    content: msg.content,
    channelId: msg.channelId,
    guildId: msg.guildId,
  });
}

function searchMessages(word, limit) {
  return messageStore.filter(
    (msg) =>
      msg.content.toLowerCase().includes(word.toLowerCase()) &&
      msg.content.length >= limit
  );
}
const commands = [
  new SlashCommandBuilder()
    .setName("search")
    .setDescription("Find messages with a keyword and minimum length")
    .addStringOption((option) =>
      option.setName("word").setDescription("Search keyword").setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("Minimum word length")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("Slash commands registered ✅");
  } catch (err) {
    console.error(err);
  }
})();

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (!message.author.bot && message.content) {
    storeMessage(message);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "search") {
    const word = interaction.options.getString("word");
    const limit = interaction.options.getInteger("limit");

    const results = searchMessages(word, limit);

    if (results.length === 0) {
      await interaction.reply(
        `No messages found with "${word}" and limit >= ${limit}.`
      );
    } else {
      let reply = `🔎 Searching for keyword: **${word}** with limit: **${limit}**\n\n`;

      results.slice(0, 10).forEach((msg) => {
        const msgLink = `https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`;
        messageId = msg.id;
        reply += `📌 [Message Link](${msgLink}) — \`${msg.content}\`\n`;
      });

      await interaction.reply(reply);
    }
  }
});

client.login(process.env.BOT_TOKEN);

