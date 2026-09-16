/**
 * Prozedurale Geometrien fürs Keyboard – hier, damit KeyboardModel.svelte
 * bei der Szene bleibt und nicht bei Vertex-Mathematik.
 * Alle Masse in Units (1u = 19.05 mm), y nach oben.
 */
import {
	Shape,
	ExtrudeGeometry,
	CatmullRomCurve3,
	TubeGeometry,
	Vector3,
	type BufferGeometry
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** Rechteck mit runden Ecken in der XY-Ebene, zentriert */
export function roundedRect(w: number, d: number, r: number): Shape {
	const s = new Shape();
	const x = -w / 2;
	const y = -d / 2;
	s.moveTo(x + r, y);
	s.lineTo(x + w - r, y);
	s.quadraticCurveTo(x + w, y, x + w, y + r);
	s.lineTo(x + w, y + d - r);
	s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
	s.lineTo(x + r, y + d);
	s.quadraticCurveTo(x, y + d, x, y + d - r);
	s.lineTo(x, y + r);
	s.quadraticCurveTo(x, y, x + r, y);
	return s;
}

/**
 * Gehäuse als Extrusion mit Fase oben und unten (Chamfer).
 * Extrudiert wird entlang z; der Aufrufer dreht die Mesh um -90° um x,
 * dann liegt die Fase oben/unten. Gesamthöhe = h (Bevel eingerechnet).
 */
export function caseGeometry(w: number, d: number, h: number, bevel = 0.1): ExtrudeGeometry {
	// bevelSize wächst NACH AUSSEN: die Extrusion ist im Mittelteil um bevelSize
	// grösser als die Shape. Also Shape um bevelSize schrumpfen, damit die
	// Aussenmasse exakt w × d bleiben (Ports/Badge sitzen sonst im Gehäuse).
	const bs = bevel * 0.9;
	const geo = new ExtrudeGeometry(roundedRect(w - 2 * bs, d - 2 * bs, 0.3), {
		depth: h - 2 * bevel,
		bevelEnabled: true,
		bevelThickness: bevel,
		bevelSize: bs,
		bevelOffset: 0,
		bevelSegments: 3,
		curveSegments: 10
	});
	// Ursprung auf die Unterkante legen (z = 0 unten, z = h oben)
	geo.translate(0, 0, bevel);
	return geo;
}

/** Flaches Band um das Gehäuse (Seam) – ohne Fase, leicht grösser als das Case */
export function seamGeometry(w: number, d: number, h: number): ExtrudeGeometry {
	return new ExtrudeGeometry(roundedRect(w, d, 0.33), {
		depth: h,
		bevelEnabled: false,
		curveSegments: 10
	});
}

/**
 * Keycap-Profil: echte Caps sind oben schmaler als unten (Cherry-Profil).
 * Wir verjüngen die Rounded-Box nach oben, indem wir x/z jedes Vertex
 * abhängig von seiner Höhe skalieren – billiger als eigene Geometrie.
 */
export function keycapGeometry(w: number, h: number, gap: number, taper = 0.16): BufferGeometry {
	const geo = new RoundedBoxGeometry(w - gap, h, 1 - gap, 3, 0.06);
	const pos = geo.attributes.position;
	for (let i = 0; i < pos.count; i++) {
		const t = (pos.getY(i) + h / 2) / h; // 0 unten … 1 oben
		const k = 1 - taper * t;
		pos.setX(i, pos.getX(i) * k);
		pos.setZ(i, pos.getZ(i) * k);
	}
	pos.needsUpdate = true;
	geo.computeVertexNormals();
	return geo;
}

/**
 * Spiralkabel: kurzes gerades Stück aus dem Port, dann Wendel, dann
 * Auslauf nach hinten zum Boden. Punkte werden durch eine Catmull-Rom-Kurve
 * geglättet und als Tube extrudiert.
 */
export function coiledCableGeometry(
	start: Vector3,
	groundY: number,
	options: { coilRadius?: number; turns?: number; coilLength?: number; tail?: number } = {}
): TubeGeometry {
	const { coilRadius = 0.28, turns = 11, coilLength = 3.2, tail = 2.4 } = options;
	const pts: Vector3[] = [];
	const lead = 0.55;

	// gerade aus dem Port
	pts.push(start.clone());
	pts.push(start.clone().add(new Vector3(0, 0, -lead * 0.5)));
	pts.push(start.clone().add(new Vector3(0, 0, -lead)));

	// Wendel um die Achse, die von der Port-Position nach hinten läuft
	const coilStart = start.clone().add(new Vector3(0, 0, -lead - coilRadius * 0.2));
	const samples = turns * 14;
	for (let i = 0; i <= samples; i++) {
		const t = i / samples;
		const a = t * turns * Math.PI * 2;
		pts.push(
			new Vector3(
				coilStart.x + Math.cos(a) * coilRadius,
				coilStart.y + Math.sin(a) * coilRadius,
				coilStart.z - t * coilLength
			)
		);
	}

	// Auslauf: nach hinten und runter auf den Boden (Kabelradius als Abstand)
	const end = pts[pts.length - 1];
	const drop = groundY + 0.07 - end.y;
	pts.push(end.clone().add(new Vector3(0.2, drop * 0.3, -tail * 0.35)));
	pts.push(end.clone().add(new Vector3(0.6, drop, -tail * 0.7)));
	pts.push(end.clone().add(new Vector3(1.1, drop, -tail)));

	const curve = new CatmullRomCurve3(pts, false, 'centripetal', 0.5);
	return new TubeGeometry(curve, Math.max(200, pts.length * 3), 0.065, 10, false);
}
