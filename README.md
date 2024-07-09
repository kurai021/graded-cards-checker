# How to configure

Before starting it is assumed that you have basic knowledge of Node.js. You should also consider that Yarn is used to install the dependencies, you can find a tutorial on how to install it on its [official website](https://yarnpkg.com/getting-started/install)

## Environment Variables

You must configure the following environment variables: `BOT_TOKEN`, `CLIENTID`, `CHANNEL`

-   `BOT_TOKEN` is your Discord Developer Portal bot token, (see: [https://discord.com/developers/docs/getting-started](https://discord.com/developers/docs/getting-started) for more details)

-   `CLIENTID` Whem you register your bot you will receive a client ID and a client secret

-   `CHANNEL` is the channel name in your server where the bot will be available.

## Deploy server

Before running your bot, you should deploy the command as is showed in this guide: [https://discordjs.guide/creating-your-bot/command-deployment.html#guild-commands](https://discordjs.guide/creating-your-bot/command-deployment.html#guild-commands), this is easy with:

```bash
	yarn run deploy
```

## Run your server

To run your server, use the following command:

```bash
	yarn start
```

That's all! Now your bot should be configured and ready to go.
