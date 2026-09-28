async function run() {
  const res = await fetch('https://genshin.gg/teams/');
  const html = await res.text();
  const idx = html.indexOf('Neuvillette');
  if (idx !== -1) {
    console.log(html.slice(idx - 100, idx + 400));
  }
}

run();
