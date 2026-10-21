import type { Mood } from "./reaction";
import type { Character } from "./model";
import { outfitLayer, hatLayer, glassesLayer } from "./wardrobe";
import { renderMarks, type Mark } from "./session";

export function renderFigure(
  character: Character,
  mood: Mood = "normal",
  prefix = "hero",
  marks: Mark[] = [],
): string {
  const {
    kind,
    color,
    outfit,
    body,
    hat = "none",
    glasses = "none",
  } = character;
  const blob = kind === "blob",
    cat = kind === "cat",
    girl = kind === "girl";
  const shape =
    body === "round"
      ? "translate(-24 15) scale(1.16 .96)"
      : body === "tall"
        ? "translate(13 -14) scale(.92 1.04)"
        : "";
  const eyes =
    mood === "normal"
      ? '<g class="eyes"><ellipse cx="120" cy="139" rx="7" ry="10"/><ellipse cx="180" cy="139" rx="7" ry="10"/><circle cx="122" cy="136" r="2" fill="white"/><circle cx="182" cy="136" r="2" fill="white"/></g>'
      : mood === "ouch"
        ? '<path d="m111 131 14 9-14 8m78-17-14 9 14 8" fill="none" stroke-width="5"/>'
        : mood === "dizzy"
          ? '<path d="M110 139c0-18 24-17 24 0s-20 15-20 2 14-12 14-2m38 0c0-18 24-17 24 0s-20 15-20 2 14-12 14-2" fill="none" stroke-width="3.5"/>'
          : '<path d="m111 133 17 14m0-14-17 14m61-14 17 14m0-14-17 14" fill="none" stroke-width="4"/>';
  const mouth =
    mood === "normal"
      ? '<path d="M139 162q11 14 22 0" fill="none" stroke-width="4"/>'
      : '<ellipse cx="150" cy="169" rx="10" ry="12" fill="#644655"/><path d="M143 174q7-6 14 0" stroke="#e6a1ac" stroke-width="4"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340" class="figure" aria-hidden="true">
  <defs>
    <radialGradient id="${prefix}-skin" cx="32%" cy="22%" r="85%"><stop stop-color="${color}"/><stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="#70517d"/></radialGradient>
    <linearGradient id="${prefix}-shirt" x2=".8" y2="1"><stop stop-color="#f4e5ca"/><stop offset="1" stop-color="#d6bca2"/></linearGradient>
    <filter id="${prefix}-shadow" x="-30%" y="-20%" width="160%" height="150%"><feDropShadow dx="0" dy="9" stdDeviation="6" flood-color="#483657" flood-opacity=".15"/></filter>
  </defs>
  <g transform="${shape}">
  <g stroke="#644b75" stroke-width="2" stroke-linejoin="round" filter="url(#${prefix}-shadow)">
    <g class="pose-body">
    <g class="pose-arm-left"><path d="M98 234Q64 231 60 257q-2 13 13 12l38-21" fill="url(#${prefix}-skin)"/></g>
    <g class="pose-arm-right"><path d="M201 233q36 0 39 26 0 14-14 8l-35-18" fill="url(#${prefix}-skin)"/></g>
    <path d="M110 267q-24 15-16 37 10 12 35-2l7-25m27 0 9 26q25 13 35 0 9-24-17-37" fill="url(#${prefix}-skin)"/>
    ${blob && outfit === "basic" ? `<path d="M90 185q-22 58 1 84 21 23 59 20 44 2 65-22 22-29-6-82Z" fill="url(#${prefix}-skin)"/><path d="m124 245 7 5 7-8 7 10 7-9 9 9 7-6" stroke="#77608b" fill="none" stroke-width="3"/><path d="m183 228 13-5 6 14-14 4Z" fill="#ead89b" stroke="none"/>` : outfitLayer(outfit, prefix)}
    ${renderMarks(marks.filter(mark => mark.y > 205))}
    </g>
    <g class="pose-head">
    <g class="pose-tuft">${cat ? `<path d="m83 110-4-65q31 0 47 29m48 0q20-31 45-29l-3 67" fill="${color}"/><path d="m90 62 5 35 19-18m75 0 18-18-3 38" fill="#e9b0bb" stroke="none"/>` : blob ? `<path d="M132 85q-36-25-15-38 12-7 23 6-6-26 13-28 20 1 14 28 17-17 29-1 10 18-20 34" fill="url(#${prefix}-skin)"/><path d="M143 62q-7-16 4-20" stroke="white" stroke-opacity=".3" stroke-width="5" fill="none"/>` : `<path d="M82 152Q55 62 116 55q92-34 107 47l-4 79H80Z" fill="${girl ? "#604652" : "#63505b"}"/>`}
    </g>
    <path d="${blob ? "M85 104Q86 76 116 77l68-2q37 0 40 34l5 59q0 36-38 39l-83-2q-38-3-36-35Z" : "M77 134q-3-59 69-64 76-3 80 62 6 69-75 76-80-1-74-74Z"}" fill="url(#${prefix}-skin)"/>
    ${blob ? '<path d="m91 101 12-12 19 8-9 19Z" fill="#eadba5" stroke="none"/><path d="m99 100 8 5" stroke="#b99f7b" stroke-width="2"/><path d="m104 121 22 3m48 0 20-7" stroke="#6b4f7c" stroke-width="5" stroke-linecap="round"/>' : ""}
    <path d="M91 111q12-25 40-27" stroke="white" stroke-opacity=".28" stroke-width="7" fill="none"/>
    ${!blob && !cat ? `<path d="M77 120Q66 51 142 57q79-9 85 65-36-6-57-39-27 39-93 37Z" fill="${girl ? "#604652" : "#63505b"}"/>${girl ? '<path d="M204 92q25 27 13 65" fill="none" stroke="#604652" stroke-width="19"/><path d="m197 90 15-14 10 16-16 8Z" fill="#f2bf86"/>' : '<path d="M114 67q15-30 35-17" fill="none" stroke="#63505b" stroke-width="9"/>'}` : ""}
    <ellipse cx="99" cy="159" rx="13" ry="8" fill="#efb1c3" stroke="none" opacity=".65"/><ellipse cx="201" cy="159" rx="13" ry="8" fill="#efb1c3" stroke="none" opacity=".65"/>
    <g class="pose-gaze" fill="#47344f" stroke="#47344f" stroke-linecap="round">${eyes}<g class="pose-mouth">${mouth}</g></g>
    ${glassesLayer(glasses)}
    ${renderMarks(marks.filter(mark => mark.y <= 205))}
    ${hatLayer(hat)}
    ${cat ? '<path d="m91 158-26-5m26 13-26 4m144-12 26-5m-26 13 26 4" fill="none" stroke-width="2"/><path d="m145 152 5 5 5-5Z" fill="#6b4b69"/>' : ""}
  </g>
  </g>
  ${mood === "dizzy" || mood === "knocked" ? '<g fill="#eebf55" stroke="#9a7639" stroke-width="1"><path d="m66 44 4 10 11 1-8 7 2 11-9-6-10 6 2-11-8-7 11-1Z"/><path d="m237 62 3 8 9 1-6 6 1 8-7-4-8 4 2-8-7-6 9-1Z"/></g>' : ""}
  </g></svg>`;
}
