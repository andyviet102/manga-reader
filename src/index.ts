import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import 'dotenv/config'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const data: { title: string; chapters: { name: string; pages: string[] }[] } = require('./data.json')

const app = new Hono()

// API trả pages theo chapter index (lazy load từng chương khi scroll tới)
app.get('/api/chapter/:index', (c) => {
  const idx = parseInt(c.req.param('index'))
  const chapter = data.chapters[idx]
  if (!chapter) return c.json({ error: 'not found' }, 404)
  return c.json(chapter)
})

app.get('/', (c) => {
  const chapterNames = JSON.stringify(data.chapters.map(c => c.name))
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
.chapter-divider{padding:12px;color:#e94560;font-weight:bold;font-size:14px;text-align:center;background:#16213e;width:100%;max-width:800px;margin:4px 0}
img{display:block;width:100%;max-width:800px;height:auto}
.loading{color:#666;padding:20px;text-align:center}
.page-info{position:fixed;bottom:16px;right:16px;background:rgba(0,0,0,.8);color:#fff;padding:6px 12px;border-radius:4px;font-size:12px;z-index:99}
</style></head><body>
<header>
<h1>${data.title}</h1>
<input type="text" class="search" id="search" placeholder="Tìm...">
<select id="jumpTo"><option value="">-- Nhảy tới --</option></select>
</header>
<div id="reader"></div>
<div class="loading" id="loadingIndicator">Đang tải...</div>
<div class="page-info" id="info"></div>
<script>
const names=${chapterNames};
const total=names.length;
const reader=document.getElementById('reader');
const info=document.getElementById('info');
const jumpTo=document.getElementById('jumpTo');
const search=document.getElementById('search');
let loaded=0;
let isLoading=false;

// Populate jump dropdown
names.forEach((n,i)=>{const o=document.createElement('option');o.value=i;o.textContent=n;jumpTo.appendChild(o);});

search.oninput=function(){
  const q=this.value.toLowerCase();
  [...jumpTo.options].forEach((o,i)=>{if(i===0)return;o.style.display=o.textContent.toLowerCase().includes(q)?'':'none';});
};

jumpTo.onchange=function(){
  const idx=+this.value;
  if(isNaN(idx))return;
  const div=document.getElementById('ch-'+idx);
  if(div){div.scrollIntoView({behavior:'smooth'});return;}
  // Need to load up to that chapter
  loadUpTo(idx);
};

async function loadUpTo(targetIdx){
  while(loaded<=targetIdx&&loaded<total){await loadNext();}
  setTimeout(()=>{const div=document.getElementById('ch-'+targetIdx);if(div)div.scrollIntoView({behavior:'smooth'});},100);
}

async function loadNext(){
  if(loaded>=total||isLoading)return;
  isLoading=true;
  const idx=loaded;
  const res=await fetch('/api/chapter/'+idx);
  const ch=await res.json();
  
  const divider=document.createElement('div');
  divider.className='chapter-divider';
  divider.id='ch-'+idx;
  divider.textContent='── '+ch.name+' ──';
  reader.appendChild(divider);
  
  ch.pages.forEach((id,i)=>{
    const img=document.createElement('img');
    img.src='https://lh3.googleusercontent.com/d/'+id;
    img.loading=i<3&&idx<2?'eager':'lazy';
    img.alt=ch.name+' - Page '+(i+1);
    reader.appendChild(img);
  });
  
  loaded++;
  isLoading=false;
  if(loaded>=total)document.getElementById('loadingIndicator').style.display='none';
}

// Infinite scroll - load next chapter when near bottom
const observer=new IntersectionObserver((entries)=>{
  if(entries[0].isIntersecting&&!isLoading){loadNext();}
},{rootMargin:'1000px'});
observer.observe(document.getElementById('loadingIndicator'));

// Update current chapter indicator
window.addEventListener('scroll',()=>{
  const dividers=document.querySelectorAll('.chapter-divider');
  let current='';
  dividers.forEach(d=>{if(d.getBoundingClientRect().top<window.innerHeight/2)current=d.textContent;});
  info.textContent=current;
});

// Load first 2 chapters immediately
loadNext().then(()=>loadNext());

// Restore last position
const lastCh=localStorage.getItem('lastChapter');
if(lastCh&&+lastCh>1)loadUpTo(+lastCh);

// Save position periodically
setInterval(()=>{
  const dividers=document.querySelectorAll('.chapter-divider');
  let idx=0;
  dividers.forEach((d,i)=>{if(d.getBoundingClientRect().top<window.innerHeight/2)idx=i;});
  localStorage.setItem('lastChapter',idx);
},3000);
</script></body></html>`)
})

const port = parseInt(process.env.PORT || '3000')
serve({ fetch: app.fetch, port }, () => {
  console.log(`Manga reader running on http://localhost:${port}`)
})
