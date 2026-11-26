/* Original cuisine-styled dish illustrations, used wherever a recipe has no verified, licensed photo.
   Drawn here as SVG (no third-party artwork). Loaded before app.js. */
"use strict";
const ILLUS = (function () {
  const PAL = {
    mideast: { bg: "#F3E3C8", a: "#C8643B", b: "#1F7A7A", p: "star" }, med: { bg: "#EEF2F7", a: "#2E5E9E", b: "#6B8E23", p: "tile" },
    latin: { bg: "#FFF0D9", a: "#D63A6B", b: "#F2A900", p: "zig" }, eastasia: { bg: "#FBF1E6", a: "#B8322A", b: "#2B2B2B", p: "wave" },
    seasia: { bg: "#EEF5E6", a: "#3E8E41", b: "#D9A21B", p: "leaf" }, southasia: { bg: "#FFF1DB", a: "#E07A1F", b: "#7A1F3D", p: "dots" },
    amer: { bg: "#F4F1EA", a: "#B03A48", b: "#2F4B7C", p: "check" }, north: { bg: "#EFF3EC", a: "#5B7F5E", b: "#C9A063", p: "stripe" },
    other: { bg: "#F8EDEE", a: "#8E2C42", b: "#C9A063", p: "dots" }
  };
  const GRP = { mideast: ["Egyptian", "Lebanese", "Syrian", "Turkish", "Moroccan", "Tunisian", "Saudi", "Persian", "Iranian", "Palestinian", "Algerian", "Iraqi", "Yemeni"], med: ["Italian", "Greek", "Spanish", "French", "Portuguese", "Croatian", "Albanian", "Bulgarian"], latin: ["Mexican", "Tex-Mex", "Colombian", "Peruvian", "Venezuelan", "Cuban", "Argentinian", "Chilean", "Brazilian", "Jamaican", "Dominican", "Uruguayan", "Trinidadian", "Bahamian", "Barbadian", "Puerto Rican", "Salvadoran"], eastasia: ["Chinese", "Japanese", "Korean", "Taiwanese"], seasia: ["Thai", "Vietnamese", "Filipino", "Malaysian", "Cambodian", "Lao", "Indonesian", "Singaporean"], southasia: ["Indian", "Pakistani", "Bangladeshi", "Sri Lankan", "Nepali", "Afghan"], amer: ["American", "Southern", "Cajun", "Canadian", "Australian"], north: ["British", "Irish", "Scottish", "Polish", "Ukrainian", "Russian", "German", "Dutch", "Danish", "Norwegian", "Swedish", "Belgian", "Austrian", "Hungarian", "Slovak", "Estonian", "Finnish"] };
  const grp = cu => Object.keys(GRP).find(k => GRP[k].includes(cu)) || "other";
  const pattern = (p, c) => ({
    star: `<pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M20 4l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="${c}" opacity=".18"/></pattern>`,
    tile: `<pattern id="p" width="36" height="36" patternUnits="userSpaceOnUse"><rect x="2" y="2" width="32" height="32" rx="4" fill="none" stroke="${c}" stroke-width="2" opacity=".2"/><circle cx="18" cy="18" r="5" fill="${c}" opacity=".15"/></pattern>`,
    zig: `<pattern id="p" width="40" height="20" patternUnits="userSpaceOnUse"><path d="M0 15l10-10 10 10 10-10 10 10" fill="none" stroke="${c}" stroke-width="3" opacity=".2"/></pattern>`,
    wave: `<pattern id="p" width="40" height="20" patternUnits="userSpaceOnUse"><path d="M0 10q10-10 20 0t20 0" fill="none" stroke="${c}" stroke-width="2" opacity=".2"/></pattern>`,
    leaf: `<pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M8 32q4-20 24-24-4 20-24 24z" fill="${c}" opacity=".14"/></pattern>`,
    dots: `<pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="3" fill="${c}" opacity=".2"/></pattern>`,
    check: `<pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="${c}" opacity=".1"/><rect x="20" y="20" width="20" height="20" fill="${c}" opacity=".1"/></pattern>`,
    stripe: `<pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="12" height="24" fill="${c}" opacity=".1"/></pattern>`
  })[p];
  /* dishes: drawn around a center (200,150) */
  const plate = `<ellipse cx="200" cy="168" rx="122" ry="40" fill="#000" opacity=".08"/><ellipse cx="200" cy="158" rx="118" ry="40" fill="#fff"/><ellipse cx="200" cy="156" rx="88" ry="28" fill="#F6F2EC"/>`;
  const D = {
    soup: (a, b) => `<ellipse cx="200" cy="175" rx="112" ry="30" fill="#000" opacity=".08"/><path d="M95 130h210q-8 62-105 62t-105-62z" fill="${b}"/><ellipse cx="200" cy="130" rx="105" ry="24" fill="${a}"/><ellipse cx="200" cy="128" rx="92" ry="18" fill="#E9A35B"/><circle cx="175" cy="126" r="6" fill="#5C8A3A"/><circle cx="215" cy="131" r="5" fill="#fff" opacity=".8"/><circle cx="235" cy="124" r="4" fill="#5C8A3A"/><path d="M175 98q-10-14 0-26M200 96q-10-14 0-28M225 98q-10-14 0-26" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`,
    comfort: (a, b) => `<rect x="92" y="108" width="216" height="80" rx="16" fill="${b}"/><rect x="72" y="118" width="26" height="14" rx="6" fill="${b}"/><rect x="302" y="118" width="26" height="14" rx="6" fill="${b}"/><rect x="102" y="104" width="196" height="28" rx="12" fill="#E8B04B"/><circle cx="140" cy="116" r="9" fill="#C9832E"/><circle cx="190" cy="112" r="7" fill="#C9832E"/><circle cx="245" cy="118" r="10" fill="#C9832E"/><circle cx="270" cy="110" r="6" fill="#B8572E"/>`,
    light: (a, b) => `${plate}<path d="M150 150q20-40 50-10q30-30 50 10q-25 25-50 10q-25 15-50-10z" fill="#6BAA4A"/><circle cx="180" cy="148" r="11" fill="#E0463A"/><circle cx="226" cy="152" r="9" fill="#E0463A"/><ellipse cx="205" cy="160" rx="16" ry="8" fill="#F0E6A0"/><path d="M165 165l20-6M232 164l-18-4" stroke="${a}" stroke-width="4" stroke-linecap="round"/>`,
    lunch: (a, b) => `${plate}<path d="M140 140q60-40 120 0z" fill="#E3B26A"/><rect x="138" y="140" width="124" height="10" rx="4" fill="#6BAA4A"/><rect x="140" y="148" width="120" height="9" rx="4" fill="#E0463A"/><rect x="142" y="155" width="116" height="9" rx="4" fill="#F2C94C"/><path d="M140 163h120q-60 18-120 0z" fill="#D9A257"/>`,
    quick: (a, b) => `<ellipse cx="190" cy="170" rx="100" ry="30" fill="#000" opacity=".08"/><ellipse cx="190" cy="150" rx="92" ry="34" fill="#2B2B2B"/><rect x="278" y="142" width="80" height="14" rx="7" fill="#2B2B2B"/><ellipse cx="190" cy="146" rx="78" ry="26" fill="#3A3A3A"/><circle cx="165" cy="142" r="12" fill="#C9832E"/><circle cx="200" cy="150" r="10" fill="#6BAA4A"/><circle cx="222" cy="138" r="11" fill="${a}"/><circle cx="180" cy="158" r="8" fill="#F2C94C"/>`,
    prep: (a, b) => `<rect x="110" y="112" width="180" height="76" rx="14" fill="#fff" stroke="${b}" stroke-width="4"/><path d="M200 116v68M110 150h90" stroke="${b}" stroke-width="3"/><circle cx="150" cy="132" r="12" fill="#F2E6C8"/><circle cx="165" cy="137" r="10" fill="#F2E6C8"/><rect x="128" y="158" width="58" height="20" rx="8" fill="#6BAA4A"/><path d="M215 132h60v44h-60z" fill="#C9832E" rx="8"/>`,
    breakfast: (a, b) => `${plate}<ellipse cx="175" cy="152" rx="44" ry="22" fill="#fff" stroke="#EDE6DA" stroke-width="2"/><circle cx="175" cy="150" r="13" fill="#F2B632"/><rect x="225" y="134" width="56" height="40" rx="10" fill="#D9A257"/><rect x="231" y="140" width="44" height="28" rx="7" fill="#E9C27D"/>`,
    treats: (a, b) => `${plate}<path d="M150 160l90-46 22 44z" fill="#F7E3C4"/><path d="M150 160l90-46 22 44v12l-112 2z" fill="${a}" opacity=".85"/><path d="M150 147l90-33 22 32" fill="none" stroke="#fff" stroke-width="5"/><circle cx="236" cy="112" r="8" fill="#D92B3A"/>`,
    sides: (a, b) => `<ellipse cx="200" cy="172" rx="86" ry="22" fill="#000" opacity=".08"/><path d="M128 138h144q-6 44-72 44t-72-44z" fill="${b}"/><ellipse cx="200" cy="138" rx="72" ry="16" fill="#6BAA4A"/><circle cx="182" cy="134" r="8" fill="#F2C94C"/><circle cx="210" cy="138" r="7" fill="#E0463A"/><circle cx="228" cy="132" r="6" fill="#F2E6C8"/>`,
    baking: (a, b) => `<ellipse cx="200" cy="176" rx="110" ry="22" fill="#000" opacity=".08"/><path d="M98 170q0-74 102-74t102 74z" fill="#C98A3E"/><path d="M140 112l18 22M180 102l14 26M220 102l-6 26M258 112l-14 22" stroke="#E8BC7A" stroke-width="6" stroke-linecap="round"/>`,
    wraps: (a, b) => `${plate}<g transform="rotate(-14 200 150)"><rect x="128" y="132" width="150" height="40" rx="20" fill="#EAD2A0"/><ellipse cx="276" cy="152" rx="14" ry="20" fill="#E0463A"/><ellipse cx="274" cy="152" rx="9" ry="14" fill="#6BAA4A"/><path d="M150 140q30 10 60 0" stroke="#D8BB82" stroke-width="3" fill="none"/></g>`
  };
  const cache = {};
  return function (r) {
    const g = grp(r.cu || ""), c = D[r.c] ? r.c : "comfort", key = g + "|" + c; if (cache[key]) return cache[key];
    const P = PAL[g];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs>${pattern(P.p, P.a)}<radialGradient id="v" cx="50%" cy="45%" r="70%"><stop offset="60%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".12"/></radialGradient></defs><rect width="400" height="300" fill="${P.bg}"/><rect width="400" height="300" fill="url(#p)"/>${D[c](P.a, P.b)}<rect width="400" height="300" fill="url(#v)"/><text x="388" y="290" text-anchor="end" font-family="-apple-system,Helvetica,Arial" font-size="12" fill="#000" opacity=".35">Illustration</text></svg>`;
    return (cache[key] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
  };
})();
