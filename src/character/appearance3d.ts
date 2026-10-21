import * as T from "three";
import type { Character } from "./model";

type XYZ = [number, number, number];
type M = T.MeshPhysicalMaterial | T.MeshStandardMaterial;
export interface Sculptor {
  mat(color: T.ColorRepresentation, roughness?: number, metalness?: number): T.MeshPhysicalMaterial;
  mesh(geometry: T.BufferGeometry, material: M, parent: T.Object3D, position: XYZ, scale?: XYZ): T.Mesh;
  ball(parent: T.Object3D, material: M, position: XYZ, scale: XYZ): T.Mesh;
  box(parent: T.Object3D, material: M, position: XYZ, scale: XYZ, radius?: number): T.Mesh;
  line(parent: T.Object3D, material: M, points: XYZ[], radius?: number): T.Mesh;
}

export function buildAppearance(s: Sculptor, body: T.Group, head: T.Group, arms: T.Group[], root: T.Group, skin: M, ink: M, cream: M) {
  const { mat, mesh, ball, box, line } = s;
  const hair = mat("#57404b", .65), hairLight = mat("#76544e", .6), pink = mat("#df9b9c", .8);
  const navy = mat("#46556c", .7), blue = mat("#719bb5", .75), white = mat("#f8e9d4", .7);
  const purple = mat("#a88fc5", .8), gold = mat("#dfb75f", .4), red = mat("#c87670", .7);
  const thread = mat("#bead9b", .9), mint = mat("#82b6a5", .8);
  const identities = new Map<Character["kind"], T.Group>();
  for (const kind of ["buddy", "girl", "cat"] as const) { const g = new T.Group(); head.add(g); identities.set(kind, g); }
  const buddy = identities.get("buddy")!, girl = identities.get("girl")!, cat = identities.get("cat")!;
  for (const human of [buddy, girl]) for (const side of [-1, 1]) {
    ball(human, skin, [side * .95, -.08, -.015], [.14, .21, .16]);
    ball(human, pink, [side * 1.02, -.08, .075], [.045, .1, .045]);
  }
  const hairCap = new T.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI * .53);
  mesh(hairCap, hair, buddy, [0, .37, -.06], [1.01, .54, .73]);
  ball(buddy, hair, [-.23, .47, .5], [.68, .18, .21]).rotation.z = -.17;
  ball(buddy, hair, [.57, .51, .45], [.32, .16, .2]).rotation.z = -.35;
  for (const side of [-1, 1]) ball(buddy, hair, [side * .86, .2, -.08], [.15, .45, .52]);
  line(buddy, hairLight, [[.38, .71, .27], [.56, .64, .48], [.71, .48, .52]], .018);
  // A side part and a sculpted bob give the two human bases different silhouettes.
  ball(girl, hair, [0, .1, -.47], [1.04, .88, .4]);
  for (const side of [-1, 1]) {
    const lock = ball(girl, hair, [side * .87, -.02, .03], [.19, .76, .43]); lock.rotation.z = side * .08;
    line(girl, hairLight, [[side * .94, .4, .28], [side * 1.01, -.09, .28], [side * .94, -.56, .29]], .012);
  }
  mesh(hairCap, hair, girl, [0, .39, -.03], [1.015, .54, .74]);
  ball(girl, hair, [-.21, .48, .51], [.7, .2, .2]).rotation.z = .22;
  ball(girl, hair, [.84, .47, -.48], [.35, .42, .3]);
  const catTail = new T.Group(); root.add(catTail);
  line(catTail, skin, [[.6, .65, -.28], [1.02, .62, -.35], [1.24, .93, -.3], [1.15, 1.15, -.28]], .14);
  ball(catTail, skin, [1.15, 1.15, -.28], [.14, .14, .14]);
  for (const side of [-1, 1]) {
    const ear = new T.Shape(); ear.moveTo(-.23, 0); ear.quadraticCurveTo(-.23, .29, 0, .53); ear.quadraticCurveTo(.22, .27, .24, 0); ear.closePath();
    const e = mesh(new T.ExtrudeGeometry(ear, { depth: .2, bevelSize: .045, bevelThickness: .06, bevelSegments: 3 }), skin, cat, [side * .7, .59, -.07]); e.rotation.z = -side * .25;
    const inner = new T.Shape(); inner.moveTo(-.13, .04); inner.lineTo(0, .35); inner.lineTo(.13, .04); inner.closePath();
    mesh(new T.ShapeGeometry(inner), pink, e, [0, .04, .265]);
    ball(cat, cream, [side * .13, -.23, .715], [.19, .14, .06]);
    for (let i = 0; i < 3; i++) line(cat, ink, [[side * .59, -.23 + i * .075, .6], [side * 1.1, -.32 + i * .14, .6]], .009);
  }
  ball(cat, pink, [0, -.16, .82], [.074, .05, .03]);

  const garments = new Map<Character["outfit"], T.Group>();
  const clothColor: Record<string, M> = { basic: white, stripes: white, overalls: blue, hoodie: purple, suit: navy, pajamas: blue, sport: mint, raincoat: gold, astronaut: white, bomber: mint, denim: blue, kimono: red };
  const coatGeo = new T.LatheGeometry([new T.Vector2(0, -.7), new T.Vector2(.6, -.66), new T.Vector2(.79, -.3), new T.Vector2(.77, .1), new T.Vector2(.59, .55), new T.Vector2(.37, .7), new T.Vector2(0, .7)], 40);
  const buttons = (g: T.Group, material: M, ys = [-.32, -.08, .16]) => ys.forEach(y => ball(g, material, [0, y, .635], [.033, .033, .018]));
  for (const id of Object.keys(clothColor) as Character["outfit"][]) {
    const g = new T.Group(); body.add(g); garments.set(id, g);
    mesh(coatGeo, clothColor[id], g, [0, -.02, .02], [1, 1, .81]);
    line(g, thread, [[-.52, -.59, .45], [0, -.66, .6], [.53, -.59, .45]], .012);
  }
  const basic = garments.get("basic")!;
  box(basic, red, [.3, .1, .6], [.15, .17, .035]);
  const stripes = garments.get("stripes")!;
  for (const y of [-.45, -.21, .03, .27]) line(stripes, navy, [[-.6, y, .43], [-.34, y - .01, .59], [0, y - .02, .65], [.34, y - .01, .59], [.6, y, .43]], .035);
  const overalls = garments.get("overalls")!;
  box(overalls, white, [0, .44, .39], [.85, .45, .35]);
  for (const side of [-1, 1]) { box(overalls, blue, [side * .29, .34, .59], [.12, .59, .09]); ball(overalls, gold, [side * .29, .08, .66], [.045, .045, .02]); }
  box(overalls, blue, [0, -.1, .64], [.44, .37, .07]);
  line(overalls, thread, [[-.21, -.12, .687], [0, -.22, .69], [.21, -.12, .687]], .012);
  const hoodie = garments.get("hoodie")!;
  mesh(new T.TorusGeometry(.39, .13, 10, 40), purple, hoodie, [0, .56, -.02], [1.3, .7, 1]);
  for (const side of [-1, 1]) { line(hoodie, white, [[side * .12, .51, .52], [side * .13, .12, .65]], .012); ball(hoodie, white, [side * .13, .12, .65], [.025, .04, .025]); }
  box(hoodie, purple, [0, -.35, .62], [.65, .24, .05]);
  const suit = garments.get("suit")!;
  box(suit, white, [0, .28, .53], [.48, .51, .14]);
  for (const side of [-1, 1]) {
    const lapel = new T.Shape(); lapel.moveTo(0, .58); lapel.lineTo(side * .32, .35); lapel.lineTo(side * .12, -.1); lapel.lineTo(0, .16); lapel.closePath();
    mesh(new T.ExtrudeGeometry(lapel, { depth: .04, bevelEnabled: false }), navy, suit, [side * .14, 0, .63]);
    box(suit, navy, [side * .38, -.29, .57], [.28, .07, .06]);
  }
  box(suit, red, [0, .21, .685], [.1, .32, .04]).rotation.z = .04; buttons(suit, gold, [-.23]);
  const pajamas = garments.get("pajamas")!;
  buttons(pajamas, white);
  for (const [x, y] of [[-.34, .25], [.4, -.15], [-.32, -.4]]) {
    ball(pajamas, white, [x, y, .6], [.12, .06, .025]); ball(pajamas, white, [x + .03, y + .05, .6], [.075, .055, .025]);
  }
  const sport = garments.get("sport")!;
  for (const side of [-1, 1]) line(sport, white, [[side * .39, .55, .31], [side * .6, .2, .5], [side * .65, -.35, .47]], .035);
  box(sport, white, [0, .04, .66], [.045, .3, .025]).rotation.z = -.15;
  const raincoat = garments.get("raincoat")!; buttons(raincoat, navy);
  mesh(new T.TorusGeometry(.4, .12, 10, 32), gold, raincoat, [0, .57, -.02], [1.4, .7, 1]);
  for (const side of [-1, 1]) box(raincoat, gold, [side * .37, -.3, .59], [.28, .23, .045]);
  const astronaut = garments.get("astronaut")!;
  mesh(new T.TorusGeometry(.39, .1, 10, 40), navy, astronaut, [0, .57, .03], [1.25, .7, 1]);
  box(astronaut, navy, [0, .05, .65], [.47, .32, .09]);
  for (let i = 0; i < 3; i++) ball(astronaut, [red, mint, gold][i], [(i - 1) * .13, .05, .71], [.036, .036, .015]);
  for (const side of [-1, 1]) box(astronaut, blue, [side * .69, -.24, .02], [.2, .23, .7]);
  for (const id of ["bomber", "denim"] as const) {
    const g = garments.get(id)!;
    line(g, gold, [[0, .54, .46], [0, -.6, .65]], .018);
    for (const side of [-1, 1]) {
      box(g, clothColor[id], [side * .34, .12, .59], [.26, .25, .055]);
      line(g, thread, [[side * .23, .15, .631], [side * .45, .15, .59]], .01);
    }
    mesh(new T.TorusGeometry(.57, .07, 8, 40), navy, g, [0, -.58, 0], [1.1, .35, .85]).rotation.x = Math.PI / 2;
  }
  const kimono = garments.get("kimono")!;
  line(kimono, cream, [[-.36, .54, .43], [0, .05, .66], [.38, -.32, .57]], .048);
  line(kimono, cream, [[.36, .54, .43], [0, .05, .67], [-.36, -.32, .57]], .048);
  box(kimono, purple, [0, -.21, .65], [1.1, .18, .09]);
  for (const [x, y] of [[-.4, .13], [.34, -.45]]) for (let i = 0; i < 5; i++) ball(kimono, cream, [x + Math.cos(i * 1.256) * .07, y + Math.sin(i * 1.256) * .07, .6], [.045, .045, .018]);

  const sleeves = arms.map((arm, index) => ball(arm, white, [(index ? 1 : -1) * .06, -.07, 0], [.245, .255, .265]));
  const pants = new T.Group(); root.add(pants);
  for (const side of [-1, 1]) {
    ball(pants, navy, [side * .37, .29, .02], [.27, .28, .28]);
    ball(pants, navy, [side * .4, .14, .24], [.32, .15, .42]);
  }

  const hats = new Map<Character["hat"], T.Group>();
  for (const id of ["beanie", "cap", "bucket", "crown", "bow", "headphones", "party"] as const) { const g = new T.Group(); head.add(g); hats.set(id, g); }
  const beanie = hats.get("beanie")!;
  ball(beanie, red, [0, .71, -.04], [.99, .4, .73]);
  mesh(new T.TorusGeometry(.85, .095, 10, 48), red, beanie, [0, .67, -.04], [1.1, .82, 1]).rotation.x = Math.PI / 2;
  ball(beanie, cream, [0, 1.08, -.04], [.16, .16, .16]);
  const cap = hats.get("cap")!; ball(cap, blue, [0, .65, -.04], [.98, .29, .71]);
  box(cap, blue, [0, .55, .71], [1.15, .08, .62], .35); box(cap, white, [0, .73, .62], [.17, .16, .03]);
  const bucket = hats.get("bucket")!;
  mesh(new T.CylinderGeometry(.68, .92, .39, 40), cream, bucket, [0, .81, 0], [1, 1, .75]);
  mesh(new T.CylinderGeometry(1.08, 1.11, .06, 40), cream, bucket, [0, .6, 0], [1, 1, .76]);
  const crown = hats.get("crown")!;
  mesh(new T.TorusGeometry(.66, .085, 8, 40), gold, crown, [0, .81, -.05], [1, 1, .75]).rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    mesh(new T.ConeGeometry(.15, .35, 5), gold, crown, [Math.cos(a) * .62, .98, Math.sin(a) * .45 - .05]);
    ball(crown, red, [Math.cos(a) * .62, 1.15, Math.sin(a) * .45 - .05], [.055, .055, .055]);
  }
  const bow = hats.get("bow")!;
  for (const side of [-1, 1]) ball(bow, red, [.59 + side * .17, .74, .3], [.21, .14, .1]).rotation.z = -side * .3;
  ball(bow, gold, [.59, .74, .4], [.08, .09, .07]);
  const headphones = hats.get("headphones")!;
  line(headphones, navy, [[-1, -.03, -.04], [-.95, .63, -.08], [0, .92, -.12], [.95, .63, -.08], [1, -.03, -.04]], .075);
  for (const side of [-1, 1]) { ball(headphones, navy, [side * 1.01, -.02, -.01], [.17, .3, .3]); ball(headphones, purple, [side * 1.14, -.02, .02], [.045, .19, .19]); }
  const party = hats.get("party")!;
  mesh(new T.ConeGeometry(.44, .88, 40), purple, party, [0, 1.07, 0], [1, 1, .9]); ball(party, gold, [0, 1.55, 0], [.12, .12, .12]);
  line(party, cream, [[-.3, .78, .31], [.25, .99, .26], [-.12, 1.2, .14]], .023);

  const eyewear = new Map<Character["glasses"], T.Group>();
  for (const id of ["round", "sun", "star", "sleep"] as const) { const g = new T.Group(); head.add(g); eyewear.set(id, g); }
  for (const id of ["round", "sun", "star"] as const) {
    const g = eyewear.get(id)!;
    for (const side of [-1, 1]) {
      if (id === "round") mesh(new T.TorusGeometry(.205, .023, 8, 32), gold, g, [side * .32, .05, .795]);
      else if (id === "sun") box(g, navy, [side * .33, .05, .8], [.48, .31, .05], .22).rotation.z = side * -.04;
      else {
        const star = new T.Shape(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? .105 : .24; if (!i) star.moveTo(Math.cos(a) * r, Math.sin(a) * r); else star.lineTo(Math.cos(a) * r, Math.sin(a) * r); } star.closePath();
        mesh(new T.ExtrudeGeometry(star, { depth: .025, bevelEnabled: false }), gold, g, [side * .33, .05, .79]);
      }
    }
    line(g, id === "round" ? gold : navy, [[-.11, .05, .8], [0, .08, .83], [.11, .05, .8]], .019);
    for (const side of [-1, 1]) line(g, id === "round" ? gold : navy, [[side * .52, .08, .78], [side * .88, .11, .4]], .02);
  }
  const sleep = eyewear.get("sleep")!;
  box(sleep, purple, [0, .05, .8], [1.19, .4, .1], .2);
  for (const side of [-1, 1]) line(sleep, cream, [[side * .17, .08, .865], [side * .32, .02, .88], [side * .46, .08, .86]], .017);

  return Object.assign((character: Character) => {
    identities.forEach((g, id) => { g.visible = id === character.kind; });
    catTail.visible = character.kind === "cat";
    garments.forEach((g, id) => { g.visible = id === character.outfit && !(id === "basic" && (character.kind === "blob" || character.kind === "cat")); });
    sleeves.forEach((sleeve, index) => {
      sleeve.visible = character.outfit !== "overalls" && character.outfit !== "dragon" && character.outfit !== "mecha" && !(character.outfit === "basic" && (character.kind === "blob" || character.kind === "cat")); sleeve.material = clothColor[character.outfit] || white;
      const long = !["basic", "stripes", "sport"].includes(character.outfit);
      sleeve.position.set((index ? 1 : -1) * (long ? .15 : .06), long ? -.14 : -.07, .03);
      sleeve.rotation.z = (index ? 1 : -1) * .43; sleeve.scale.set(.245, long ? .33 : .255, .265);
    });
    pants.visible = character.outfit === "suit" || character.outfit === "denim" || character.outfit === "bomber";
    hats.forEach((g, id) => { g.visible = id === character.hat; });
    eyewear.forEach((g, id) => { g.visible = id === character.glasses; });
  }, { motion(time: number, recoil: number, still: boolean) { catTail.rotation.y = still ? 0 : Math.sin(time * 2.6) * .16 + recoil * .7; catTail.rotation.z = still ? 0 : recoil * .2; } });
}
