import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { vairant, Product } from "./types.js";
import { Page } from "puppeteer";
/**
 * scraping shein clothing website and returns Values returns a null value incase it throws an error
 * the error can be 1 encountered a captcha that it couldn't solve but since i have a Stealth plugin on
 * if it enounters a captcha and fails you should just retry once again and it will work ...
 *
 * @export
 * @param {string} url
 * @return {*}  {Promise<Product>}
 */
export default async function ScrapeShein(url: string): Promise<any> {
  try {
    puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      userDataDir: "./data",
    });
    const page = await browser.newPage();
    await page.goto(url, { timeout: 0, waitUntil: "networkidle2" });

    const info: Product = await page.evaluate(async () => {
      //  let title = document.querySelectorAll("h1")[1].innerText;
      let title = document.querySelector("h1.product-intro__head-name")
        ? (
            document.querySelector(
              "h1.product-intro__head-name"
            ) as HTMLHeadElement
          ).innerText
        : "";

      //TODO: This needs to be a string
      let description: any = {};
      document.querySelectorAll("div.product-intro__description-table-item")
        ? Array.from(
            document.querySelectorAll(
              "div.product-intro__description-table-item"
            )
          ).map((row) => {
            let key = row.querySelector("div.key")
              ? (row.querySelector("div.key") as HTMLDivElement).innerText
              : "";
            let value = row.querySelector("div.val")
              ? (row.querySelector("div.val") as HTMLDivElement).innerText
              : "";
            description[key] = value;
          })
        : "";

      let image: string = document
        .querySelector("div[data-background-image]")!
        .getAttribute("data-background-image")
        ? document
            .querySelector("div[data-background-image]")!
            .getAttribute("data-background-image")!
        : "";

      // The ID was not avaliable in the shop but i did notice they label the images as for Example T-shirt-1 ...
      let images = document.querySelectorAll("div.product-intro__thumbs-item")
        ? Array.from(
            document.querySelectorAll("div.product-intro__thumbs-item")
          ).map((image, index) => {
            return {
              id: (index + 1).toString(),
              src: (image.querySelector("img") as HTMLImageElement).src,
            };
          })
        : [];

      let vendor = document.querySelector("div.name-line")
        ? (document.querySelector("div.name-line") as HTMLDivElement).innerText
        : "";

      let colors = document.querySelectorAll("div.goods-color__radio")
        ? Array.from(document.querySelectorAll("div.goods-color__radio")).map(
            (color) => {
              return color.getAttribute("aria-label")
                ? color.getAttribute("aria-label")!
                : "";
            }
          )
        : [];
      let sizes = document.querySelectorAll("p.product-intro__size-radio-inner")
        ? Array.from(
            document.querySelectorAll("p.product-intro__size-radio-inner")
          ).map((size) => {
            return (size as HTMLParagraphElement).innerText;
          })
        : [];

      let options: Array<any> = [];

      if (colors.length > 0) {
        options.push({
          name: "Color",
          values: colors,
        });
      }

      if (sizes.length > 0) {
        options.push({
          name: "Size",
          values: sizes,
        });
      }
      let variants: Array<vairant> = [];

      return {
        title,
        description: JSON.stringify(description),
        options,
        sizes,
        variants,
        images,
        image: { src: image },
        colors,
        vendor,
      };
    });

    // checking for variants keys if there are avaliable
    if (info.colors.length === 0) {
      // we loop thru the sizes avaliable so we can get variants ...
      if (info.sizes.length !== 0) {
        let priced = await GetPrices(page);
        for (var j = 0; j <= info.sizes.length; j++) {
          if (j + 1 > info.sizes.length) break;
          await page.click(
            `#goods-detail-v3 > div > div.goods-detailv2__media > div > div.product-intro > div.product-intro__info > div > div.product-intro__select-box > div.product-intro__size > div.product-intro__size-choose > span.sui-popover__trigger.product-intro__size-radio-spopover.j-product-intro__size-radio-spopover_87_index${
              j + 1
            }`
          );
          await page.waitForNetworkIdle({ idleTime: 2000 });
          let imagesrc = await page.evaluate(() => {
            return document
              .querySelector("div[data-background-image]")!
              .getAttribute("data-background-image")
              ? document
                  .querySelector("div[data-background-image]")!
                  .getAttribute("data-background-image")!
              : "";
          });
          let size = info.sizes[j];
          if (size === undefined) break;
          let title = `${size}`;
          info.variants.push({
            title,
            sku: "",
            price: eval(priced.current_price.slice(1))
              ? eval(priced.current_price.slice(1))
              : 0,
            compare_at_price: eval(priced.old_price.slice(1))
              ? eval(priced.old_price.slice(1))
              : 0,
            option1: null,
            option2: size,
            option3: null,
            imageSrc: imagesrc,
          });
        }
      } else {
        return {
          title: info.title,
          description: info.description,
          options: info.options,
          variants: info.variants,
          images: info.images,
          image: info.image,
        };
      }
    }
    // we loop thru the colors avaliable so we can get variants ...
    for (let index = 0; index < info.colors.length; index++) {
      const element = info.colors[index];
      await page.click(
        `#goods-detail-v3 > div > div.goods-detailv2__media > div > div.product-intro > div.product-intro__info > div > div.product-intro__select-box > div.goods-color.j-expose__product-intro__color.product-intro__color > div.goods-color__radio-container > span:nth-child(${
          index + 1
        })`
      );
      await page.waitForNetworkIdle({ idleTime: 2000 });
      let imagesrc = await page.evaluate(() => {
        return document
          .querySelector("div[data-background-image]")!
          .getAttribute("data-background-image")
          ? document
              .querySelector("div[data-background-image]")!
              .getAttribute("data-background-image")!
          : "";
      });
      let priced = await GetPrices(page);

      if (info.sizes.length === 0) {
        let title = `${element}`;
        info.variants.push({
          title,
          sku: "",
          price: eval(priced.current_price.slice(1))
            ? eval(priced.current_price.slice(1))
            : 0,
          compare_at_price: eval(priced.old_price.slice(1))
            ? eval(priced.old_price.slice(1))
            : 0,
          option1: element,
          option2: null,
          option3: null,
          imageSrc: imagesrc,
        });
      } else {
        for (var j = 0; j < info.sizes.length; j++) {
          let size = info.sizes[j];
          if (size === undefined) break;
          let title = `${element} / ${size}`;
          info.variants.push({
            title,
            sku: "",
            price: eval(priced.current_price.slice(1))
              ? eval(priced.current_price.slice(1))
              : 0,
            compare_at_price: eval(priced.old_price.slice(1))
              ? eval(priced.old_price.slice(1))
              : 0,
            option1: element,
            option2: size,
            option3: null,
            imageSrc: imagesrc,
          });
        }
      }
    }

    let FinalResult = {
      title: info.title,
      description: info.description,
      options: info.options,
      variants: info.variants,
      images: info.images,
      image: info.image,
    };
    await page.close();
    await browser.close();
    return FinalResult;
  } catch (error) {
    console.log(error);
    return null;
  }
}
/* 
let ProductUrl =
  "https://www.shein.com/SHEIN-VCAY-Plus-Size-Belted-Open-Shoulder-Vacation-Dress-p-35747823.html?src_identifier=fc=Curve`sc=Curve`tc=0`oc=0`ps=tab06navbar06`jc=itemPicking_017172964&src_module=topcat&src_tab_page_id=page_goods_detail1721697028845&mallCode=1&pageListType=2&imgRatio=3-4";
 */
async function GetPrices(
  page: Page
): Promise<{ current_price: string; old_price: string }> {
  let priced = await page.evaluate(() => {
    return {
      current_price: document.querySelector("div.from.original")
        ? (
            document.querySelector("div.from.original") as HTMLDivElement
          ).innerText.replace(/[^0-9$.]/g, "")
        : "",
      old_price: document.querySelector("del.del-price")
        ? (
            document.querySelector("del.del-price") as HTMLSpanElement
          ).innerText.replace(/[^0-9$.]/g, "")
        : "",
    };
  });
  return priced;
}
