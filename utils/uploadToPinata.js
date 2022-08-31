const pinnatSdk = require("@pinata/sdk");
const path = require("path")
const fs = require("fs");
// const { resolve } = require("path");
require("dotenv").config()
// require("pinnata")
const pinata = pinnatSdk(process.env.PINATA_KEY , process.env.PINATA_SECRET);

async function upload(imagesLocation) {

    const fullImage = path.resolve(imagesLocation);
    const location = fs.readdirSync(fullImage)
    // console.log(location);
    let responses = [];
    console.log("Everthing ok up to now in upload pinata")
   for(index in location){
    const readableStreamForFile = fs.createReadStream(`${fullImage}/${location[index]}`);
    console.log("Cool in upload img to pinata at " , index)
      try {
        const tx = await pinata.pinFileToIPFS(readableStreamForFile);
        console.log("Working fine at" , index)
        responses.push(tx);
      } catch (error) {
        console.log(error)
      }
   }
   
   console.log("Worked done !! in uploading the image")
   console.log(responses , location)
   return {responses , location}
   
}

async function uploadMetadatatoiPFS(metadata){
try {
  console.log("UPloading the json temlate to pinata")
  const reponse = await pinata.pinJSONToIPFS(metadata);
  return reponse;
} catch (error) {
  console.log(error)
}
return null
}

module.exports = {upload , uploadMetadatatoiPFS}