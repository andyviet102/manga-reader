import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import 'dotenv/config'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const data: { title: string; chapters: { name: string; pages: string[] }[] } = require('./data.json')

const app = new Hono()

app.get('/', (c) => {
  const allPages = JSON.stringify(data.chapters.map(c => c.pages))
  const names = JSON.stringify(data.chapters.map(c => c.name))
  return c.html(`<!DOCTYPE html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${data.title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#eee;font-family:system-ui}
header{padding:10px 16px;background:#16213e;position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
h1{font-size:16px;white-space:nowrap}
select{padding:6px 10px;border-radius:6px;border:1px solid #333;background:#0f3460;color:#fff;font-size:13px}
.search{padding:6px 10px;border-radius:6px;border:1px solid #333;background:#0f3460;color:#fff;font-size:13px;width:100px}
#reader{display:flex;flex-direction:column;align-items:center}
.ch-div{padding:12px;color:#e94560;font-weight:bold;font-size:14px;text-align:center;background:#16213e;width:100%;max-width:800px;margin:4px 0}
img{display:block;width:100%;max-width:800px;height:auto;min-height:200px;background:#111}
.info{position:fixed;bottom:16px;right:16px;background:rgba(0,0,0,.8);color:#fff;padding:6px 12px;border-radius:4px;font-size:12px;z-index:99}
</style></head><body>
<header>
<h1>${data.title}</h1>
<input type="text" class="search" id="search" placeholder="Tìm...">
<select id="jumpTo"><option value="">-- Nhảy tới --</option></select>
</header>
<div id="reader"></div>
<div class="info" id="info"></div>
<script>
const P=${allPages};
const N=${names};
const T=P.length;
const reader=document.getElementById('reader');
const info=document.getElementById('info');
const jump=document.getElementById('jumpTo');
const search=document.getElementById('search');
let loaded=0;

N.forEach((n,i)=>{const o=document.createElement('option');o.value=i;o.textContent=n;jump.appendChild(o);});
const opts=[...jump.options];
search.oninput=function(){const q=this.value.toLowerCase();opts.forEach((o,i)=>{if(i===0)return;o.hidden=!o.textContent.toLowerCase().includes(q);});};

jump.onchange=function(){
  const idx=+this.value;if(isNaN(idx))return;
  while(loaded<=idx)loadNext();
  document.getElementById('c'+idx).scrollIntoView({behavior:'smooth'});
};

function loadNext(){
  if(loaded>=T)return;
  const i=loaded;
  const d=document.createElement('div');d.className='ch-div';d.id='c'+i;d.textContent='── '+N[i]+' ──';
  reader.appendChild(d);
  P[i].forEach((id,j)=>{
    const img=document.createElement('img');
    img.src='https://lh3.googleusercontent.com/d/'+id;
    img.loading=(i<2&&j<3)?'eager':'lazy';
    reader.appendChild(img);
  });
  loaded++;
}

// Load first 3 chapters
loadNext();loadNext();loadNext();

// Restore last position
const last=localStorage.getItem('lc');
if(last&&+last>2){let t=Math.min(+last,T-1);while(loaded<=t)loadNext();setTimeout(()=>{const el=document.getElementById('c'+t);if(el)el.scrollIntoView();},200);}

// Infinite scroll + interval backup
function checkLoad(){
  if(loaded>=T)return;
  const sh=document.documentElement.scrollHeight;
  const sy=window.scrollY||window.pageYOffset;
  const wh=window.innerHeight;
  if(sh-sy-wh<3000){loadNext();loadNext();}
}
window.addEventListener('scroll',checkLoad);
setInterval(checkLoad,500);

// Update chapter indicator
setInterval(()=>{
  const divs=document.querySelectorAll('.ch-div');
  let cur='',idx=0;
  divs.forEach((d,i)=>{if(d.getBoundingClientRect().top<window.innerHeight/2){cur=d.textContent;idx=i;}});
  info.textContent=cur;
  localStorage.setItem('lc',idx);
},1000);
</script></body></html>`)
})

const port = parseInt(process.env.PORT || '3000')
serve({ fetch: app.fetch, port }, () => {
  console.log(`Manga reader running on http://localhost:${port}`)
})
