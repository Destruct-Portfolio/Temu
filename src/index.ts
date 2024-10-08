import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { GenerateVariants, GetProductInfo } from "./utils.js";
import { ReturnProductType } from "./types.js";


/**
 *
 * scraping shein clothing website and returns Values returns a null value incase it throws an error
 * the error can be 1 selector change from the website owner can't really fall proof this , 2 captcha but since am using 
 * a StealthPlugin all i have to do is refresh the page so i made userDataDir as a part of this to keep session alive and also added 
 * a retry system up to 3 tries to refresh the page and begone the captcha shall be :D xD 
 * 
 * @export
 * @param {string} url
 * @return {*}  {Promise<Product>}
 */


export default async function ScrapeShein(url: string): Promise<ReturnProductType | undefined> {
  try {
    puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      userDataDir: "./data",
    });
    let tries = 0
    while (tries <= 3) {
      try {
        const page = await browser.newPage();
        await page.goto(url, { timeout: 0, waitUntil: "networkidle2" });
        const info = await GetProductInfo(page)
        const preFinal = await GenerateVariants(info, page)

        if (preFinal !== null) {
          const FinalResult = {
            title: preFinal.title,
            description: preFinal.description,
            options: preFinal.options,
            variants: preFinal.variants,
            images: preFinal.images,
            image: preFinal.image,
          };
          await page.close();
          await browser.close();
          return FinalResult as ReturnProductType;
        } else {
          console.log('[-] Failed To scrape Variants ... ')
          await page.close();
          await browser.close()
          return {
            title: info.title,
            description: info.description,
            options: info.options,
            variants: [],
            images: info.images,
            image: info.image
          }
        }
      } catch (error) {
        if (tries === 3) {
          console.log('failed to scrape Product ')
          return undefined
        } else {
          console.log('[+]Something came up will try again right now ...')
          tries = tries + 1
        }
      }
    }
  } catch (error) {
    console.log(error);
    return undefined;
  }
}



let ProductUrl = "https://www.shein.com/SHEIN-VCAY-Plus-Size-Belted-Open-Shoulder-Vacation-Dress-p-35747823.html?src_identifier=fc=Curve`sc=Curve`tc=0`oc=0`ps=tab06navbar06`jc=itemPicking_017172964&src_module=topcat&src_tab_page_id=page_goods_detail1721697028845&mallCode=1&pageListType=2&imgRatio=3-4";
let ProductUrl2 = "https://www.shein.com/SHEIN-EZwear-Plus-Size-English-Letter-Printed-T-Shirt-Dress-p-32497162.html?mallCode=1&imgRatio=3-4"
let ProductUrl3 = "https://www.shein.com/SHEIN-Essnce-Plus-Size-Spring-Summer-Casual-Loose-Striped-Split-Hem-Short-Sleeve-T-Shirt-Dress-p-32052174.html?mallCode=1&imgRatio=3-4"
let ProductUrl4_With_otherOptions = "https://www.shein.com/SHEIN-Priv-Women-s-Ink-Floral-Print-Puff-Sleeve-Shirt-p-26133511.html?mallCode=1&imgRatio=3-4"


// console.log(await ScrapeShein(ProductUrl4_With_otherOptions))
