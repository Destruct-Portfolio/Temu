export async function fetchConfig(): Promise<any> {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/obsfx/libgen-downloader/configuration/config.json"
    );
    const json = await response.json();
    const conf = json as Record<string, unknown>;

    return {
      latestVersion: (conf["latest_version"] as string) || "",
      mirrors: (conf["mirrors"] as string[]) || [],
      searchReqPattern: (conf["searchReqPattern"] as string) || "",
      searchByMD5Pattern: (conf["searchByMD5Pattern"] as string) || "",
      MD5ReqPattern: (conf["MD5ReqPattern"] as string) || "",
      columnFilterQueryParamKey:
        (conf["columnFilterQueryParamKey"] as string) || "",
      columnFilterQueryParamValues:
        (conf["columnFilterQueryParamValues"] as Record<string, string>) || {},
    };
  } catch (e) {
    throw new Error("Error occured while fetching configuration.");
  }
}

console.log(await fetchConfig());

export async function findMirror(
  mirrors: string[],
  onMirrorFail: (failedMirror: string) => void
): Promise<string | null> {
  for (let i = 0; i < mirrors.length; i++) {
    const mirror = mirrors[i];
    try {
      await fetch(mirror);
      return mirror;
    } catch (e) {
      onMirrorFail(mirror);
    }
  }
  return null;
}

let x = await fetchConfig();

let miror = await findMirror(x.mirrors!, (link: string) => {
  console.log(link);
});

export interface constructSearchURLParams {
  query: string;
  pageNumber: number;
  pageSize: number;
  mirror: string;
  searchReqPattern: string;
  columnFilterQueryParamKey: string;
  columnFilterQueryParamValue: string | null;
}
export function constructSearchURL({
  query,
  pageNumber,
  pageSize,
  mirror,
  searchReqPattern,
  columnFilterQueryParamKey,
  columnFilterQueryParamValue,
}: constructSearchURLParams): string {
  let url = searchReqPattern
    .replace("{mirror}", mirror)
    .replace("{query}", query.trim().replace(/ /g, "+"))
    .replace("{pageNumber}", pageNumber.toString())
    .replace("{pageSize}", pageSize.toString());

  if (columnFilterQueryParamValue) {
    url += `&${columnFilterQueryParamKey}=${columnFilterQueryParamValue}`;
  }

  return url;
}

let url = constructSearchURL({
  query: "Slavoj Žižek",
  pageNumber: 5,
  pageSize: 10,
  mirror: miror!,
  searchReqPattern: x.searchReqPattern,
  columnFilterQueryParamKey: x.columnFilterQueryParamKe,
  columnFilterQueryParamValue: x.columnFilterQueryParamValues.Publisher,
});

export async function getDocument(searchURL: string): Promise<Document> {
  try {
    const response = await fetch(searchURL);
    const htmlString = await response.text();
    return new JSDOM(htmlString).window.document;
  } catch (e) {
    throw new Error(`Error occured while fetching document of ${searchURL}`);
  }
}
