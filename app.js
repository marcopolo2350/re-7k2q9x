"use strict";
const ICON=(document.querySelector('link[rel="apple-touch-icon"]')||{}).href||"";
const CANDL=(()=>{try{return window.self===window.top}catch(e){return false}})();
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const MT={B:"Breakfast",L:"Lunch",D:"Dinner",S:"Snack"};
const DIFF=["","Very easy","Easy","Medium"];
/* ---------- data prep ---------- */
const SEC={};for(const[k,v] of Object.entries(SEC_SRC))v.split(",").forEach(x=>SEC[x.trim()]=k);
function pq(str){str=(str||"").trim();if(!str)return[null,""];const t=str.split(/\s+/);let q=0,i=0,f=false;while(i<t.length){const x=t[i];if(/^\d+(\.\d+)?$/.test(x)){q+=parseFloat(x);f=true;i++}else if(/^\d+\/\d+$/.test(x)){const[a,b]=x.split("/");q+=a/b;f=true;i++}else break}return[f?q:null,t.slice(i).join(" ")]}
function parseIng(s){const p=s.split("|");const[q,u]=pq(p[0]);return{q,u,item:(p[1]||"").trim(),note:(p[2]||"").trim()}}
const GARN={"chicken breast":"🍗","chicken thighs":"🍗","shrimp":"🍤","salmon":"🐟","bacon":"🥓","eggs":"🥚","cheddar":"🧀","mozzarella":"🧀","parmesan":"🧀","feta":"🧀","garlic":"🧄","tomatoes":"🍅","cherry tomatoes":"🍅","crushed tomatoes":"🍅","lemon":"🍋","lime":"🍋‍🟩","basil":"🌿","parsley":"🌿","cilantro":"🌿","spinach":"🥬","kale":"🥬","lettuce":"🥬","avocado":"🥑","broccoli":"🥦","mushrooms":"🍄","bell pepper":"🫑","jalapeño":"🌶️","sriracha":"🌶️","red pepper flakes":"🌶️","potatoes":"🥔","baby potatoes":"🥔","carrots":"🥕","rice":"🍚","bread":"🍞","french bread":"🍞","frozen corn":"🌽","onion":"🧅","chocolate chips":"🍫","banana":"🍌","blueberries":"🫐","strawberries":"🍓","apple":"🍎","honey":"🍯","butter":"🧈","cucumber":"🥒","ground beef":"🥩","sirloin steak":"🥩","coconut milk":"🥥","peanut butter":"🥜","cinnamon":"✨","maple syrup":"🍁","heavy cream":"🥛","milk":"🥛","sweet potatoes":"🍠","eggplant":"🍆","zucchini":"🥒","green onion":"🌱","ginger":"🫚","olives":"🫒","pesto":"🌿","tortilla chips":"🌮"};
const GF={soup:"Cold nights, sick days, leftovers",comfort:"Cozy dinners, chilly nights, leftovers",light:"Fresh dinners, lighter nights",lunch:"Easy lunches, work-from-home days",quick:"Busy weeknights, low-energy days",prep:"Meal prep, batch cooking",breakfast:"Slow mornings, brunch at home",treats:"Dessert's own stomach, movie nights"};
const SKIP=new Set(["warm water","water"]);
CATS.sides={n:"Sides & starters",e:"🥗",g:["#DCE6C4","#6F8A4A"]};
CATS.baking={n:"Baking & breads",e:"🥖",g:["#EBCB9A","#9A5B2E"]};CATS.wraps={n:"Wraps & rolls",e:"🌯",g:["#CFE3C2","#4F7A5A"]};
GF.baking="Fresh bread, weekend baking, breakfast on the go";GF.wraps="Lunch on the go, easy dinners, leftovers";
GF.sides="Sides, starters, potlucks";
PARTS[7]="Part 7 · Around the world";PARTS[8]="Our own recipes";
const MINE_P=8;
const MAINS=[["chicken","🍗 Chicken"],["steak","🥩 Steak"],["beef","🍔 Beef"],["pork","🥓 Pork"],["lamb","🍖 Lamb"],["seafood","🦐 Seafood"],["veg","🥦 Vegetarian"],["pasta","🍝 Pasta"],["soup","🍲 Soup & stew"],["rice","🍚 Rice & bowls"],["dessert","🍰 Dessert"]];
function mainOf(r){const n=r.n.toLowerCase(),k=r.keys.join(" | ");const m=new Set();
if(/chicken|turkey/.test(n+" "+k))m.add("chicken");
if(/steak|ribeye|sirloin|filet mignon|strip|flank|skirt|porterhouse|t-bone|tenderloin/.test(n)||/sirloin|ribeye|flank steak|skirt steak|strip steak|filet mignon|beef tenderloin/.test(k))m.add("steak");
if(/beef|brisket|oxtail|veal|meatball|burger|meatloaf|bolognese/.test(n+" "+k))m.add("beef");
if(/pork|bacon|ham\b|sausage|chorizo|prosciutto|pancetta|carnitas|char siu/.test(n+" "+k))m.add("pork");
if(/lamb|mutton|goat/.test(n+" "+k))m.add("lamb");
if(/shrimp|prawn|salmon|cod|tuna|fish|crab|lobster|scallop|mussel|clam|squid|calamari|anchov|tilapia|catfish|crawfish|seafood|haddock|mackerel|sardine|trout/.test(n+" "+k))m.add("seafood");
if(r.c==="treats")m.add("dessert");
if(r.c==="soup"||/soup|stew|chili|chowder|bisque|gumbo|pho|ramen|jjigae|curry/.test(n))m.add("soup");
if(/pasta|spaghetti|penne|linguine|fettuccine|lasagn|macaroni|ziti|rigatoni|gnocchi|tortellini|ravioli|orzo|noodle|shells|carbonara|alfredo|lo mein|chow mein|pad thai/.test(n+" "+k))m.add("pasta");
if(/rice|bowl|risotto|biryani|paella|jambalaya|congee|bibimbap|donburi|gyudon|oyakodon/.test(n))m.add("rice");
if(!["chicken","steak","beef","pork","lamb","seafood"].some(x=>m.has(x))&&r.c!=="treats")m.add("veg");
return[...m]}
function finishR(r){const g=[];for(const x of r.i){const em=GARN[x.item];if(em&&em!==r.e&&!g.includes(em))g.push(em);if(g.length===3)break}while(g.length<3)g.push(["🌿","✨","🍽️"][g.length]);r.g=g;r.keys=[...new Set(r.i.map(x=>x.item).filter(x=>x&&!SKIP.has(x)))];if(!r.keys.length)r.keys=["(no ingredients)"];return r}
const BASE=ORIG.concat(RAW.slice(45)).map((a,i)=>finishR({id:i+1,n:a[0],c:a[1],e:a[2],t:a[3],df:typeof a[4]==="number"?DIFF[a[4]]:a[4],cz:a[5],s:a[6],d:a[7],i:a[8].split(";").map(parseIng),st:a[9].split("|"),hot:a[10]==="hot",gf:a[11]||GF[a[1]],h:a[12]||"",p:i<21?1:i<45?2:i<69?3:i<93?4:i<117?5:6,img:(typeof ORIG_IMG!=="undefined"&&ORIG_IMG[i+1])||""}));
if(typeof NEWR!=="undefined")NEWR.forEach(a=>BASE.push(finishR({id:a[0],n:a[1],c:a[2],e:a[3],t:a[4],df:a[5],cz:a[6],s:a[7],d:a[8],i:a[9].split(";").map(parseIng),st:a[10].split("|"),hot:false,gf:GF[a[2]],h:"",p:7,img:"",cu:a[11]||""})));
if(typeof WORLD!=="undefined")WORLD.forEach(a=>BASE.push(finishR({id:a[0],n:a[1],c:a[2],e:a[3],t:a[4],df:a[5],cz:a[6],s:a[7],d:a[8],i:a[9].split(";").map(parseIng),st:a[10].split("|"),hot:false,gf:GF[a[2]],h:"",p:7,img:a[11],cu:a[12]||""})));
if(typeof EGYPT!=="undefined")EGYPT.forEach(a=>BASE.push(finishR({id:a[0],n:a[1],c:a[2],e:a[3],t:a[4],df:a[5],cz:a[6],s:a[7],d:a[8],i:a[9].split(";").map(parseIng),st:a[10].split("|"),hot:false,gf:GF[a[2]],h:"",p:7,img:"",cu:a[11]||""})));
const CU_FIX={"United States":"American",France:"French",India:"Indian",Netherlands:"Dutch",Norway:"Norwegian",Colombia:"Colombian",Brazil:"Brazilian",Argentina:"Argentinian",Venezuela:"Venezuelan",Chile:"Chilean",Bulgaria:"Bulgarian",Albania:"Albanian",Croatian:"Croatian",Denmark:"Danish",Belgium:"Belgian",Cuba:"Cuban",Estonia:"Estonian",Slovakia:"Slovak",Laos:"Lao",Armenia:"Armenian",Austria:"Austrian",Andorra:"Andorran",Bangladesh:"Bangladeshi",Angola:"Angolan",Azerbaijan:"Azerbaijani",Afghanistan:"Afghan",Cambodia:"Cambodian",Dominica:"Dominican","Costa Rica":"Costa Rican",Botswana:"Botswanan",Aruba:"Aruban",Barbados:"Barbadian","Cayman Islands":"Caymanian","Antigua and Barbuda":"Antiguan",Bahamas:"Bahamian","Saudi Arabian":"Saudi"};
const LVN={E:"Essential",R:"Recommended",O:"Optional",S:"Substitutable"};
const LVR={E:3,S:2,R:1,O:0};
function prepChef(r){const c=(typeof CHEF!=="undefined"&&CHEF[r.id])||null;const ok=c&&typeof c.lv==="string"&&c.lv.length===r.i.length&&/^[ERSO]+$/.test(c.lv);r.cf=ok?c:null;r.imp={};r.ilv=[];r.i.forEach((g,k)=>{const L=ok?c.lv[k]:"E";r.ilv[k]=L;if(!SKIP.has(g.item)){const p=r.imp[g.item];if(p==null||LVR[L]>LVR[p])r.imp[g.item]=L}})}
function applyFix(r){const f=typeof CHEFFIX!=="undefined"&&CHEFFIX[r.id];if(!f)return;if(f.repI)for(const k in f.repI)r.i[+k]=parseIng(f.repI[k]);(f.i||[]).forEach(x=>r.i.push(parseIng(x)));if(f.repSt)r.st=f.repSt.slice();if(f.stEdit)for(const k in f.stEdit)r.st[+k]=f.stEdit[k];(f.st||[]).forEach(x=>r.st.push(x));if(f.t)r.t=f.t;if(f.c&&CATS[f.c])r.c=f.c;r.keys=[...new Set(r.i.map(x=>x.item).filter(x=>x&&!SKIP.has(x)))];if(!r.keys.length)r.keys=["(no ingredients)"]}
function subFor(r,key){if(!r.cf||!r.cf.sub)return null;let best=null;r.i.forEach((g,k)=>{if(g.item===key&&r.cf.sub[k]&&!best)best=r.cf.sub[k]});return best}
const STEPFIX={53076:["Beat the eggs with the salt until smooth.","Heat a lightly oiled non-stick pan over medium heat.","Dip each slice of bread in the egg, turning to coat both sides, and lay them in the pan.","Pour any remaining egg over the bread and cook 2 to 3 minutes per side until golden and set, then serve hot."]};
const HEADSTEP=/^(notes?|to serve|pro tips?|serving suggestions?|instructions?|method|directions|for the [\w ]+)\s*:?\s*$/i;
function normSteps(r){if(STEPFIX[r.id]){r.st=STEPFIX[r.id].slice();return}
let st=r.st.map(x=>(x||"").trim()).filter(x=>x&&!HEADSTEP.test(x));
if(st.length<=2&&st.join(" ").length>150){const out=[];st.join(" ").split(/(?<=[.!?])\s+(?=[A-Z0-9])/).forEach(x=>{if(out.length&&(x.length<35||out[out.length-1].length<35))out[out.length-1]+=" "+x;else out.push(x)});st=out}
r.st=st.length?st:r.st}
BASE.forEach(r=>{if(r.id===53076)r.i.forEach(x=>{if(x.item==="salt"&&!x.u)x.u="tsp"});normSteps(r);applyFix(r);prepChef(r)});
BASE.forEach(r=>{if(r.id<1000&&typeof ORIG_CU!=="undefined")r.cu=ORIG_CU[r.id]||"American";r.cu=CU_FIX[r.cu]||r.cu;r.img=(typeof PHOTO!=="undefined"&&PHOTO[r.id])?PHOTO[r.id]:(typeof ILLUS!=="undefined"?ILLUS(r):r.img);r.mn=mainOf(r)});
const RECIPES=[];const RID={};
const R_=id=>RID[id];
let ALLITEMS=[];
const BASICS=["salt","black pepper","olive oil","vegetable oil","butter","eggs","milk","flour","sugar","garlic","onion","rice","soy sauce","garlic powder","italian seasoning","chicken broth"];
const RULES=["Snacks are not a meal. They're a pre-meal.","Dessert has its own stomach. It's science.","\"I'm not that hungry\" (Rose, four minutes before eating everything).","Leftovers are just the next one, again.","Asking \"what do you want to eat?\" is a trap. Use the button.","If you cooked it, Rose gets the first bite. If Rose cooked it, Rose gets the first bite.","Food tastes better when someone else plans it. That's what this app is for.","The best meal is the one currently in front of Rose. Until the next one.","A bread bowl is a bowl you can eat. Every bowl should aspire to this.","Soup counts as a hug."];
const EMPTYQ=["Monday deserves carbs.","Taco Tuesday is right there.","Hump day = comfort food.","Almost Friday. Treat yourselves.","Pizza night? Just saying.","Big cooking energy day.","Sunday reset (with seconds)."];
/* ---------- dates ---------- */
const pad=n=>String(n).padStart(2,"0");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const fromIso=s=>{const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d,12)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const curMon=()=>{const d=new Date();return mondayOf(d.getDay()===0?addDays(d,1):d)};
const mondayOf=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);return addDays(x,-((x.getDay()+6)%7))};
const todayIso=()=>iso(new Date());
const weekDates=w=>{const m=fromIso(w);return[0,1,2,3,4,5,6].map(k=>iso(addDays(m,k)))};
const nice=s=>{const d=fromIso(s);return d.toLocaleDateString(undefined,{month:"short",day:"numeric"})};
/* ---------- state ---------- */
const TESTENV=/[?&]testenv=1/.test(location.search);const KEY=TESTENV?"roses-eats-TEST":"roses-eats-v1";
function fresh(){return{v:1,mine:[],left:[],log:[],soon:[],timers:[],fav:[],cooked:[],basket:{},pantry:["salt","black pepper","olive oil","vegetable oil"],plan:{},checked:{},extras:[],tk:{},rating:{},notes:{},hidden:[],photos:{},gone:{},myIng:[],thr:65,maxMiss:5,flex:2,skipOpt:false,gmode:"all",hidePantry:true,night:false,week:iso(curMon()),bm:[],recent:[]}}
function load(){let d=null;try{d=JSON.parse(localStorage.getItem(KEY))}catch(e){}const f=fresh();if(!d||typeof d!=="object")return f;const s=Object.assign(f,d);const cm=iso(curMon());s.week=(typeof s.week==="string"&&/^\d{4}-\d\d-\d\d$/.test(s.week)&&s.week>=cm)?s.week:cm;["hidden","myIng"].forEach(k=>{if(!Array.isArray(s[k]))s[k]=[]});["photos","gone"].forEach(k=>{if(!s[k]||typeof s[k]!=="object")s[k]={}});return s}
let S=load();let saveWarned=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){if(!saveWarned){saveWarned=true;toast("Heads up: this browser isn't saving changes")}}}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const DESC=new Set("fresh dried ground boneless skinless breast breasts thigh thighs large small medium baby whole chopped sliced diced minced shredded grated frozen canned tinned cooked raw red yellow white brown sharp mild extra virgin plain unsalted salted light dark lean organic ripe smoked cherry roma plum free range jumbo block wedge cloves clove of".split(" "));
const wds=s=>String(s).toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(Boolean).map(w=>w.length>3&&w.endsWith("s")&&!w.endsWith("ss")?w.slice(0,-1):w);
function ingMatch(a,b){if(a===b)return true;const A=wds(a),B=wds(b);if(!A.length||!B.length)return false;const sa=new Set(A),sb=new Set(B);const sub=(x,y,sy)=>x.every(w=>sy.has(w));if(A.length<=B.length&&sub(A,B,sb))return B.every(w=>sa.has(w)||DESC.has(w));if(B.length<A.length&&sub(B,A,sa))return A.every(w=>sb.has(w)||DESC.has(w));return false}
let pMemo=new Map(),pSig="";
function inP(it){const P=S.pantry;const sig=P.length+"|"+P[0]+"|"+P[P.length-1];if(sig!==pSig||pMemo.ref!==P){pSig=sig;pMemo=new Map();pMemo.ref=P}let v=pMemo.get(it);if(v===undefined){v=P.includes(it)||P.some(p=>ingMatch(p,it));pMemo.set(it,v)}return v}
const SECRX=[["meat",/drumstick|wings?|chicken|beef|steak|pork|lamb|turkey|sausage|bacon|ham\b|chorizo|salami|pepperoni|prosciutto|pancetta|mince|veal|duck|goat|shrimp|prawn|salmon|tuna steak|cod|fish|fillet|mussel|clam|crab|lobster|scallop|squid|anchov|tofu|brisket|ribs?\b|venison|rabbit/],["dairy",/cheese|milk|cream|butter|yogurt|yoghurt|egg|parmesan|mozzarella|cheddar|feta|ricotta|brie|gouda|mascarpone|creme|crème|ghee|custard/],["produce",/onion|garlic|tomato|potato|carrot|celery|pepper\b|bell|chili|chilli|jalape|lettuce|spinach|kale|cabbage|broccoli|cauliflower|zucchini|courgette|squash|pumpkin|cucumber|mushroom|leek|shallot|herb|basil|parsley|cilantro|coriander leaves|mint|dill|thyme sprig|rosemary|sage|ginger|lemon|lime|orange|apple|banana|berr|grape|mango|pineapple|peach|pear|plum|cherr|avocado|bean sprout|green bean|asparagus|pea pod|corn on|beet|radish|turnip|parsnip|eggplant|aubergine|fennel|okra|lemongrass|scallion|spring onion|fruit|salad|rocket|arugula|watercress|chard/],["bakery",/bread|bun|roll|tortilla|pita|naan|bagel|baguette|croissant|brioche|muffin|wrap/],["grains",/rice|pasta|spaghetti|noodle|macaroni|penne|fettuccine|linguine|lasagn|couscous|quinoa|oat|barley|lentil|bulgur|polenta|semolina|breadcrumb|panko|cereal|granola/],["canned",/canned|tinned|can of|broth|stock|bean|chickpea|tomato paste|tomato sauce|passata|coconut milk|frozen|puff pastry|filo|phyllo/],["sauces",/gochujang|tahini|miso|kimchi|sauce|oil|vinegar|ketchup|mayo|mustard|dressing|syrup|honey|jam|paste|salsa|pesto|hummus|peanut butter|nutella|relish|pickle|wine|beer|sake|mirin|juice/],["spices",/salt|pepper|cumin|paprika|cinnamon|nutmeg|clove|cardamom|turmeric|curry|masala|oregano|thyme|bay lea|chili powder|cayenne|seasoning|spice|allspice|saffron|star anise|fennel seed|mustard seed|sesame seed|seeds|vanilla pod|dried/],["baking",/flour|sugar|baking|yeast|cocoa|chocolate|vanilla|cornstarch|cornflour|gelatin|sprinkle|icing|marshmallow|almond|walnut|pecan|hazelnut|pistachio|cashew|peanut|nut|raisin|sultana|date|coconut|chip|cracker|biscuit|cookie|candy|snack|popcorn/]];
function secOf(it){if(SEC[it])return SEC[it];const t=String(it).toLowerCase();for(const[k,rx] of SECRX)if(rx.test(t))return k;return"other"}
const isFav=id=>S.fav.includes(id);const isCooked=id=>S.cooked.includes(id);const inBasket=id=>S.basket[id]!=null;
function togArr(a,v){const i=a.indexOf(v);if(i>=0)a.splice(i,1);else a.push(v);return i<0}
function tkUrl(r){return S.tk[r.id]||"https://www.tiktok.com/search?q="+encodeURIComponent(r.n+" recipe")}
const tkLbl=r=>S.tk[r.id]?"saved video":"search";
const IS_MOB=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const IS_AND=/Android/i.test(navigator.userAgent);
function openApp(appUrl,webUrl){if(!IS_MOB||!appUrl){if(IS_MOB){location.href=webUrl}else{window.open(webUrl,"_blank","noopener")}return}let left=false;const gone=()=>{left=true};document.addEventListener("visibilitychange",gone,{once:true});window.addEventListener("pagehide",gone,{once:true});window.addEventListener("blur",gone,{once:true});location.href=appUrl;setTimeout(()=>{if(!left&&!document.hidden)location.href=webUrl},1800)}
function tkAppSearch(q){return IS_AND?"intent://search?keyword="+encodeURIComponent(q)+"#Intent;scheme=snssdk1233;package=com.zhiliaoapp.musically;end":"snssdk1233://search?keyword="+encodeURIComponent(q)}
function tiktokSearch(q){q=String(q||"").trim();if(!q)return;try{navigator.clipboard&&navigator.clipboard.writeText(q).catch(()=>{})}catch(e){}toast("Opening TikTok… “"+q+"” is copied if you need to paste it");openApp(tkAppSearch(q),"https://www.tiktok.com/search?q="+encodeURIComponent(q))}
function tiktokOpen(r){const u=S.tk[r.id];if(!u){tiktokSearch(r.n+" recipe");return}const m=u.match(/\/video\/(\d+)/);openApp(m?(IS_AND?"intent://aweme/detail/"+m[1]+"#Intent;scheme=snssdk1233;package=com.zhiliaoapp.musically;end":"snssdk1233://aweme/detail/"+m[1]):null,u)}
/* ---------- quantities ---------- */
const PL={clove:"cloves",can:"cans",slice:"slices",cup:"cups",stalk:"stalks",head:"heads",fillet:"fillets",pint:"pints",jar:"jars",bag:"bags",packet:"packets",leaf:"leaves",pack:"packs"};
const uL=(u,q)=>q!=null&&q>1.01&&PL[u]?PL[u]:u;
function fmtQ(x){if(x==null)return"";if(x>=20)return String(Math.round(x));let w=Math.floor(x+1e-9),fr=x-w;const F=[[0,""],[.125,"⅛"],[.25,"¼"],[1/3,"⅓"],[.5,"½"],[2/3,"⅔"],[.75,"¾"],[1,""]];let b=F[0],d=9;for(const f of F){const dd=Math.abs(fr-f[0]);if(dd<d){d=dd;b=f}}if(b[0]===1)w++;const s=(w?String(w):"")+(b[1]?(w?" ":"")+b[1]:"");return s||"⅛"}
function ingText(g,f){const q=g.q!=null?g.q*f:null;let s="";if(q!=null)s+=fmtQ(q)+" ";if(g.u)s+=uL(g.u,q)+" ";s+=g.item;if(g.note)s+=", "+g.note;return s}
const UB={tsp:["v",1],tbsp:["v",3],cup:["v",48],oz:["w",1],lb:["w",16],g:["g",1],kg:["g",1000],ml:["m",1],l:["m",1000]};
function amtText(e){const parts=[];if(e.v)parts.push(e.v>=12?fmtQ(e.v/48)+" "+uL("cup",e.v/48):e.v>=3?fmtQ(e.v/3)+" tbsp":fmtQ(e.v)+" tsp");if(e.w)parts.push(e.w>=16?fmtQ(e.w/16)+" lb":fmtQ(e.w)+" oz");if(e.g)parts.push(e.g>=1000?(Math.round(e.g/100)/10)+" kg":Math.round(e.g)+" g");if(e.m)parts.push(e.m>=1000?(Math.round(e.m/100)/10)+" L":Math.round(e.m)+" ml");for(const[u,q] of Object.entries(e.o))parts.push((fmtQ(q)+" "+uL(u,q)).trim());let s=parts.join(" + ");if(e.taste)s+=s?" (+ to taste)":"to taste";return s}
/* ---------- matching ---------- */
const TIER={ready:["✅","Ready to cook"],subs:["🔁","Ready with substitutions"],minor:["👍","Ready with minor omissions"],almost:["🛒","Almost ready"]};
const FLEXN=["I have every ingredient","Skipping minor ones is OK","Substitutions are OK","I'd buy 1 essential","I'd buy up to 3 essentials"];
const FLEX=()=>S.flex==null?2:S.flex;
function stats(r){const miss=r.keys.filter(k=>!inP(k));const buy=[],rec=[],opt=[],sub=[];
for(const k of miss){const L=r.imp[k]||"E";if(L==="O"){opt.push(k);continue}const sb=subFor(r,k);if(sb&&sb.k&&sb.k.length&&sb.k.every(x=>inP(x))){sub.push({k,sb});continue}if(L==="R")rec.push(k);else buy.push(k)}
const tier=buy.length?"almost":sub.length?"subs":(rec.length||opt.length)?"minor":"ready";
const core=r.keys.filter(k=>(r.imp[k]||"E")!=="O").length||1;
return{r,tot:r.keys.length,miss,buy,rec,opt,sub,tier,have:r.keys.length-miss.length,pct:Math.max(0,Math.round(100*(core-buy.length)/core))}}
function whatNeed(m){let h="";
if(m.sub.length)h+=`<div class="need"><b>🔁 Swap in what you have:</b> ${m.sub.map(x=>`<span class="nchip sw">${esc(x.k)}: ${esc(x.sb.x)}</span>`).join("")}</div>`;
if(m.buy.length)h+=`<div class="need"><b>🛒 Need:</b> ${m.buy.map(x=>`<span class="nchip">${esc(x)}</span>`).join("")}</div>`;
if(m.rec.length)h+=`<div class="need"><b>Okay to skip (small difference):</b> ${m.rec.map(x=>`<span class="nchip soft">${esc(x)}</span>`).join("")}</div>`;
if(m.opt.length)h+=`<div class="need"><b>Safe to skip:</b> ${m.opt.map(x=>`<span class="nchip soft">${esc(x)}</span>`).join("")}</div>`;
return h}
function tipsBox(r){const t=r.cf&&r.cf.tips;if(!t||!t.length)return"";return`<div class="tipbox"><h3>👩‍🍳 Chef's Pro Tips</h3>${t.map(x=>`<p>${esc(x.t)}</p>`).join("")}</div>`}
function stepTip(r,k,cls){const t=r.cf&&r.cf.tips;if(!t)return"";return t.filter(x=>x.s===k).map(x=>`<div class="${cls||"stip"}">💡 ${esc(x.t)}</div>`).join("")}
function ingRow(r,g,k,f){const L=r.ilv[k]||"E";const cf=r.cf;const w=cf&&cf.w&&cf.w[k];const sb=cf&&cf.sub&&cf.sub[k];const has=inP(g.item);
const more=(L!=="E"&&(w||sb))?`<details class="why"><summary>${L==="O"?"Don't make a special trip":L==="S"?"Easy substitution":"Why this matters"}</summary>${w?`<p>${esc(w)}</p>`:""}${sb?`<p class="sbx"><b>Swap:</b> ${esc(sb.x)}${det&&det.s!==r.s?` <i>(amount is for the original ${r.s} servings)</i>`:""}<br><span class="mut">${esc(sb.d)}</span></p>`:""}</details>`:"";
return`<li><div class="ir"><span class="q">${esc(ingText(g,f))} ${cf?`<span class="lv lv${L}">${LVN[L]}</span>`:""}</span><button class="have-b ${has?"on":""}" data-a="have" data-it="${esc(g.item)}">${has?"✓ Have":"+ Have"}</button></div>${more}</li>`}
/* ---------- grocery ---------- */
function weekEntries(w){return weekDates(w).flatMap(d=>(S.plan[d]||[]).map(e=>({...e,date:d})))}
function sources(){const wk=weekEntries(S.week);const src=[];if(S.gmode!=="selected")wk.forEach(e=>{if(e.lo)return;const r=R_(e.id);if(r)src.push({r,s:e.s,lbl:DAYS[weekDates(S.week).indexOf(e.date)].slice(0,3)+" "+MT[e.m]})});if(S.gmode!=="week"){const planned=new Set(wk.map(e=>e.id));Object.entries(S.basket).forEach(([id,s])=>{id=+id;if(S.gmode==="all"&&planned.has(id))return;const r=R_(id);if(r)src.push({r,s,lbl:"Selected",sel:1})})}return src}
function grocery(){const m=new Map();for(const so of sources()){const f=so.s/so.r.s;for(const[gk,g] of so.r.i.entries()){if(SKIP.has(g.item))continue;let e=m.get(g.item);if(!e){e={key:g.item,sec:secOf(g.item),v:0,w:0,g:0,m:0,o:{},taste:false,src:new Set(),lv:null,sb:null};m.set(g.item,e)}const L=(so.r.ilv&&so.r.ilv[gk])||"E";if(e.lv==null||LVR[L]>LVR[e.lv]){e.lv=L;e.sb=(so.r.cf&&so.r.cf.sub&&so.r.cf.sub[gk])||null}if(g.q==null)e.taste=true;else if(UB[g.u])e[UB[g.u][0]]+=g.q*f*UB[g.u][1];else e.o[g.u]=(e.o[g.u]||0)+g.q*f;e.src.add(so.r.n)}}return[...m.values()]}
const chk=()=>S.checked[S.week]||(S.checked[S.week]={});
const gone=()=>S.gone[S.week]||(S.gone[S.week]={});
const gVis=e=>!(S.hidePantry&&inP(e.key))&&!gone()[e.key]&&!(S.skipOpt&&e.lv==="O");
const gGrp=e=>e.lv==="O"?"opt":e.lv==="R"?"rec":"must";
/* ---------- ui helpers ---------- */
let tab="home";
function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2100)}
function gst(r){const c=CATS[r.c];return`--g1:${c.g[0]};--g2:${c.g[1]}`}
const rImg=r=>(S.photos&&S.photos[r.id])||r.img||"";
/* A real photograph, or nothing. Generated illustrations (data:image/svg) and emoji are no longer shown as recipe art;
   recipes without a verified photo get a typographic cover with the dish name instead. */
const realImg=r=>{const u=rImg(r);return u&&!/^data:image\/svg/.test(u)?u:""};
const coverKick=r=>esc(r.cu||(CATS[r.c]?CATS[r.c].n:""));
function art(r,cls){const u=realImg(r);if(u)return`<div class="art photo ${cls||""}" style="${gst(r)}"><i style="background-image:url('${u}')"></i></div>`;
return`<div class="art cover ${cls||""}"><div class="cv"><span class="cv-k">${coverKick(r)}</span><span class="cv-t">${esc(r.n.replace(/\s*\(.*\)\s*$/,""))}</span><span class="cv-r"></span></div></div>`}
const mini=(r,lg)=>{const u=realImg(r);return u?`<span class="mini photo${lg?" lg":""}"><i style="background-image:url('${u}')"></i></span>`:`<span class="mini cover${lg?" lg":""}" aria-hidden="true">${esc((r.n.trim()[0]||"·").toUpperCase())}</span>`};
function confetti(){const E=["🍕","🌮","🍝","🍔","🥞","🍪","🍣","🥑","🧀","🍩","🍲","♥"];for(let k=0;k<28;k++){const s=document.createElement("span");s.className="cf";s.textContent=E[k%E.length];s.style.left=Math.random()*100+"vw";s.style.animationDelay=Math.random()*.5+"s";s.style.fontSize=(18+Math.random()*20)+"px";s.style.setProperty("--dx",(Math.random()*140-70)+"px");document.body.appendChild(s);setTimeout(()=>s.remove(),3200)}}
/* ---------- tabs & render ---------- */
const TABS=[["home","🏠","Home"],["recipes","📖","Recipes"],["cookbook","📚","Cookbook"],["plan","🗓️","Planner"],["pantry","🧺","Pantry"],["groceries","🛒","Groceries"]];
function render(keep){const y=keep?window.scrollY:0;$("#view").innerHTML=V[tab]();$("#tabs").innerHTML=TABS.map(([k,i,n])=>`<button class="${tab===k?"on":""}" data-a="go" data-t="${k}"><span class="i">${i}</span>${n}${k==="groceries"&&gCount()?`<span class="bd">${gCount()}</span>`:""}</button>`).join("");const bc=gCount();$("#hdrBasket").innerHTML="🛒"+(bc?` <b>${bc}</b>`:"");if(tab==="recipes")fillGrid();document.body.classList.toggle("night",!!S.night);window.scrollTo(0,y)}
function gCount(){const c=chk();return grocery().filter(e=>gVis(e)&&!c[e.key]).length+S.extras.filter(x=>!x.done).length}
function go(t){tab=t;try{history.replaceState(null,"","#"+t)}catch(e){}render()}
/* ---------- HOME ---------- */
let lastPick=0,spinning=false,ruleI=0;
const V={};
V.home=()=>{const t=todayIso();const today=(S.plan[t]||[]);const ti=weekDates(S.week).indexOf(t);
const day=Math.floor(Date.now()/864e5);const pick=(L,n,seed)=>{L=L.slice();const o=[];let x=seed%233280;while(L.length&&o.length<n){x=(x*9301+49297)%233280;o.push(L.splice(x%L.length,1)[0])}return o};
const easy=pick(RECIPES.filter(r=>r.t<=30&&!["treats","sides","breakfast"].includes(r.c)),10,day);
const world=pick(RECIPES.filter(r=>r.p===7&&!["treats","sides"].includes(r.c)),10,day+7);
const sweet=pick(RECIPES.filter(r=>r.c==="treats"),10,day+3);
const tile=(a,i,n,x)=>`<button class="qt" data-a="${a}"${x||""}><span>${i}</span>${n}</button>`;
return`<section class="hero2"><div class="hz"><img src="${ICON}" alt=""><div><div class="ht">Hi Rose ♡</div><div class="hs">Favorite meal? <b>The next one.</b></div></div></div>
<button class="btn gold full" data-a="decide">🤔 What are we eating tonight?</button></section>
<div class="qa">${tile("spin","🎰","Surprise me")}${tile("pantryMake","🧺","Use what we have")}${tile("go","🗓️","Plan the week",' data-t="plan"')}${tile("go","🛒","Groceries",' data-t="groceries"')}${tile("addMine","⭐","Add a recipe")}${tile("tkSearch","🎵","Search TikTok")}${tile("openBook","📚","Cookbook")}${tile("timers","⏱","Timer")}</div>
<div id="spinOut"></div>
<section class="card"><div class="row sb"><b>Today${ti>=0?" · "+DAYS[ti]:""}</b><button class="link" data-a="go" data-t="plan">Planner →</button></div>
${today.length?today.map(e=>{const r=R_(e.id);return r?`<div class="tn"><div class="tni" data-a="open" data-id="${r.id}">${art(r)}<span class="mt">${MT[e.m]}</span></div><div class="tnb"><b data-a="open" data-id="${r.id}">${esc(r.n)}</b><small>⏱ ${r.t>=120?Math.round(r.t/60)+" hr":r.t+" min"} · serves ${e.s} · have ${stats(r).have}/${stats(r).tot}</small><button class="btn sm" data-a="cook" data-id="${r.id}">👩‍🍳 Start cooking</button></div></div>`:""}).join(""):`<div class="row sb" style="margin-top:6px"><span class="mut small">Nothing planned yet today.</span><button class="btn sm" data-a="planDlg" data-date="${t}">＋ Plan something</button></div>`}</section>
${leftCard()}
<div class="h2 sb">Tonight, keep it easy<button class="link" data-a="homeMore" data-k="30">See all</button></div><div class="strip">${easy.map(card).join("")}</div>
<div class="h2 sb">🌍 Around the world<button class="link" data-a="homeMore" data-p="7">See all</button></div><div class="strip">${world.map(card).join("")}</div>
<div class="h2">Browse by cuisine</div><div class="chips cuz">${["Egyptian","Chinese","Mexican","Italian","American","Indian","Thai","Korean","Japanese","Greek","Southern","Lebanese"].filter(c=>RECIPES.some(r=>r.cu===c)).map(c=>`<button class="chip" data-a="homeMore" data-cu="${c}">${c}</button>`).join("")}</div>
<div class="chips cuz">${MAINS.map(([k,n])=>`<button class="chip" data-a="homeMore" data-mn="${k}">${n}</button>`).join("")}</div>
<div class="h2 sb">🍪 Something sweet<button class="link" data-a="homeMore" data-c="treats">See all</button></div><div class="strip">${sweet.map(card).join("")}</div>
<div class="hfoot"><button data-a="go" data-t="recipes"><b>${RECIPES.length}</b> recipes</button><button data-a="favs"><b>${S.fav.length}</b> favorites</button><button data-a="go" data-t="pantry"><b>${S.pantry.length}</b> in pantry</button></div>
<section class="rulec" data-a="rule"><small>Rose's Kitchen Rule #<span id="rn">${ruleI+1}</span> · tap for another</small><div id="rt">${RULES[ruleI]}</div></section>
<div class="center mut small" style="margin:14px 0 6px">Made with ♡ for Rose</div>`};
function spin(){if(spinning)return;spinning=true;const out=$("#spinOut");let n=0,delay=45;const pool=RECIPES.filter(r=>r.id!==lastPick&&(!isCooked(r.id)||Math.random()<.2));const tick=()=>{const r=pool[Math.floor(Math.random()*pool.length)];out.innerHTML=`<div class="card spinbox rolling" style="margin-top:12px">${mini(r,1)}<b style="font-family:var(--serif);font-size:17px">${esc(r.n)}</b></div>`;n++;delay*=1.13;if(n<20)setTimeout(tick,delay);else{spinning=false;lastPick=r.id;out.innerHTML=`<div class="card" style="margin-top:12px;padding:0;overflow:hidden"><div style="height:150px">${art(r)}</div><div style="padding:14px"><div class="mut small">The next one is…</div><div style="font:700 22px var(--serif);margin:2px 0 10px">${esc(r.n)}</div><div class="row g8 wrap" style="margin-top:0"><button class="btn sm" data-a="open" data-id="${r.id}">See recipe</button><button class="btn sm ghost" data-a="planDlg" data-id="${r.id}" data-date="${todayIso()}">＋ Plan it</button><button class="btn sm ghost" data-a="spin">🎲 Spin again</button></div></div></div>`;confetti()}};tick()}
/* ---------- RECIPES ---------- */
const F={q:"",cat:"all",part:0,time:0,fav:false,lim:24,cu:"",mn:""};
function card(r){const f=isFav(r.id);return`<div class="rc"><div data-a="open" data-id="${r.id}" style="cursor:pointer">${art(r)}${r.hot?`<span class="tag">🔥 TikTok</span>`:r.p===1?`<span class="tag">★ Original</span>`:""}<div class="meta"><div class="rm">${r.cu?esc(r.cu)+" · ":""}${CATS[r.c].n} · ${r.t>=120?Math.round(r.t/60)+" hr":r.t+" min"}</div><div class="rn">${esc(r.n)}</div></div></div>${isCooked(r.id)?`<span class="ck-tag">Cooked ✓</span>`:""}<button class="hrt" data-a="fav" data-id="${r.id}" aria-label="Favorite">${f?"♥":"♡"}</button><div class="meta" style="padding-top:0"><div class="ra"><button class="${inBasket(r.id)?"on":""}" data-a="basket" data-id="${r.id}">${inBasket(r.id)?"✓ In list":"🛒 Select"}</button><button data-a="planDlg" data-id="${r.id}">＋ Plan</button></div></div></div>`}
function filtered(skipCu){const q=F.q.trim().toLowerCase();return RECIPES.filter(r=>(F.cat==="all"||r.c===F.cat)&&(skipCu||!F.cu||r.cu===F.cu)&&(!F.mn||(r.mn||[]).includes(F.mn))&&(!F.part||r.p===F.part)&&(!F.time||r.t<=F.time)&&(!F.fav||isFav(r.id))&&(!q||r.n.toLowerCase().includes(q)||r.d.toLowerCase().includes(q)||(r.cu||"").toLowerCase().includes(q)||CATS[r.c].n.toLowerCase().includes(q)||r.keys.some(k=>k.includes(q))))}
V.recipes=()=>{const bc=Object.keys(S.basket).length;return`<h1 class="h1">The Menu</h1>
${bc?`<div class="card row sb" style="background:var(--rose2)"><span><b>${bc}</b> recipe${bc>1?"s":""} selected for groceries</span><span class="row" style="gap:4px"><button class="btn sm" data-a="go" data-t="groceries">Groceries →</button><button class="btn sm ghost" data-a="clearBasket">Clear</button></span></div>`:""}
<div class="row g8" style="margin:0 0 10px"><button class="btn" style="flex:1" data-a="addMine">⭐ Add a recipe</button><button class="btn ghost" style="flex:1" data-a="tkSearch">🎵 Search TikTok</button></div>
<input class="search" placeholder="Search recipes or ingredients (try 'chicken')" value="${esc(F.q)}" data-in="rq" type="search">
<div class="chips">${[["all","All"],...Object.entries(CATS).map(([k,c])=>[k,c.e+" "+c.n])].map(([k,n])=>`<button class="chip ${F.cat===k?"on":""}" data-a="fcat" data-k="${k}">${n}</button>`).join("")}</div>
<div class="chips mains">${[["","Everything"],...MAINS].map(([k,n])=>`<button class="chip ${F.mn===k?"on":""}" data-a="fmn" data-k="${k}">${n}</button>`).join("")}</div>
<div class="filters"><select class="inp" data-ch="fcu"><option value="">🌍 Any cuisine</option>${cuList().map(([c,n])=>`<option value="${esc(c)}" ${F.cu===c?"selected":""}>${esc(c)} (${n})</option>`).join("")}</select></div>
<div class="filters"><select class="inp" data-ch="fpart"><option value="0">All parts</option>${[1,2,3,4,5,6,7,8].filter(p=>p<MINE_P||(S.mine||[]).length).map(p=>`<option value="${p}" ${F.part===p?"selected":""}>${PARTS[p]}</option>`).join("")}</select><select class="inp" data-ch="ftime"><option value="0">Any time</option>${[15,20,30,45,60].map(t=>`<option value="${t}" ${F.time===t?"selected":""}>${t} min or less</option>`).join("")}</select></div>
<div class="row sb" style="margin-top:10px"><label class="toggle" style="padding:0"><span class="sw"><input type="checkbox" data-ch="ffav" ${F.fav?"checked":""}><span></span></span>Favorites only</label><button class="link" data-a="resetF">Reset filters</button></div>
<div id="tkHint"></div><div class="mut small" id="rcnt" style="margin-top:8px"></div><div class="grid" id="rgrid"></div><div id="rmore"></div>`};
function cuList(){const c={};filtered(true).forEach(r=>{if(r.cu)c[r.cu]=(c[r.cu]||0)+1});if(F.cu&&!c[F.cu])c[F.cu]=0;return Object.entries(c).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))}
function fillGrid(){const L=filtered();const q=F.q.trim();$("#tkHint").innerHTML=q?`<button class="tkbar" data-a="tkGo" data-q="${esc(q)}">🎵 Can't find it? Search “${esc(q)}” on TikTok</button>`:"";$("#rcnt").textContent=L.length+" recipe"+(L.length===1?"":"s");$("#rgrid").innerHTML=L.length?L.slice(0,F.lim).map(card).join(""):`<div class="empty" style="grid-column:1/-1">No matches. Rose would still eat something though.<br><button class="btn sm" style="margin-top:10px" data-a="resetF">Reset filters</button></div>`;$("#rmore").innerHTML=L.length>F.lim?`<button class="btn ghost more" data-a="moreR">Show more (${L.length-F.lim} left)</button>`:""}
/* ---------- DETAIL ---------- */
let det=null,sheetKind=null;
function sheet(html,kind){sheetKind=kind;$("#sheetIn").innerHTML=html;$("#shw").classList.add("open");document.body.style.overflow="hidden"}
function closeSheet(){$("#shw").classList.remove("open");$("#shw").style.zIndex="";sheetKind=null;if(ck){return}document.body.style.overflow=$("#book").classList.contains("open")?"hidden":"";if(!$("#book").classList.contains("open"))render(true);else refreshBook()}
function openDetail(id){const r=R_(id);det={id,s:r.s,tk:false};noteRecent(id);sheet(dDetail(),"detail");$("#sheet").scrollTop=0}
/* Reader navigation: the reading order is the cookbook order (chapters -> sections -> recipes), built once from ORG.book(). */
let FLAT=null;
function flatBook(){if(FLAT)return FLAT;FLAT=[];ORG.book().chapters.forEach((c,ci)=>c.secs.forEach(s=>s.ids.forEach(id=>FLAT.push({id,ci}))));return FLAT}
function navOf(id){const F=flatBook();const k=F.findIndex(x=>x.id===id);if(k<0)return null;const ci=F[k].ci;const first=F.findIndex(x=>x.ci===ci);let last=first;while(last+1<F.length&&F[last+1].ci===ci)last++;const chFirst=c=>F.find(x=>x.ci===c).id;const B=ORG.book().chapters;
return{pos:k+1,n:F.length,prev:k>0?F[k-1].id:null,next:k<F.length-1?F[k+1].id:null,pch:first>0?chFirst(F[first-1].ci):null,nch:last<F.length-1?chFirst(F[last+1].ci):null,chName:B[ci].n,chPos:B[ci].no,chN:B.length,chNo:k-first+1,chCount:last-first+1}}
function noteRecent(id){if(!Array.isArray(S.recent))S.recent=[];S.recent=[id,...S.recent.filter(x=>x!==id)].slice(0,12);save()}
function isBm(id){return Array.isArray(S.bm)&&S.bm.includes(id)}
/* Reading position: saved each time the cookbook turns a page; restored by "Continue reading". */
function saveResume(part,id){if(!RID[id])return;S.resume={part:+part||0,id,at:Date.now()};save()}
function readingBox(){
  const rec=(Array.isArray(S.recent)?S.recent:[]).filter(id=>RID[id]).slice(0,6);
  const bms=(Array.isArray(S.bm)?S.bm:[]).filter(id=>RID[id]);
  const btn=(id)=>`<button class="rb-item" data-a="open" data-id="${id}" aria-label="Open ${esc(RID[id].n)}">${esc(RID[id].n)}</button>`;
  let h="";
  if(S.resume&&RID[S.resume.id])h+=`<button class="btn full big rose" data-a="resume" aria-label="Continue reading ${esc(RID[S.resume.id].n)}">▶ Continue reading: ${esc(RID[S.resume.id].n)}</button>`;
  if(bms.length)h+=`<section class="rb" aria-label="Bookmarks"><h3>🔖 Bookmarks</h3><div class="rb-list">${bms.map(btn).join("")}</div></section>`;
  if(rec.length)h+=`<section class="rb" aria-label="Recently viewed"><h3>Recently viewed</h3><div class="rb-list">${rec.map(btn).join("")}</div></section>`;
  return h}
/* Swipe between recipes in the recipe sheet. Only a mostly-horizontal gesture counts, so scrolling still works;
   gestures that start on buttons, inputs, or the ingredient list are ignored so cooking and steppers are unaffected. */
(function(){let sx=0,sy=0,st=0,skip=false;const sh=()=>document.getElementById("sheetIn");
document.addEventListener("touchstart",e=>{const t=e.target;const s=document.getElementById("shw");if(!s||!s.classList.contains("open")||sheetKind!=="detail"){skip=true;return}
skip=!!(t.closest&&t.closest("button,input,textarea,select,a,.ings,.rnav-row,[data-a]"));sx=e.touches[0].clientX;sy=e.touches[0].clientY;st=Date.now()},{passive:true});
document.addEventListener("touchend",e=>{if(skip||!det)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Date.now()-st>700)return;
if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*2)return;const g=navOf(det.id);if(!g)return;if(dx<0&&g.next)openDetail(g.next);else if(dx>0&&g.prev)openDetail(g.prev)},{passive:true});})();
function navBar(id){const g=navOf(id);if(!g)return"";const b=(a,t,v,lab)=>`<button class="btn ghost" data-a="${a}" data-id="${v}"${v?"":" disabled"} aria-label="${lab}">${t}</button>`;
return`<nav class="rnav" aria-label="Reading navigation"><div class="rnav-pos">${esc(g.chName)} · recipe ${g.chNo} of ${g.chCount} · book ${g.pos} of ${g.n}</div><div class="rnav-row">${b("rchprev","‹ Chapter",g.pch,"Previous chapter")}${b("rprev","‹ Recipe",g.prev,"Previous recipe")}${b("rnext","Recipe ›",g.next,"Next recipe")}${b("rchnext","Chapter ›",g.nch,"Next chapter")}</div><button class="btn ${isBm(id)?"sage":"ghost"} full" data-a="bm" data-id="${id}" aria-pressed="${isBm(id)}">${isBm(id)?"🔖 Bookmarked":"🔖 Bookmark this recipe"}</button></nav>`}
function rerSheet(){if(!sheetKind)return;const sc=$("#sheet").scrollTop;if(sheetKind==="detail")$("#sheetIn").innerHTML=dDetail();else if(sheetKind==="plan")$("#sheetIn").innerHTML=dPlan();$("#sheet").scrollTop=sc}
function dDetail(){const r=R_(det.id),c=CATS[r.c],f=det.s/r.s,st=stats(r),rt=S.rating[r.id]||0;const custom=!!S.tk[r.id];
return`<div class="d-art">${art(r)}</div>${!S.photos[r.id]&&typeof PHOTO_SRC!=="undefined"&&PHOTO_SRC[r.id]?`<div class="pcred">Photo: ${esc(PHOTO_SRC[r.id])}</div>`:""}<div class="d-body">
<div class="d-cat">${r.mine?"⭐ Our own recipe":r.p===7?"🌍 "+(r.cu?esc(r.cu)+" · ":"")+"Around the world":PARTS[r.p].split(" · ")[0]} · ${c.e} ${c.n}${r.hot?" · 🔥 TikTok famous":""}</div>
${navBar(r.id)}<h2 class="d-t">${esc(r.n)}</h2><p class="d-desc">${esc(r.d)}</p>
<div class="d-meta"><span>⏱ ${r.t>=120?Math.round(r.t/60)+" hours":r.t+" min"}</span><span>🔥 ${r.cz}/10 cozy</span><span>📶 ${r.df}</span><span>💛 ${esc(r.gf)}</span><span>${TIER[st.tier][0]} ${TIER[st.tier][1]}</span>${isCooked(r.id)?"<span>✅ Cooked</span>":""}</div>
<button class="btn full big rose" style="margin-bottom:8px" data-a="cook" data-id="${r.id}">👩‍🍳 Start cooking (step by step)</button>${(()=>{const cs=cookStats(r.id);return cs?`<div class="mut small" style="margin:-2px 0 8px">Made ${cs.n} time${cs.n>1?"s":""} · last on ${nice(cs.last)}</div>`:""})()}<div class="d-acts"><button class="btn ${isFav(r.id)?"rose":"ghost"}" data-a="fav" data-id="${r.id}">${isFav(r.id)?"♥ Favorite":"♡ Favorite"}</button><button class="btn ${isCooked(r.id)?"sage":"ghost"}" data-a="cooked" data-id="${r.id}">${isCooked(r.id)?"✓ Cooked":"Mark cooked"}</button><button class="btn ${inBasket(r.id)?"sage":"ghost"}" data-a="basket" data-id="${r.id}">${inBasket(r.id)?"✓ In list":"🛒 Select"}</button><button class="btn" style="grid-column:span 2" data-a="planDlg" data-id="${r.id}">＋ Add to planner</button><button class="btn ghost" data-a="bookAt" data-id="${r.id}">📚 Book</button></div>
<button class="tt" data-a="tiktok" data-id="${r.id}">▶ ${S.tk[r.id]?"Watch it on TikTok":"Search it on TikTok"} <small>opens the TikTok app</small></button>
${tipsBox(r)}<div class="sec-h"><h3>Ingredients</h3><div class="stepper"><button data-a="ds" data-v="-1">−</button><span>${det.s}</span><button data-a="ds" data-v="1">＋</button></div></div><div class="mut small" style="margin-bottom:4px">Servings (recipe makes ${r.s}). Tap Have to update your pantry.</div>
<ul class="ings">${r.i.map((g,k)=>ingRow(r,g,k,f)).join("")}</ul>${r.cf?`<div class="mut small" style="margin:6px 0 0">Labels show how much each ingredient matters. Tap “Don't make a special trip” or “Easy substitution” for why.</div>`:""}${whatNeed(st)}
${st.miss.length?`<button class="btn ${inBasket(r.id)?"sage":"ghost"} full" style="margin-top:10px" data-a="addMissing" data-id="${r.id}">${inBasket(r.id)?"✓ On the grocery list":`🛒 Add the ${st.miss.length} missing item${st.miss.length>1?"s":""} to groceries`}</button>`:`<div class="allhave">🎉 You have everything for this one!</div>`}
<h3>Directions</h3><ol class="steps">${r.st.map((s,k)=>`<li>${esc(s)}${stepTip(r,k)}</li>`).join("")}</ol>
<h3>Our rating</h3><div class="rating">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="${rt>=n?"on":""}" data-a="rate" data-id="${r.id}" data-v="${n}">${n}</button>`).join("")}</div>
<h3>Our notes</h3><textarea class="inp" rows="3" maxlength="1200" placeholder="Extra garlic next time. Rose had thirds." data-in="note" data-id="${r.id}">${esc(S.notes[r.id]||"")}</textarea>
<div class="row g8 wrap" style="margin-top:16px">${r.mine?`<button class="btn sm ghost" data-a="editMine" data-id="${r.id}">✏️ Edit recipe</button>`:""}<label class="btn sm ghost">📷 ${rImg(r)?"Change photo":"Add photo"}<input type="file" accept="image/*" data-ch="recPhoto" data-id="${r.id}" style="display:none"></label>${S.photos[r.id]?`<button class="btn sm ghost" data-a="recPhotoReset" data-id="${r.id}">↺ Original photo</button>`:""}<button class="btn sm ghost" data-a="delRec" data-id="${r.id}">🗑 Delete recipe</button></div><h3>TikTok link</h3>${det.tk?`<input class="inp" id="tkin" type="url" placeholder="https://www.tiktok.com/@creator/video/…" value="${esc(S.tk[r.id]||"")}"><div class="row g8"><button class="btn sm" data-a="tkSave" data-id="${r.id}">Save link</button>${custom?`<button class="btn sm ghost" data-a="tkReset" data-id="${r.id}">Reset to search</button>`:""}<button class="btn sm ghost" data-a="tkEdit">Cancel</button></div>`:`<button class="link" data-a="tkEdit">✏️ ${custom?"Change your saved link":"Found the perfect TikTok? Save the link"}</button>`}
</div>`}
function validTk(u){try{const x=new URL(u);return x.protocol==="https:"&&/(^|\.)tiktok\.com$/i.test(x.hostname)&&u.length<=500}catch(e){return false}}
function unGone(id){const r=R_(id);if(!r||!S.gone[S.week])return;r.keys.forEach(k=>delete S.gone[S.week][k])}
function addMissing(id){const r=R_(id);if(inBasket(id)){toast("Already on the grocery list ✓");return}const n=stats(r).miss.length;S.basket[id]=r.s;unGone(id);save();toast(`🛒 Added ${n} item${n===1?"":"s"} for ${r.n}`);after()}
/* ---------- PLAN DIALOG ---------- */
let pd=null;
function planDlg(id,date,edit){const dates=weekDates(S.week);pd=edit?{...edit}:{uid:null,id:id||0,date:date&&dates.includes(date)?date:(dates.includes(todayIso())?todayIso():dates[0]),m:id?(R_(id).c==="breakfast"?"B":R_(id).c==="treats"?"S":R_(id).c==="lunch"?"L":"D"):"D",s:id?R_(id).s:2,q:""};if(date&&!dates.includes(date)){S.week=iso(mondayOf(fromIso(date)));pd.date=date}sheet(dPlan(),"plan")}
function dPlan(){const dates=weekDates(S.week);const r=pd.id?R_(pd.id):null;const q=pd.q.trim().toLowerCase();const L=r?[]:RECIPES.filter(x=>!q||x.n.toLowerCase().includes(q)).slice(0,40);
return`<div class="d-body" style="padding-top:22px"><h2 class="d-t">${pd.uid?"Edit planned meal":"Add to the planner"}</h2>
${r?`<div class="prow sel">${mini(r)}<span class="pn">${esc(r.n)}<small>${CATS[r.c].n} · ${r.t} min</small></span><button class="link" data-a="pdChange">Change</button></div>`:`<input class="search" placeholder="Search recipes…" data-in="pdq" value="${esc(pd.q)}" type="search"><div id="pdl" style="margin-top:8px;max-height:38vh;overflow:auto">${pdList(L)}</div>`}
<div class="mut small" style="margin-top:12px">Day · ${nice(dates[0])} to ${nice(dates[6])}</div>
<div class="daypick">${dates.map((d,k)=>`<button data-a="pdDay" data-d="${d}" style="${pd.date===d?"background:var(--wine);color:#fff":""}">${DAYS[k].slice(0,3)}<small>${fromIso(d).getDate()}</small></button>`).join("")}</div>
<div class="mut small" style="margin-top:12px">Meal</div><div class="mtpick">${Object.entries(MT).map(([k,n])=>`<button class="${pd.m===k?"on":""}" data-a="pdM" data-k="${k}">${n}</button>`).join("")}</div>
<div class="row sb" style="margin-top:14px"><span class="mut small">Servings</span><div class="stepper"><button data-a="pdS" data-v="-1">−</button><span>${pd.s}</span><button data-a="pdS" data-v="1">＋</button></div></div>
<button class="btn full big" style="margin-top:16px" data-a="pdSave" ${r?"":"disabled"}>${pd.uid?"Save changes":"＋ Add to "+DAYS[dates.indexOf(pd.date)]}</button>
${pd.uid?`<button class="btn ghost full" style="margin-top:8px" data-a="pdDel">Remove from plan</button>`:""}</div>`}
function pdList(L){return L.map(x=>`<button class="prow" data-a="pdPick" data-id="${x.id}">${mini(x)}<span class="pn">${esc(x.n)}<small>${CATS[x.c].n} · ${x.t} min</small></span></button>`).join("")||`<div class="empty">No matches</div>`}
/* ---------- PLANNER ---------- */
V.plan=()=>{const dates=weekDates(S.week);const wk=weekEntries(S.week);const serv=wk.reduce((a,e)=>a+e.s,0);const t=todayIso();
return`<h1 class="h1">This Week's Menu</h1>
<div class="card"><div class="weeknav"><button class="btn sm ghost" data-a="wk" data-v="-1">‹ Prev</button><div class="wl">${nice(dates[0])} – ${nice(dates[6])}</div><button class="btn sm ghost" data-a="wk" data-v="1">Next ›</button></div>
<div class="row sb" style="margin-top:10px"><span><b>${wk.length}</b> meal${wk.length===1?"":"s"} · <b>${serv}</b> servings</span>${S.week!==iso(curMon())?`<button class="link" data-a="wk" data-v="0">Today</button>`:""}</div>
<button class="btn full big" style="margin-top:10px" data-a="showList" ${wk.length?"":"disabled"}>🛒 Show grocery list for all meals selected</button>
<div class="row g8 wrap"><button class="btn sm ghost" data-a="fillWeek">🎲 Fill empty days with dinners</button><button class="btn sm ghost" data-a="copyLast">↻ Copy last week</button>${wk.length?`<button class="btn sm ghost" data-a="clearWeek">🗑 Clear week</button>`:""}</div></div>
${dates.map((d,k)=>{const E=S.plan[d]||[];return`<div class="card day ${d===t?"today":""}"><div class="row sb"><div class="dn">${DAYS[k]}<small>${nice(d)}</small>${d===t?`<span class="pill">Today</span>`:""}</div><button class="btn sm" data-a="planDlg" data-date="${d}">＋ Add</button></div>
${E.length?E.map(e=>{const r=R_(e.id);if(!r)return"";return`<div class="pe"><span data-a="open" data-id="${r.id}">${mini(r)}</span><span class="pn" data-a="open" data-id="${r.id}"><span class="mt">${MT[e.m]}</span>${e.lo?"🥡 ":""}${esc(r.n)}${e.lo?" <small>(leftovers)</small>":""}<small>Serves ${e.s} · ${r.t} min</small></span><button class="x" data-a="peEdit" data-date="${d}" data-u="${e.uid}" aria-label="Edit">✎</button><button class="x" data-a="peDel" data-date="${d}" data-u="${e.uid}" aria-label="Remove">✕</button></div>`}).join(""):`<div class="mut small pad">Nothing yet. ${EMPTYQ[k]}</div>`}</div>`}).join("")}`};
/* ---------- GROCERIES ---------- */
V.groceries=()=>{const all=grocery();const c=chk();const G=gone();const show=all.filter(gVis);const nGone=all.filter(e=>G[e.key]).length;const exS=S.extras.map(x=>({...x,sec:secOf(x.name.toLowerCase())}));document.body.classList.toggle("store",storeMode);const hidden=all.filter(e=>!G[e.key]&&S.hidePantry&&inP(e.key)).length;const done=show.filter(e=>c[e.key]).length;const src=sources();
const mkSecs=(items,xs0)=>AISLES.map(([k,n])=>{const it=items.filter(e=>e.sec===k&&!(storeMode&&c[e.key])).sort((a,b)=>(!!c[a.key]-!!c[b.key])||a.key.localeCompare(b.key));const xs=xs0.filter(x=>x.sec===k&&!(storeMode&&x.done));return it.length||xs.length?`<div class="gsec"><div class="gsh">${n}<span>${it.filter(e=>!c[e.key]).length+xs.filter(x=>!x.done).length} left</span></div>${it.map(e=>`<div class="gi ${c[e.key]?"done":""}" data-a="gchk" data-k="${esc(e.key)}"><span class="cb">${c[e.key]?"✓":""}</span><span class="gt"><b>${esc(cap(e.key))}</b> · <span class="amt">${esc(amtText(e))}</span><small>${[...e.src].slice(0,3).map(esc).join(" · ")}${e.src.size>3?" +"+(e.src.size-3)+" more":""}</small>${swapNote(e)}</span><button class="x gx" data-a="gdel" data-k="${esc(e.key)}" aria-label="Remove from list">✕</button></div>`).join("")}${xs.map(x=>`<div class="gi ${x.done?"done":""}" data-a="exChk" data-u="${x.uid}"><span class="cb">${x.done?"✓":""}</span><span class="gt"><b>${esc(x.name)}</b>${x.amt?` · <span class="amt">${esc(x.amt)}</span>`:""}<small>Added by you</small></span><button class="x gx" data-a="exDel" data-u="${x.uid}" aria-label="Remove from list">✕</button></div>`).join("")}</div>`:""}).join("");
const GRP=[["must","🛒 Must buy","Needed for the dish to work, or no good swap.",show.filter(e=>gGrp(e)==="must"),exS],["rec","👍 Recommended","Worth buying, but you can cook without them.",show.filter(e=>gGrp(e)==="rec"),[]],["opt","🌿 Optional","Don't make a special trip for these.",show.filter(e=>gGrp(e)==="opt"),[]]];
const secs=GRP.map(([k,t,d,it,xs])=>{const body=mkSecs(it,xs);if(!body)return"";const n=it.filter(e=>!c[e.key]).length+xs.filter(x=>!x.done).length;return`<div class="ghd g-${k}"><b>${t}</b><span>${n} left</span><small>${d}</small></div>${body}`}).join("");
const nOpt=all.filter(e=>e.lv==="O"&&!G[e.key]&&!(S.hidePantry&&inP(e.key))).length;
const ex=nGone?`<div class="center" style="margin:6px 0 14px"><button class="link" data-a="gRestore">↺ Bring back ${nGone} removed item${nGone>1?"s":""}</button></div>`:"";
return`<h1 class="h1">Groceries</h1>
<div class="card"><select class="inp" data-ch="gmode"><option value="all" ${S.gmode==="all"?"selected":""}>List from: planner + recipes I picked</option><option value="week" ${S.gmode==="week"?"selected":""}>List from: this week's planner only</option><option value="selected" ${S.gmode==="selected"?"selected":""}>List from: recipes I picked only</option></select>
<label class="toggle"><span>Leave out optional ingredients${nOpt?` <span class="mut small">(${nOpt} ${S.skipOpt?"left off":"on the list"})</span>`:""}</span><span class="sw"><input type="checkbox" data-ch="skipopt" ${S.skipOpt?"checked":""}><span></span></span></label>
<label class="toggle"><span>Hide what's already in my pantry${hidden?` <span class="mut small">(${hidden} hidden)</span>`:""}</span><span class="sw"><input type="checkbox" data-ch="hidep" ${S.hidePantry?"checked":""}><span></span></span></label>
${show.length||S.extras.length?`<div class="row sb"><b>${done} of ${show.length} in the cart</b><span class="mut small">${src.length} meal${src.length===1?"":"s"}</span></div><div class="bar"><div style="width:${show.length?done/show.length*100:0}%"></div></div>
<div class="row g8 wrap"><button class="btn sm ${storeMode?"sage":""}" data-a="storeMode">${storeMode?"✓ Store mode on":"🛒 Store mode"}</button><button class="btn sm ghost" data-a="copyList">📋 Copy list</button>${CANDL?`<button class="btn sm ghost" data-a="dlList">⬇︎ .txt</button>`:""}${done?`<button class="btn sm sage" data-a="toPantry">🧺 Mark checked as in pantry</button><button class="btn sm ghost" data-a="uncheck">↺ Reset checks</button>`:""}<button class="btn sm ghost" data-a="gClear">🗑 Clear list</button></div><div class="mut small" style="margin-top:8px">Tap an item to check it off. Tap ✕ to take it off the list.</div>`:""}</div>
<div class="chips" style="padding-top:0">${STAPLES.map(n=>`<button class="chip" data-a="staple" data-v="${n}">＋ ${n}</button>`).join("")}</div><form class="addf" data-f="addEx"><input class="inp" id="exN" placeholder="Add anything…" maxlength="80"><input class="inp" id="exA" placeholder="Amt" style="width:80px" maxlength="20"><button class="btn sm">Add</button></form>
${!src.length&&!S.extras.length?`<div class="empty big"><div class="e">🛒</div><b>Nothing on the list yet.</b><br>Plan some meals or tap "🛒 Select" on any recipe and the list builds itself.<div class="row g8" style="justify-content:center"><button class="btn sm" data-a="go" data-t="plan">🗓️ Planner</button><button class="btn sm ghost" data-a="go" data-t="recipes">📖 Recipes</button></div></div>`:""}
${secs}${ex}
${src.length?`<div class="card srcs"><b>Where this list comes from</b>${src.map(so=>`<div class="pe">${mini(so.r)}<span class="pn">${esc(so.r.n)}<small>${so.lbl}</small></span>${so.sel?`<span class="srv"><small>servings</small><span class="stepper"><button data-a="bsv" data-id="${so.r.id}" data-v="-1" aria-label="Fewer servings">−</button><span>${so.s}</span><button data-a="bsv" data-id="${so.r.id}" data-v="1" aria-label="More servings">＋</button></span></span><button class="x" data-a="basket" data-id="${so.r.id}" aria-label="Take this recipe off the list">✕</button>`:`<span class="mut small">${so.s} servings</span>`}</div>`).join("")}<div class="mut small" style="margin-top:6px">Servings change how much of each ingredient is on the list. Planned meals are changed in the Planner.</div></div>`:""}`};
function swapNote(e){const sb=e.sb;if(!sb||e.lv==="O")return"";const have=sb.k&&sb.k.length&&sb.k.every(x=>inP(x));return`<small class="swap">${have?"🔁 You already have what you need to swap: ":"Or swap: "}${esc(sb.x)}</small>`}
function listText(){const c=chk();const show=grocery().filter(gVis);const dates=weekDates(S.week);let t=`🛒 Rose's EATS grocery list\nWeek of ${nice(dates[0])} · ${sources().length} meals\n`;[["must","MUST BUY"],["rec","RECOMMENDED"],["opt","OPTIONAL (no special trip)"]].forEach(([g,gn])=>{const sg=show.filter(e=>gGrp(e)===g);if(!sg.length)return;t+=`\n== ${gn} ==\n`;AISLES.forEach(([k,n])=>{const it=sg.filter(e=>e.sec===k);if(!it.length)return;t+=`\n${n}\n`+it.map(e=>`${c[e.key]?"☑":"☐"} ${cap(e.key)}: ${amtText(e)}${e.sb&&e.lv!=="O"?" (or swap: "+e.sb.x+")":""}`).join("\n")+"\n"})});if(S.extras.length)t+="\n📝 Extras\n"+S.extras.map(x=>`${x.done?"☑":"☐"} ${x.name}${x.amt?": "+x.amt:""}`).join("\n")+"\n";return t+"\nWhat's Rose's favorite meal? The next one. ♡"}
async function copyText(t,label){try{await navigator.clipboard.writeText(t);toast((label||"Copied")+" ✓ Paste it in a text!");return}catch(e){}sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Copy this</h2><p class="mut small">Your browser blocked automatic copying. Tap in the box, Select All, then Copy.</p><textarea class="inp" rows="14" readonly id="cpT">${esc(t)}</textarea></div>`,"copy");setTimeout(()=>{const x=$("#cpT");if(x){x.focus();x.select()}},100)}
function dl(name,t,type){try{const b=new Blob([t],{type:type||"text/plain"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast("Downloading "+name)}catch(e){copyText(t)}}
/* ---------- PANTRY ---------- */
let kSeg="make",kQ="",kAisle="all",kLim=10,kFold=false,kClosed=new Set(),pickSel=new Set(),pickOpen=false;
const TRANK={ready:0,minor:1,subs:2,almost:3};
function pantryLists(){const M=RECIPES.map(stats);const fl=FLEX();const ok=m=>m.tier==="almost"?(fl>=3&&m.buy.length<=(fl>=4?3:1)):(m.tier==="ready"||(m.tier==="minor"&&fl>=1)||(m.tier==="subs"&&fl>=2));
const ready=M.filter(ok).sort((a,b)=>TRANK[a.tier]-TRANK[b.tier]||a.buy.length-b.buy.length||b.r.cz-a.r.cz||a.r.t-b.r.t);
const near=M.filter(m=>m.tier==="almost"&&!ok(m)&&m.buy.length<=3).sort((a,b)=>a.buy.length-b.buy.length||b.pct-a.pct||a.r.t-b.r.t);return{ready,near}}
V.pantry=()=>{const{ready,near}=pantryLists();
return`<h1 class="h1">My Pantry</h1>
<div class="kstats"><div class="stat"><b>${S.pantry.length}</b><span>ingredients at home</span></div><div class="stat"><b>${ready.length}</b><span>ready to make</span></div><div class="stat"><b>${near.length}</b><span>1–3 essentials away</span></div></div>
<div class="seg"><button class="${kSeg==="have"?"on":""}" data-a="kseg" data-k="have">🧺 What we have</button><button class="${kSeg==="make"?"on":""}" data-a="kseg" data-k="make">✨ What can I make?</button></div>
${kSeg==="have"?vHave():vMake(ready,near)}`};
function vHave(){return`<form class="addf" data-f="addIng"><input class="inp" id="ingN" placeholder="Add something we have (e.g. chicken drumsticks)" maxlength="60"><button class="btn sm">Add</button></form>
<div class="card small">Tap everything that's in the fridge, freezer and cabinets. Then check <b>What can I make?</b></div>
<input class="search" placeholder="Search ${ALLITEMS.length} ingredients…" value="${esc(kQ)}" data-in="kq" type="search">
<div class="chips"><button class="chip ${kAisle==="all"?"on":""}" data-a="kaisle" data-k="all">All aisles</button>${AISLES.filter(a=>ALLITEMS.some(x=>secOf(x)===a[0])).map(([k,n])=>`<button class="chip ${kAisle===k?"on":""}" data-a="kaisle" data-k="${k}">${n}</button>`).join("")}</div>
<div class="seg" style="margin:6px 0 8px"><button class="${kMode==="have"?"on":""}" data-a="kmode" data-k="have">Tap = we have it</button><button class="${kMode==="soon"?"on":""}" data-a="kmode" data-k="soon">Tap = use it soon ⏰</button></div>${(S.soon||[]).length?`<div class="mut small">⏰ Use soon: ${S.soon.map(esc).join(", ")}</div>`:""}<div class="row g8 wrap" style="margin:4px 0 12px"><button class="btn sm sage" data-a="basics">＋ Mark common basics</button><button class="btn sm ghost" data-a="kclear">Clear all</button></div>
<div id="klist">${kList()}</div>`}
function kList(){const q=kQ.trim().toLowerCase();return AISLES.map(([k,n])=>{if(kAisle!=="all"&&kAisle!==k)return"";const it=ALLITEMS.filter(x=>secOf(x)===k&&(!q||x.includes(q)));if(!it.length)return"";return`<div class="gsec"><div class="gsh">${n}<span>${it.filter(inP).length}/${it.length}</span></div><div class="kchips">${it.map(x=>`<button class="kc ${inP(x)?"on":""} ${(S.soon||[]).includes(x)?"soon":""}" data-a="ktog" data-it="${esc(x)}">${(S.soon||[]).includes(x)?"⏰ ":inP(x)?"✓ ":""}${esc(x)}</button>`).join("")}</div></div>`}).join("")||`<div class="empty">No ingredients match "${esc(kQ)}"</div>`}
function vMake(ready,near){return`${S.pantry.length<=6?`<div class="card" style="background:var(--rose2)">👋 Start in <b>What we have</b> and tap what's in the kitchen. Right now it only knows about ${S.pantry.map(esc).join(", ")||"nothing"}.<div class="row g8"><button class="btn sm" data-a="kseg" data-k="have">Mark what we have</button></div></div>`:""}
<div class="card"><b>What can I cook tonight?</b><div class="mut small" style="margin:2px 0 8px">Choose how flexible you want to be. Skipped, swapped and missing ingredients are always shown on each card.</div><div class="kchips">${FLEXN.map((n,i)=>`<button class="kc ${FLEX()===i?"on":""}" data-a="flex" data-v="${i}">${n}</button>`).join("")}</div></div>
${(()=>{const so=S.soon||[];if(!so.length)return"";const U=ready.concat(near).map(m=>({m,u:m.r.keys.filter(k=>so.includes(k))})).filter(x=>x.u.length).sort((a,b)=>b.u.length-a.u.length||a.m.miss.length-b.m.miss.length).slice(0,6);return`<div class="h2">⏰ Use it up before it goes bad <span class="cnt">${U.length}</span></div>`+(U.length?U.map(x=>mkCard(x.m,0,x.u)).join(""):`<div class="empty">Nothing uses ${so.map(esc).join(", ")} yet. Try a more flexible option above.</div>`)})()}<div class="h2">🎉 You can cook these <span class="cnt">${ready.length}</span></div>
${ready.length?ready.slice(0,kLim).map(m=>mkCard(m,1)).join(""):`<div class="empty">Nothing fits that setting yet. Try a more flexible option above, or mark more of what you have.</div>`}
<div class="h2">🛒 Almost ready: 1–3 essentials away <span class="cnt">${near.length}</span></div>
${near.length?near.slice(0,kLim).map(m=>mkCard(m)).join(""):`<div class="empty">Nothing close yet. Mark more of what you have.</div>`}
${ready.length>kLim||near.length>kLim?`<button class="btn ghost more" data-a="kmore">Show more</button>`:""}`}
function mkCard(m,ready,uses){const r=m.r;const T=TIER[m.tier];return`<div class="card">${uses?`<div class="nchip" style="background:#FDE7C8;color:#9A5A12;margin:0 0 8px">⏰ uses ${uses.map(esc).join(", ")}</div>`:""}<div class="mk-top" data-a="open" data-id="${r.id}">${mini(r,1)}<span class="pn">${esc(r.n)}<small>${CATS[r.c].e} ${CATS[r.c].n} · ${r.t} min · ${r.cz}/10 cozy</small></span></div><div class="tierb t-${m.tier}">${T[0]} ${T[1]}${m.tier==="almost"?` · ${m.buy.length} essential${m.buy.length>1?"s":""} to buy`:""}</div>${whatNeed(m)}<div class="row g8 wrap"><button class="btn sm ghost" data-a="open" data-id="${r.id}">View</button><button class="btn sm ghost" data-a="planDlg" data-id="${r.id}">＋ Plan</button>${m.tier==="ready"?"":`<button class="btn sm ${inBasket(r.id)?"sage":""}" data-a="addMissing" data-id="${r.id}">${inBasket(r.id)?"✓ On the list":"🛒 Add to groceries"}</button>`}</div></div>`}
/* ---------- COOKBOOK TAB ---------- */

V.cookbook=()=>`<h1 class="h1">The Cookbook</h1>
<div class="closedbook" data-a="openBook"><img src="${ICON}" alt=""><div class="cbt">ROSE'S EATS</div><div class="cbs">The Cookbook · ${RECIPES.length} recipes</div><div class="cbq">"What's my favorite meal?<br>The next one."</div></div>
${readingBox()}<button class="btn full big" data-a="openBook">📚 Open the cookbook</button>
<p class="center mut small">Turn your phone sideways 📱↔️ and swipe to flip the pages.</p>
<div class="h2">Open to a part</div>
${[0,1,2,3,4,5,6,7].concat((S.mine||[]).length?[8]:[]).map(p=>`<button class="prow" data-a="openBook" data-part="${p}"><span class="mini" style="--g1:#9B3450;--g2:#5A1626;color:#E8C48C;font:700 18px var(--serif)">${p||"★"}</span><span class="pn">${p?PARTS[p]:"The whole book"}<small>${p?RECIPES.filter(r=>r.p===p).length:RECIPES.length} recipes</small></span></button>`).join("")}`;
/* ---------- BOOK ---------- */
let BL=[],pf=null,bookPart=0,bServ={},bLand=null,hintShown=false;
const PG0=3;
const pageOf=k=>PG0+2*k;
function openBook(part,startId){bookPart=+part||0;BL=bookList(bookPart);let start=0;if(startId){let k=BL.findIndex(r=>r.id===startId);if(k<0){bookPart=0;BL=RECIPES.slice();k=BL.findIndex(r=>r.id===startId)}start=pageOf(k)}
$("#bkPart").innerHTML=`<option value="0">All parts</option>`+[1,2,3,4,5,6,7,8].filter(p=>p<MINE_P||(S.mine||[]).length).map(p=>`<option value="${p}" ${bookPart===p?"selected":""}>${p<MINE_P?"Part "+p:"Our recipes"}</option>`).join("");fillJump();$("#book").classList.add("open");document.body.style.overflow="hidden";requestAnimationFrame(()=>{buildBook(start);if(!hintShown){hintShown=true;const h=$("#bkHint");h.classList.add("show");setTimeout(()=>h.classList.remove("show"),3200)}})}
function fillJump(){$("#bkJump").innerHTML=`<option value="0">📖 Cover & contents</option>`+BL.map((r,k)=>`<option value="${pageOf(k)}">#${r.id} ${esc(r.n)}</option>`).join("")}
function closeBook(){if(pf){try{pf.destroy()}catch(e){}pf=null}$("#stage").innerHTML="";$("#book").classList.remove("open");document.body.style.overflow="";render(true)}
const pw=(cls,html,dens,no)=>`<div class="bpg ${cls}"${dens?' data-density="hard"':""}><div class="pi">${html}</div>${no?`<div class="pno">${no}</div>`:""}</div>`;
function ingLi(r,sv){const f=sv/r.s;return r.i.map(g=>{const q=g.q!=null?g.q*f:null;const amt=(q!=null?fmtQ(q):"")+(g.u?" "+uL(g.u,q):"");return`<li class="${inP(g.item)?"have":""}">${amt.trim()?`<b>${esc(amt.trim())}</b>`:""}<span>${esc(cap(g.item))}${g.note?`<span style="opacity:.65">, ${esc(g.note)}</span>`:""}</span></li>`}).join("")}
function btnState(a,id){if(a==="fav")return[isFav(id),isFav(id)?"♥ Saved":"♡ Save"];if(a==="cooked")return[isCooked(id),isCooked(id)?"✓ Cooked":"☐ Cooked"];return[inBasket(id),inBasket(id)?"✓ Groceries":"+ Groceries"]}
const bb=(a,id)=>{const[on,t]=btnState(a,id);return`<button class="${on?"on":""}" data-a="${a}" data-id="${id}">${t}</button>`};
function bookPages(){const P=[];const parts={};BL.forEach((r,k)=>{if(!(r.p in parts))parts[r.p]=k});
P.push(pw("R",`<div class="cover"><div class="cover-in"><img src="${ICON}" alt=""><div class="t">ROSE'S EATS</div><div class="s">The Cookbook · ${BL.length} recipes</div><div class="q">"What's Rose's favorite meal?"<br>"The next one."</div></div></div>`,1));
P.push(pw("L",`<div class="endp"><div style="font:italic 15px var(--serif);color:#6D5A4C">This book belongs to</div><div style="font:700 44px/1.1 var(--script);color:#7A2338;margin:6px 0 10px">Rose ♡</div><div style="font:13px/1.5 var(--serif);color:#6D5A4C;max-width:260px">Cozy scale 1–10 · times are estimates · every recipe can open TikTok.<br><br>Swipe or drag a page corner to turn the page.</div></div>`,0,""));
P.push(pw("R",typeof bookTocHTML==="function"&&!bookPart?bookTocHTML():`<div class="scr"><div class="kick">Contents</div><h2>${bookPart?esc(PARTS[bookPart]):"Every part, all delicious"}</h2><div class="toc">${Object.entries(parts).map(([p,k])=>`<a data-a="bkGo" data-i="${pageOf(k)}">${esc(PARTS[p])}<i></i>${pageOf(k)}</a>`).join("")}</div></div>`,0,""));
BL.forEach((r,k)=>{const c=CATS[r.c],sv=bServ[r.id]||r.s,n=pageOf(k);
P.push(pw("L",`<div class="bphoto">${art(r)}${typeof chapDivHTML==="function"?chapDivHTML(r,k):""}<div class="bpt"><span>🌹 Rose's EATS</span><span>${r.mine?"⭐ Ours":r.cu?esc(r.cu):"Part "+r.p}</span></div><div class="bpb"><small>The next one club</small><h2>${esc(r.n)} ♡</h2><p>${esc(r.gf)}</p></div></div><div class="bpx"><p class="desc">${esc(r.d)}</p><div class="bmeta"><span>♡ Cozy ${r.cz}/10</span><span>⏱ ${r.t>=120?Math.round(r.t/60)+" hr":r.t+" min"}</span><span>${esc(r.df)}</span></div><div class="nxt">Turn the page for the recipe ›</div></div>`,0,n));
P.push(pw("R",`<div class="scr"><div class="kick">${c.e} ${c.n} · ${r.mine?"Our own recipe":"Recipe "+(k+1)+" / "+BL.length}</div><h2>${esc(r.n)}</h2><p class="desc">${esc(r.d)}</p><div class="bmeta"><span>♡ Cozy ${r.cz}/10</span><span>⏱ ${r.t>=120?Math.round(r.t/60)+" hr":r.t+" min"}</span><span>${esc(r.df)}</span></div><div class="bact"><button class="tk" data-a="tiktok" data-id="${r.id}">▶ TikTok ${esc(tkLbl(r))}</button>${bb("fav",r.id)}${bb("basket",r.id)}<button data-a="cook" data-id="${r.id}">👩‍🍳 Cook</button><button data-a="planDlg" data-id="${r.id}">+ Plan</button>${bb("cooked",r.id)}</div><div class="cols"><div><h4>Ingredients <span class="bserv"><button data-a="bkS" data-id="${r.id}" data-v="-1">−</button><span id="sv-${r.id}">${sv}</span><button data-a="bkS" data-id="${r.id}" data-v="1">+</button></span></h4><ul class="ing2" id="bi-${r.id}">${ingLi(r,sv)}</ul></div><div><h4>Directions</h4><ol class="st2">${r.st.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div></div><div class="gfor"><b>Perfect for:</b> ${esc(r.gf)}${S.notes[r.id]?`<br><b>Our notes:</b> ${esc(S.notes[r.id])}`:""}</div></div>`,0,n+1))});
P.push(pw("L",`<div class="endp"><div style="font-size:54px">🍽️</div><h2 style="font:700 30px var(--serif);margin:8px 0;color:#5A1626">The End?</h2></div>`,0,""));
P.push(pw("R",`<div class="endp"><h2 style="font:700 24px var(--serif);color:#5A1626;margin:0 0 6px">Of course not.</h2><p style="font:italic 15px var(--serif);color:#6D5A4C">There's always the next one. ♡</p><div class="bact" style="justify-content:center"><button data-a="bkGo" data-i="0">↺ Back to the cover</button></div></div>`,0,""));
P.push(pw("L",`<div class="cover"><div class="cover-in"><img src="${ICON}" alt=""><div class="q">Made with ♡ for Rose</div></div></div>`,1));
return P.join("")}
function buildBook(start){const st=$("#stage");if(pf){try{pf.destroy()}catch(e){}pf=null}st.innerHTML="";const land=innerWidth>innerHeight;bLand=land;$("#book").classList.toggle("port",!land);$("#book").classList.toggle("land",land);
const W=st.clientWidth,H=st.clientHeight;let w,h;if(land){h=H;w=Math.min(W/2,h*1.08);h=Math.min(h,w/0.8)}else{w=Math.min(W,560);h=H}w=Math.floor(w);h=Math.floor(h);
const el=document.createElement("div");el.className="fb";el.innerHTML=bookPages();st.appendChild(el);
pf=new St.PageFlip(el,{width:w,height:h,size:"fixed",showCover:true,usePortrait:true,mobileScrollSupport:true,maxShadowOpacity:.55,flippingTime:900,drawShadow:true,disableFlipByClick:true,clickEventForward:true,swipeDistance:25,showPageCorners:true,startPage:start||0,autoSize:true,startZIndex:0});
pf.loadFromHTML(el.querySelectorAll(".bpg"));pf.on("flip",e=>syncCnt(e.data));syncCnt(start||0)}
function syncCnt(p){const k=Math.floor((p-PG0)/2);const inR=p>=PG0&&k<BL.length;if(inR)saveResume(bookPart,BL[k].id);$("#bkCnt").textContent=inR?`${k+1} / ${BL.length}`:p<PG0?"Cover":"The End";$("#bkJump").value=inR?String(pageOf(k)):"0"}
function curPage(){try{return pf?pf.getCurrentPageIndex():0}catch(e){return 0}}
function refreshBook(){if(!pf)return;document.querySelectorAll("#stage [data-a=fav],#stage [data-a=cooked],#stage [data-a=basket]").forEach(b=>{const[on,t]=btnState(b.dataset.a,+b.dataset.id);b.classList.toggle("on",on);b.textContent=t})}
/* ---------- SETTINGS ---------- */
function settings(){sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Settings & backup</h2>
<div class="card howto"><b>📲 Put Rose's EATS on your Home Screen</b><ol class="small"><li>Open the link in <b>Safari</b>.</li><li>Tap <b>Share</b> (square with the arrow).</li><li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol></div>
<label class="toggle card" style="margin-bottom:12px"><span>🌙 Cozy night mode</span><span class="sw"><input type="checkbox" data-ch="night" ${S.night?"checked":""}><span></span></span></label>
<div class="card"><b>💞 Share between two phones</b><p class="small mut" style="margin:6px 0 10px">Each phone keeps its own favorites, plans and pantry. To send yours to the other phone: copy the backup code, text it, then paste it here on the other phone. Importing replaces that phone's data.</p>
<div class="row g8 wrap" style="margin-top:0"><button class="btn sm" data-a="expCopy">📋 Copy backup code</button>${CANDL?`<button class="btn sm ghost" data-a="expFile">⬇︎ Download .json</button>`:""}</div>
<textarea class="inp" id="impT" rows="3" placeholder="Paste a backup code here…" style="margin-top:10px"></textarea><div class="row g8 wrap"><button class="btn sm" data-a="impGo">Import pasted code</button><label class="btn sm ghost">Import .json file<input type="file" accept=".json,application/json,text/plain" data-ch="impFile" style="display:none"></label></div></div>
<div class="card small"><b>Your numbers</b><div class="mut" style="margin-top:4px">${S.fav.length} favorites · ${S.cooked.length} cooked · ${Object.keys(S.rating).length} rated · ${Object.keys(S.notes).length} notes · ${S.pantry.length} pantry items · ${Object.values(S.plan).flat().length} planned meals</div><div class="mut" style="margin-top:6px">Saved privately in this browser on this phone. No account, no sign-up.</div></div>
<div class="card small"><b>📷 Photo & recipe credits</b><div class="mut" style="margin-top:4px">Around-the-world recipe text comes from TheMealDB (themealdb.com). Photos are shown only where the licence is verified (credited on the recipe). Every other recipe shows an original illustration made for this app until a licensed photo is found. Your own photos stay on your phone. Details in <a href="photo-manifest.json" target="_blank" rel="noopener">photo-manifest.json</a>.</div></div>
${(S.hidden||[]).length?`<div class="card"><b>🗑 Deleted recipes</b><div class="mut small" style="margin:4px 0 8px">Tap Restore to bring one back.</div>${S.hidden.map(id=>{const r=RID[id];return r?`<div class="pe">${mini(r)}<span class="pn">${esc(r.n)}</span><button class="btn sm ghost" data-a="unhide" data-id="${id}">Restore</button></div>`:""}).join("")}</div>`:""}<button class="btn ghost full" data-a="resetAll">Reset everything</button></div>`,"settings")}
function expCode(){return"ROSESEATS1:"+btoa(unescape(encodeURIComponent(JSON.stringify(S))))}
function cleanImport(txt){txt=(txt||"").trim();let o;if(txt.startsWith("ROSESEATS1:"))o=JSON.parse(decodeURIComponent(escape(atob(txt.slice(11)))));else{o=JSON.parse(txt);if(o&&o.state)o=o.state}if(!o||typeof o!=="object"||!o.v)throw new Error("bad");const f=fresh();const mineIds=new Set((Array.isArray(o.mine)?o.mine:[]).map(m=>m&&m.id));const ids=a=>Array.isArray(a)?a.filter(x=>RID[x]||mineIds.has(x)):[];f.fav=ids(o.fav);f.cooked=ids(o.cooked);f.pantry=Array.isArray(o.pantry)?o.pantry.filter(x=>typeof x==="string"&&x.length<60):f.pantry;if(o.basket&&typeof o.basket==="object")for(const[k,v] of Object.entries(o.basket))if(RID[k]&&v>0&&v<=24)f.basket[k]=+v;if(o.plan&&typeof o.plan==="object")for(const[d,E] of Object.entries(o.plan))if(/^\d{4}-\d\d-\d\d$/.test(d)&&Array.isArray(E))f.plan[d]=E.filter(e=>e&&RID[e.id]).map(e=>({uid:String(e.uid||uid()),id:+e.id,s:Math.min(24,Math.max(1,+e.s||2)),m:MT[e.m]?e.m:"D"}));if(o.checked&&typeof o.checked==="object")f.checked=o.checked;if(Array.isArray(o.extras))f.extras=o.extras.filter(x=>x&&x.name).slice(0,200).map(x=>({uid:String(x.uid||uid()),name:String(x.name).slice(0,80),amt:String(x.amt||"").slice(0,20),done:!!x.done}));if(o.tk)for(const[k,v] of Object.entries(o.tk))if(RID[k]&&validTk(v))f.tk[k]=v;if(o.rating)for(const[k,v] of Object.entries(o.rating))if(RID[k]&&v>=1&&v<=10)f.rating[k]=Math.round(v);if(o.notes)for(const[k,v] of Object.entries(o.notes))if(RID[k])f.notes[k]=String(v).slice(0,1200);["thr","maxMiss"].forEach(k=>{if(typeof o[k]==="number")f[k]=o[k]});["gmode"].forEach(k=>{if(["all","week","selected"].includes(o[k]))f[k]=o[k]});f.hidePantry=o.hidePantry!==false;if(Array.isArray(o.mine))f.mine=o.mine.filter(m=>m&&m.id>=1000&&m.n).slice(0,200);if(Array.isArray(o.left))f.left=o.left.filter(x=>x&&x.date);if(Array.isArray(o.log))f.log=o.log.filter(x=>x&&x.date).slice(-2000);if(Array.isArray(o.soon))f.soon=o.soon.filter(x=>typeof x==="string");f.night=!!o.night;if(Array.isArray(o.hidden))f.hidden=o.hidden.filter(x=>RID[x]);if(Array.isArray(o.myIng))f.myIng=o.myIng.filter(x=>typeof x==="string"&&x.length<60).slice(0,300);if(o.photos&&typeof o.photos==="object")for(const[k,v] of Object.entries(o.photos))if(RID[k]&&typeof v==="string"&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(v))f.photos[k]=v;if(o.gone&&typeof o.gone==="object")f.gone=o.gone;return f}
function doImport(txt){let n;try{n=cleanImport(txt)}catch(e){toast("That code didn't work. Copy the whole thing and try again.");return}confirmDlg("Replace this phone's data with the backup?","This swaps in the favorites, plans, pantry, notes and grocery list from the code.","Yes, import it",()=>{S=n;save();syncMine();closeSheet();toast("Imported ♡");render()})}
function confirmDlg(t,body,yes,fn){confirmDlg.fn=fn;sheet(`<div class="d-body" style="padding-top:26px;text-align:center"><h2 class="d-t">${esc(t)}</h2><p class="mut">${esc(body)}</p><button class="btn full big" data-a="cfYes">${esc(yes)}</button><button class="btn ghost full" style="margin-top:8px" data-a="closeSheet">Never mind</button></div>`,"confirm")}
/* ---------- actions ---------- */
const A={
go:el=>{if($("#book").classList.contains("open"))closeBook();if(sheetKind)closeSheet();go(el.dataset.t)},
joke:el=>{el.classList.toggle("flip");if(el.classList.contains("flip"))confetti()},
spin:()=>spin(),
rule:()=>{ruleI=(ruleI+1)%RULES.length;$("#rt").textContent=RULES[ruleI];$("#rn").textContent=ruleI+1},
favs:()=>{F.fav=true;go("recipes")},
pantryMake:()=>{kSeg="make";go("pantry")},
flex:el=>{S.flex=+el.dataset.v;save();render(true)},
open:el=>openDetail(+el.dataset.id),
closeSheet:()=>closeSheet(),
fav:el=>{const id=+el.dataset.id;const on=togArr(S.fav,id);save();toast(on?"Saved to favorites ♥":"Removed from favorites");after()},
cooked:el=>{const id=+el.dataset.id;const on=togArr(S.cooked,id);save();toast(on?"Marked cooked ✓ (how was it?)":"Unmarked cooked");after()},
basket:el=>{const id=+el.dataset.id;if(inBasket(id))delete S.basket[id];else{S.basket[id]=R_(id).s;unGone(id)}save();toast(inBasket(id)?"Added to grocery selection 🛒":"Removed from grocery selection");after()},
clearBasket:()=>{S.basket={};save();render(true)},
fcat:el=>{F.cat=el.dataset.k;F.lim=24;render(true)},
fmn:el=>{F.mn=el.dataset.k;F.lim=24;render(true)},
resetF:()=>{Object.assign(F,{q:"",cat:"all",part:0,time:0,fav:false,lim:24,cu:"",mn:""});render(true)},
moreR:()=>{F.lim+=24;fillGrid()},
ds:el=>{det.s=Math.min(24,Math.max(1,det.s+ +el.dataset.v));rerSheet()},
have:el=>{const it=el.dataset.it;const on=togArr(S.pantry,it);save();toast(on?`${cap(it)} added to pantry`:`${cap(it)} removed from pantry`);rerSheet()},
addMissing:el=>addMissing(+el.dataset.id),
rate:el=>{const id=+el.dataset.id,v=+el.dataset.v;if(S.rating[id]===v)delete S.rating[id];else S.rating[id]=v;save();rerSheet()},
tkEdit:()=>{det.tk=!det.tk;rerSheet()},
tkSave:el=>{const v=$("#tkin").value.trim();if(!validTk(v)){toast("Use a https://tiktok.com link");return}S.tk[el.dataset.id]=v;save();det.tk=false;toast("TikTok link saved ✓");rerSheet()},
tkReset:el=>{delete S.tk[el.dataset.id];save();det.tk=false;rerSheet()},
bookAt:el=>{const id=+el.dataset.id;closeSheet();lastWH=innerWidth+"x"+innerHeight;openBook(0,id)},
rprev:el=>{const g=navOf(det.id);if(g&&g.prev)openDetail(g.prev)},
rnext:el=>{const g=navOf(det.id);if(g&&g.next)openDetail(g.next)},
rchprev:el=>{const g=navOf(det.id);if(g&&g.pch)openDetail(g.pch)},
rchnext:el=>{const g=navOf(det.id);if(g&&g.nch)openDetail(g.nch)},
resume:el=>{if(!S.resume||!RID[S.resume.id]){toast("Nothing to resume yet");return}lastWH=innerWidth+"x"+innerHeight;openBook(S.resume.part,S.resume.id)},
bm:el=>{const id=+el.dataset.id;if(!Array.isArray(S.bm))S.bm=[];S.bm=isBm(id)?S.bm.filter(x=>x!==id):[id,...S.bm];save();toast(isBm(id)?"Bookmarked 🔖":"Bookmark removed");rerSheet()},
planDlg:el=>planDlg(el.dataset.id?+el.dataset.id:0,el.dataset.date),
pdPick:el=>{pd.id=+el.dataset.id;const r=R_(pd.id);pd.s=r.s;pd.m=r.c==="breakfast"?"B":r.c==="treats"?"S":r.c==="lunch"?"L":"D";rerSheet()},
pdChange:()=>{pd.id=0;rerSheet()},
pdDay:el=>{pd.date=el.dataset.d;rerSheet()},
pdM:el=>{pd.m=el.dataset.k;rerSheet()},
pdS:el=>{pd.s=Math.min(24,Math.max(1,pd.s+ +el.dataset.v));rerSheet()},
pdSave:()=>{if(!pd.id)return;if(pd.uid){for(const d of Object.keys(S.plan)){const k=S.plan[d].findIndex(e=>e.uid===pd.uid);if(k>=0){S.plan[d].splice(k,1);if(!S.plan[d].length)delete S.plan[d]}}}(S.plan[pd.date]=S.plan[pd.date]||[]).push({uid:pd.uid||uid(),id:pd.id,s:pd.s,m:pd.m});unGone(pd.id);save();const r=R_(pd.id);toast(`${r.n} → ${DAYS[weekDates(S.week).indexOf(pd.date)]} ${MT[pd.m].toLowerCase()} ✓`);closeSheet()},
pdDel:()=>{delEntry(pd.date,pd.uid);closeSheet()},
peEdit:el=>{const e=(S.plan[el.dataset.date]||[]).find(x=>x.uid===el.dataset.u);if(e)planDlg(0,null,{...e,date:el.dataset.date,q:""})},
peDel:el=>{delEntry(el.dataset.date,el.dataset.u);render(true)},
wk:el=>{const v=+el.dataset.v;S.week=v?iso(addDays(fromIso(S.week),7*v)):iso(curMon());save();render(true)},
showList:()=>{go("groceries")},
fillWeek:()=>{const dates=weekDates(S.week);const used=new Set(weekEntries(S.week).map(e=>e.id));const pool=RECIPES.filter(r=>["soup","comfort","light","quick","prep"].includes(r.c)&&!used.has(r.id)).sort(()=>Math.random()-.5);let n=0;dates.forEach(d=>{if(!(S.plan[d]||[]).length){const r=pool.pop();if(r){S.plan[d]=[{uid:uid(),id:r.id,s:r.s,m:"D"}];n++}}});save();toast(n?`Added ${n} dinner${n>1?"s":""} 🎲`:"Every day already has something!");render(true)},
clearWeek:()=>confirmDlg("Clear this whole week?","Every planned meal from Monday to Sunday will be removed.","Yes, clear the week",()=>{weekDates(S.week).forEach(d=>delete S.plan[d]);delete S.checked[S.week];save();closeSheet();toast("Week cleared")}),
cfYes:()=>{const f=confirmDlg.fn;confirmDlg.fn=null;if(f)f()},
gchk:el=>{const c=chk(),k=el.dataset.k;if(c[k])delete c[k];else c[k]=1;save();render(true)},
uncheck:()=>{delete S.checked[S.week];save();render(true)},
toPantry:()=>{const c=chk();const ks=Object.keys(c);ks.forEach(k=>{if(!inP(k))S.pantry.push(k)});delete S.checked[S.week];save();toast(`${ks.length} item${ks.length>1?"s":""} moved into the pantry 🧺`);render(true)},
copyList:()=>copyText(listText(),"Grocery list copied"),
dlList:()=>dl("roses-eats-groceries.txt",listText()),
exChk:el=>{const x=S.extras.find(x=>x.uid===el.dataset.u);if(x){x.done=!x.done;save();render(true)}},
exDel:el=>{S.extras=S.extras.filter(x=>x.uid!==el.dataset.u);save();render(true)},
kseg:el=>{kSeg=el.dataset.k;kLim=10;render(true)},
kaisle:el=>{kAisle=el.dataset.k;render(true)},
kfold:()=>{kFold=!kFold;render(true)},
kaisleT:el=>{const k=el.dataset.k;kClosed.has(k)?kClosed.delete(k):kClosed.add(k);render(true)},
kexpAll:()=>{kClosed.clear();render(true)},
pickToggle:()=>{pickOpen=!pickOpen;render(true)},
pick:el=>{const it=el.dataset.it;pickSel.has(it)?pickSel.delete(it):pickSel.add(it);render(true)},
pickClear:()=>{pickSel.clear();render(true)},
pickAdd:()=>{const n=pickSel.size;pickSel.forEach(x=>{if(!S.pantry.includes(x))S.pantry.push(x)});pickSel.clear();pickOpen=false;save();toast(`Added ${n} to the pantry ✓`);render(true)},
kcolAll:()=>{AISLES.forEach(([k])=>kClosed.add(k));render(true)},
ktog:el=>{const it=el.dataset.it;togArr(S.pantry,it);save();const on=inP(it);el.classList.toggle("on",on);el.textContent=(on?"✓ ":"")+it;const st=document.querySelectorAll(".kstats .stat b");if(st[0])st[0].textContent=S.pantry.length},
basics:()=>{let n=0;BASICS.forEach(b=>{if(!inP(b)){S.pantry.push(b);n++}});save();toast(`Added ${n} basics`);render(true)},
kclear:()=>confirmDlg("Clear the whole pantry?","Every ingredient you marked will be unmarked.","Yes, clear it",()=>{S.pantry=[];save();closeSheet()}),
kmore:()=>{kLim+=15;render(true)},
openBook:el=>{lastWH=innerWidth+"x"+innerHeight;openBook(el.dataset.part||0)},
closeBook:()=>closeBook(),
bkPrev:()=>pf&&pf.flipPrev(),bkNext:()=>pf&&pf.flipNext(),
bkGo:el=>{if(pf){const i=+el.dataset.i;Math.abs(i-curPage())<=2?pf.flip(i):pf.turnToPage(i);syncCnt(i)}},
bkS:el=>{const id=+el.dataset.id;const r=R_(id);const v=Math.min(24,Math.max(1,(bServ[id]||r.s)+ +el.dataset.v));bServ[id]=v;const u=$("#bi-"+id);if(u)u.innerHTML=ingLi(r,v);const sv=$("#sv-"+id);if(sv)sv.textContent=v},
settings:()=>settings(),
expCopy:()=>copyText(expCode(),"Backup code copied"),
expFile:()=>dl("roses-eats-backup-"+todayIso()+".json",JSON.stringify({app:"Rose's EATS",exported:new Date().toISOString(),state:S},null,1),"application/json"),
impGo:()=>doImport($("#impT").value),
resetAll:()=>confirmDlg("Reset everything?","Favorites, pantry, plans, grocery checks, notes, ratings, links and your own recipes all go back to fresh. The built-in recipes stay.","Reset everything",()=>{S=fresh();save();syncMine();closeSheet();toast("Fresh start ✓")})
};
/* ================= NEW FEATURES ================= */
/* ---- our own recipes ---- */
const UNITW={cup:"cup",cups:"cup",c:"cup",tbsp:"tbsp",tbs:"tbsp",tablespoon:"tbsp",tablespoons:"tbsp",tsp:"tsp",teaspoon:"tsp",teaspoons:"tsp",lb:"lb",lbs:"lb",pound:"lb",pounds:"lb",oz:"oz",ounce:"oz",ounces:"oz",clove:"clove",cloves:"clove",can:"can",cans:"can",slice:"slice",slices:"slice",g:"g",grams:"g",kg:"kg",ml:"ml",pinch:"pinch",bunch:"bunch",head:"head",stalk:"stalk",stalks:"stalk",jar:"jar",jars:"jar",package:"pkg",packages:"pkg",pkg:"pkg",bag:"bag",bags:"bag",sheet:"sheet",fillet:"fillet",fillets:"fillet"};
const UF={"½":.5,"¼":.25,"¾":.75,"⅓":1/3,"⅔":2/3,"⅛":.125};
function parseFree(line){line=line.trim().replace(/^[-•*]\s*/,"");let q=null,rest=line;const m=line.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?\s*[½¼¾⅓⅔⅛]?|[½¼¾⅓⅔⅛])\s*(.*)$/);if(m){const raw=m[1].trim();q=0;raw.split(/\s+/).forEach(p=>{if(UF[p])q+=UF[p];else if(p.includes("/")){const[a,b]=p.split("/");q+=a/b}else{const f=p.match(/^(\d+(?:\.\d+)?)([½¼¾⅓⅔⅛])?$/);if(f){q+=parseFloat(f[1]);if(f[2])q+=UF[f[2]]}}});rest=m[2]}
const t=rest.split(/\s+/);let u="";if(t.length>1){const w=t[0].toLowerCase().replace(/\.$/,"");if(UNITW[w]){u=UNITW[w];t.shift()}}rest=t.join(" ").replace(/^of\s+/i,"");const[it,...note]=rest.split(",");return{q,u,item:it.trim().toLowerCase(),note:note.join(",").trim()}}
function mineToR(m){const r={id:m.id,n:m.n,c:CATS[m.c]?m.c:"comfort",e:"⭐",t:+m.t||30,df:m.df||"Easy",cz:+m.cz||9,s:+m.s||4,d:m.d||"One of our own. ♡",i:(m.ing||[]).filter(x=>x.trim()).map(parseFree),st:(m.st||[]).filter(x=>x.trim()),hot:false,gf:m.gf||"Our own recipe",h:"",p:MINE_P,img:m.img||(typeof ILLUS!=="undefined"?ILLUS({c:CATS[m.c]?m.c:"comfort",cu:""}):""),mine:true};r.keys=[...new Set(r.i.map(x=>x.item).filter(x=>x&&!SKIP.has(x)))];if(!r.keys.length)r.keys=["(no ingredients)"];r.mn=mainOf(r);prepChef(r);return r}
function syncMine(){RECIPES.length=0;for(const k of Object.keys(RID))delete RID[k];const hid=new Set(S.hidden||[]);BASE.forEach(r=>{RID[r.id]=r;if(!hid.has(r.id))RECIPES.push(r)});(S.mine||[]).forEach(m=>{const r=mineToR(m);RECIPES.push(r);RID[r.id]=r});ALLITEMS=[...new Set(RECIPES.flatMap(r=>r.keys).concat(S.myIng||[]))].filter(x=>x&&x!=="(no ingredients)").sort()}
const ING_RX=/^(\d|[½¼¾⅓⅔⅛]|a\s|an\s|one\s|two\s|three\s|half\s|pinch|dash|handful|salt|pepper)/i;
function parsePasted(txt){const L=String(txt||"").split(/\r?\n/).map(x=>x.replace(/^\s*(?:[-•*▢☐▪◦·✔️✅]+|step\s*\d+[:.)]?|\d+[.)](?=\s))\s*/i,"").trim()).filter(x=>x&&!/^(#\S+\s*)+$/.test(x));
const out={n:"",ing:[],st:[],t:0,s:0};let mode="";const HI=/^(ingredients?|what you('|’)?ll need|you('|’)?ll need|you will need|shopping list)\s*:?$/i,HS=/^(instructions?|directions?|method|steps?|how to( make it)?|preparation|to make)\s*:?$/i;
for(const x of L){if(HI.test(x)){mode="i";continue}if(HS.test(x)){mode="s";continue}
const tm=x.match(/^(?:total |cook |prep )?time\s*:?\s*(\d+)\s*(h|hr|hour|min)/i);if(tm){out.t=+tm[1]*(/^h/i.test(tm[2])?60:1);continue}
const sm=x.match(/^(?:serves|servings|yield|makes)\s*:?\s*(\d+)/i);if(sm){out.s=+sm[1];continue}
if(!out.n&&!mode&&x.length<90&&!ING_RX.test(x)){out.n=x.replace(/[#@]\S+/g,"").trim();continue}
if(mode==="i")out.ing.push(x);else if(mode==="s")out.st.push(x);else if(ING_RX.test(x)&&x.length<90)out.ing.push(x);else out.st.push(x)}
if(out.st.length===1&&out.st[0].length>220)out.st=out.st[0].split(/(?<=[.!?])\s+(?=[A-Z])/);return out}
let md=null;
function openMine(id){const m=id?S.mine.find(x=>x.id===id):null;md=m?{...m,ing:[...m.ing],st:[...m.st]}:{id:0,n:"",c:"comfort",t:30,s:4,cz:9,d:"",ing:[],st:[],img:"",tk:"",gf:""};if(m)md.tk=S.tk[m.id]||"";sheet(dMine(),"mine")}
function dMine(){return`<div class="d-body" style="padding-top:22px"><h2 class="d-t">${md.id?"Edit our recipe":"Add our own recipe"}</h2><p class="mut small" style="margin-top:-4px">Only a name and ingredients are needed. It works everywhere: planner, groceries, pantry and the cookbook.</p>${md.id?"":`<div class="paste"><b>✨ Auto-fill: paste a link or the recipe</b><div class="mut small">Paste the TikTok or website link to save it. For ingredients, paste the caption or recipe text too, because apps can't read the video itself.</div><textarea class="inp" id="mPaste" rows="5" placeholder="Paste the recipe here…"></textarea><button class="btn sm" data-a="minePaste">✨ Fill in the form for me</button></div>`}
<label class="photoup">${md.img?`<img src="${md.img}" alt="">`:`<span>📷<br>Add a photo<br><small>from your camera roll</small></span>`}<input type="file" accept="image/*" data-ch="mineImg" style="display:none"></label>
<div class="fl"><label>Name</label><input class="inp" id="mN" value="${esc(md.n)}" placeholder="Grandma's meatballs" maxlength="80"></div>
<div class="fl"><label>TikTok link (optional)</label><input class="inp" id="mT" value="${esc(md.tk)}" placeholder="https://www.tiktok.com/@…" type="url"></div>
<div class="fl"><label>Ingredients (one per line)</label><textarea class="inp" id="mI" rows="7" placeholder="1 lb ground beef&#10;2 cloves garlic, minced&#10;1 cup parmesan">${esc(md.ing.join("\n"))}</textarea></div>
<div class="fl"><label>Steps (one per line, optional)</label><textarea class="inp" id="mP" rows="6" placeholder="Brown the beef 6 to 8 minutes&#10;Add sauce and simmer 15 minutes">${esc(md.st.join("\n"))}</textarea></div>
<details class="more"><summary>More details (optional)</summary><div class="g3"><div class="fl"><label>Type</label><select class="inp" id="mC">${Object.entries(CATS).map(([k,c])=>`<option value="${k}" ${md.c===k?"selected":""}>${c.n}</option>`).join("")}</select></div><div class="fl"><label>Minutes</label><input class="inp" id="mM" type="number" inputmode="numeric" value="${md.t}"></div><div class="fl"><label>Serves</label><input class="inp" id="mS" type="number" inputmode="numeric" value="${md.s}"></div></div>
<div class="fl"><label>Short description</label><input class="inp" id="mD" value="${esc(md.d)}" placeholder="Why we love it" maxlength="200"></div></details>
<button class="btn full big" data-a="mineSave">${md.id?"Save changes":"＋ Save to our recipes"}</button>${md.id?`<button class="btn ghost full" style="margin-top:8px" data-a="mineDel">Delete this recipe</button>`:""}</div>`}
function readMineForm(){md.n=$("#mN").value.trim();md.tk=$("#mT").value.trim();md.c=$("#mC").value;md.t=+$("#mM").value||30;md.s=Math.max(1,+$("#mS").value||4);md.d=$("#mD").value.trim();md.ing=$("#mI").value.split("\n").map(x=>x.trim()).filter(Boolean);md.st=$("#mP").value.split("\n").map(x=>x.trim()).filter(Boolean)}
function shrinkImg(file,cb){const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,720/Math.max(im.width,im.height));const c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);cb(c.toDataURL("image/jpeg",.74))};im.onerror=()=>toast("Couldn't read that photo");im.src=rd.result};rd.readAsDataURL(file)}
/* ---- cooked log + leftovers ---- */
function logCooked(id){S.log=S.log||[];S.log.push({id,date:todayIso()});if(!isCooked(id))S.cooked.push(id);save();const r=R_(id);sheet(`<div class="d-body" style="padding-top:28px;text-align:center"><div style="font-size:52px">🎉</div><h2 class="d-t">${esc(r.n)}: cooked!</h2><p class="mut">Any leftovers going in the fridge?</p><button class="btn full big" data-a="leftYes" data-id="${id}">🥡 Yes, save leftovers</button><button class="btn ghost full" style="margin-top:8px" data-a="closeSheet">Nope, all gone 😋</button><p class="mut small" style="margin-top:14px">Don't forget to rate it on the recipe page.</p></div>`,"cooked")}
function cookStats(id){const L=(S.log||[]).filter(x=>x.id===id);return L.length?{n:L.length,last:L[L.length-1].date}:null}
const daysSince=d=>Math.round((fromIso(todayIso())-fromIso(d))/864e5);
function leftCard(){const L=S.left||[];if(!L.length)return"";return`<section class="card"><div class="row sb"><b>🥡 In the fridge</b><span class="mut small">eat within 4 days</span></div>${L.map(x=>{const r=R_(x.id);const d=daysSince(x.date);const left=4-d;const cls=left<=0?"bad":left<=1?"warn":"ok";return`<div class="pe">${r?mini(r):`<span class="mini">🥡</span>`}<span class="pn">${esc(r?r.n:x.name||"Leftovers")}<small class="lf ${cls}">${left<=0?"Past day 4, check before eating":left===1?"Eat by tomorrow":`Good for ${left} more days`} · made ${d===0?"today":d===1?"yesterday":d+" days ago"}</small></span><button class="btn sm sage" data-a="leftAte" data-u="${x.uid}">Ate it</button><button class="x" data-a="leftToss" data-u="${x.uid}">🗑</button></div>`}).join("")}</section>`}
/* ---- timers ---- */
let actx=null;function ensureAudio(){try{if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")actx.resume()}catch(e){}}
function chime(){try{ensureAudio();const t0=actx.currentTime;for(let r=0;r<3;r++)[880,1175,1568].forEach((f,i)=>{const o=actx.createOscillator(),g=actx.createGain();o.type="sine";o.frequency.value=f;const st=t0+r*.9+i*.16;g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(.35,st+.02);g.gain.exponentialRampToValueAtTime(.001,st+.5);o.connect(g);g.connect(actx.destination);o.start(st);o.stop(st+.55)})}catch(e){}try{if(navigator.vibrate&&(!navigator.userActivation||navigator.userActivation.hasBeenActive))navigator.vibrate([300,150,300,150,300])}catch(e){}}
function startTimer(mins,label){ensureAudio();S.timers=S.timers||[];S.timers.push({uid:uid(),label:label||"Timer",end:Date.now()+mins*6e4,mins});save();tickTimers();toast(`⏱ ${fmtMin(mins)} timer started`)}
const fmtMin=m=>m>=60?(Math.floor(m/60)+" hr"+(m%60?" "+Math.round(m%60)+" min":"")):Math.round(m)+" min";
const mmss=ms=>{ms=Math.max(0,ms);const s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+":"+pad(m):m)+":"+pad(x)};
let alarmT=null,alarmLast=0;
function alarmLoop(){clearTimeout(alarmT);alarmT=null;if(!(S.timers||[]).some(t=>t.fired))return;alarmLast=Date.now();chime();alarmT=setTimeout(alarmLoop,4000)}
function tickTimers(){const T=S.timers||[];const now=Date.now();let fired=false;T.forEach(t=>{if(!t.fired&&!t.p&&t.end<=now){t.fired=1;fired=true}});if(fired)save();const ring=T.filter(t=>t.fired);const al=$("#alarm");if(ring.length){if(!alarmT||now-alarmLast>5500)alarmLoop();al.innerHTML=`<div class="al-in"><div class="al-b">⏰</div><div class="al-t">${ring.map(t=>esc(t.label)).join(", ")} ${ring.length>1?"are":"is"} done!</div><button class="btn big full" data-a="tStop">Stop alarm</button><button class="btn ghost full" style="margin-top:10px" data-a="kSnooze">😴 Snooze 1 minute</button></div>`;al.classList.add("on")}else{clearTimeout(alarmT);alarmT=null;al.classList.remove("on");al.innerHTML=""}const bar=$("#tbar");if(!T.length){bar.innerHTML="";bar.classList.remove("on");return}bar.classList.add("on");bar.innerHTML=T.map(t=>`<div class="tchip ${t.fired?"done":""}"><span data-a="timers">⏱ ${esc(t.label)} · <b>${t.fired?"DONE!":t.p?"paused "+mmss(t.left||0):mmss(t.end-now)}</b></span><button data-a="tDel" data-u="${t.uid}">✕</button></div>`).join("")}
setInterval(()=>tickTimers(),1000);
function dTimers(){return`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Kitchen timers</h2><div class="tgrid">${[1,3,5,8,10,12,15,20,25,30,45,60].map(m=>`<button data-a="tQuick" data-v="${m}">${m}<small>min</small></button>`).join("")}</div><p class="mut small">Keep the app open while timers run. iPhones pause web pages in the background, so the chime plays when you come back if it finished.</p>${(S.timers||[]).length?`<button class="btn ghost full" data-a="tClear">Clear all timers</button>`:""}</div>`}
/* ---- wake lock ---- */
let wl=null,wakeWant=false;async function wakeOn(){wakeWant=true;try{if("wakeLock" in navigator&&!wl){wl=await navigator.wakeLock.request("screen");wl.addEventListener("release",()=>{wl=null})}}catch(e){}}
function wakeOff(){wakeWant=false;try{wl&&wl.release()}catch(e){}wl=null}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){if(wakeWant)wakeOn();tickTimers()}});
/* ---- cook mode ---- */
let ck=null;
function findT(t){const out=[];const re=/(\d+(?:\.\d+)?)(?:\s*(?:to|-|–)\s*(\d+(?:\.\d+)?))?\s*(minutes?|mins?|hours?|hrs?)\b/gi;let m;while((m=re.exec(t))){const v=parseFloat(m[2]||m[1]);out.push({mins:/^h/i.test(m[3])?v*60:v,txt:m[0]})}return out}
function openCook(id,serv){const r=R_(id);ck={id,i:-1,s:serv||r.s,ing:true,got:{}};if(sheetKind){$("#shw").classList.remove("open");sheetKind=null}$("#cook").classList.add("open");document.body.style.overflow="hidden";wakeOn();rCook()}
function closeCook(){$("#cook").classList.remove("open");ck=null;wakeOff();document.body.style.overflow=$("#book").classList.contains("open")?"hidden":"";if(!$("#book").classList.contains("open"))render(true)}
function rCook(){const r=R_(ck.id),n=r.st.length,f=ck.s/r.s;const onIng=ck.i===-1;const step=onIng?null:r.st[ck.i];
$("#cook").innerHTML=`<div class="ck-top"><button class="ibtn" data-a="closeCook">✕</button><div class="ck-t">${esc(r.n)}<small>${wl?"☀️ Screen stays on":"Cook mode"}</small></div><button class="ibtn" data-a="timers">⏱</button></div>
<div class="ck-dots">${["🧺"].concat(r.st.map((_,k)=>k+1)).map((x,k)=>`<button class="${k-1===ck.i?"on":k-1<ck.i?"past":""}" data-a="ckGo" data-v="${k-1}">${x}</button>`).join("")}</div>
<div class="ck-body" id="ckBody">${onIng?`<div class="ck-k">Get everything out first</div><div class="ck-serv"><span>Making</span><div class="stepper"><button data-a="ckS" data-v="-1">−</button><span>${ck.s}</span><button data-a="ckS" data-v="1">＋</button></div><span>servings</span></div><ul class="ck-ing">${r.i.map((g,k)=>`<li class="${ck.got[k]?"got":""}" data-a="ckGot" data-v="${k}"><span class="cb">${ck.got[k]?"✓":""}</span>${esc(ingText(g,f))}</li>`).join("")}</ul>${(r.cf&&r.cf.tips||[]).filter(x=>x.s<0).map(x=>`<div class="ck-tip">💡 ${esc(x.t)}</div>`).join("")}`:`<div class="ck-k">Step ${ck.i+1} of ${n}</div><div class="ck-step">${esc(step)}</div>${stepTip(r,ck.i,"ck-tip")}${findT(step).map(t=>`<button class="ck-timer" data-a="ckTimer" data-v="${t.mins}">⏱ Start a ${fmtMin(t.mins)} timer</button>`).join("")}<details class="ck-peek"><summary>🧺 Peek at ingredients</summary><ul>${r.i.map(g=>`<li>${esc(ingText(g,f))}</li>`).join("")}</ul></details>`}</div>
<div class="ck-nav"><button class="btn ghost" data-a="ckGo" data-v="${ck.i-1}" ${ck.i<0?"disabled":""}>‹ Back</button>${ck.i<n-1?`<button class="btn" data-a="ckGo" data-v="${ck.i+1}">${onIng?"Let's cook ›":"Next step ›"}</button>`:`<button class="btn sage" data-a="ckDone">🎉 Done! Mark cooked</button>`}</div>`;
ck.i=Math.max(-1,ck.i)}
(function(){let x0=0,y0=0;document.addEventListener("touchstart",e=>{if(!ck)return;const t=e.touches[0];x0=t.clientX;y0=t.clientY},{passive:true});document.addEventListener("touchend",e=>{if(!ck||!$("#cook").contains(e.target))return;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.4){const r=R_(ck.id);const ni=ck.i+(dx<0?1:-1);if(ni>=-1&&ni<r.st.length){ck.i=ni;rCook()}}},{passive:true})})();
/* ---- dinner decider ---- */
const DZ={time:0,vibe:"any",useP:false,seed:1};
function decide(){let L=RECIPES.filter(r=>{if(DZ.time&&r.t>DZ.time)return false;const v=DZ.vibe;if(v==="any")return!["breakfast","treats"].includes(r.c);if(v==="cozy")return r.cz>=9&&r.c!=="treats";if(v==="light")return["light","lunch"].includes(r.c);if(v==="fav")return isFav(r.id);if(v==="new")return!isCooked(r.id)&&!["breakfast","treats"].includes(r.c);return r.c===v});const rnd=x=>{const s=Math.sin(x*9301+DZ.seed*49297)*233280;return s-Math.floor(s)};L=L.map(r=>({r,st:stats(r),k:rnd(r.id)}));L.sort(DZ.useP?(a,b)=>b.st.pct-a.st.pct||a.k-b.k:(a,b)=>a.k-b.k);return L.slice(0,3)}
function dDecide(){const P=decide();const ch=(k,v,l)=>`<button class="chip ${DZ[k]===v?"on":""}" data-a="dz" data-k="${k}" data-v="${v}">${l}</button>`;return`<div class="d-body" style="padding-top:22px"><h2 class="d-t">🤔 What are we eating?</h2>
<div class="mut small">How much time do we have?</div><div class="chips" style="margin:0;padding-left:0">${ch("time",20,"⚡ 20 min")}${ch("time",30,"30 min")}${ch("time",45,"45 min")}${ch("time",0,"All the time")}</div>
<div class="mut small" style="margin-top:8px">What's the vibe?</div><div class="chips" style="margin:0;padding-left:0;flex-wrap:wrap">${ch("vibe","any","Anything")}${ch("vibe","cozy","🧸 Cozy")}${ch("vibe","light","🥗 Light")}${ch("vibe","soup","🍲 Soup")}${ch("vibe","fav","♥ Favorites")}${ch("vibe","new","✨ Something new")}${ch("vibe","breakfast","🍳 Breakfast")}${ch("vibe","treats","🍪 Treat")}</div>
<label class="toggle"><span>🧺 Use what we already have</span><span class="sw"><input type="checkbox" data-ch="dzP" ${DZ.useP?"checked":""}><span></span></span></label>
${P.length?P.map(({r,st})=>`<div class="dzc"><div class="dzi" data-a="open" data-id="${r.id}">${art(r)}</div><div class="dzb"><b>${esc(r.n)}</b><small>⏱ ${r.t>=120?Math.round(r.t/60)+" hr":r.t+" min"} · ♡ ${r.cz}/10 · have ${st.have}/${st.tot}</small><div class="row" style="gap:6px;margin-top:6px"><button class="btn sm" data-a="dzPick" data-id="${r.id}">Tonight ✓</button><button class="btn sm ghost" data-a="open" data-id="${r.id}">View</button></div></div></div>`).join(""):`<div class="empty">Nothing matches. Loosen it up a little.</div>`}
<button class="btn ghost full" data-a="dzShuffle">🎲 Show me 3 different ones</button></div>`}
/* ---- extra state + actions ---- */
const STAPLES=["Milk","Eggs","Bread","Butter","Coffee","Bananas","Paper towels","Snacks","Sparkling water","Ice cream"];
let storeMode=false,kMode="have";
Object.assign(A,{
cooked:el=>{const id=+el.dataset.id;if(isCooked(id)){togArr(S.cooked,id);save();toast("Unmarked cooked");after()}else{logCooked(id)}},
cook:el=>openCook(+el.dataset.id,det&&det.id===+el.dataset.id?det.s:0),
closeCook:()=>closeCook(),
ckGo:el=>{const r=R_(ck.id);const v=+el.dataset.v;if(v>=-1&&v<r.st.length){ck.i=v;rCook();$("#ckBody")&&($("#ckBody").scrollTop=0)}},
ckS:el=>{ck.s=Math.min(24,Math.max(1,ck.s+ +el.dataset.v));rCook()},
ckGot:el=>{const k=el.dataset.v;ck.got[k]=!ck.got[k];rCook()},
ckTimer:el=>startTimer(+el.dataset.v,R_(ck.id).n.split(" ").slice(0,3).join(" ")),
ckDone:()=>{const id=ck.id;closeCook();logCooked(id)},
leftYes:el=>{S.left=S.left||[];S.left.push({uid:uid(),id:+el.dataset.id,date:todayIso()});save();closeSheet();toast("🥡 Saved to the fridge list")},
leftAte:el=>{S.left=S.left.filter(x=>x.uid!==el.dataset.u);save();toast("Yum ✓");render(true)},
leftToss:el=>{S.left=S.left.filter(x=>x.uid!==el.dataset.u);save();render(true)},
timers:()=>{const k=ck;sheet(dTimers(),"timers");if(k)$("#shw").style.zIndex=300},
tQuick:el=>{startTimer(+el.dataset.v,el.dataset.v+" min");closeSheet()},
tStop:()=>{S.timers=S.timers.filter(t=>!t.fired);save();tickTimers();try{navigator.vibrate&&navigator.vibrate(0)}catch(e){}toast("Alarm stopped")},
tDel:el=>{S.timers=S.timers.filter(t=>t.uid!==el.dataset.u);save();tickTimers()},
tClear:()=>{S.timers=[];save();tickTimers();closeSheet()},
decide:()=>{DZ.seed=Math.random()*1000;sheet(dDecide(),"decide")},
dz:el=>{const k=el.dataset.k;DZ[k]=k==="time"?+el.dataset.v:el.dataset.v;$("#sheetIn").innerHTML=dDecide()},
dzShuffle:()=>{DZ.seed=Math.random()*1000;$("#sheetIn").innerHTML=dDecide()},
dzPick:el=>{const id=+el.dataset.id,r=R_(id),t=todayIso();(S.plan[t]=S.plan[t]||[]).push({uid:uid(),id,s:r.s,m:"D"});save();closeSheet();confetti();toast(`Tonight: ${r.n} ♡`)},
addMine:()=>openMine(0),
editMine:el=>openMine(+el.dataset.id),
mineSave:()=>{readMineForm();if(!md.n){toast("Give it a name first");return}if(!md.ing.length){toast("Add at least one ingredient");return}if(!md.st.length)md.st=["Cook it the way we like it. ♡"];if(md.tk&&!/^https:\/\//.test(md.tk)){toast("The link should start with https://");return}S.mine=S.mine||[];const isNew=!md.id;if(isNew)md.id=1000+S.mine.reduce((a,x)=>Math.max(a,x.id-1000),0)+1;const rec={id:md.id,n:md.n.slice(0,80),c:md.c,t:md.t,s:md.s,d:md.d.slice(0,200),ing:md.ing.slice(0,60),st:md.st.slice(0,40),img:md.img||""};const k=S.mine.findIndex(x=>x.id===md.id);if(k>=0&&S.mine[k].chef)rec.chef=S.mine[k].chef;if(k>=0)S.mine[k]=rec;else S.mine.push(rec);if(md.tk)S.tk[md.id]=md.tk;else delete S.tk[md.id];save();if(!S.__saveOk){}syncMine();closeSheet();toast(isNew?"⭐ Added to our recipes":"Saved ✓");F.cat="all";F.part=MINE_P;F.q="";go("recipes")},
mineDel:()=>confirmDlg("Delete this recipe?","It comes out of the planner and cookbook too.","Delete it",()=>{const id=md.id;S.mine=S.mine.filter(x=>x.id!==id);Object.keys(S.plan).forEach(d=>{S.plan[d]=S.plan[d].filter(e=>e.id!==id);if(!S.plan[d].length)delete S.plan[d]});delete S.basket[id];save();syncMine();closeSheet();toast("Deleted")}),
tiktok:el=>{const r=R_(+el.dataset.id);if(r)tiktokOpen(r)},
tkGo:el=>tiktokSearch(el.dataset.q),
tkSearch:el=>{sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">🎵 Search TikTok</h2><p class="mut small">Can't find it in our recipes? Type it here and the TikTok app opens with that search.</p><form data-f="tkS"><input class="inp" id="tkq" placeholder="e.g. marry me chicken" value="${esc(el.dataset.q||F.q||"")}" maxlength="100" enterkeyhint="search"><button class="btn full big" style="margin-top:10px">Open TikTok search</button></form><div class="mut small" style="margin-top:12px">Popular: ${["marry me chicken","cottage cheese recipes","crockpot dinner","viral pasta","easy dessert"].map(q=>`<button class="chip" data-a="tkGo" data-q="${q}">${q}</button>`).join(" ")}</div></div>`,"tks")},
homeMore:el=>{Object.assign(F,{q:"",cat:el.dataset.c||"all",part:+el.dataset.p||0,time:+el.dataset.k||0,fav:false,lim:24,cu:el.dataset.cu||"",mn:el.dataset.mn||""});go("recipes")},
gdel:el=>{const k=el.dataset.k;gone()[k]=1;delete chk()[k];save();render(true);toast("Took "+k+" off the list")},
gRestore:()=>{delete S.gone[S.week];save();render(true)},
gClear:()=>confirmDlg("Clear the grocery list?","Everything comes off the list. Your planned meals stay in the planner.","Clear the list",()=>{const G=gone();grocery().forEach(e=>G[e.key]=1);S.basket={};S.extras=[];delete S.checked[S.week];save();closeSheet();toast("List cleared ✓")}),
bsv:el=>{const id=el.dataset.id;S.basket[id]=Math.min(24,Math.max(1,(+S.basket[id]||1)+ +el.dataset.v));save();render(true)},
delRec:el=>{const id=+el.dataset.id;const r=R_(id);if(!r)return;confirmDlg("Delete \u201c"+r.n+"\u201d?",r.mine?"This removes your recipe for good, including from the planner and grocery list.":"It comes out of the recipe list, cookbook, planner and grocery list. You can bring it back later in Settings ⚙︎.","Delete it",()=>{if(r.mine)S.mine=S.mine.filter(x=>x.id!==id);else if(!S.hidden.includes(id))S.hidden.push(id);Object.keys(S.plan).forEach(d=>{S.plan[d]=S.plan[d].filter(e=>e.id!==id);if(!S.plan[d].length)delete S.plan[d]});delete S.basket[id];S.fav=S.fav.filter(x=>x!==id);save();syncMine();closeSheet();toast("Deleted "+r.n)})},
unhide:el=>{const id=+el.dataset.id;S.hidden=S.hidden.filter(x=>x!==id);save();syncMine();toast("Restored "+(RID[id]?RID[id].n:""));settings()},
recPhotoReset:el=>{delete S.photos[el.dataset.id];save();rerSheet()},
minePaste:async()=>{const txt=($("#mPaste").value||"").trim();if(!txt){toast("Paste a link or the recipe first");return}readMineForm();
const urlOnly=/^https?:\/\/\S+$/.test(txt);const linkM=txt.match(/https?:\/\/\S+/);
if(linkM&&!md.tk)md.tk=linkM[0].replace(/[),.]+$/,"");
if(urlOnly){if(!md.n){try{const r=await fetch("https://www.tiktok.com/oembed?url="+encodeURIComponent(md.tk));if(r.ok){const j=await r.json();if(j.title)md.n=String(j.title).slice(0,80)}}catch(e){}}$("#sheetIn").innerHTML=dMine();toast(md.n?"🔗 Link saved and named. Now paste the recipe text (caption or notes) to fill in ingredients.":"🔗 Link saved. Paste the recipe text (caption or notes) to fill in the ingredients.");return}
const p=parsePasted(txt);if(p.n&&!md.n)md.n=p.n;if(p.ing.length)md.ing=p.ing;if(p.st.length)md.st=p.st;if(p.t)md.t=p.t;if(p.s)md.s=p.s;$("#sheetIn").innerHTML=dMine();toast(`✨ Found ${p.ing.length} ingredient${p.ing.length===1?"":"s"} and ${p.st.length} step${p.st.length===1?"":"s"}. Check it over, then save.`)},
addIngQ:el=>addIng(el.dataset.v),
storeMode:()=>{storeMode=!storeMode;storeMode?wakeOn():wakeOff();render(true);toast(storeMode?"🛒 Store mode: big text, screen stays on":"Store mode off")},
staple:el=>{const n=el.dataset.v;if(S.extras.some(x=>x.name.toLowerCase()===n.toLowerCase()&&!x.done)){toast(n+" is already on the list");return}S.extras.push({uid:uid(),name:n,amt:"",done:false});save();render(true);toast("Added "+n)},
copyLast:()=>{const prev=weekDates(iso(addDays(fromIso(S.week),-7)));const cur=weekDates(S.week);let n=0;prev.forEach((d,k)=>(S.plan[d]||[]).forEach(e=>{(S.plan[cur[k]]=S.plan[cur[k]]||[]).push({...e,uid:uid()});n++}));save();toast(n?`Copied ${n} meal${n>1?"s":""} from last week`:"Last week was empty");render(true)},
kmode:el=>{kMode=el.dataset.k;render(true)},
ktog:el=>{const it=el.dataset.it;if(kMode==="soon"){S.soon=S.soon||[];const on=togArr(S.soon,it);if(on&&!inP(it))S.pantry.push(it)}else{togArr(S.pantry,it);if(!inP(it)&&S.soon)S.soon=S.soon.filter(x=>x!==it)}save();$("#klist").innerHTML=kList();const st=document.querySelectorAll(".kstats .stat b");if(st[0])st[0].textContent=S.pantry.length}
});

function delEntry(d,u){if(!S.plan[d])return;S.plan[d]=S.plan[d].filter(e=>e.uid!==u);if(!S.plan[d].length)delete S.plan[d];save();toast("Removed from plan")}
function after(){if(sheetKind==="detail")rerSheet();if($("#book").classList.contains("open"))refreshBook();else if(!sheetKind)render(true)}
document.addEventListener("click",e=>{const el=e.target.closest("[data-a]");if(!el)return;if(el.tagName==="A")return;const f=A[el.dataset.a];if(f){e.preventDefault();f(el,e)}});
let inT=null;
document.addEventListener("input",e=>{const el=e.target,k=el.dataset.in;if(!k)return;
if(k==="rq"){F.q=el.value;F.lim=24;fillGrid()}
else if(k==="kq"){kQ=el.value;$("#klist").innerHTML=kList()}
else if(k==="pdq"){pd.q=el.value;const q=pd.q.trim().toLowerCase();$("#pdl").innerHTML=pdList(RECIPES.filter(x=>!q||x.n.toLowerCase().includes(q)||x.keys.some(z=>z.includes(q))).slice(0,40))}
else if(k==="note"){S.notes[el.dataset.id]=el.value.slice(0,1200);if(!S.notes[el.dataset.id])delete S.notes[el.dataset.id];clearTimeout(inT);inT=setTimeout(save,400)}
else if(k==="thr"){S.thr=+el.value;$("#thrV").textContent=S.thr+"%+"}});
document.addEventListener("change",e=>{const el=e.target,k=el.dataset.ch;if(!k)return;
if(k==="fpart"){F.part=+el.value;F.lim=24;render(true)}else if(k==="fcu"){F.cu=el.value;F.lim=24;render(true)}else if(k==="ftime"){F.time=+el.value;F.lim=24;render(true)}else if(k==="ffav"){F.fav=el.checked;render(true)}
else if(k==="gmode"){S.gmode=el.value;save();render(true)}else if(k==="hidep"){S.hidePantry=el.checked;save();render(true)}else if(k==="skipopt"){S.skipOpt=el.checked;save();render(true)}
else if(k==="recPhoto"){const f=el.files&&el.files[0];if(!f)return;const id=el.dataset.id;shrinkImg(f,u=>{S.photos[id]=u;save();toast("📷 Photo saved");rerSheet()})}
else if(k==="thr2"){save();render(true)}else if(k==="maxm"){S.maxMiss=+el.value;save();render(true)}
else if(k==="night"){S.night=el.checked;save();document.body.classList.toggle("night",S.night)}
else if(k==="dzP"){DZ.useP=el.checked;$("#sheetIn").innerHTML=dDecide()}
else if(k==="mineImg"){const f=el.files&&el.files[0];if(!f)return;readMineForm();shrinkImg(f,u=>{md.img=u;$("#sheetIn").innerHTML=dMine()})}
else if(k==="impFile"){const f=el.files&&el.files[0];if(!f)return;if(f.size>3e6){toast("File too big");return}const rd=new FileReader();rd.onload=()=>doImport(String(rd.result));rd.readAsText(f)}});
document.addEventListener("submit",e=>{e.preventDefault();if(e.target.dataset.f==="tkS"){tiktokSearch($("#tkq").value);return}if(e.target.dataset.f==="addIng"){addIng($("#ingN").value);return}if(e.target.dataset.f==="addEx"){const n=$("#exN").value.trim();if(!n)return;S.extras.push({uid:uid(),name:n.slice(0,80),amt:$("#exA").value.trim().slice(0,20),done:false});save();render(true);toast("Added "+n)}});
$("#bkJump").addEventListener("change",e=>{const i=+e.target.value;if(pf){pf.turnToPage(i);syncCnt(i)}});
$("#bkPart").addEventListener("change",e=>{bookPart=+e.target.value;BL=bookList(bookPart);fillJump();buildBook(bookPart?PG0:0)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(sheetKind)closeSheet();else if(ck)closeCook();else if($("#book").classList.contains("open"))closeBook()}if($("#book").classList.contains("open")&&!sheetKind&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){if(e.key==="ArrowRight"&&pf)pf.flipNext();if(e.key==="ArrowLeft"&&pf)pf.flipPrev()}});
let rzT,lastWH="";function rebook(){if(!$("#book").classList.contains("open"))return;const wh=innerWidth+"x"+innerHeight;if(wh===lastWH)return;lastWH=wh;const p=curPage();buildBook(p>=PG0?p-((p-PG0)%2):p)}
window.addEventListener("resize",()=>{clearTimeout(rzT);rzT=setTimeout(rebook,200)});window.addEventListener("orientationchange",()=>setTimeout(rebook,350));
function fromHash(){const h=(location.hash||"").slice(1);if(TABS.some(t=>t[0]===h))tab=h}
window.addEventListener("hashchange",()=>{fromHash();render()});
$("#hdrIcon").src=ICON;syncMine();fromHash();render();tickTimers();

/* ---- custom ingredients: add anything, see which recipes it fits ---- */
function addIng(name){name=String(name||"").trim().toLowerCase().replace(/\s+/g," ").slice(0,60);if(!name)return;
if(!ALLITEMS.includes(name)&&!S.myIng.includes(name))S.myIng.push(name);if(!S.pantry.includes(name))S.pantry.push(name);save();syncMine();kQ="";
const hits=RECIPES.filter(r=>r.keys.some(k=>ingMatch(name,k)));const near=hits.map(stats).sort((a,b)=>a.miss.length-b.miss.length).slice(0,8);const aisle=(AISLES.find(a=>a[0]===secOf(name))||AISLES[AISLES.length-1])[1];
sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">✓ ${esc(cap(name))} is in the pantry</h2><p class="mut small">Filed under ${aisle}. ${hits.length?`It's used in <b>${hits.length}</b> recipe${hits.length>1?"s":""}. Here are the closest to ready:`:"No recipes use it yet. It's still saved, and recipes you add with it will match."}</p>${near.map(m=>`<button class="prow" data-a="open" data-id="${m.r.id}">${mini(m.r)}<span class="pn">${esc(m.r.n)}<small>${m.miss.length?"missing "+m.miss.length+": "+m.miss.slice(0,3).map(esc).join(", ")+(m.miss.length>3?"…":""):"🎉 ready to make"}</small></span></button>`).join("")}<button class="btn full" style="margin-top:10px" data-a="closeSheet">Done</button></div>`,"ing")}

/* Reader navigation tests load only with ?selftest=reader (selftest-reader.js). */
if (/[?&]selftest=reader/.test(location.search)) setTimeout(() => { const b = document.createElement("script"); b.src = "selftest-reader.js?v=" + Date.now(); document.body.appendChild(b); }, 1500);
