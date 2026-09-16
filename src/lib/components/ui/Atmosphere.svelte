<!--
	Seitenhintergrund für alle Routen: feines Punktraster, drei langsam
	driftende Lichtflecken (Violett, Ember, Cyan), Vignette. Liegt fixed
	hinter allem – die 3D-Canvases blenden per `screen` darüber, deshalb
	sieht man das Licht auch hinter dem Board.
-->
<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void" aria-hidden="true">
	<!-- Punktraster -->
	<div
		class="absolute inset-0 [background-image:radial-gradient(oklch(0.55_0.01_260/0.35)_1px,transparent_1px)] [background-size:26px_26px] opacity-[0.35]"
	></div>
	<!-- Lichtflecken -->
	<div
		class="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vw] animate-drift-a blur-3xl glow-violet"
	></div>
	<div
		class="absolute top-[30%] -right-[15%] h-[80vh] w-[60vw] animate-drift-b blur-3xl glow-ember"
	></div>
	<div
		class="absolute -bottom-[25%] left-[20%] h-[60vh] w-[50vw] animate-drift-c blur-3xl glow-cyan"
	></div>
	<!-- Vignette: Ränder ruhig, Mitte offen -->
	<div
		class="absolute inset-0 [background:radial-gradient(120%_90%_at_50%_40%,transparent_55%,oklch(0.1_0.01_260/0.85)_100%)]"
	></div>
</div>
