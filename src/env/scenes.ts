export const scenes = [
  {
    id: "studio",
    label: "Phòng chill",
    description: "Một góc nhỏ, bỏ bực ở đây.",
  },
  {
    id: "rain",
    label: "Vườn mưa",
    description: "Để mưa cuốn trôi ngày hơi mệt.",
  },
  {
    id: "space",
    label: "Vũ trụ",
    description: "Bực bội cũng nhẹ tênh ngoài không gian.",
  },
] as const;
export type SceneId = (typeof scenes)[number]["id"];
export function sceneArt(id: SceneId): string {
  if (id === "rain")
    return `<svg viewBox="0 0 900 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="rain-sky" x2="0" y2="1"><stop stop-color="#accac6"/><stop offset="1" stop-color="#e0e8cd"/></linearGradient></defs><path fill="url(#rain-sky)" d="M0 0h900v650H0z"/><circle cx="720" cy="130" r="64" fill="#e1e8d4"/><path d="M0 340Q160 200 350 355T900 300v350H0Z" fill="#94b8a3"/><path d="M0 430Q200 300 460 420T900 375v275H0Z" fill="#6c9d8e"/><path d="M0 510q250-160 480-40t420-30v210H0Z" fill="#b8cbb0"/><g fill="#4d8174"><path d="M40 480V140q100 40 75 135-40 80-75 50m820 185V170q-110 60-82 150 30 50 82 40"/></g><g fill="#dae2c7"><ellipse cx="220" cy="570" rx="60" ry="7"/><ellipse cx="710" cy="540" rx="70" ry="9"/></g></svg><div class="rainfall"></div>`;
  if (id === "space")
    return `<svg viewBox="0 0 900 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="space-sky"><stop stop-color="#55527d"/><stop offset="1" stop-color="#252d4c"/></radialGradient><linearGradient id="planet"><stop stop-color="#b69bc9"/><stop offset="1" stop-color="#70688f"/></linearGradient></defs><path fill="url(#space-sky)" d="M0 0h900v650H0z"/><g fill="#dbd7ec" opacity=".75">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 167 + 37) % 900}" cy="${(i * 89 + 29) % 570}" r="${i % 3 === 0 ? 2 : 1}"/>`).join("")}</g><g transform="translate(728 155) rotate(-23)"><circle r="64" fill="url(#planet)"/><ellipse rx="106" ry="19" fill="none" stroke="#d0b8b8" stroke-width="13"/><path d="M-61-18q-1-47 52-46" fill="none" stroke="#dac4df" stroke-width="5" opacity=".4"/></g><circle cx="148" cy="267" r="22" fill="#caa993"/><path d="M0 627q420-135 900-5v28H0Z" fill="#69657f"/><ellipse cx="180" cy="620" rx="42" ry="9" fill="#514e69"/><ellipse cx="740" cy="615" rx="72" ry="12" fill="#514e69"/></svg>`;
  return `<svg viewBox="0 0 900 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="studio-wall" x2=".8" y2="1"><stop stop-color="#ede9f7"/><stop offset="1" stop-color="#d8cfea"/></linearGradient><linearGradient id="studio-floor" x2="0" y2="1"><stop stop-color="#d0c4df"/><stop offset="1" stop-color="#e8deee"/></linearGradient></defs><path fill="url(#studio-wall)" d="M0 0h900v650H0z"/><path d="M0 450h900v200H0z" fill="url(#studio-floor)"/><path d="M0 450h900" stroke="#bbaaca" stroke-opacity=".4"/><path d="M110 450V136a95 95 0 0 1 190 0v314Z" fill="#c4b6d5" opacity=".48"/><path d="M126 440V139a79 79 0 0 1 158 0v301Z" fill="#f3edf9"/><path d="M205 61v379m-79-228h158" stroke="#d3c7e0" stroke-width="8"/><path d="m132 225 145 88v117H132Z" fill="#e7dff1"/><path d="M126 440h159l97 140H223Z" fill="#f8f1ff" opacity=".35"/><g transform="translate(736 358)"><path d="M-41 36h78l-11 68h-54Z" fill="#d0a592"/><path d="M-2 37V-48m0 45q-61-5-44-57 42 6 44 57m2 23q63-6 43-63Q4-35 0 20m0-50q-34-28-8-69 34 27 8 69" fill="#93ab91" stroke="#708a76" stroke-width="3"/></g><g transform="translate(603 134) rotate(8)"><rect width="62" height="76" rx="3" fill="#f1eaf4" stroke="#b7a4c8" stroke-width="5"/><path d="m14 57 18-30 19 30Z" fill="#b9a1ce"/><circle cx="20" cy="20" r="7" fill="#e4be90"/></g><ellipse cx="450" cy="545" rx="191" ry="47" fill="#bcaacd" opacity=".36"/><ellipse cx="450" cy="541" rx="172" ry="38" fill="#cbbbd9" opacity=".5"/></svg>`;
}
