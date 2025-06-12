require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SHOPIFY_ADMIN_API_URL = `https://${process.env.EXPORT_FILES_SHOPIFY_SHOP}/admin/api/2025-04/graphql.json`;
const ACCESS_TOKEN = process.env.EXPORT_FILES_SHOPIFY_ACCESS_TOKEN;
const DOWNLOAD_DIR = './shopify-files';

const client = axios.create({
  baseURL: SHOPIFY_ADMIN_API_URL,
  headers: {
    'X-Shopify-Access-Token': ACCESS_TOKEN,
    'Content-Type': 'application/json'
  }
});

async function fetchAllShopifyFiles() {
  let allFiles = [];
  let hasNextPage = true;
  let afterCursor = null;

    const query = `
    query getFiles($after: String) {
      files(first: 100, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              ... on Model3d {
                id
                originalSource {
                  url
                }
              }
              ... on MediaImage {
                id
                image {
                  url
                }
              }
              ... on GenericFile {
                id
                url
              }
              ... on Video {
                id
                sources {
                  url
                }
              }
            }
          }
        }
      }
  `;
  while (hasNextPage) {
    const response = await client.post(
      '',
      {
          query,
          variables: { after: afterCursor },
        }
    );

    const { edges, pageInfo } = response.data.data.files;

    const files = edges
      .map(edge => edge.node)
      .map(node => {
        if (node.url) {
          return { url: node.url, name: node.filename || path.basename(node.url) };
        } else if (node.image?.url) {
          return { url: node.image.url, name: path.basename(node.image.url) };
        }
        return null;
      })
      .filter(Boolean);

    allFiles = allFiles.concat(files);
    hasNextPage = pageInfo.hasNextPage;
    afterCursor = pageInfo.endCursor;
  }

  return allFiles;
}

async function downloadFiles (files, outputDir) {
  const totalFiles = files.length;
  let downloadedFiles = 0;

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  for (const file of files) {
    const filePath = path.join(outputDir, file.name);
    try {
      const response = await axios({ method: 'GET', url: file.url, responseType: 'stream' });
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      downloadedFiles++

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log(`✅ (${downloadedFiles}/${totalFiles}) - Downloaded: ${file.name} `);
    } catch (err) {
      console.error(`❌ Failed to download ${file.name}: ${err.message}`);
    }
  }
}

(async () => {
  try {
    const files = await fetchAllShopifyFiles();
    console.log(`Found ${files.length} files.`);
    await downloadFiles(files, DOWNLOAD_DIR);
  } catch (error) {
    console.error('Error fetching or downloading files:', error);
  }
})();
