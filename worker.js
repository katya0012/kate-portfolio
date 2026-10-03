const MAX_BODY = 8 * 1024 * 1024;
const MAX_CONTENT = 3_500_000;
const MAX_IMAGE = 4_000_000;

function json(body, status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
async function body(req){const t=await req.text(); if(t.length>MAX_BODY) throw new Error('BODY_TOO_LARGE'); try{return JSON.parse(t||'{}')}catch{throw new Error('INVALID_JSON')}}
function b64(bytes){let s=''; const a=new Uint8Array(bytes); for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode(...a.subarray(i,i+0x8000)); return btoa(s)}
function hex(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function hmac(secret,msg){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']); return hex(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(msg)))}
async function tokenFor(secret,exp){return `${exp}.${await hmac(secret,String(exp))}`}
async function validToken(req,env){const h=req.headers.get('authorization')||''; const tok=h.startsWith('Bearer ')?h.slice(7):''; const [exp,sig]=tok.split('.'); if(!exp||!sig||Number(exp)<=Date.now())return false; const expected=await hmac(env.SESSION_SECRET,String(exp)); return sig===expected}
function cleanName(n){return String(n||'photo').replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,50)||'photo'}
const EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};

async function ensure(env){const r=await env.DB.prepare('SELECT json FROM content WHERE id=1').first(); if(r?.json)return; const d=await env.ASSETS.fetch(new Request(new URL('/default-content.json', 'https://assets.local'))); const text=await d.text(); const now=Date.now(); await env.DB.prepare('INSERT INTO content(id,json,updated_at) VALUES(1,?,?)').bind(text,now).run()}

async function api(req,env,url){
  if(url.pathname==='/api/login'&&req.method==='GET') return (await validToken(req,env))?json({ok:true}):json({error:'Не выполнен вход'},401);
  if(url.pathname==='/api/login'&&req.method==='POST'){
    let x;try{x=await body(req)}catch(e){return json({error:e.message==='BODY_TOO_LARGE'?'Запрос слишком большой':'Неверный JSON'},400)}
    const a=new TextEncoder().encode(String(x.password||'')), b=new TextEncoder().encode(String(env.ADMIN_PASSWORD||'')); if(a.length!==b.length){return json({error:'Неверный пароль'},401)}; let d=0; for(let i=0;i<a.length;i++)d|=a[i]^b[i]; if(d)return json({error:'Неверный пароль'},401);
    const exp=Date.now()+14*24*3600*1000; return json({token:await tokenFor(env.SESSION_SECRET,exp),expires:exp});
  }
  if(url.pathname==='/api/content'&&req.method==='GET'){await ensure(env);const r=await env.DB.prepare('SELECT json FROM content WHERE id=1').first();return json(r?JSON.parse(r.json):{empty:true})}
  if(url.pathname==='/api/save'&&req.method==='POST'){
    if(!(await validToken(req,env)))return json({error:'Войдите заново'},401); let x;try{x=await body(req)}catch(e){return json({error:'Неверный JSON'},400)}; if(!x.content||typeof x.content!=='object'||Array.isArray(x.content))return json({error:'Пустой или неверный контент'},400); const text=JSON.stringify(x.content);if(text.length>MAX_CONTENT)return json({error:'Слишком большой объём данных'},413); await ensure(env);const old=await env.DB.prepare('SELECT json FROM content WHERE id=1').first();const now=Date.now(); await env.DB.batch([env.DB.prepare('INSERT INTO backups(json,created_at) VALUES(?,?)').bind(old?.json||text,now),env.DB.prepare('INSERT INTO content(id,json,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json,updated_at=excluded.updated_at').bind(text,now),env.DB.prepare('DELETE FROM backups WHERE id NOT IN (SELECT id FROM backups ORDER BY id DESC LIMIT 20)')]);return json({ok:true,savedAt:now});
  }
  if(url.pathname==='/api/upload'&&req.method==='POST'){
    if(!(await validToken(req,env)))return json({error:'Войдите заново'},401);let x;try{x=await body(req)}catch{return json({error:'Неверный JSON'},400)};const m=/^data:(image\/[a-z+.-]+);base64,(.+)$/s.exec(String(x.data||''));const ext=EXT[m?.[1]];if(!m||!ext)return json({error:'Поддерживаются JPG, PNG, WebP, GIF'},400);let bin;try{bin=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0))}catch{return json({error:'Повреждённый файл'},400)};if(bin.byteLength>MAX_IMAGE)return json({error:'Файл слишком большой (макс. 4 МБ)'},413);const key=`${cleanName(x.name)}-${crypto.randomUUID()}.${ext}`;await env.MEDIA.put(key,bin,{httpMetadata:{contentType:m[1]}});return json({url:`/uploads/${encodeURIComponent(key)}`});
  }
  if(url.pathname==='/api/backups'&&req.method==='GET'){if(!(await validToken(req,env)))return json({error:'Войдите заново'},401);return json((await env.DB.prepare('SELECT id,created_at FROM backups ORDER BY id DESC LIMIT 20').all()).results)}
  if(url.pathname==='/api/backup/latest'&&req.method==='GET'){if(!(await validToken(req,env)))return json({error:'Войдите заново'},401);const r=await env.DB.prepare('SELECT json,created_at FROM backups ORDER BY id DESC LIMIT 1').first();return r?json({content:JSON.parse(r.json),createdAt:r.created_at}):json({error:'Копий пока нет'},404)}
  return json({error:'API route not found'},404)
}

export default {async fetch(req,env){const u=new URL(req.url);try{if(u.pathname.startsWith('/api/'))return await api(req,env,u);if(u.pathname.startsWith('/uploads/')){const key=decodeURIComponent(u.pathname.slice('/uploads/'.length));const o=await env.MEDIA.get(key);if(!o)return new Response('Not found',{status:404});return new Response(o.body,{headers:{'content-type':o.httpMetadata?.contentType||'application/octet-stream','cache-control':'public,max-age=31536000,immutable'}})}let path=u.pathname;if(path==='/admin'||path==='/admin/')path='/admin.html';if(path==='/')path='/index.html';return env.ASSETS.fetch(new Request(new URL(path,req.url),req));}catch(e){return json({error:'Internal server error'},500)}}};
