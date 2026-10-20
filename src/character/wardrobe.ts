import type { Character } from "./model";
export function outfitLayer(
  outfit: Character["outfit"],
  prefix: string,
): string {
  const fill = {
    basic: `url(#${prefix}-shirt)`,
    stripes: "#f1e0c5",
    overalls: "#efe3ca",
    hoodie: "#90b9ae",
    suit: "#66778c",
    pajamas: "#b6a3d3",
    sport: "#b37286",
    raincoat: "#e9cb76",
    astronaut: "#e1e3eb",
    bomber: "#9b9e81",
    denim: "#85a6bf",
    kimono: "#d39eab",
  }[outfit];
  const base = `<path d="M90 185q-22 58 1 84 21 23 59 20 44 2 65-22 22-29-6-82Z" fill="${fill}"/>`;
  const details: Record<Character["outfit"], string> = {
    basic:
      '<path d="m130 243 8-4 6 4 6-8 6 8 7-3 9 5" stroke="#a68ca9" fill="none" stroke-width="3"/>',
    stripes:
      '<path d="M91 222h119m-124 19h130m-122 19h114" fill="none" stroke="#a18ab3" stroke-width="9"/>',
    overalls:
      '<path d="m110 198 7 36h67l7-36 12 7-4 29 11 35q-59 31-115 0l12-35-10-29Z" fill="#819caf"/><rect x="134" y="244" width="32" height="23" rx="5" fill="#a3bac7"/><g fill="#f6de9f"><circle cx="120" cy="235" r="4"/><circle cx="182" cy="235" r="4"/></g>',
    hoodie:
      '<path d="M97 203q50 35 107-2" fill="none" stroke="#6c998f" stroke-width="10"/><path d="m128 218-2 21m46-21 2 21" stroke="#eee7cc" stroke-width="3"/><path d="M119 248q31-12 62 0l-3 20h-55Z" fill="#a9ccc0"/><path d="M97 278h107" stroke="#6c998f" stroke-width="6"/>',
    suit: '<path d="m122 204 28 24 28-24 5 10-33 49-34-49Z" fill="#eee9df"/><path d="m150 228-6 9 6 21 6-21Z" fill="#c395a5"/><path d="m112 211 16 32-14 2 32 35m44-69-16 32 14 2-32 35" stroke="#465b74" fill="none" stroke-width="3"/><path d="M150 259v23m26-25h18" stroke="#c0c4c9"/>',
    pajamas:
      '<path d="M150 213v72m-28-76 28 23 27-23m-58 39h20v17h-20Z" fill="none" stroke="#e0d1ed" stroke-width="3"/><g fill="#f0d89f" stroke="none"><path d="m184 242 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/><circle cx="114" cy="232" r="3"/><circle cx="178" cy="277" r="3"/></g>',
    sport:
      '<path d="m96 214 10 66m97-67-10 67" stroke="#f0d1ab" stroke-width="8"/><text x="150" y="264" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="900" fill="#f5e2c8" stroke="none">01</text><path d="M126 213q24 19 48 0" stroke="#edc7ab" stroke-width="5" fill="none"/>',
    raincoat:
      '<path d="M150 214v70m-22-75 22 17 22-17" fill="none" stroke="#ad9466" stroke-width="3"/><path d="M111 248h25v19h-25Zm56 0h25v19h-25Z" fill="#f7dc91"/><g fill="#b39767"><circle cx="150" cy="240" r="3"/><circle cx="150" cy="261" r="3"/></g><path d="M96 278h109" stroke="#f8e4ab" stroke-width="5"/>',
    astronaut:
      '<path d="M99 211q51 29 102 0" fill="none" stroke="#b4b9cb" stroke-width="9"/><rect x="127" y="233" width="47" height="33" rx="7" fill="#8f9eb9"/><g stroke="none"><circle cx="139" cy="245" r="4" fill="#e9a69d"/><circle cx="153" cy="245" r="4" fill="#a6cbb3"/><path d="M137 255h27" stroke="#e1e5ed" stroke-width="3"/></g><path d="M99 280h104" stroke="#b4b9cb" stroke-width="6"/>',
    bomber:
      '<path d="M150 216v65m-20-70q20 16 40 0" fill="none" stroke="#ded2ab" stroke-width="6"/><path d="m111 242 24 12m54-12-24 12" stroke="#777d6a" stroke-width="4"/><path d="M98 278h104" stroke="#727869" stroke-width="9"/><circle cx="180" cy="227" r="8" fill="#e2c88b"/>',
    denim:
      '<path d="M150 215v68m-22-77-14 26 20 7 16-19 16 19 19-7-12-26" fill="none" stroke="#c2d4dc" stroke-width="3"/><path d="M109 241h25v18l-12 6-13-6Zm57 0h25v18l-13 6-12-6Z" fill="#6b91ae"/><g fill="#e4d2aa"><circle cx="150" cy="244" r="2.5"/><circle cx="150" cy="263" r="2.5"/></g>',
    kimono:
      '<path d="m123 208 57 72m-4-72-47 62" stroke="#f3d8dc" stroke-width="10"/><path d="M90 255h121v17H91Z" fill="#817c9e"/><g fill="#f3d9b4" stroke="none"><circle cx="110" cy="231" r="5"/><circle cx="188" cy="244" r="4"/><circle cx="128" cy="278" r="4"/></g>',
  };
  return base + details[outfit];
}
export function hatLayer(hat: Character["hat"]): string {
  return {
    none: "",
    beanie:
      '<path d="M80 103q-8-64 70-64 73 2 75 64Z" fill="#9b85bc"/><path d="M79 91q73-18 147 0v22q-73-17-147 0Z" fill="#b9a3d1"/><path d="M108 59v23m23-34v30m23-32v31m22-25v27m23-18v20" stroke="#d1bee4" stroke-width="3"/><circle cx="150" cy="35" r="17" fill="#cab7dd"/>',
    cap: '<path d="M84 97q6-55 66-57 64 3 73 57Z" fill="#90b8ad"/><path d="M87 94q-50 10-49 22 1 13 95-3l79-14Z" fill="#77a395"/><path d="M153 42v45" fill="none" stroke="#c8dbcd" stroke-width="3"/><path d="m164 65 6-10 5 10 10 2-8 6 1 10-8-5-9 4 2-10-7-7Z" fill="#e7d399"/>',
    bucket:
      '<path d="m99 53 96 2 21 49q-64 19-133 0Z" fill="#d9ba92"/><path d="M84 91q61 17 131 0l25 30q-90 27-177 0Z" fill="#edcea6"/><path d="M100 78h95" fill="none" stroke="#b59d85" stroke-width="4"/>',
    crown:
      '<path d="m88 72 7-43 30 26 26-40 26 41 29-26 7 42Z" fill="#efd081"/><path d="M91 72h118v15H91Z" fill="#d7b261"/><g fill="#d6a0bb"><circle cx="121" cy="68" r="5"/><circle cx="151" cy="64" r="6"/><circle cx="181" cy="68" r="5"/></g>',
    bow: '<path d="M188 65q-36-44-44-18-7 29 40 31 30 18 37-6 5-25-29-12Z" fill="#d79aad"/><circle cx="184" cy="71" r="10" fill="#b47795"/><path d="m174 82-9 23 18-6 9 7 7-22" fill="#d79aad"/>',
    headphones:
      '<path d="M77 140V99q0-71 74-71t73 71v41" fill="none" stroke="#635b7d" stroke-width="13"/><path d="M78 107V96q3-57 73-57t72 57v11" fill="none" stroke="#c6b4dc" stroke-width="5"/><rect x="65" y="113" width="25" height="54" rx="12" fill="#a38bbd"/><rect x="212" y="113" width="25" height="54" rx="12" fill="#a38bbd"/><path d="M78 125v29m146-29v29" stroke="#d4c5e6" stroke-width="5"/>',
    party:
      '<path d="m93 82 58-80 56 80q-52 19-114 0Z" fill="#b29bcf"/><path d="m126 37 47 14m-62 7 77 15" stroke="#efcda0" stroke-width="9"/><circle cx="151" cy="7" r="10" fill="#e6b5c2"/>',
  }[hat];
}
export function glassesLayer(glasses: Character["glasses"]): string {
  return {
    none: "",
    round:
      '<g fill="#ede8f3" fill-opacity=".12" stroke="#786183" stroke-width="4"><circle cx="118" cy="140" r="21"/><circle cx="182" cy="140" r="21"/><path d="M139 138q11-8 22 0m-64 0-17-5m123 5 17-5" fill="none"/></g>',
    sun: '<path d="M93 124h48l-3 24q-23 23-42-1Zm68 0h48l-3 24q-23 23-42-1Z" fill="#554764"/><path d="M140 130h22m-69 0-14-5m130 5 14-5m-112 3 12 14m57-14 12 14" stroke="#c9b5d7" stroke-width="3"/>',
    star: '<g fill="#ecd68e" fill-opacity=".7" stroke="#bc9672" stroke-width="3"><path d="m118 115 8 15 17 2-12 12 3 17-16-8-16 8 3-17-12-12 17-2Zm64 0 8 15 17 2-12 12 3 17-16-8-16 8 3-17-12-12 17-2Z"/><path d="M141 138h18"/></g>',
    sleep:
      '<path d="M91 122q24-12 59-4 35-8 59 4l-2 34q-28 14-57-2-29 16-57 2Z" fill="#b9a1cf"/><path d="m108 137 5 9 5-9m64 0 5 9 5-9m-99-2-14-3m128 3 15-3" fill="none" stroke="#f0dfef" stroke-width="3"/>',
  }[glasses];
}
