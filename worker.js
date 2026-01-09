export default {
  async fetch(request) {
    const url = new URL(request.url).searchParams.get("url");
    if (!url) return new Response("Missing url");

    const html = await fetch(url).then(r => r.text());

    const make = html.match(/"make":"(.*?)"/)?.[1] || "";
    const model = html.match(/"model":"(.*?)"/)?.[1] || "";
    const year = html.match(/"year":"(.*?)"/)?.[1] || "";

    if (!make || !model || !year)
      return new Response("Vehicle data not found");

    const avtoUrl =
      `https://www.avto.net/Ads/results.asp?znamka=${make}&model=${model}&letnikMin=${year}&letnikMax=${year}`;

    const avtoHtml = await fetch(avtoUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    }).then(r => r.text());

    const regex = /GO-Results-Price.*?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)/g;
    let prices = [];
    let m;

    while ((m = regex.exec(avtoHtml)) !== null) {
      const num = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
      if (!isNaN(num)) prices.push(num);
    }

    if (prices.length === 0)
      return new Response(JSON.stringify({ make, model, year, avg: 0 }), {
        headers: { "Content-Type": "application/json" }
      });

    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    return new Response(JSON.stringify({ make, model, year, avg, avtoUrl }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
