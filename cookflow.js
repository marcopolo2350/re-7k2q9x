/* Cooking Mode as a cooking assistant: the current step stays in front, and alongside it the cook sees
   - "While you wait": later preparation steps that can be done during a waiting period,
   - running timers, what's coming up next, and the whole recipe at any time.
   Parallel suggestions come only from the recipe's own text: a later step is offered early only if it is pure
   preparation (chopping, measuring, mixing...) that does not use the stove, oven or the food from earlier steps,
   or if the recipe itself says "meanwhile". Nothing is suggested while a step needs constant attention (frying,
   stirring constantly, broiling, caramel). Loaded after kitchen.js. */
(function () {
  const WAIT = /\b(boil|boiling|simmer|bake|roast|rest|marinate|chill|refrigerat\w*|cool|rise|prove|soak|steep|until (?:tender|golden|soft|cooked|thick))\b/i;
  const ATTEND = /\b(deep[- ]?fry|fry|frying|saut[ée]|stir constantly|stirring constantly|whisk constantly|keep stirring|watch (?:closely|carefully)|broil|caramel\w*|flamb\w*)\b/i;
  const PREP = /\b(chop|slice|dice|mince|grate|shred|peel|measure|whisk together|mix together|stir together|combine|rinse|wash|pat dry|season the|crush|zest|juice|trim|cut|tear|pick|halve|quarter|core|seed|soak the)\b/i;
  const HOT = /\b(add|return|pour (?:it|them|over|into the (?:pan|pot))|heat|hot|fry|saut[ée]|cook|bake|roast|boil|simmer|stir in|the pan|the pot|skillet|wok|oven|drain|reserved|cooked|serve|transfer)\b/i;
  const MEANWHILE = /^\s*(meanwhile|while\b)/i;
  const EQUIP = [["oven", /\boven|bake|roast\b/i], ["large pot", /\bpot|boil\b/i], ["skillet or frying pan", /\bskillet|frying pan|pan\b/i], ["baking dish or tray", /baking (?:dish|sheet|tray|pan)|casserole|tray\b/i], ["blender or food processor", /blend|food processor|pur[ée]e/i], ["grill", /\bgrill/i], ["whisk", /\bwhisk/i]];

  const waitMins = s => (typeof findT === "function" ? findT(s) : []).reduce((a, t) => a + t.mins, 0);
  const isPrep = s => PREP.test(s) && !HOT.test(s);
  function parallelFor(r, i) {
    const cur = r.st[i] || "";
    if (ATTEND.test(cur) || !WAIT.test(cur) && waitMins(cur) < 5) return { list: [], attend: ATTEND.test(cur) };
    const list = [];
    for (let k = i + 1; k < r.st.length && list.length < 3; k++) {
      if (ck.done[k]) continue;
      const s = r.st[k];
      /* never suggest something that needs the equipment the waiting step is using (same oven, pot, pan, blender…) */
      if (EQUIP.some(([, re]) => re.test(cur) && re.test(s))) continue;
      if (MEANWHILE.test(s) && !ATTEND.test(s)) list.push({ k, s, why: "The recipe says to do this meanwhile" });
      else if (isPrep(s)) list.push({ k, s, why: "Preparation only: no stove or oven needed" });
    }
    return { list, attend: false };
  }
  const short = s => { const t = String(s).replace(/<[^>]+>/g, ""); return t.length > 150 ? t.slice(0, 147) + "…" : t; };
  function timersHtml() {
    const T = (S.timers || []).filter(t => t.end - Date.now() > -60000);
    if (!T.length) return "";
    return `<section class="cf-sec"><h3>Active timers</h3>${T.map(t => `<div class="cf-timer" data-end="${t.end}"><span>${esc(t.label || "Timer")}</span><b class="cf-left">${mmss(t.end - Date.now())}</b></div>`).join("")}<button class="btn ghost sm" data-a="timers">Manage timers</button></section>`;
  }
  function overviewHtml(r, f) {
    return `<details class="cf-ov"><summary>Whole recipe (${r.st.length} steps)</summary><ol>${r.st.map((s, k) => `<li class="${ck.done[k] ? "done" : ""}${k === ck.i ? " cur" : ""}"><button class="cf-go" data-a="ckGo" data-v="${k}">${ck.done[k] ? "Done · " : k === ck.i ? "Now · " : ""}${esc(short(scaleText(s, f)))}</button></li>`).join("")}</ol></details>`;
  }
  function beforeHtml(r) {
    const all = r.st.join(" ");
    const eq = EQUIP.filter(([, re]) => re.test(all)).map(([n]) => n);
    const waits = r.st.reduce((a, s) => a + waitMins(s), 0);
    const prep = r.st.map((s, k) => ({ s, k })).filter(x => isPrep(x.s));
    return `<section class="cf-sec cf-before"><h3>Before you start</h3><div class="cf-facts"><span><b>${fmtMin(r.t)}</b> total</span>${waits ? `<span><b>${fmtMin(waits)}</b> of it waiting</span>` : ""}<span><b>${r.st.length}</b> steps</span></div>${eq.length ? `<div class="small"><b>You'll use:</b> ${eq.join(", ")}</div>` : ""}${prep.length ? `<div class="small" style="margin-top:6px"><b>Prep you can do first:</b> step ${prep.map(x => x.k + 1).join(", ")}</div>` : ""}</section>`;
  }

  const _rCook = rCook;
  rCook = function () {
    _rCook();
    if (!ck) return;
    const r = R_(ck.id), f = ck.s / r.s, body = document.getElementById("ckBody");
    if (!body) return;
    let h = "";
    if (ck.i < 0) h = beforeHtml(r) + timersHtml() + overviewHtml(r, f);
    else {
      const p = parallelFor(r, ck.i);
      if (p.attend) h += `<section class="cf-sec cf-attend"><h3>Stay with the pan</h3><p class="small">This step needs your full attention, so nothing else is suggested right now.</p></section>`;
      else if (p.list.length) h += `<section class="cf-sec cf-wait"><h3>While you wait</h3><p class="small mut">You can do these now and they'll be ticked off when you get there.</p>${p.list.map(x => `<div class="cf-task"><div><div>${scaleText(x.s, f)}</div><small class="mut">Step ${x.k + 1} · ${x.why}</small></div><button class="btn sm" data-a="cfDone" data-v="${x.k}" aria-label="Mark step ${x.k + 1} done">Done</button></div>`).join("")}</section>`;
      h += timersHtml();
      const nx = r.st.findIndex((s, k) => k > ck.i && !ck.done[k]);
      if (nx > 0) h += `<section class="cf-sec"><h3>Coming up next</h3><p class="small">${esc(short(scaleText(r.st[nx], f)))}</p></section>`;
      h += overviewHtml(r, f);
    }
    const box = document.createElement("div"); box.className = "cf"; box.innerHTML = h; body.appendChild(box);
  };
  A.cfDone = el => { const k = +el.dataset.v; ck.done[k] = 1; saveSess(); rCook(); toast("Step " + (k + 1) + " done"); };
  /* Next skips steps already done during a wait. */
  A.kNext = () => {
    const r = R_(ck.id); if (ck.i >= 0) ck.done[ck.i] = 1;
    let j = ck.i + 1; while (j < r.st.length - 1 && ck.done[j]) j++;
    if (j <= r.st.length - 1) { ck.i = j; rCook(); const b = document.getElementById("ckBody"); if (b) b.scrollTop = 0; if (typeof speakAuto !== "undefined" && speakAuto) speak(r.st[ck.i]); }
  };
  setInterval(() => { document.querySelectorAll("#cook .cf-timer").forEach(el => { const b = el.querySelector(".cf-left"); if (b) b.textContent = mmss(+el.dataset.end - Date.now()); }); }, 1000);
  window.__cookflow = { parallelFor, isPrep, WAIT, ATTEND };
})();
