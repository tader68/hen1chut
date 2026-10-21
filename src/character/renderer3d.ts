import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { advance, impulse, spring, type Costume, type Toy } from "../atelier/dynamics";
import { defaultCharacter, type Character } from "./model";
import { buildAppearance } from "./appearance3d";
import { createSurfaceMarks } from "./marks3d";
import type { Mark } from "./session";
import type { Mood } from "./reaction";

type Material = T.MeshStandardMaterial | T.MeshPhysicalMaterial;
type XYZ = [number, number, number];

export function createToyStage(host: HTMLElement, onReady: () => void, options: { game?: boolean } = {}) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const frameInterval = 1000 / (matchMedia("(pointer: coarse)").matches ? 30 : 60) - .8;
  const scene = new T.Scene();
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  const camera = new T.PerspectiveCamera(32, 1, .1, 50);
  camera.position.set(3.8, 3.1, 9.5);
  camera.lookAt(0, 1.65, 0);
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .55;
  room.dispose();
  pmrem.dispose();
  scene.add(new T.HemisphereLight(0xffffff, 0x8b759d, 1.2));
  const key = new T.DirectionalLight(0xffeadb, 3.2);
  key.position.set(-3, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -4;
  key.shadow.camera.right = key.shadow.camera.top = 4;
  key.shadow.normalBias = .035;
  key.shadow.bias = -.0003;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new T.DirectionalLight(0xded8ff, 2.2);
  rim.position.set(3, 3, -3);
  scene.add(rim);

  const materials = new Set<Material>();
  const mat = (color: T.ColorRepresentation, roughness = .45, metalness = 0): T.MeshPhysicalMaterial => {
    const m = new T.MeshPhysicalMaterial({ color, roughness, metalness, clearcoat: .2, clearcoatRoughness: .45 });
    materials.add(m);
    return m;
  };
  const skin = mat("#a27bce", .5), blush = mat("#e2849c", .7), ink = mat("#35253f", .3);
  const cream = mat("#f6dfb2", .75), seam = mat("#aa845f", .8), white = mat("#fffaf4", .3);
  const mint = mat("#4d9679", .55), mintLight = mat("#9bc78b", .55), horn = mat("#f7d995", .45);
  const armor = mat("#d1d8e7", .29, .6), armorDark = mat("#575271", .4, .5), coral = mat("#fa886d", .36);
  const glow = mat("#b8ffdb", .25);
  glow.emissive.set("#82f9cb"); glow.emissiveIntensity = .7;
  const sphere = new T.SphereGeometry(1, 40, 28);
  const geometries = new Set<T.BufferGeometry>([sphere]);
  const mesh = (geometry: T.BufferGeometry, material: Material, parent: T.Object3D, position: XYZ, scale: XYZ = [1, 1, 1]) => {
    geometries.add(geometry);
    const m = new T.Mesh(geometry, material);
    m.position.set(...position); m.scale.set(...scale);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const ball = (parent: T.Object3D, material: Material, position: XYZ, scale: XYZ) => mesh(sphere, material, parent, position, scale);
  const line = (parent: T.Object3D, material: Material, points: XYZ[], radius = .02) => {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
    return mesh(new T.TubeGeometry(curve, 24, radius, 8, false), material, parent, [0, 0, 0]);
  };
  const box = (parent: T.Object3D, material: Material, position: XYZ, scale: XYZ, radius = .12) =>
    mesh(new RoundedBoxGeometry(1, 1, 1, 4, radius), material, parent, position, scale);

  // A broad rounded head, sloped pear body and bent tuft define Bự's silhouette.
  const root = new T.Group(); scene.add(root);
  const body = new T.Group(); body.position.y = .96; root.add(body);
  const bodyGeo = new T.LatheGeometry([
    new T.Vector2(0, -.69), new T.Vector2(.38, -.68), new T.Vector2(.64, -.51),
    new T.Vector2(.76, -.15), new T.Vector2(.71, .2), new T.Vector2(.56, .55),
    new T.Vector2(.35, .7), new T.Vector2(0, .73),
  ], 56);
  bodyGeo.computeVertexNormals();
  mesh(bodyGeo, skin, body, [0, 0, 0], [1, 1, .78]);
  const belly = ball(body, cream, [.06, -.12, .526], [.43, .43, .09]);
  const stitches = new T.Group(); body.add(stitches);
  for (let i = 0; i < 17; i++) {
    const a = i / 17 * Math.PI * 2;
    const x = .06 + Math.cos(a) * .39, y = -.12 + Math.sin(a) * .39;
    line(stitches, seam, [[x - .019, y - .026, .572], [x + .019, y + .026, .582]], .008);
  }
  // Embroidered "enough" mark, a small identity detail rather than another logo.
  line(body, seam, [[-.08, -.12, .618], [0, -.18, .625], [.1, -.08, .625], [.18, -.18, .62]], .018);
  const arms: T.Group[] = [], feet: T.Mesh[] = [];
  for (const side of [-1, 1]) {
    const arm = new T.Group(); arm.position.set(side * .62, .25, 0); body.add(arm);
    const hand = ball(arm, skin, [side * .17, -.23, .04], [.22, .38, .24]);
    hand.rotation.z = side * .43;
    line(arm, seam, [[side * .21, -.42, .24], [side * .16, -.43, .26]], .009);
    arms.push(arm);
    const foot = ball(root, skin, [side * .39, .19, .16], [.31, .2, .39]); feet.push(foot);
    for (let i = 0; i < 2; i++) line(root, seam, [[side * .39 + (i - .5) * .1, .18, .516], [side * .39 + (i - .5) * .1, .23, .5]], .009);
  }
  const head = new T.Group(); head.position.y = 2.14; root.add(head);
  const headGeo = sphere.clone();
  const position = headGeo.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const power = (n: number) => Math.sign(n) * Math.pow(Math.abs(n), .77);
    position.setXYZ(i, power(position.getX(i)), power(position.getY(i)), power(position.getZ(i)));
  }
  headGeo.computeVertexNormals();
  mesh(headGeo, skin, head, [0, 0, 0], [.98, .78, .71]);
  const tuft = new T.Group(); tuft.position.set(0, .66, -.04); head.add(tuft);
  line(tuft, skin, [[0, 0, 0], [.02, .33, 0], [.22, .47, 0], [.34, .39, .02]], .13);
  ball(tuft, skin, [.33, .39, .02], [.13, .13, .13]);
  line(tuft, skin, [[-.1, .03, 0], [-.3, .18, .01], [-.38, .12, .03]], .1);
  ball(tuft, skin, [-.38, .12, .03], [.1, .1, .1]);

  const face = new T.Group(); face.position.z = .69; head.add(face);
  const eyes: T.Group[] = [], brows: T.Mesh[] = [];
  for (const side of [-1, 1]) {
    ball(face, blush, [side * .61, -.14, -.075], [.19, .105, .037]);
    const eye = new T.Group(); eye.position.set(side * .31, .05, .018); face.add(eye);
    ball(eye, ink, [0, 0, 0], [.092, .137, .05]);
    ball(eye, white, [-.023, .042, .044], [.022, .029, .009]);
    ball(eye, white, [.029, -.042, .042], [.01, .013, .007]);
    eyes.push(eye);
    const brow = line(face, ink, [[-.14, 0, 0], [0, .024, .004], [.14, -.008, 0]], .029);
    brow.position.set(side * .33, .32, .012);
    brow.rotation.z = side * .24;
    brows.push(brow);
  }
  ball(face, skin, [0, -.13, .04], [.1, .065, .08]);
  const closedMouth = line(face, ink, [[-.12, -.33, .006], [-.02, -.29, .025], [.09, -.32, .012]], .022);
  const openMouth = new T.Group(); openMouth.position.set(0, -.31, .04); openMouth.visible = false; face.add(openMouth);
  ball(openMouth, ink, [0, 0, 0], [.15, .17, .045]);
  ball(openMouth, blush, [.01, -.083, .042], [.095, .06, .014]);
  const tooth = box(openMouth, white, [-.025, .11, .044], [.11, .048, .025], .25);
  tooth.rotation.z = -.08;

  const patch = new T.Group(); patch.position.set(-.64, .41, .535); patch.rotation.set(-.1, -.38, -.32); head.add(patch);
  box(patch, cream, [0, 0, 0], [.34, .16, .045], .25);
  box(patch, mat("#e7c696", .8), [0, 0, .027], [.13, .125, .015]);
  for (const side of [-1, 1]) for (const y of [-.035, .035]) ball(patch, seam, [side * .118, y, .025], [.009, .009, .005]);

  const dragon = new T.Group(); body.add(dragon); dragon.visible = false;
  const hood = new T.Group(); head.add(hood); hood.visible = false;
  mesh(headGeo, mint, hood, [0, .02, -.18], [1.035, .82, .64]);
  ball(dragon, mint, [0, -.03, -.015], [.79, .75, .625]);
  ball(dragon, mintLight, [.02, -.13, .594], [.44, .45, .065]);
  for (const y of [-.39, -.16, .07]) line(dragon, mint, [[-.24, y, .646], [0, y - .025, .669], [.28, y, .646]], .012);
  // Raised hood frames the original face, with separate snout, horns and scales.
  mesh(new T.TorusGeometry(.83, .14, 12, 56), mint, hood, [0, .03, .13], [1.08, .98, .95]);
  ball(hood, mint, [0, .67, -.02], [.79, .24, .65]);
  for (const side of [-1, 1]) {
    const h = mesh(new T.ConeGeometry(.14, .37, 24), horn, hood, [side * .61, .92, -.02]); h.rotation.z = -side * .3;
    ball(hood, mintLight, [side * .3, .79, .4], [.24, .15, .22]);
    ball(hood, ink, [side * .3, .84, .58], [.047, .05, .027]);
    const wing = new T.Shape(); wing.moveTo(0, 0); wing.bezierCurveTo(.2, .2, .48, .62, .76, .5);
    wing.lineTo(.66, -.05); wing.quadraticCurveTo(.43, .13, .3, -.23); wing.quadraticCurveTo(.15, -.08, 0, 0);
    const wingMesh = mesh(new T.ExtrudeGeometry(wing, { depth: .065, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .055, bevelThickness: .04 }), mint, dragon, [side * .58, .1, -.37]);
    wingMesh.scale.x = side; wingMesh.rotation.y = side * .25;
    line(wingMesh, mintLight, [[.04, .02, .12], [.33, .22, .12], [.7, .45, .12]], .018);
  }
  line(dragon, mint, [[0, -.38, -.4], [.62, -.49, -.62], [1.04, -.35, -.5], [1.15, -.04, -.44]], .18);
  ball(dragon, mintLight, [1.15, -.03, -.44], [.19, .22, .18]);

  const mech = new T.Group(); body.add(mech); mech.visible = false;
  const helmet = new T.Group(); head.add(helmet); helmet.visible = false;
  box(mech, armorDark, [0, -.04, .02], [1.39, 1.15, 1.05], .25);
  box(mech, armor, [0, .04, .53], [1.12, .81, .21], .2);
  box(mech, armorDark, [0, .1, .66], [.44, .44, .07], .2).rotation.z = Math.PI / 4;
  box(mech, glow, [0, .1, .71], [.23, .23, .055], .2).rotation.z = Math.PI / 4;
  for (const side of [-1, 1]) {
    box(mech, armor, [side * .77, .3, 0], [.42, .47, .6], .2).rotation.z = side * .18;
    box(mech, coral, [side * .81, .32, .32], [.23, .095, .04]);
    box(helmet, armor, [side * .92, .03, -.03], [.19, .78, .64], .2);
    ball(helmet, coral, [side * 1.025, .08, .03], [.07, .2, .2]);
    line(helmet, armorDark, [[side * .92, .38, -.03], [side * .96, .79, -.06]], .035);
    ball(helmet, glow, [side * .96, .79, -.06], [.065, .065, .065]);
  }
  box(helmet, armor, [0, .69, -.02], [1.63, .24, 1.06], .2);
  box(helmet, coral, [0, .73, .54], [.18, .12, .06]);

  const updateAppearance = buildAppearance({ mat, mesh, ball, box, line }, body, head, arms, root, skin, ink, cream);
  const surfaceMarks = createSurfaceMarks(head, body);
  const dizzyEyes = new T.Group(), knockedEyes = new T.Group(); face.add(dizzyEyes, knockedEyes);
  for (const side of [-1, 1]) {
    const spiral: XYZ[] = [];
    for (let i = 0; i < 48; i++) { const a = i / 47 * Math.PI * 4, r = .018 + i / 47 * .095; spiral.push([side * .31 + Math.cos(a) * r, .05 + Math.sin(a) * r, .07]); }
    line(dizzyEyes, ink, spiral, .013);
    line(knockedEyes, ink, [[side * .31 - side * .09, .14, .07], [side * .31 + side * .04, .05, .07], [side * .31 - side * .09, -.04, .07]], .022);
  }
  dizzyEyes.visible = knockedEyes.visible = false;

  const floorGeometry = new T.PlaneGeometry(200, 200); geometries.add(floorGeometry);
  const floorMaterial = new T.ShadowMaterial({ color: 0x45324f, opacity: .045 });
  const floor = new T.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -.025; floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // Analytic soft contact shadow complements the directional shadow at the feet.
  const shadowCanvas = document.createElement("canvas"); shadowCanvas.width = shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext("2d")!;
  const gradient = shadowContext.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, "rgba(48,26,68,.32)"); gradient.addColorStop(1, "rgba(48,26,68,0)");
  shadowContext.fillStyle = gradient; shadowContext.fillRect(0, 0, 128, 128);
  const shadowTexture = new T.CanvasTexture(shadowCanvas);
  const shadowMaterial = new T.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  const shadow = new T.Mesh(new T.PlaneGeometry(3.4, 2.3), shadowMaterial);
  geometries.add(shadow.geometry); shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.018; scene.add(shadow);

  // Each toy has geometry and its own contact path, rather than a screen-wide shake.
  const weapon = new T.Group(); scene.add(weapon); weapon.visible = false;
  const weapons = new Map<Toy, T.Group>();
  const glove = new T.Group(); weapon.add(glove); weapons.set("punch", glove);
  const red = mat("#e97969", .45);
  ball(glove, red, [0, 0, 0], [.37, .35, .3]);
  ball(glove, red, [-.27, -.14, .03], [.18, .2, .2]);
  box(glove, cream, [0, -.3, -.02], [.47, .18, .42], .2);
  line(glove, seam, [[-.18, -.35, .21], [.18, -.35, .21]], .013);
  const hammer = new T.Group(); weapon.add(hammer); weapons.set("hammer", hammer);
  box(hammer, cream, [0, -.42, 0], [.13, .95, .14]);
  box(hammer, coral, [0, .05, 0], [.85, .43, .45], .2);
  for (const side of [-1, 1]) ball(hammer, cream, [side * .39, .05, 0], [.095, .23, .235]);
  const pillow = new T.Group(); weapon.add(pillow); weapons.set("pillow", pillow);
  box(pillow, mat("#eed8bf", .95), [0, 0, 0], [1.05, .7, .29], .27);
  line(pillow, seam, [[-.43, -.23, .13], [-.46, .23, .13], [.43, .23, .13], [.43, -.23, .13], [-.43, -.23, .13]], .009);
  const extraWeapon = (id: Toy) => { const g = new T.Group(); weapon.add(g); weapons.set(id, g); return g; };
  extraWeapon("boxing").add(glove.clone());
  const tomato = extraWeapon("tomato"); ball(tomato, coral, [0, 0, 0], [.31, .28, .3]);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ball(tomato, mint, [Math.cos(a) * .13, .25, Math.sin(a) * .13], [.13, .025, .055]).rotation.y = -a; }
  const water = extraWeapon("water"); const waterMaterial = mat("#69bddb", .15); waterMaterial.clearcoat = .8;
  ball(water, waterMaterial, [0, 0, 0], [.28, .36, .28]);
  const boot = extraWeapon("boot"); box(boot, horn, [0, -.07, .06], [.43, .35, .7]); box(boot, horn, [0, .22, -.12], [.36, .47, .35]); box(boot, ink, [0, -.24, .06], [.45, .08, .72]);
  for (const y of [.12, .24, .36]) line(boot, cream, [[-.12, y, .08], [.12, y, .08]], .013);
  const lightning = extraWeapon("lightning");
  const bolt = new T.Shape(); bolt.moveTo(.08, .56); bolt.lineTo(-.32, -.05); bolt.lineTo(-.03, -.05); bolt.lineTo(-.1, -.5); bolt.lineTo(.35, .15); bolt.lineTo(.07, .15); bolt.closePath();
  mesh(new T.ExtrudeGeometry(bolt, { depth: .09, bevelSize: .025, bevelThickness: .02, bevelSegments: 2 }), horn, lightning, [0, 0, 0]);
  const springGlove = extraWeapon("spring"); springGlove.add(glove.clone());
  const coil: XYZ[] = []; for (let i = 0; i < 72; i++) { const a = i / 71 * Math.PI * 10; coil.push([Math.cos(a) * .12, -.4 - i / 71 * .7, Math.sin(a) * .12]); } line(springGlove, armorDark, coil, .025);
  const slipper = extraWeapon("slipper"); ball(slipper, mint, [0, 0, 0], [.23, .075, .48]); line(slipper, mintLight, [[-.21, .02, .13], [0, .23, .13], [.21, .02, .13]], .045); slipper.rotation.x = 1;
  const chicken = extraWeapon("chicken"); ball(chicken, horn, [0, -.17, 0], [.22, .31, .17]); ball(chicken, horn, [0, .25, 0], [.09, .3, .09]); ball(chicken, horn, [0, .51, 0], [.14, .15, .13]); ball(chicken, coral, [0, .49, .15], [.12, .04, .09]);
  for (const side of [-1, 1]) { ball(chicken, ink, [side * .11, .54, .08], [.023, .023, .025]); ball(chicken, coral, [side * .13, -.48, .07], [.15, .055, .09]); }
  const banana = extraWeapon("banana"); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; line(banana, horn, [[0, .25, 0], [Math.cos(a) * .14, -.09, Math.sin(a) * .14], [Math.cos(a) * .43, -.16, Math.sin(a) * .43]], .065); } ball(banana, seam, [0, .3, 0], [.045, .08, .045]);
  const confetti = extraWeapon("confetti"); mesh(new T.ConeGeometry(.27, .65, 32), mat("#b58dce", .6), confetti, [0, 0, 0]); confetti.rotation.z = -.7;
  for (let i = 0; i < 8; i++) { const piece = box(confetti, [coral, mintLight, horn][i % 3], [Math.sin(i * 2) * .46, .45 + i * .06, Math.cos(i) * .3], [.09, .15, .03]); piece.rotation.set(i, i * .3, i * .7); }

  const tilt = spring(), squash = spring(), lift = spring(), neck = spring();
  let targetYaw = -.14, yaw = -.14, lookX = 0, lookY = 0, expression = 0, hitAt = -10;
  let toy: Toy = "punch", costume: Costume = "original", direction = 1, elapsed = 0, paused = false, disposed = false;
  let character: Character = { ...defaultCharacter }, baseMood: Mood = "normal";
  let savedMarks: Mark[] = [];
  const portraits = new Map<string, string>();
  const applyCharacter = (value: Character) => {
    character = { ...value }; skin.color.set(value.color); updateAppearance(value);
    costume = value.outfit === "mecha" ? "mecha" : value.outfit === "dragon" ? "dragon" : "original";
    dragon.visible = hood.visible = value.outfit === "dragon";
    mech.visible = helmet.visible = value.outfit === "mecha";
    tuft.visible = value.kind === "blob" && costume === "original" && value.hat === "none";
    patch.visible = value.kind === "blob" && costume === "original";
    belly.visible = stitches.visible = value.kind === "blob" && value.outfit === "basic";
    closedMouth.position.z = value.kind === "cat" ? .115 : 0;
    openMouth.position.z = value.kind === "cat" ? .15 : .04;
  };
  applyCharacter(character);
  let last = 0, frame = 0, wasReady = false, dirty = true;
  let contactPending = false;
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; dirty = true;
    // Leave breathing room for the title and tool selector on small screens.
    camera.position.set(options.game ? 1.8 : 2.6, 2.85, options.game ? (camera.aspect < .85 ? 8.2 : 7.3) : camera.aspect < .85 ? 9.6 : 8.1);
    camera.lookAt(0, options.game ? 1.8 : 1.7, 0); camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const draw = (now: number) => {
    if (disposed) return;
    frame = requestAnimationFrame(draw);
    if (document.hidden || (options.game && document.querySelector("dialog[open]"))) { last = now; return; }
    if ((paused || reduced.matches) && !dirty) { last = now; return; }
    if (last && now - last < frameInterval) return;
    const dt = last ? Math.min((now - last) / 1000, .05) : 1 / 60; last = now;
    if (!paused && !reduced.matches) {
      elapsed += dt;
      if (contactPending && elapsed - hitAt >= .075) {
        const force = impulse(toy);
        tilt.velocity = Math.max(-10, Math.min(10, tilt.velocity + force.tilt * direction));
        squash.velocity = Math.max(-9, Math.min(9, squash.velocity + force.squash));
        lift.velocity = Math.min(6, lift.velocity + force.lift);
        expression = force.face; contactPending = false;
      }
      advance(tilt, dt, 125, 11); advance(squash, dt, 165, 10); advance(lift, dt, 125, 13);
      neck.velocity -= tilt.value * dt * 130; advance(neck, dt, 105, 9);
      expression = Math.max(0, expression - dt * .85);
    }
    const quiet = paused || reduced.matches;
    const breath = quiet ? 0 : Math.sin(elapsed * 2.1) * .012;
    yaw = quiet ? targetYaw : yaw + (targetYaw - yaw) * Math.min(1, dt * 9);
    const age = elapsed - hitAt;
    root.rotation.y = yaw + (!quiet && toy === "banana" && age < .9 ? Math.sin(age / .9 * Math.PI) * 1.6 * direction : 0);
    root.rotation.z = quiet ? 0 : tilt.value;
    root.position.y = quiet ? 0 : Math.max(-.05, lift.value);
    const stretch = quiet ? 0 : squash.value;
    const softness = costume === "mecha" ? .08 : 1;
    const broad = character.body === "round" ? 1.13 : character.body === "tall" ? .92 : 1;
    const tall = character.body === "tall" ? 1.08 : character.body === "round" ? .95 : 1;
    root.scale.set(broad * (1 - stretch * .48 * softness), tall * (1 + stretch * softness), 1 - stretch * .25 * softness);
    body.scale.y = 1 + breath * softness;
    head.position.y = 2.14 + breath * 2 + (costume === "mecha" ? stretch * .5 : 0);
    head.position.x = quiet ? 0 : -tilt.value * .12;
    head.scale.set(1 - stretch * .2 * softness, 1 + stretch * .6 * softness, 1 - stretch * .12 * softness);
    const headRest = character.kind === "buddy" ? .015 : character.kind === "girl" ? -.05 : character.kind === "cat" ? -.07 : -.035;
    head.rotation.z = quiet ? headRest : headRest + neck.value + Math.sin(elapsed * .8) * .025;
    head.rotation.y = lookX * .14 + (!quiet && (toy === "water" || toy === "chicken") && age < .8 ? Math.sin(age * (toy === "water" ? 25 : 38)) * .1 * (1 - age / .8) : 0);
    head.rotation.x = lookY * -.1;
    tuft.rotation.z = quiet ? 0 : -neck.value * 1.3 + Math.sin(elapsed * 2.1) * .045;
    arms.forEach((arm, index) => { arm.rotation.z = (index ? -1 : 1) * (breath * 2 + stretch * .7) + (quiet ? 0 : neck.value * 1.5); });
    updateAppearance.motion(elapsed, neck.value, quiet);
    feet.forEach((foot, index) => { foot.rotation.x = quiet ? 0 : tilt.value * (index ? 1 : -1); });
    const blink = !quiet && elapsed % 4.6 > 4.45 ? .08 : 1;
    const shock = expression > .32, grin = expression > .04 && !shock;
    eyes.forEach((eye, index) => {
      eye.visible = shock || grin || baseMood === "normal" || baseMood === "ouch";
      eye.scale.x = character.kind === "cat" ? .82 : 1;
      const hitSide = direction > 0 ? 1 : 0;
      eye.scale.y = blink * (shock ? toy === "pillow" || toy === "confetti" ? .22 : (toy === "punch" || toy === "boxing" || toy === "slipper") && index === hitSide ? .17 : 1.3 : grin ? .6 : .88);
      eye.position.x = (index ? .31 : -.31) + lookX * .026;
      eye.position.y = .05 + lookY * .025;
      brows[index].rotation.z = (index ? 1 : -1) * (shock ? -.2 : grin ? -.06 : .24);
      brows[index].position.y = shock ? .4 : grin && index === 0 ? .38 : .32;
    });
    dizzyEyes.visible = baseMood === "dizzy" && !shock && !grin;
    knockedEyes.visible = baseMood === "knocked" && !shock && !grin;
    closedMouth.visible = !shock && !grin && baseMood !== "knocked"; openMouth.visible = shock || grin || baseMood === "knocked";
    closedMouth.position.z = character.kind === "cat" ? .115 : 0;
    openMouth.position.z = character.kind === "cat" ? .15 : .04;
    openMouth.scale.set(grin || baseMood === "knocked" ? 1.2 : 1, grin || toy === "pillow" || (!shock && baseMood === "knocked") ? .48 : 1, 1);
    openMouth.rotation.z = shock && toy === "punch" ? direction * .2 : -.08;
    shadow.scale.setScalar(1 - Math.max(0, lift.value) * .3);
    if (weapon.visible && !quiet) {
      const p = Math.min(1, age / .42);
      const contact = Math.sin(Math.min(1, p / .28) * Math.PI / 2);
      const retract = Math.max(0, (p - .3) / .7);
      if (toy === "hammer") {
        weapon.position.set(direction * (.5 + retract * 1.8), 3.9 - contact * 1.1 + retract, .8);
        weapon.rotation.set(.2, 0, direction * (-.5 + contact * .6 + retract));
      } else {
        weapon.position.set(direction * (2.1 - contact * 1.3 + retract * 2), (toy === "boot" || toy === "banana" ? .7 : 1.95) + retract * .4, .85);
        weapon.rotation.set(.2, -.3 * direction, direction * (-.4 + retract));
      }
      if (p >= 1) weapon.visible = false;
    }
    renderer.render(scene, camera);
    dirty = false;
    if (!wasReady) { wasReady = true; onReady(); }
  };
  frame = requestAnimationFrame(draw);
  const resetMotion = () => { for (const s of [tilt, squash, lift, neck]) { s.value = 0; s.velocity = 0; } weapon.visible = false; contactPending = false; dirty = true; };
  const handleReduced = () => { resetMotion(); expression = 0; }; reduced.addEventListener("change", handleReduced);
  const contextLost = (event: Event) => { event.preventDefault(); host.dispatchEvent(new Event("toy-context-lost")); };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  return {
    hit(selected: Toy, x = 1) {
      toy = selected; direction = x < 0 ? -1 : 1;
      dirty = true;
      if (reduced.matches || paused) { expression = impulse(toy).face; return; }
      contactPending = true; hitAt = elapsed;
      weapons.forEach((group, key) => { group.visible = key === toy; }); weapon.visible = true;
    },
    costume(value: Costume) {
      applyCharacter({ ...character, outfit: value === "original" ? "basic" : value });
      dirty = true;
    },
    character(value: Character) { applyCharacter(value); dirty = true; },
    session(mood: Mood, marks: Mark[]) { baseMood = mood; savedMarks = marks; surfaceMarks.update(marks); dirty = true; },
    portrait(value: Character, width = 320): string | undefined {
      if (disposed) return;
      const key = `${width}:${JSON.stringify({ ...value, name: "" })}`;
      if (portraits.has(key)) return portraits.get(key);
      const before = { character: { ...character }, size: renderer.getSize(new T.Vector2()), ratio: renderer.getPixelRatio(), cameraPosition: camera.position.clone(), cameraQuaternion: camera.quaternion.clone(), aspect: camera.aspect, position: root.position.clone(), scale: root.scale.clone(), rotation: root.quaternion.clone(), headScale: head.scale.clone(), headRotation: head.quaternion.clone(), headPosition: head.position.clone(), weapon: weapon.visible };
      let result: string | undefined;
      try {
        applyCharacter(value); surfaceMarks.update([]);
        root.position.set(0, 0, 0); root.scale.set(value.body === "round" ? 1.13 : value.body === "tall" ? .92 : 1, value.body === "tall" ? 1.08 : value.body === "round" ? .95 : 1, 1); root.rotation.set(0, -.1, 0);
        head.scale.set(1, 1, 1); head.rotation.set(0, 0, -.035); head.position.set(0, 2.14, 0); weapon.visible = false;
        eyes.forEach(eye => { eye.visible = true; eye.scale.y = .88; }); dizzyEyes.visible = knockedEyes.visible = openMouth.visible = false; closedMouth.visible = true;
        renderer.setPixelRatio(1); renderer.setSize(width, Math.round(width * 380 / 320), false); camera.aspect = 320 / 380; camera.position.set(2, 2.9, 8.3); camera.lookAt(0, 1.7, 0); camera.updateProjectionMatrix();
        renderer.render(scene, camera); result = renderer.domElement.toDataURL("image/webp", width > 320 ? .94 : .85);
        if (portraits.size >= 192) portraits.delete(portraits.keys().next().value!);
        portraits.set(key, result);
      } catch { /* The SVG fallback still works if a device cannot export WebGL. */ }
      finally {
        applyCharacter(before.character); surfaceMarks.update(savedMarks);
        root.position.copy(before.position); root.scale.copy(before.scale); root.quaternion.copy(before.rotation); head.scale.copy(before.headScale); head.quaternion.copy(before.headRotation); head.position.copy(before.headPosition); weapon.visible = before.weapon;
        renderer.setPixelRatio(before.ratio); renderer.setSize(before.size.x, before.size.y, false); camera.position.copy(before.cameraPosition); camera.quaternion.copy(before.cameraQuaternion); camera.aspect = before.aspect; camera.updateProjectionMatrix(); renderer.render(scene, camera); dirty = true;
      }
      return result;
    },
    color(value: string) { skin.color.set(value); dirty = true; },
    look(x: number, y: number) { lookX = Math.max(-1, Math.min(1, x)); lookY = Math.max(-1, Math.min(1, y)); dirty = true; },
    rotate(delta: number) { targetYaw += delta; dirty = true; },
    pause(value: boolean) { paused = value; dirty = true; if (value) resetMotion(); },
    dispose() {
      if (disposed) return;
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      reduced.removeEventListener("change", handleReduced);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      environment.dispose(); shadowTexture.dispose(); shadowMaterial.dispose(); floorMaterial.dispose();
      surfaceMarks.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
