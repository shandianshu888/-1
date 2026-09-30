const fs = require('fs');

const source = `${fs.readFileSync('index.html', 'utf8')}\n${fs.readFileSync('styles.css', 'utf8')}`;
const urls = [...new Set([...source.matchAll(/https?:\/\/[^\"')\s]+/g)].map(m => m[0].replaceAll('&amp;', '&')))];

async function check(url) {
  const options = {method:'HEAD', redirect:'follow', headers:{'user-agent':'Mozilla/5.0 link-check'}, signal:AbortSignal.timeout(12000)};
  try {
    let response = await fetch(url, options);
    if (response.status === 405 || response.status === 403) response = await fetch(url, {...options, method:'GET', signal:AbortSignal.timeout(12000)});
    return {url, status:response.status, reachable:response.status < 500};
  } catch (error) {
    return {url, status:'ERR', reachable:false, error:error.cause?.code || error.name};
  }
}

Promise.all(urls.map(check)).then(results => {
  const issues = results.filter(x => !x.reachable || Number(x.status) >= 400);
  console.log(`External=${results.length} Reachable=${results.filter(x => x.reachable).length} Issues=${issues.length}`);
  for (const item of issues) console.log(item.status, item.error || '', item.url);
});
