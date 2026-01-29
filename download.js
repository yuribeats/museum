const https=require('https'),fs=require('fs'),path=require('path');
const API_KEY=process.env.FLICKR_KEY,DEST=path.join(process.env.HOME,'Desktop','museum');
const KW=['jasper johns art','robert rauschenberg art','nam june paik','laurie anderson artist','elvis costello','michael mann director','canal street nyc','avenue a nyc','pyramid club nyc','tompkins square park'];
if(!API_KEY){console.error('Missing FLICKR_KEY');process.exit(1);}
if(!fs.existsSync(DEST))fs.mkdirSync(DEST,{recursive:true});
function get(u){return new Promise((r,j)=>{https.get(u,s=>{let d='';s.on('data',c=>d+=c);s.on('end',()=>r(JSON.parse(d)));}).on('error',j);});}
function dl(u,f){return new Promise((r,j)=>{https.get(u,s=>{if(s.statusCode>299&&s.statusCode<400)return dl(s.headers.location,f).then(r).catch(j);const w=fs.createWriteStream(f);s.pipe(w);w.on('finish',()=>{w.close();r();});}).on('error',j);});}
async function run(){let t=0;for(const k of KW){console.log('Searching: '+k);try{const d=await get('https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key='+API_KEY+'&text='+encodeURIComponent(k)+'&per_page=50&format=json&nojsoncallback=1&sort=relevance');if(!d.photos||!d.photos.photo)continue;for(const p of d.photos.photo){const fn=k.replace(/\s+/g,'-')+'-'+p.id+'.jpg',fp=path.join(DEST,fn);if(fs.existsSync(fp))continue;console.log('  '+fn);try{await dl('https://live.staticflickr.com/'+p.server+'/'+p.id+'_'+p.secret+'_b.jpg',fp);t++;}catch(e){}}}catch(e){console.error('Error: '+e.message);}}console.log('Done: '+t);}
run();
