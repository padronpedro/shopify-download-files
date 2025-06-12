# Shopify Download Files - is

This JavaScript function enables the download of all files from a Shopify store, facilitating the migration of your store to a new one without the need for manual file downloads and uploads.

To utilize this functionality, you must first create a developer app and obtain the admin API access token. Subsequently, select the following permissions:

- write_files
- read_files

Finally, modify the .env file to include your credentials.

# Running the script

    node download-files

## Notes

The script will create a new folder named “shopify-files” to store all the downloaded files. Subsequently, you can upload these files into your newly created store.
