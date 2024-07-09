const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const altFetcher = require('../helpers/alt-fetcher');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getprice')
		.setDescription('Find price in alt.xyz')
		.addStringOption(option =>
			option.setName('certnumber')
				.setDescription('Certification number')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('gradingcompany')
				.setDescription('Grading company')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('gradenumber')
				.setDescription('Grade number')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();

		const certNumber = interaction.options.getString('certnumber');
		const gradingCompany = interaction.options.getString('gradingcompany');
		let gradeNumber = interaction.options.getString('gradenumber');

		// Convert gradeNumber to the correct format if necessary
		if (!gradeNumber.includes('.')) {
			gradeNumber = `${gradeNumber}.0`;
		}

		await altFetcher.getPrice(certNumber, gradingCompany, gradeNumber, interaction, EmbedBuilder);
		await interaction.deleteReply();
	},
};
