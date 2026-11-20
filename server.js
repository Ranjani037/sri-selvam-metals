// Sri Selvam Metals catalog server. No installs needed: only Node.js.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000;
const PUB=path.join(__dirname,'public'),DATA=path.join(__dirname,'data'),UP=path.join(DATA,'uploads');
fs.mkdirSync(UP,{recursive:true});
const DF=path.join(DATA,'data.json'),CF=path.join(DATA,'config.json');
const hash=(p,s)=>crypto.scryptSync(p,s,32).toString('hex');
const readJ=(f,d)=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){return d}};
let cfg=readJ(CF,null);
if(!cfg){const salt=crypto.randomBytes(16).toString('hex');
  const initialPassword=process.env.OWNER_INITIAL_PASSWORD||crypto.randomBytes(18).toString('base64url');
  cfg={salt,hash:hash(initialPassword,salt),code:crypto.randomBytes(4).toString('hex').toUpperCase()};
  fs.writeFileSync(CF,JSON.stringify(cfg));
  console.log('First-run owner password (save it, then change it after login): '+initialPassword);}
const tokens=new Map(),fails=new Map();
const authed=r=>{const e=tokens.get(r.headers['x-token']);return e&&e>Date.now()};
const send=(res,c,o)=>{res.writeHead(c,{'Content-Type':'application/json'});res.end(JSON.stringify(o))};
const body=req=>new Promise((ok,no)=>{let b=[],n=0;req.on('data',c=>{n+=c.length;if(n>40e6){no();req.destroy()}else b.push(c)});req.on('end',()=>{try{ok(JSON.parse(Buffer.concat(b).toString()||'{}'))}catch(e){no(e)}})});
const setPw=p=>{cfg.salt=crypto.randomBytes(16).toString('hex');cfg.hash=hash(p,cfg.salt);fs.writeFileSync(CF,JSON.stringify(cfg));tokens.clear()};
function saveData(d){
  const ext={jpeg:'jpg',png:'png',webp:'webp'};
  d.prods.forEach(p=>{p.imgs=(Array.isArray(p.imgs)?p.imgs:[]).slice(0,4).map(s=>{
    const m=/^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(s||'');
    if(!m)return String(s).startsWith('/uploads/')?s:null;
    const n=Date.now().toString(36)+crypto.randomBytes(3).toString('hex')+'.'+ext[m[1]];
    fs.writeFileSync(path.join(UP,n),Buffer.from(m[2],'base64'));return '/uploads/'+n}).filter(Boolean)});
  const used=new Set(d.prods.flatMap(p=>p.imgs).map(s=>path.basename(s)));
  fs.readdirSync(UP).forEach(f=>{if(!used.has(f))fs.unlinkSync(path.join(UP,f))});
  fs.writeFileSync(DF,JSON.stringify(d));return d}
const MIME={'.html':'text/html; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.js':'text/javascript','.css':'text/css','.ico':'image/x-icon'};
http.createServer(async(req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0]);
  try{
    if(url==='/api/data'&&req.method==='GET')return send(res,200,readJ(DF,{cats:[],prods:[]}));
    if(url==='/api/data'&&req.method==='POST'){if(!authed(req))return send(res,401,{});
      const d=await body(req);if(!Array.isArray(d.cats)||!Array.isArray(d.prods))return send(res,400,{});
      return send(res,200,saveData({cats:d.cats,prods:d.prods}))}
    if(url==='/api/login'&&req.method==='POST'){
      const ip=req.socket.remoteAddress,f=fails.get(ip)||{n:0,t:0};
      if(f.n>=5&&Date.now()-f.t<6e5)return send(res,429,{});
      const {password}=await body(req);
      if(typeof password==='string'&&hash(password,cfg.salt)===cfg.hash){fails.delete(ip);
        const t=crypto.randomBytes(24).toString('hex');tokens.set(t,Date.now()+12*36e5);return send(res,200,{token:t})}
      fails.set(ip,{n:f.n+1,t:Date.now()});return send(res,401,{})}
    if(url==='/api/password'&&req.method==='POST'){if(!authed(req))return send(res,401,{});
      const {password}=await body(req);if(!password||password.length<6)return send(res,400,{});setPw(password);return send(res,200,{})}
    if(url==='/api/reset'&&req.method==='POST'){
      const {code,password}=await body(req);
      if(code&&password&&password.length>=6&&String(code).toUpperCase()===cfg.code){setPw(password);return send(res,200,{})}
      return send(res,401,{})}
    let file;
    if(url.startsWith('/uploads/'))file=path.join(UP,path.basename(url));
    else if(url==='/'||url==='/admin')file=path.join(PUB,'index.html');
    else file=path.join(PUB,path.normalize(url).replace(/^(\.\.[\/\\])+/,''));
    if(!file.startsWith(PUB)&&!file.startsWith(UP))return send(res,403,{});
    fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);return res.end('Not found')}
      res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':url.startsWith('/uploads/')?'public, max-age=86400':'no-cache'});res.end(b)});
  }catch(e){send(res,400,{})}
}).listen(PORT,'0.0.0.0',()=>console.log('\nSri Selvam Metals catalog is running.\n  Customers: http://localhost:'+PORT+'\n  Owner:     http://localhost:'+PORT+'/admin\n  (Keep this window open. Press Ctrl+C to stop.)\n  Password reset code is saved in data/config.json'));
