import {W,D} from "./data/profiles.js";
import {QA} from "./data/kb.js";
import {R,E,NR} from "./data/records.js";
const wt={crew:3,model:3,equip:3,earth:1};
const $=id=>document.getElementById(id);
let sel="saffire";
const wbox=$("weights");
W.forEach(([l,k])=>{wbox.insertAdjacentHTML("beforeend",`<label>${l}: <span id="v_${k}">${wt[k]}</span><input type="range" min="0" max="5" value="${wt[k]}" data-k="${k}"></label>`)});
wbox.addEventListener("input",e=>{const k=e.target.dataset.k;wt[k]=+e.target.value;$("v_"+k).textContent=wt[k];render()});
["env","cat","fuel"].forEach(i=>$(i).addEventListener("change",render));
function score(d){
  const tot=Object.values(wt).reduce((a,b)=>a+b,0)||1;
  let v=d.s.reduce((a,x,i)=>a+x*wt[W[i][1]],0)/tot;
  const env=$("env").value;
  if(env!=="craft"&&d.hi)v+=0.8;
  if(env!=="craft"&&d.pg)v+=0.6;
  return Math.min(5,v)/5*100;
}
function render(){
  const c=$("cat").value,f=$("fuel").value;
  const rows=D.filter(d=>(c==="all"||d.cat===c)&&(f==="all"||d.fuel===f)).map(d=>({d,v:score(d)})).sort((a,b)=>b.v-a.v);
  $("list").innerHTML=rows.length?rows.map((r,i)=>`<button class="row" data-id="${r.d.id}" aria-pressed="${r.d.id===sel}"><span class="rk">${i+1}</span><span class="nm"><b>${r.d.n}</b><small>${r.d.cat} · ${r.d.fuel}</small><span class="bar"><i style="width:${r.v}%"></i></span></span><span class="sc">${Math.round(r.v)}</span></button>`).join(""):"<p>No investigations match. Set Focus or Fuel back to All.</p>";
  if(rows.length&&!rows.some(r=>r.d.id===sel))sel=rows[0].d.id;
  detail();
}
function detail(){
  const d=D.find(x=>x.id===sel),env=$("env").value;
  const best=W.map(([l,k],i)=>[l,d.s[i]]).sort((a,b)=>b[1]-a[1])[0][0].toLowerCase();
  const envName=$("env").selectedOptions[0].text.split(" (")[0];
  let why=`Strongest for: ${best}.`;
  if(env!=="craft"&&d.hi)why+=` Tested at raised oxygen, which matters for a ${envName.toLowerCase()} where air is richer in O₂ than Earth’s.`;
  else if(env!=="craft"&&d.pg)why+=` Closest available stand-in for partial-gravity fire behavior.`;
  else if(env!=="craft")why+=` Useful context, but not run at the oxygen levels planned for this habitat.`;
  $("detail").innerHTML=`<h3>${d.n}</h3><p>${d.b}</p><div><span class="chip">${d.cat}</span><span class="chip">${d.fuel}</span>${d.hi?'<span class="chip hot">High-O₂ relevant</span>':""}</div><dl class="kv"><dt>Hardware</dt><dd>${d.hw}</dd><dt>Earth use</dt><dd>${d.earth}</dd></dl><p><b>Why it ranks here.</b> ${why}</p><p><a href="#inv-${d.id}">Open full page</a></p>`;
}
$("list").addEventListener("click",e=>{const b=e.target.closest(".row");if(b){sel=b.dataset.id;render()}});
[$("cA"),$("cB")].forEach((s,i)=>{s.innerHTML=D.map(d=>`<option value="${d.id}">${d.n}</option>`).join("");s.selectedIndex=i*2;s.addEventListener("change",cmp)});
function cmp(){
  const a=D.find(x=>x.id===$("cA").value),b=D.find(x=>x.id===$("cB").value);
  const r=(l,f)=>`<tr><th scope="row">${l}</th><td>${f(a)}</td><td>${f(b)}</td></tr>`;
  $("cmp").innerHTML=`<table><thead><tr><th></th><th>${a.n}</th><th>${b.n}</th></tr></thead><tbody>${r("Fire safety area",x=>x.cat)}${r("Fuel",x=>x.fuel)}${r("Hardware",x=>x.hw)}${r("Objective",x=>x.b)}${W.map(([l],i)=>r(l,x=>x.s[i]+" / 5")).join("")}</tbody></table>`;
}
function grav(z){
  $("g0").setAttribute("aria-pressed",z);$("g1").setAttribute("aria-pressed",!z);
  $("tearShape").style.opacity=z?0:1;$("sphereShape").style.opacity=z?1:0;
  $("gtext").textContent=z?"Without buoyancy, no gas rises. The flame becomes a dim blue sphere fed only by diffusion.":"With gravity, hot gases rise and pull in fresh air, giving a flickering teardrop.";
}
$("g0").onclick=()=>grav(true);$("g1").onclick=()=>grav(false);
$("o2r").addEventListener("input",e=>{
  const v=+e.target.value;$("o2v").textContent=v;
  const up=Math.round((v/21-1)*100);
  $("o2t").textContent=v===21?"Same as Earth’s air.":`${up}% more oxygen than Earth’s air. Materials burn more readily.`;
});
$("o2t").textContent="Same as Earth’s air.";
render();cmp();
function invPage(d){
 const O=[["Earth air",21],["Lunar habitat (minimum expected)",30],["Highest microgravity test (CFI-G)",85],["Spacesuit",100]];
 const svg=`<svg viewBox="0 0 520 170" role="img" aria-label="Oxygen concentration reference chart" style="width:100%;max-width:560px">${O.map(([l,v],i)=>`<text x="0" y="${22+i*40}" fill="var(--ink)" font-size="13">${l}</text><rect x="0" y="${28+i*40}" width="${v*4.8}" height="10" rx="5" fill="${i===2&&d.hi?"var(--amber)":"var(--blue)"}"/><text x="${v*4.8+6}" y="${38+i*40}" fill="var(--mute)" font-size="12">${v}%</text>`).join("")}</svg>`;
 $("p-inv").innerHTML=`<p style="margin-top:24px"><a href="#explore">Back to ranking</a></p><h1 style="font-size:2.2rem">${d.n}</h1><p class="sub">${d.b}</p><div><span class="chip">${d.cat}</span><span class="chip">${d.fuel}</span>${d.hi?'<span class="chip hot">High-O₂ relevant</span>':""}</div>
 <section class="layout"><div class="panel"><h2>Score profile</h2><p class="sub">Placeholder estimates, 0 to 5.</p>${W.map(([l],i)=>`<p style="margin:10px 0 0">${l}: <b>${d.s[i]}</b></p><div class="bar"><i style="width:${d.s[i]*20}%"></i></div>`).join("")}</div>
 <div class="panel"><h2>Setup</h2><dl class="kv"><dt>Hardware</dt><dd>${d.hw}</dd><dt>Earth use</dt><dd>${d.earth}</dd></dl><p><button class="seg" style="padding:8px 16px;background:var(--blue);color:var(--bg);border:0;cursor:pointer" id="askinv">Ask the assistant about this</button></p></div></section>
 <section class="panel"><h2>Oxygen in context</h2><p class="sub">Reference levels from the challenge background, not results from ${d.n}.</p>${svg}</section>
 <section class="panel gap" style="margin-top:20px"><p style="margin:0">Measured conditions, sensors and variables for this investigation are not shown yet. They need the PSI database, which this site is not connected to.</p></section>`;
 $("askinv").onclick=()=>{location.hash="#ask";$("q").value="What should a fire safety engineer know about "+d.n+", and what are the limits of what it can tell us?";$("q").focus()};
}
 
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const cats=[...new Set(R.flatMap(r=>r.c))].sort(),plats=[...new Set(R.map(r=>r.p))].sort();
$("lc").innerHTML='<option value="">All topics</option>'+cats.map(c=>`<option>${c}</option>`).join("");
$("lp").innerHTML='<option value="">All platforms</option>'+plats.map(c=>`<option>${c}</option>`).join("");
function lib(){const q=$("ls").value.toLowerCase().trim(),c=$("lc").value,p=$("lp").value;
 const rows=R.filter(r=>(!c||r.c.includes(c))&&(!p||r.p===p)&&(!q||q.split(/\s+/).every(w=>JSON.stringify(r).toLowerCase().includes(w))));
 $("lcount").textContent=rows.length+" of "+R.length+" records";
 $("lib").innerHTML=rows.length?rows.map(r=>`<a class="card" href="#study-${r.id}"><h3>${esc(r.t)}</h3><div class="meta">${esc(r.a)} · ${r.y||"Year not retrieved"} · ${esc(r.p)}</div><p>${esc(r.sum)}</p><p class="meta"><b>Question:</b> ${esc(r.q)}</p><span class="chip">${esc(r.c[0])}</span><span class="chip hot">Unverified candidate source</span></a>`).join(""):'<p class="sub">No records match. Clear a filter or try a broader word.</p>'}
["ls","lc","lp"].forEach(i=>$(i).addEventListener("input",lib));lib();
$("stat").textContent=R.length+" NASA research records in the library · years retrieved: "+(()=>{const y=R.map(r=>+r.y).filter(Boolean);return Math.min(...y)+"–"+Math.max(...y)})();
function studyPage(r){
 const grp={};r.f.forEach(([t,x])=>(grp[t]=grp[t]||[]).push(x));
 $("p-study").innerHTML=`<div class="st"><p style="margin-top:24px"><a href="#library">Back to library</a></p><h1 style="font-size:2rem">${esc(r.t)}</h1>
 <p class="meta">${esc(r.a)} · ${r.y||"Year not retrieved"} · ${esc(r.org)}</p><p><span class="chip">${esc(r.c.join(" · "))}</span><span class="chip hot">Unverified candidate source</span></p>
 <p><a href="${r.url}" target="_blank" rel="noopener">Open original source (${esc(r.rid)})</a></p>
 <div class="warn">IGNIS read only the abstract-level text of this record. Details below are limited to that text. Verify in the original.</div>
 <h2>Summary</h2><p>${esc(r.sum)}</p>
 <h2>Research question</h2><p>${esc(r.q||"Not stated in the retrieved abstract.")}</p><p class="meta">Source of this question: ${esc(r.qs||"Not recorded")}</p>${r.hy?`<div class="fi pot"><span class="tag">Hypothesis stated by the authors</span><p style="margin:6px 0">${esc(r.hy)}</p></div>`:""}
 <h2>Experimental conditions</h2><div class="panel tablewrap"><table><tbody>${E.map(([l,k])=>`<tr><th scope="row">${l}</th><td>${esc(r.env[k]||NR)}</td></tr>`).join("")}</tbody></table></div>
 <h2>Findings</h2>${Object.keys(grp).map(t=>`<div class="fi"><span class="tag">${esc(t)}</span>${grp[t].map(x=>`<p style="margin:6px 0">${esc(x)}</p>`).join("")}</div>`).join("")}<p class="sub">Page, figure and table references are not extracted yet.</p>
 ${r.ch?chart(r):""}<h2>Why did it happen?</h2><p class="sub">Mechanism explanations from the authors are not extracted for this record. For background on buoyancy and diffusion, see the Science page. That background is general, not this paper’s conclusion.</p>
 <h2>Fire-safety relevance</h2>
 <div class="fi"><span class="tag">Supported by the abstract</span><p style="margin:6px 0">${esc(r.sup)}</p></div>
 <div class="fi pot"><span class="tag">Potential implication (IGNIS interpretation)</span><p style="margin:6px 0">The findings may help scientists understand similar conditions. Applying them needs matching oxygen, pressure, flow and material.</p></div>
 <div class="fi no"><span class="tag">Not established by this research</span><p style="margin:6px 0">That any material or design is safe in general, or behavior outside the tested conditions.</p></div>
 <h2>Limitations</h2><p>Abstract-level reading only. Sample sizes, uncertainty and model assumptions are not extracted. Conditions not listed above were not retrieved.</p>
 <p><button class="seg" style="padding:8px 16px;background:var(--blue);color:var(--bg);border:0;cursor:pointer" id="askst">Ask the assistant about this study</button></p></div>`;
 $("askst").onclick=()=>{location.hash="#ask";$("q").value="Explain "+r.rid+" ("+r.t.slice(0,80)+"): what was observed, under what conditions, and what can’t be concluded?";$("q").focus()};
}
function inl(el,t){t.split(/(\*\*[^*]+\*\*|NTRS \d{8}|10\.\d{4,}\/[^\s\]\),;]*[^\s\]\),;.])/).forEach(p=>{if(!p)return;if(/^\*\*/.test(p)){const b=document.createElement("strong");b.textContent=p.slice(2,-2);el.append(b)}else if(/^NTRS \d{8}$/.test(p)||/^10\.\d{4,}\//.test(p)){const a=document.createElement("a");a.href=p.startsWith("NTRS")?"https://ntrs.nasa.gov/citations/"+p.slice(5):"https://doi.org/"+p;a.target="_blank";a.rel="noopener";a.textContent=p;el.append(a)}else el.append(p)})}
function setMsg(el,t){el.textContent="";let ul=null;t.split("\n").forEach(line=>{const l=line.trim();if(!l){ul=null;return}let m;
 if((m=l.match(/^#{1,4}\s+(.*)/))||(m=l.match(/^\*\*([^*]+)\*\*:?$/))){ul=null;const h=document.createElement("h4");inl(h,m[1]);el.append(h)}
 else if((m=l.match(/^[-*•]\s+(.*)/))){if(!ul){ul=document.createElement("ul");el.append(ul)}const li=document.createElement("li");inl(li,m[1]);ul.append(li)}
 else{ul=null;const p=document.createElement("p");inl(p,l);el.append(p)}});$("chat").scrollTop=1e9}

function chart(r){return `<h2>Chart</h2><div class="panel"><p class="sub" style="margin:0 0 8px">Limiting oxygen concentration for flame spread, % O₂ (quantitative values stated in the abstract; same study, so comparable).</p>`+r.ch.map(([l,v])=>`<div class="br"><span class="l">${l}</span><div class="bar"><i style="width:${v*3.5}%"></i></div><b>${v}</b></div>`).join("")+`</div>`}
const cls=t=>t==="Comparable"?"c":t==="Not reported"?"":t==="Not directly comparable"?"n":"p";
const DIM=[["Platform","p"],["Gravity","env.grav"],["Oxygen concentration","env.o2"],["Ambient pressure","env.pr"],["Oxidizer flow","env.flow"],["Fuel or material","env.fuel"],["Sample size","env.size"],["Ignition method","env.ign"],["Test duration","env.dur"],["Finding types","ft"]];
const gv=(r,k)=>k==="p"?r.p:k==="ft"?[...new Set(r.f.map(x=>x[0]))].sort().join(", "):r.env[k.slice(4)]||"";
function stat(a,b,k){const x=gv(a,k),y=gv(b,k);if(!x||!y)return"Not reported";if(x.toLowerCase()===y.toLowerCase())return"Comparable";if(k==="ft")return"Different measurement method";return/fuel|ign|size|dur/.test(k)?"Not directly comparable":"Partially comparable"}
const lA=$("lA"),lB=$("lB");[lA,lB].forEach((e,i)=>{e.innerHTML=R.map(r=>`<option value="${r.id}">${esc(r.t.slice(0,70))}</option>`).join("");e.selectedIndex=i?3:2;e.addEventListener("change",labCmp)});
function labCmp(){const a=R.find(r=>r.id===lA.value),b=R.find(r=>r.id===lB.value);
 if(a===b){$("lres").innerHTML='<div class="panel">Choose two different studies.</div>';return}
 const rows=DIM.map(([l,k])=>({l,k,x:gv(a,k),y:gv(b,k),st:stat(a,b,k)}));
 const li=a=>a.length?"<ul>"+a.map(t=>`<li>${t}</li>`).join("")+"</ul>":"<p class=sub>None identified from the retrieved text.</p>";
 const sim=rows.filter(r=>r.st==="Comparable").map(r=>`${r.l}: ${esc(r.x)}`);const sc=a.c.filter(c=>b.c.includes(c));if(sc.length)sim.push("Shared topics: "+esc(sc.join(", ")));
 const dif=rows.filter(r=>/Partially|Not directly|Different/.test(r.st)).map(r=>`${r.l}: ${esc(r.x)} versus ${esc(r.y)} <span class="stt ${cls(r.st)}">${r.st}</span>`);
 const cond=rows.filter(r=>/^env\.(grav|o2|pr|flow|fuel)$/.test(r.k)&&r.x&&r.y&&r.x.toLowerCase()!==r.y.toLowerCase()).map(r=>r.l);
 const nr=rows.filter(r=>r.st==="Not reported").map(r=>r.l);
 const side=t=>t.f.map(x=>`<div class="fi"><span class="tag">${esc(x[0])}</span> ${esc(x[1])}</div>`).join("");
 $("lres").innerHTML=`<div class="panel tablewrap"><table><thead><tr><th>Dimension</th><th>${esc(a.t.slice(0,50))}</th><th>${esc(b.t.slice(0,50))}</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${r.l}</th><td>${esc(r.x||NR)}</td><td>${esc(r.y||NR)}</td><td><span class="stt ${cls(r.st)}">${r.st}</span></td></tr>`).join("")}</tbody></table></div>
 <div class="dz" style="margin-top:16px"><div class="panel"><h3>Key similarities</h3>${li(sim)}</div><div class="panel"><h3>Key differences</h3>${li(dif)}</div>
 <div class="panel"><h3>Differences in conditions</h3><p>${cond.length?"Different "+cond.join(", ").toLowerCase()+". Oxygen, flow, gravity and fuel all change flame behavior, so results are not automatically equivalent.":"No differing conditions could be identified from the retrieved text."}</p></div>
 <div class="panel"><h3>Not reported</h3><p>${nr.length?nr.join(", ")+" (missing in at least one study, so not compared and not estimated).":"All listed dimensions are reported."}</p></div></div>
 <h2 style="margin-top:32px">Reported findings, side by side</h2><div class="dz"><div class="panel"><h3>${esc(a.t.slice(0,60))}</h3>${side(a)}</div><div class="panel"><h3>${esc(b.t.slice(0,60))}</h3>${side(b)}</div></div>
 <div class="dz" style="margin-top:16px"><div class="panel"><h3>Findings that agree or differ</h3><p>Not assessed. IGNIS has no matched, quantified results under equal conditions for both studies, so it will not claim agreement or conflict.</p></div>
 <div class="panel"><h3>Possible reasons (IGNIS interpretation)</h3><p>${dif.length?"Differences in platform, fuel, scale or measurement method could explain different results. This is not stated by the authors.":"No difference to interpret."}</p></div>
 <div class="panel"><h3>What can reasonably be concluded</h3><p>Which conditions each study reports, and what each author statement says. Both are unverified candidate sources read at abstract level.</p></div>
 <div class="panel"><h3>What cannot be concluded</h3><p>That one material, condition or design is safer than another, or that either result applies outside its tested conditions.</p></div></div>
 <div class="panel" style="margin-top:16px"><h3>Chart</h3><p>${a.ch&&b.ch?"":"No chart. The two studies do not share numerically comparable values, and IGNIS will not plot incompatible numbers."}</p></div>
 <p class="meta">Sources: <a href="${a.url}" target="_blank" rel="noopener">${esc(a.rid)}</a> · <a href="${b.url}" target="_blank" rel="noopener">${esc(b.rid)}</a></p>`}
labCmp();
const INS=[
["Flame spread in spacecraft conditions differs from 1-g expectations","The available studies suggest flames on solids behave differently in microgravity and at spacecraft scale than on Earth.",["20170008805","s41598-017-18398-4"],"Different tests: concurrent and opposed flow on fabric at 20 cm/s; PMMA rods at low opposed flow.","Moderate: two independent test types, abstract-level.","Different materials, geometries and scales. Details not extracted.","May affect how Earth-based material screening is interpreted.","Matched tests under identical oxygen, pressure and flow."],
["Oxygen and flow set a flammability boundary","Under the tested conditions, whether a flame spreads depends on oxygen concentration and flow speed together.",["20150008962","s41598-017-18398-4"],"SIBAL fabric in slow concurrent flow; PMMA with oxygen reduced to find the limit.","Moderate for these materials only.","Boundary values were not retrieved. Materials differ.","This may have implications for habitats with raised oxygen. Further investigation is needed.","Boundaries at lunar oxygen and pressure."],
["Scale may change fire behavior","The authors of the Saffire papers argue fire growth cannot be expected to scale linearly from small tests.",["20170008805","20180005168"],"Large sample on an unmanned Cygnus spacecraft.","Authors’ argument, supported by one flight series.","Few flights. Not crewed.","Suggests small-sample data may not predict full-scale fires.","More scales, geometries and materials."],
["Smoke forms and moves differently without buoyancy","Records suggest microgravity changes smoke structure, which matters for detector design.",["20170007283","10.1080/02786826.2015.1025124","19990020833","20050215648"],"SAME studied overheated samples (oxidative pyrolysis), not flames.","Moderate for pyrolysis smoke.","Flaming fires and large fires not covered by SAME.","May inform detector sensitivity and placement.","Detection tests for flaming and large-scale fires."],
["Gases may matter more than heat in a cabin fire","In Saffire results, temperature and pressure rose less than CO and CO2 concentrations.",["20210011521","20240002981"],"Large samples on Cygnus; one VI test reported preliminarily.","Preliminary, authors’ statement.","Unoccupied vehicle, specific materials and cabin volume.","May bear on how crews respond to a fire. Not a safety guarantee.","More tests and full analyses."]];
$("ins").innerHTML=INS.map(([t,e,ids,cn,cf,lm,rl,fr])=>`<div class="panel" style="margin-bottom:16px"><h2>${t}</h2><p>${e}</p><p class="meta">Evidence: ${ids.map(i=>`<a href="#study-${i}">${esc(R.find(r=>r.id===i).rid)}</a>`).join(" · ")}</p><dl class="kv"><dt>Conditions</dt><dd>${cn}</dd><dt>Strength</dt><dd>${cf}</dd><dt>Limitations</dt><dd>${lm}</dd><dt>Spacecraft relevance</dt><dd>${rl}</dd><dt>Needs</dt><dd>${fr}</dd></dl><span class="tag chip">IGNIS interpretation</span></div>`).join("")+`<div class="panel gap"><h2>Research gaps</h2><ul><li>No partial-gravity (Moon or Mars) combustion data in PSI yet, per the challenge brief.</li><li>None of the library records reported lunar-habitat conditions (30% oxygen or more at 10.2 psi or less).</li><li>Ambient pressure was not retrieved for any record.</li><li>No suppression record is in the library yet (FLEX not added).</li><li>SAME covers overheating smoke, not flaming fires.</li><li>The library has ${R.length} records, so absence of evidence here is not absence of research.</li></ul></div>`;
function bars(t,o){const m=Math.max(...Object.values(o));return `<div class="panel"><h3>${t}</h3>${Object.entries(o).map(([k,v])=>`<div class="br"><span class="l" title="${esc(k)}">${esc(k)}</span><div class="bar"><i style="width:${v/m*100}%"></i></div><b>${v}</b></div>`).join("")}</div>`}
const cnt=a=>a.reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{});
$("dash").innerHTML=`<h2>Mission dashboard</h2><p class="sub">Counts come from the ${R.length} records in the library. None is padded.</p><div class="dz">${bars("By topic",cnt(R.flatMap(r=>r.c)))}${bars("By year",cnt(R.map(r=>r.y||"Not retrieved")))}${bars("By platform",cnt(R.map(r=>r.p)))}${bars("Evidence types in findings",cnt(R.flatMap(r=>r.f.map(x=>x[0]))))}${bars("Verification status",cnt(R.map(()=>"Unverified candidate")))}</div><p class="sub" style="margin-top:12px">Latest additions: ${R.slice(-3).map(r=>`<a href="#study-${r.id}">${esc(r.rid)}</a>`).join(" · ")}. Key themes and gaps: <a href="#insights">Insights</a>.</p>`;
function ld(u){return new Promise((ok,no)=>{if(window.pdfjsLib)return ok();const e=document.createElement("script");e.src=u;e.onload=ok;e.onerror=no;document.head.append(e)})}
$("pdf").addEventListener("change",async e=>{const f=e.target.files[0],o=$("pdfr");if(!f)return;o.textContent="Reading "+f.name+"...";
 try{await ld("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const d=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;let t="";const n=Math.min(d.numPages,5);
  for(let i=1;i<=n;i++){const c=await(await d.getPage(i)).getTextContent();t+=c.items.map(x=>x.str).join(" ")+"\n"}
  if(t.trim().length<40)throw new Error("no text layer");
  const doi=(t.match(/10\.\d{4,}\/[^\s"<>]+/)||[])[0];
  o.innerHTML=`<b>Text extracted from the first ${n} of ${d.numPages} pages.</b> Not validated and not added to the library. ${doi?"Possible DOI: "+esc(doi)+".":"No DOI found."}<pre class="x">${esc(t.slice(0,2500))}</pre>`;
 }catch(err){o.textContent="Extraction failed ("+(err.message||"error")+"). Scanned PDFs need OCR, which is not available here."}});
const pgs=[...document.querySelectorAll(".pg")];
function route(){let h=(location.hash||"#home").slice(1),iv=h.startsWith("inv-")&&D.find(x=>x.id===h.slice(4));if(iv){invPage(iv);h="inv"}const st=h.startsWith("study-")&&R.find(x=>x.id===h.slice(6));if(st){studyPage(st);h="study"}const k=pgs.some(p=>p.id==="p-"+h)?h:"home";
 pgs.forEach(p=>p.classList.toggle("on",p.id==="p-"+k));
 document.querySelectorAll("nav a").forEach(a=>a.toggleAttribute("aria-current",a.getAttribute("href")==="#"+(k==="inv"?"explore":k==="study"?"library":k))||a.removeAttribute("aria-current"));
 document.querySelectorAll("nav a").forEach(a=>{if(a.getAttribute("href")==="#"+(k==="inv"?"explore":k==="study"?"library":k))a.setAttribute("aria-current","page")});
 document.title="IGNIS AI";window.scrollTo(0,0)}
addEventListener("hashchange",route);route();
let hist=[],ai=false;
(async()=>{try{const r=await fetch("/api/health");ai=!!(await r.json()).aiConfigured}catch(e){ai=false}
 $("mode").textContent=ai?"Answers are generated by Claude through this site’s server. They can be wrong; verify important claims.":"The AI service is not configured on this server, so answers come from a short built-in fact list."})();
["Why is a flame a sphere in freefall?","Why does 30% oxygen matter on the Moon?","What can’t this data tell us yet?","How do Earth smoke detectors benefit?"].forEach(t=>{const b=document.createElement("button");b.textContent=t;b.onclick=()=>{$("q").value=t;send()};$("sug").append(b)});
function add(c,t){const d=document.createElement("div");d.className="m "+c;d.textContent=t;$("chat").append(d);$("chat").scrollTop=1e9;return d}
function local(q){q=q.toLowerCase();let best=null,n=0;QA.forEach(([k,a])=>{const c=k.split(" ").filter(w=>q.includes(w.slice(0,5))).length;if(c>n){n=c;best=a}});return best||"I don’t have a built-in answer for that, and the AI model isn’t available here. Try the Science page or the Explore ranking."}
let busy=false;
async function send(){const q=$("q").value.trim();if(!q||busy)return;busy=true;$("q").value="";add("u",q);const out=add("a","");out.textContent="Thinking...";
 if(!ai){out.textContent=local(q);busy=false;return}
 hist.push({role:"user",content:q});
 try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:hist.slice(-8)})});
  const j=await r.json();if(!r.ok)throw new Error(j.message||j.error||"request failed");
  setMsg(out,j.text);hist.push({role:"assistant",content:j.text})}
 catch(e){hist.pop();out.textContent=local(q)+"\n\n(The AI service could not answer: "+(e.message||"error")+")"}
 busy=false}
$("go").onclick=send;$("q").addEventListener("keydown",e=>{if(e.key==="Enter")send()});
