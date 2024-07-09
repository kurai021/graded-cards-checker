const fetch = require("node-fetch");
// puppeteer-extra is a drop-in replacement for puppeteer, 
// it augments the installed puppeteer with plugin functionality 
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques) 
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

//Query to know the ID in alt.xyZ
async function queryCert(certNumber) {
	const certQuery = `
    query Cert($certNumber: String!) {
      cert(certNumber: $certNumber) {
        asset {
			id
			__typename
		}
      }
    }
  `;

	const response = await fetch('https://alt-platform-server.production.internal.onlyalt.com/graphql/Cert', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: certQuery,
			variables: {
				certNumber: certNumber
			}
		})
	});

	const responseData = await response.json();
	return responseData.data.cert.asset.id;
}

//Query to fetch the card details
async function queryAssetDetails(id, gradeNumber, gradingCompany) {
	const assetQuery = `
    query AssetDetails($id: ID!, $tsFilter: TimeSeriesFilter!) {
      asset(id: $id) {
        ...AssetDetails
        ...AssetActiveListings
        __typename
      }
    }
    fragment AssetDetails on Asset {
      ...AssetBase
      images {
        ...ImageBase
        __typename
      }
      attributes {
        cardNumber
        printRun
        __typename
      }
      predictedPrice(tsFilter: $tsFilter)
      altValueInfo(tsFilter: $tsFilter) {
        currentAltValue
        confidenceData {
          currentConfidenceMetric
          currentErrorLowerBound
          currentErrorUpperBound
          __typename
        }
        __typename
      }
      cardPops {
        ...CardPopBase
        __typename
      }
      __typename
    }
    fragment AssetBase on Asset {
      id
      name
      year
      subject
      category
      brand
      variety
      attributes {
        cardNumber
        printRun
        __typename
      }
      __typename
    }
    fragment ImageBase on Image {
      position
      url
      __typename
    }
    fragment CardPopBase on CardPop {
      gradingCompany
      gradeNumber
      count
      __typename
    }
    fragment AssetActiveListings on Asset {
      activeListings {
        ...PublicListingBase
        __typename
      }
      __typename
    }
    fragment PublicListingBase on PublicListing {
      id
      minOfferPrice
      listPrice
      state
      createdAt
      type
      expiresAt
      isEligibleForBidding
      depositsWaived
      disallowOffers
      subtitle
      requireIdVerification
      listingPaymentState {
        state
        __typename
      }
      ...PublicListingLiveDetails
      __typename
    }
    fragment PublicListingLiveDetails on PublicListing {
      id
      __typename
    }
  `;

	const response = await fetch(`https://alt-platform-server.production.internal.onlyalt.com/graphql/AssetDetails?id=${id}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: assetQuery,
			variables: {
				id: id,
				tsFilter: {
					gradeNumber: gradeNumber,
					gradingCompany: gradingCompany
				}
			}
		})
	});

	const responseData = await response.json();
	return responseData.data.asset;
}

async function getNFTImage(id) {

	const browser = await puppeteer.launch()
	const page = await browser.newPage()


	const url = `https://api-mainnet.magiceden.io/idxv2/getAllNftsByCollectionSymbol?collectionSymbol=collector_crypt&onChainCollectionAddress=CCryptWBYktukHDQ2vHGtVcmtjXxYzvw8XNVY64YN2Yf&direction=2&field=1&limit=100&attributes=[%7B%22attributes%22:[%7B%22traitType%22:%22Grading%20ID%22,%22value%22:%22${id}%22%7D]%7D]&token22StandardFilter=1&mplCoreStandardFilter=1&agg=3&compressionMode=both`;

	try {
		await page.goto(url, { waitUntil: 'domcontentloaded' });

		// Esperar a que aparezca la etiqueta <pre> con el JSON
		await page.waitForSelector('pre');

		// Obtener el contenido JSON dentro de <pre>
		const jsonContent = await page.evaluate(() => {
			const preElement = document.querySelector('pre');
			return preElement.textContent.trim();
		});

		// Parsear el JSON
		const data = JSON.parse(jsonContent);

		// Obtener la URL de la imagen (img)
		const imageUrl = data.results[0].img;

		// Cerrar navegador después de obtener los datos
		await browser.close();

		return imageUrl;

	} catch (error) {
		await browser.close();

		return null;
	}
}

async function queryMarketTransactions(id, gradeNumber, gradingCompany) {
	const assetQuery = `
    query AssetMarketTransactions($id: ID!, $marketTransactionFilter: MarketTransactionFilter!) {
      asset(id: $id) {
        ...AssetMarketTransactions
        __typename
      }
    }
    fragment AssetMarketTransactions on Asset {
      id
      marketTransactions(marketTransactionFilter: $marketTransactionFilter) {
        ...MarketTransactionBase
        __typename
      }
      __typename
    }
    fragment MarketTransactionBase on MarketTransaction {
      id
      date
      auctionHouse
      auctionType
      price
      attributes {
        ...MarketTransactionAttributesBase
        __typename
      }
      subjectToChange
      consolidatedSkippedReason
      __typename
    }
    fragment MarketTransactionAttributesBase on MarketTransactionAttributes {
      gradeNumber
      gradingCompany
      url
      autograph
      __typename
    }
  `;

	const response = await fetch('https://alt-platform-server.production.internal.onlyalt.com/graphql/AssetMarketTransactions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: assetQuery,
			variables: {
				id: id,
				marketTransactionFilter: {
					gradeNumber: gradeNumber,
					gradingCompany: gradingCompany
				}
			}
		})
	});

	const responseData = await response.json();
	return responseData.data.asset;
}

// Put them together
async function getPrice(certNumber, gradingCompany, gradeNumber, interaction, EmbedBuilder) {
	const cert = certNumber;
	const number = gradeNumber;
	const company = gradingCompany;

	try {

		const certId = await queryCert(cert);

		const assetDetails = await queryAssetDetails(certId, number, company);

		const markets = await queryMarketTransactions(certId, number, company)

		const cardImage = await getNFTImage(certNumber)

		const predictedPrice = assetDetails.predictedPrice
		const roundedPrice = predictedPrice.toFixed(2)

		const embed = new EmbedBuilder()
			.setColor(0x0099ff)
			.setTitle(`${assetDetails.name}`)
			.setImage(`${cardImage}`)
			.setDescription(`${assetDetails.brand}`)
			.addFields({ name: "Card Number", value: `${assetDetails.attributes.cardNumber}` })
			.addFields({ name: "Price", value: `${roundedPrice}` })
			.addFields({ name: `Latest Market Transaction (${markets.marketTransactions[0].auctionHouse}) - ${markets.marketTransactions[0].date}`, value: `${markets.marketTransactions[0].price}` })

		await interaction.channel.send({ embeds: [embed] })
	} catch (error) {
		console.error('Error fetching card data:', error);
		await interaction.reply('There was an error fetching the card data. Please try again later.');
	}
};

module.exports = {
	getPrice: getPrice,
}