// Shared by the games hub and every game page: overlay, best score, leaderboard and score saving.
(function () {
  var G = (window.GameUI = {});
  var game = document.body.getAttribute("data-game");
  var lastScore = 0;

  // Hub thumbnails, drawn on a 56x56 grid in the same style as Snake, Tetris and Space Shooter.
  var THUMBS = {
    gridlock: '<rect x="6" y="22" width="24" height="12" rx="3" fill="#8b5cf6"/><rect x="36" y="8" width="12" height="26" rx="3" fill="#60a5fa"/><rect x="10" y="40" width="36" height="10" rx="3" fill="#c084fc"/><path d="M34 28h16m-5-5 5 5-5 5" fill="none" stroke="#a78bfa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    colorlink: '<path d="M12 14h16v16h16" fill="none" stroke="#a78bfa" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 44h32" fill="none" stroke="#c084fc" stroke-width="4" stroke-linecap="round"/><circle cx="12" cy="14" r="6" fill="#60a5fa"/><circle cx="44" cy="30" r="6" fill="#60a5fa"/><circle cx="12" cy="44" r="6" fill="#c084fc"/><circle cx="44" cy="44" r="6" fill="#c084fc"/>',
    merge: '<rect x="5" y="16" width="20" height="24" rx="5" fill="#6d28d9"/><rect x="31" y="16" width="20" height="24" rx="5" fill="#8b5cf6"/><text x="15" y="34" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="16" fill="#fff">2</text><text x="41" y="34" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="16" fill="#fff">4</text>',
    perfecttap: '<rect x="4" y="26" width="48" height="4" rx="2" fill="#34343f"/><rect x="21" y="12" width="14" height="32" rx="3" fill="#8b5cf6" fill-opacity=".55"/><rect x="27" y="8" width="2" height="40" fill="#c4b5fd"/><circle cx="39" cy="28" r="7" fill="#60a5fa"/>',
    tilestep: '<rect x="4" y="6" width="11" height="16" rx="2" fill="#4c1d95"/><rect x="16" y="22" width="11" height="16" rx="2" fill="#8b5cf6"/><rect x="28" y="6" width="11" height="16" rx="2" fill="#4c1d95"/><rect x="40" y="38" width="11" height="14" rx="2" fill="#60a5fa"/><rect x="4" y="38" width="11" height="14" rx="2" fill="#4c1d95"/>',
    deflect: '<circle cx="28" cy="28" r="7" fill="#60a5fa"/><path d="M10 28a18 18 0 0 1 36 0" fill="none" stroke="#a78bfa" stroke-width="5" stroke-linecap="round"/><circle cx="28" cy="46" r="3.5" fill="#f87171"/><circle cx="48" cy="46" r="3" fill="#f87171"/>',
    gravity: '<rect x="4" y="8" width="48" height="3" rx="1.5" fill="#8b5cf6"/><rect x="4" y="45" width="48" height="3" rx="1.5" fill="#8b5cf6"/><rect x="10" y="30" width="14" height="14" rx="4" fill="#60a5fa"/><path d="M38 44V32l5-0 0 12z" fill="#ef4444"/><path d="M46 11v10h5V11z" fill="#ef4444"/>',
    orbit: '<circle cx="24" cy="32" r="12" fill="none" stroke="#a78bfa" stroke-opacity=".5" stroke-width="2"/><circle cx="24" cy="32" r="6" fill="#8b5cf6"/><circle cx="44" cy="12" r="5" fill="#22c55e"/><path d="M32 22l8-6" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 5"/><path d="M33 22l5-1-2 5z" fill="#60a5fa"/>',
    helix: '<rect x="6" y="14" width="44" height="7" rx="3" fill="#6d28d9"/><rect x="24" y="14" width="10" height="7" fill="#07070b"/><rect x="6" y="36" width="44" height="7" rx="3" fill="#6d28d9"/><rect x="12" y="36" width="9" height="7" fill="#ef4444"/><circle cx="29" cy="7" r="5" fill="#60a5fa"/>',
    simon: '<rect x="6" y="6" width="20" height="20" rx="6" fill="#ef4444"/><rect x="30" y="6" width="20" height="20" rx="6" fill="#3b82f6"/><rect x="6" y="30" width="20" height="20" rx="6" fill="#22c55e"/><rect x="30" y="30" width="20" height="20" rx="6" fill="#eab308"/>',
    pairmatch: '<rect x="5" y="12" width="21" height="30" rx="5" fill="#3b82f6"/><rect x="30" y="12" width="21" height="30" rx="5" fill="#2a2a4a" stroke="#4c1d95" stroke-width="2"/><text x="15.5" y="33" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="16" fill="#fff">A</text><text x="40.5" y="33" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="16" fill="#8b7bd0">?</text>',
    pathtrace: '<path d="M10 10h18v18h18v18" fill="none" stroke="#c4b5fd" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="10" r="6" fill="#22c55e"/><circle cx="28" cy="28" r="4" fill="#8b5cf6"/><circle cx="46" cy="46" r="5" fill="#60a5fa"/><circle cx="46" cy="10" r="2.5" fill="#34343f"/><circle cx="10" cy="46" r="2.5" fill="#34343f"/>',
    brick: '<rect x="6" y="8" width="13" height="8" fill="#ef4444"/><rect x="21" y="8" width="13" height="8" fill="#eab308"/><rect x="36" y="8" width="13" height="8" fill="#22c55e"/><rect x="13" y="18" width="13" height="8" fill="#3b82f6"/><rect x="28" y="18" width="13" height="8" fill="#a855f7"/><circle cx="32" cy="38" r="4" fill="#dbeafe"/><rect x="16" y="46" width="26" height="5" rx="2.5" fill="#8b5cf6"/>',
    glitch: '<rect x="6" y="6" width="14" height="14" rx="4" fill="#171726"/><rect x="21" y="6" width="14" height="14" rx="4" fill="#171726"/><rect x="36" y="6" width="14" height="14" rx="4" fill="#171726"/><rect x="6" y="21" width="14" height="14" rx="4" fill="#171726"/><rect x="21" y="21" width="14" height="14" rx="4" fill="#171726"/><rect x="36" y="21" width="14" height="14" rx="4" fill="#171726"/><rect x="6" y="36" width="14" height="14" rx="4" fill="#171726"/><rect x="21" y="36" width="14" height="14" rx="4" fill="#171726"/><rect x="36" y="36" width="14" height="14" rx="4" fill="#171726"/><circle cx="28" cy="28" r="5.5" fill="#16a34a"/><circle cx="43" cy="13" r="5.5" fill="#dc2626"/>',
    slice: '<circle cx="26" cy="30" r="15" fill="#22c55e"/><circle cx="26" cy="30" r="9" fill="#bbf7d0" fill-opacity=".5"/><path d="M8 52L50 8" stroke="#c4b5fd" stroke-width="4" stroke-linecap="round"/><circle cx="46" cy="46" r="6" fill="#1f2937" stroke="#ef4444" stroke-width="2"/>',
    neonrunner: '<rect x="4" y="44" width="48" height="3" fill="#8b5cf6"/><rect x="10" y="30" width="14" height="14" rx="4" fill="#60a5fa"/><path d="M32 44l6-14 6 14z" fill="#ef4444"/><path d="M4 20h12M4 26h8" stroke="#a78bfa" stroke-width="2" stroke-linecap="round"/>',
    asteroid: '<path d="M30 6l12 8 4 14-8 12-14 2-10-10 4-14z" fill="#475569" stroke="#94a3b8" stroke-width="2"/><rect x="8" y="40" width="9" height="9" fill="#facc15" transform="rotate(20 12 44)"/><path d="M40 42l6 10h-12z" fill="#8b5cf6"/>',
    lavaescape: '<rect x="6" y="14" width="22" height="6" rx="3" fill="#8b5cf6"/><rect x="28" y="30" width="22" height="6" rx="3" fill="#ef4444" fill-opacity=".7"/><circle cx="16" cy="8" r="5" fill="#60a5fa"/><path d="M2 50q7-6 13 0t13 0 13 0 13 0v6H2z" fill="#f97316"/>',
    jetpack: '<path d="M2 12h52v8q-10 6-26 0T2 20zM2 44h52v-8q-10-6-26 0T2 36z" fill="#3b2a6b"/><rect x="18" y="24" width="14" height="10" rx="3" fill="#60a5fa"/><path d="M18 30l-8-3v6z" fill="#fb923c"/>',
    balloonpop: '<ellipse cx="20" cy="26" rx="10" ry="12" fill="#ef4444"/><ellipse cx="38" cy="22" rx="9" ry="11" fill="#3b82f6"/><path d="M20 38v10M38 33v12" stroke="#cbd5e1" stroke-width="1.5"/><path d="M4 6l4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6" fill="none" stroke="#ef4444" stroke-width="2"/>',
    memorychain: '<rect x="4" y="14" width="14" height="22" rx="4" fill="#3b82f6"/><rect x="21" y="14" width="14" height="22" rx="4" fill="#22c55e"/><rect x="38" y="14" width="14" height="22" rx="4" fill="#2a2a4a" stroke="#4c1d95" stroke-width="2"/><path d="M11 44h34" stroke="#a78bfa" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round"/>',
    towerstacker: '<rect x="14" y="40" width="28" height="8" fill="#6d28d9"/><rect x="18" y="31" width="26" height="8" fill="#8b5cf6"/><rect x="16" y="22" width="24" height="8" fill="#60a5fa"/><rect x="8" y="12" width="22" height="8" fill="#c084fc"/><path d="M34 16h14m-4-4 4 4-4 4" fill="none" stroke="#c4b5fd" stroke-width="2"/>',
    rhythmtap: '<rect x="6" y="4" width="10" height="48" fill="#11111c"/><rect x="18" y="4" width="10" height="48" fill="#11111c"/><rect x="30" y="4" width="10" height="48" fill="#11111c"/><rect x="42" y="4" width="10" height="48" fill="#11111c"/><rect x="7" y="12" width="8" height="8" rx="2" fill="#ef4444"/><rect x="31" y="22" width="8" height="8" rx="2" fill="#22c55e"/><rect x="43" y="6" width="8" height="8" rx="2" fill="#eab308"/><rect x="4" y="42" width="48" height="3" fill="#c4b5fd"/>',
    penalty: '<rect x="6" y="8" width="44" height="26" fill="none" stroke="#e2e8f0" stroke-width="3"/><path d="M6 14h44M6 20h44M6 26h44M17 8v26M28 8v26M39 8v26" stroke="#e2e8f0" stroke-opacity=".25"/><circle cx="28" cy="46" r="6" fill="#fff" stroke="#111" stroke-width="1.5"/><rect x="22" y="16" width="10" height="16" rx="3" fill="#f59e0b"/>',
    minefield: '<rect x="6" y="6" width="20" height="20" rx="3" fill="#1f2a44"/><rect x="30" y="6" width="20" height="20" rx="3" fill="#171726"/><rect x="6" y="30" width="20" height="20" rx="3" fill="#171726"/><rect x="30" y="30" width="20" height="20" rx="3" fill="#14532d"/><text x="16" y="21" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="14" fill="#60a5fa">2</text><circle cx="40" cy="16" r="5" fill="#ef4444"/>',
    trampoline: '<rect x="8" y="42" width="40" height="5" rx="2.5" fill="#8b5cf6"/><path d="M14 47v6M42 47v6" stroke="#c4b5fd" stroke-width="3"/><circle cx="28" cy="26" r="8" fill="#60a5fa"/><path d="M46 8l2 4 4 0-3 3 1 4-4-2-4 2 1-4-3-3 4 0z" fill="#facc15"/>',
    hookshot: '<circle cx="14" cy="10" r="4" fill="#22c55e"/><circle cx="42" cy="12" r="4" fill="#8b5cf6"/><path d="M14 10l14 26" stroke="#e2e8f0" stroke-width="2"/><circle cx="28" cy="38" r="6" fill="#60a5fa"/><path d="M2 50h52" stroke="#ef4444" stroke-opacity=".6" stroke-width="4"/>',
    gridconnect: '<rect x="4" y="4" width="48" height="48" rx="4" fill="#12121c"/><path d="M12 16h16v16h16" fill="none" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="16" r="7" fill="#0ea5e9"/><circle cx="44" cy="32" r="7" fill="#22c55e"/><rect x="30" y="38" width="12" height="10" rx="2" fill="#475569"/>',
    colormatch: '<circle cx="14" cy="14" r="7" fill="#ef4444"/><rect x="26" y="7" width="14" height="14" fill="#3b82f6"/><path d="M48 6l7 16H41z" fill="#22c55e"/><circle cx="14" cy="42" r="7" fill="#ef4444"/><circle cx="14" cy="28" r="7" fill="#ef4444"/><path d="M26 42h28" stroke="#a78bfa" stroke-width="3" stroke-linecap="round"/>',
    mirrorbeam: '<path d="M4 40h22l16-24" fill="none" stroke="#ef4444" stroke-width="3"/><path d="M20 48l14-16" stroke="#e2e8f0" stroke-width="4" stroke-linecap="round"/><path d="M42 8l8 8-8 8-8-8z" fill="#22d3ee"/>',
    sokoban: '<rect x="6" y="6" width="20" height="20" rx="3" fill="#a16207"/><path d="M6 6l20 20M26 6L6 26" stroke="#fde68a" stroke-width="2"/><rect x="32" y="32" width="18" height="18" rx="3" fill="#7f1d1d"/><circle cx="14" cy="42" r="7" fill="#3b82f6"/>',
    shiftingmaze: '<path d="M6 6h44v44H6zM16 16h24v24H16zM28 6v10M6 28h10M40 28h10M28 40v10" fill="none" stroke="#7c3aed" stroke-width="4"/><circle cx="28" cy="28" r="5" fill="#60a5fa"/><path d="M46 14a14 14 0 0 1 4 10" fill="none" stroke="#a78bfa" stroke-width="2"/>',
    logicgate: '<rect x="6" y="6" width="20" height="20" rx="5" fill="#facc15"/><rect x="30" y="6" width="20" height="20" rx="5" fill="#2563eb"/><rect x="6" y="30" width="20" height="20" rx="5" fill="#171726" stroke="#2a2a4a" stroke-width="2"/><rect x="30" y="30" width="20" height="20" rx="5" fill="#2563eb"/>',
    wordbridge: '<path d="M2 36h14M40 36h14" stroke="#475569" stroke-width="6"/><rect x="16" y="34" width="8" height="6" fill="#a16207"/><rect x="26" y="34" width="8" height="6" fill="#a16207"/><rect x="6" y="8" width="12" height="12" rx="3" fill="#8b5cf6"/><rect x="22" y="8" width="12" height="12" rx="3" fill="#8b5cf6"/><rect x="38" y="8" width="12" height="12" rx="3" fill="#60a5fa"/>',
    weightbalance: '<path d="M28 18v28M18 48h20" stroke="#64748b" stroke-width="4" stroke-linecap="round"/><path d="M8 24l40-6" stroke="#c4b5fd" stroke-width="4" stroke-linecap="round"/><circle cx="12" cy="34" r="6" fill="#ef4444"/><rect x="40" y="26" width="10" height="10" fill="#3b82f6"/>',
    glitchrunner: '<rect x="4" y="44" width="48" height="3" fill="#8b5cf6"/><rect x="10" y="26" width="14" height="14" rx="4" fill="#3b82f6"/><rect x="34" y="30" width="10" height="14" fill="#ef4444"/><circle cx="32" cy="18" r="5" fill="#facc15"/>',
    rooftop: '<rect x="4" y="30" width="18" height="24" fill="#2a2a4a"/><rect x="34" y="22" width="18" height="32" fill="#2a2a4a"/><rect x="4" y="30" width="18" height="3" fill="#8b5cf6"/><rect x="34" y="22" width="18" height="3" fill="#8b5cf6"/><rect x="10" y="12" width="9" height="14" rx="3" fill="#3b82f6"/><rect x="38" y="12" width="8" height="8" fill="#f59e0b"/>',
    flashlight: '<rect x="2" y="2" width="52" height="52" rx="8" fill="#000"/><path d="M12 28L48 12v32z" fill="#fde68a" fill-opacity=".35"/><circle cx="12" cy="28" r="5" fill="#3b82f6"/><circle cx="40" cy="28" r="4" fill="#6d28d9"/>',
    islandfall: '<path d="M2 36q26 10 52 0v20H2z" fill="#0b2a4a"/><path d="M8 28h40l-6 12H14z" fill="#65a30d"/><rect x="34" y="28" width="10" height="8" fill="#b45309"/><circle cx="22" cy="22" r="5" fill="#3b82f6"/>',
    bulletarena: '<rect x="4" y="4" width="48" height="48" rx="4" fill="none" stroke="#8b5cf6" stroke-width="3"/><circle cx="28" cy="28" r="6" fill="#3b82f6"/><circle cx="12" cy="14" r="5" fill="#dc2626"/><circle cx="44" cy="40" r="3" fill="#fb923c"/><circle cx="38" cy="14" r="3" fill="#fb923c"/><circle cx="46" cy="22" r="3" fill="#fb923c"/>',
    cyberheist: '<rect x="4" y="4" width="48" height="48" rx="6" fill="#050a08"/><rect x="9" y="9" width="17" height="17" rx="4" fill="#0f2a1c" stroke="#22c55e" stroke-width="2"/><rect x="30" y="9" width="17" height="17" rx="4" fill="#3f1d1d" stroke="#ef4444" stroke-width="2"/><rect x="9" y="30" width="17" height="17" rx="4" fill="#0f2a1c" stroke="#22c55e" stroke-width="2"/><text x="17.5" y="22" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="12" fill="#86efac">7</text>',
    oxygen: '<rect x="2" y="2" width="52" height="52" rx="8" fill="#101524"/><circle cx="28" cy="28" r="18" fill="#1e293b"/><rect x="22" y="20" width="12" height="20" rx="4" fill="#22d3ee"/><rect x="26" y="15" width="4" height="5" fill="#fff"/><circle cx="14" cy="42" r="4" fill="#3b82f6"/>',
    witchpotion: '<path d="M22 8h12v10l10 22q2 10-16 10T12 40l10-22z" fill="#7c3aed"/><rect x="20" y="4" width="16" height="6" rx="2" fill="#a16207"/><circle cx="26" cy="38" r="3" fill="#c4b5fd"/><circle cx="34" cy="32" r="2" fill="#c4b5fd"/>',
    traindefense: '<rect x="4" y="8" width="48" height="14" rx="4" fill="#2a2a4a" stroke="#475569" stroke-width="2"/><rect x="4" y="34" width="48" height="14" rx="4" fill="#2a2a4a" stroke="#475569" stroke-width="2"/><rect x="22" y="12" width="9" height="20" rx="3" fill="#3b82f6"/><rect x="40" y="38" width="7" height="12" rx="2" fill="#dc2626"/>',
    cafe: '<path d="M10 18h30v14a14 14 0 0 1-30 0z" fill="#92400e"/><path d="M40 22h4a5 5 0 0 1 0 12h-5" fill="none" stroke="#e5e7eb" stroke-width="3"/><path d="M18 12q3-4 0-8M26 12q3-4 0-8M34 12q3-4 0-8" fill="none" stroke="#c4b5fd" stroke-width="2" stroke-linecap="round"/><rect x="8" y="48" width="36" height="3" rx="1.5" fill="#64748b"/>',
    townbalance: '<rect x="6" y="30" width="14" height="22" fill="#22c55e"/><rect x="21" y="22" width="14" height="30" fill="#a16207"/><rect x="36" y="38" width="14" height="14" fill="#94a3b8"/><path d="M28 4l4 8h-8z" fill="#93c5fd"/>',
    traffic: '<rect x="2" y="21" width="52" height="14" fill="#2b2b3a"/><rect x="21" y="2" width="14" height="52" fill="#2b2b3a"/><rect x="6" y="25" width="10" height="6" rx="2" fill="#ef4444"/><rect x="40" y="25" width="10" height="6" rx="2" fill="#3b82f6"/><circle cx="14" cy="14" r="4" fill="#22c55e"/><circle cx="42" cy="42" r="4" fill="#ef4444"/>',
    cargo: '<rect x="4" y="44" width="48" height="6" fill="#475569"/><rect x="8" y="34" width="20" height="10" fill="#3b82f6"/><rect x="28" y="30" width="16" height="14" fill="#eab308"/><rect x="14" y="22" width="16" height="12" fill="#a855f7"/><path d="M2 16h52" stroke="#ef4444" stroke-width="2" stroke-dasharray="5 4"/>',
    paperplane: '<path d="M6 30L50 8 34 46 28 32z" fill="#f8fafc"/><path d="M28 32L50 8 34 46z" fill="#cbd5e1"/><path d="M4 50h48" stroke="#fb923c" stroke-opacity=".5" stroke-width="6"/>',
    katari: '<circle cx="26" cy="30" r="17" fill="#8b5cf6" stroke="#e9d5ff" stroke-width="3"/><circle cx="46" cy="14" r="5" fill="#ec4899"/><circle cx="48" cy="44" r="4" fill="#22c55e"/><circle cx="20" cy="24" r="4" fill="#fff" fill-opacity=".35"/>',
    cleanup: '<rect x="4" y="4" width="48" height="48" rx="6" fill="#2a2234"/><rect x="26" y="8" width="22" height="12" fill="#6b4f3a"/><circle cx="22" cy="34" r="10" fill="#38bdf8" stroke="#e0f2fe" stroke-width="3"/><rect x="38" y="38" width="5" height="5" fill="#a16207"/><rect x="12" y="14" width="5" height="5" fill="#78716c"/>',
    hexclean: '<path d="M16 6l9 5v10l-9 5-9-5V11z" fill="#ef4444"/><path d="M38 6l9 5v10l-9 5-9-5V11z" fill="#3b82f6"/><path d="M27 28l9 5v10l-9 5-9-5V33z" fill="#22c55e"/>',
    plantnursery: '<path d="M14 36h28l-4 14H18z" fill="#7c4a2d"/><path d="M28 36V18" stroke="#4ade80" stroke-width="4"/><circle cx="28" cy="14" r="9" fill="#a855f7"/><circle cx="25" cy="13" r="2" fill="#fff"/><circle cx="31" cy="13" r="2" fill="#fff"/>',
    antcolony: '<path d="M4 44q24-10 48 0v10H4z" fill="#4d7c0f"/><rect x="38" y="16" width="10" height="10" fill="#f9a8d4"/><ellipse cx="22" cy="32" rx="5" ry="3.5" fill="#1f2937"/><circle cx="29" cy="31" r="3" fill="#1f2937"/><circle cx="16" cy="33" r="3" fill="#1f2937"/>',
    museum: '<path d="M4 22L28 8l24 14z" fill="#8b5cf6"/><rect x="8" y="24" width="6" height="22" fill="#c4b5fd"/><rect x="21" y="24" width="6" height="22" fill="#c4b5fd"/><rect x="34" y="24" width="6" height="22" fill="#c4b5fd"/><rect x="2" y="46" width="52" height="6" fill="#6d28d9"/>',
    storerestock: '<rect x="4" y="8" width="22" height="16" rx="3" fill="#ef4444"/><rect x="30" y="8" width="22" height="16" rx="3" fill="#3b82f6"/><rect x="4" y="30" width="22" height="16" rx="3" fill="#eab308"/><rect x="30" y="30" width="22" height="16" rx="3" fill="#22c55e"/>',
    bountyboard: '<rect x="6" y="6" width="44" height="44" rx="5" fill="#a16207"/><rect x="12" y="12" width="14" height="18" fill="#fde68a"/><rect x="30" y="16" width="14" height="22" fill="#fde68a"/><circle cx="19" cy="14" r="2" fill="#ef4444"/><circle cx="37" cy="18" r="2" fill="#ef4444"/><path d="M14 40h28" stroke="#fde68a" stroke-width="3"/>',
    tinygolf: '<path d="M2 44q26-10 52 0v12H2z" fill="#16a34a"/><circle cx="14" cy="40" r="4" fill="#fff"/><path d="M42 42V14" stroke="#e2e8f0" stroke-width="2"/><path d="M42 14l10 4-10 4z" fill="#ef4444"/><path d="M18 36q10-14 20 0" fill="none" stroke="#c4b5fd" stroke-width="2" stroke-dasharray="3 3"/>',
    deepsea: '<rect x="0" y="10" width="56" height="46" fill="#1e6fa8"/><rect x="14" y="4" width="28" height="9" rx="3" fill="#7c2d12"/><path d="M28 13v28" stroke="#e2e8f0" stroke-width="2"/><ellipse cx="22" cy="46" rx="9" ry="5" fill="#0f2c4a"/><circle cx="28" cy="43" r="3" fill="none" stroke="#fbbf24" stroke-width="2"/>',
    iceskating: '<rect x="4" y="4" width="48" height="48" rx="6" fill="#0b2a4a"/><path d="M12 14h16v14h16" fill="none" stroke="#bae6fd" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="14" r="5" fill="#3b82f6"/><rect x="38" y="34" width="12" height="12" fill="#a16207"/><path d="M36 14l2 4 4 0-3 3 1 4-4-2-4 2 1-4-3-3 4 0z" fill="#facc15"/>',
    churro: '<rect x="6" y="28" width="44" height="10" rx="5" fill="#d97706" transform="rotate(-25 28 33)"/><path d="M12 36l32-16" stroke="#92400e" stroke-width="2" stroke-dasharray="3 3"/><circle cx="46" cy="44" r="5" fill="#7c2d12"/>',
    sandbox: '<rect x="14" y="40" width="28" height="10" fill="#6d28d9"/><rect x="18" y="30" width="22" height="10" fill="#8b5cf6"/><rect x="16" y="20" width="18" height="10" fill="#60a5fa"/><path d="M46 4v14" stroke="#e2e8f0" stroke-width="2"/><circle cx="46" cy="22" r="6" fill="#475569"/>'
  };

  function $(id) { return document.getElementById(id); }

  // ----- hub: show each game's top score -----
  if (!game) {
    var metaList = window.GAME_META || [];
    var grid = document.querySelector(".game-grid");
    if (grid && metaList.length) {
      metaList.forEach(function (m, i) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.className = "game-tile";
        a.href = "play.html?g=" + m.id;
        a.innerHTML =
          '<svg viewBox="0 0 56 56" aria-hidden="true">' + (THUMBS[m.id] || "") + "</svg>" +
          "<h2></h2><p></p>" +
          '<span class="tile-top" data-top="' + m.id + '">Top score: none yet</span><span class="tile-play">Play</span>';
        a.querySelector("h2").textContent = m.title;
        a.querySelector("p").textContent = m.tag + ": " + m.desc;
        li.appendChild(a);
        grid.appendChild(li);
      });
    }
    // ----- admin: delete (hide) a game, after re-entering the admin password -----
    var hiddenMap = {}, adminUser = null;
    function idOf(li) {
      var a = li.querySelector("a.game-tile");
      var h = a ? a.getAttribute("href") : "";
      var m = /[?&]g=([a-z0-9_]+)/i.exec(h) || /^([a-z0-9_]+)\.html/i.exec(h);
      return m ? m[1] : "";
    }
    function applyHidden() {
      if (!grid) return;
      grid.querySelectorAll("li").forEach(function (li) {
        var id = idOf(li);
        if (!id) return;
        var gone = !!hiddenMap[id];
        li.setAttribute("data-gone", gone ? "1" : "");
        li.hidden = gone && !adminUser;
        li.classList.toggle("is-deleted", gone);
        var btn = li.querySelector(".del-btn");
        if (adminUser) {
          if (!btn) {
            btn = document.createElement("button");
            btn.type = "button";
            btn.className = "del-btn";
            li.appendChild(btn);
            btn.addEventListener("click", function () { askAdmin(id, li); });
          }
          btn.textContent = gone ? "Restore" : "Delete";
        } else if (btn) btn.remove();
      });
    }
    var adlg = document.createElement("dialog");
    adlg.className = "dlg";
    adlg.innerHTML =
      '<form id="adm-form" autocomplete="off"><h2 id="adm-title">Admin password</h2><p id="adm-text"></p>' +
      '<label for="adm-pw">Admin password</label><input id="adm-pw" type="password" autocomplete="current-password" required />' +
      '<altcha-widget id="captcha-adm" style="display:block;margin:14px 0 0"></altcha-widget>' +
      '<p class="form-error" id="adm-error" role="alert"></p>' +
      '<div class="row"><button type="button" class="btn btn-ghost" id="adm-cancel">Cancel</button><button type="submit" class="btn" id="adm-ok">Confirm</button></div></form>';
    document.body.appendChild(adlg);
    var pending = null;
    async function armAdm() {
      try {
        var w = document.getElementById("captcha-adm");
        var ch = await (await fetch("api/auth/challenge")).json();
        await customElements.whenDefined("altcha-widget");
        w.reset(); w.configure({ challenge: ch }); w.verify();
      } catch (_) {}
    }
    function askAdmin(id, li) {
      var gone = !!hiddenMap[id];
      pending = { id: id, restore: gone };
      var name = li.querySelector("h2") ? li.querySelector("h2").textContent : id;
      document.getElementById("adm-title").textContent = gone ? "Restore game?" : "Delete game?";
      document.getElementById("adm-text").textContent = (gone ? "Restore " : "Remove ") + name + (gone ? " to the games list." : " from the games list. You can restore it later.") + " Enter your admin password to confirm.";
      document.getElementById("adm-pw").value = "";
      document.getElementById("adm-error").textContent = "";
      adlg.showModal();
      document.getElementById("adm-pw").focus();
      armAdm();
    }
    document.getElementById("adm-cancel").addEventListener("click", function () { adlg.close(); });
    document.getElementById("adm-form").addEventListener("submit", async function (e) {
      e.preventDefault();
      var err = document.getElementById("adm-error"), ok = document.getElementById("adm-ok");
      var f = document.querySelector('#captcha-adm input[name="altcha"]');
      if (!f || !f.value) { err.textContent = "Finishing the security check, try again in a second."; return; }
      ok.disabled = true; err.textContent = "";
      try {
        var r = await fetch("api/auth/login", { method: "POST", credentials: "include", headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: adminUser.email, password: document.getElementById("adm-pw").value, altcha: f.value }) });
        var d = await r.json().catch(function () { return {}; });
        if (!r.ok || !d.user) { err.textContent = "Wrong password."; armAdm(); return; }
        if (pending.restore) {
          var rowId = hiddenMap[pending.id];
          var x = await fetch("api/rows/hidden_games/" + rowId, { method: "DELETE", credentials: "include" });
          if (!x.ok) throw new Error();
          delete hiddenMap[pending.id];
        } else {
          var p = await fetch("api/rows/hidden_games", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ values: { game: pending.id } }) });
          var pd = await p.json().catch(function () { return {}; });
          if (!p.ok || !pd.row) throw new Error();
          hiddenMap[pending.id] = pd.row.id;
        }
        adlg.close();
        applyHidden();
      } catch (_) { err.textContent = "Could not complete that. Please try again."; armAdm(); }
      finally { ok.disabled = false; }
    });
    Promise.all([
      fetch("api/rows/hidden_games?limit=200").then(function (r) { return r.json(); }).catch(function () { return {}; }),
      fetch("api/auth/me", { credentials: "include" }).then(function (r) { return r.json(); }).catch(function () { return {}; })
    ]).then(function (res) {
      (res[0].rows || []).forEach(function (x) { hiddenMap[x.game] = x.id; });
      if (res[1].user && res[1].user.role === "admin") adminUser = res[1].user;
      applyHidden();
    });

    var search = document.getElementById("game-search"), none = document.getElementById("no-games");
    if (search && grid) {
      search.addEventListener("input", function () {
        var q = search.value.trim().toLowerCase(), shown = 0;
        grid.querySelectorAll("li").forEach(function (li) {
          var h = li.querySelector("h2");
          var hit = !q || (h && h.textContent.toLowerCase().indexOf(q) >= 0);
          li.hidden = !hit || (li.getAttribute("data-gone") === "1" && !adminUser);
          if (hit) shown++;
        });
        if (none) none.hidden = shown > 0;
      });
    }
    var tops = document.querySelectorAll("[data-top]");
    if (tops.length) {
      fetch("api/rows/scores/aggregate?agg=max.score&group=game")
        .then(function (r) { return r.json(); })
        .then(function (d) {
          (d.rows || []).forEach(function (row) {
            var el = document.querySelector('[data-top="' + row.game + '"]');
            if (el && row.max_score != null) el.textContent = "Top score: " + row.max_score;
          });
        })
        .catch(function () {});
    }
    return;
  }

  // ----- best score (this device) -----
  var bestKey = "synswer-best-" + game;
  function best() { try { return parseInt(localStorage.getItem(bestKey), 10) || 0; } catch (_) { return 0; } }
  function setBest(n) { try { localStorage.setItem(bestKey, String(n)); } catch (_) {} }
  $("best").textContent = best();

  G.onStart = null;
  G.setScore = function (n) {
    $("score").textContent = n;
    if (n > best()) { setBest(n); $("best").textContent = n; }
  };
  G.typing = function () { return !!document.querySelector("dialog[open]"); };

  // ----- pause -----
  var playing = false, paused = false, plays = 0;
  G.onPause = null;
  G.onResume = null;
  var pauseBtn = document.createElement("button");
  pauseBtn.type = "button";
  pauseBtn.className = "pause-btn";
  pauseBtn.textContent = "Pause";
  pauseBtn.hidden = true;
  var hud = document.querySelector(".hud");
  var S = window.Sound;
  var muteBtn = document.createElement("button");
  muteBtn.type = "button";
  muteBtn.className = "pause-btn";
  function muteLabel() { muteBtn.textContent = S && S.muted ? "Sound off" : "Sound on"; }
  muteLabel();
  muteBtn.addEventListener("click", function () {
    muteBtn.blur();
    if (!S) return;
    S.toggle();
    muteLabel();
    if (!S.muted) { S.play("start"); if (playing && !paused) S.music(true); }
  });
  var vol = document.createElement("input");
  vol.type = "range";
  vol.className = "vol";
  vol.min = "0";
  vol.max = "100";
  vol.step = "5";
  vol.value = S ? Math.round(S.volume * 100) : 70;
  vol.setAttribute("aria-label", "Volume");
  vol.addEventListener("input", function () {
    if (!S) return;
    S.setVolume(vol.value / 100);
    if (S.muted && vol.value > 0) { S.toggle(); muteLabel(); }
  });
  vol.addEventListener("change", function () { if (S && !S.muted) S.play("eat"); vol.blur(); });
  var card = document.querySelector(".game-card");
  var fsBtn = document.createElement("button");
  fsBtn.type = "button";
  fsBtn.className = "pause-btn";
  fsBtn.textContent = "Fullscreen";
  var canFs = card && (card.requestFullscreen || card.webkitRequestFullscreen);
  function fsOn() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function fsLabel() { fsBtn.textContent = fsOn() ? "Exit fullscreen" : "Fullscreen"; }
  fsBtn.addEventListener("click", function () {
    fsBtn.blur();
    if (fsOn()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    else { try { (card.requestFullscreen || card.webkitRequestFullscreen).call(card); } catch (_) {} }
  });
  document.addEventListener("fullscreenchange", fsLabel);
  document.addEventListener("webkitfullscreenchange", fsLabel);
  if (hud) { hud.appendChild(muteBtn); hud.appendChild(vol); if (canFs) hud.appendChild(fsBtn); hud.appendChild(pauseBtn); }

  // While a round is running, the game area never scrolls the page (touch, wheel, space and arrow keys).
  function lockScroll() { document.body.classList.toggle("game-active", playing && !paused); }
  function stopScroll(e) { if (playing && !paused && e.cancelable) e.preventDefault(); }
  if (card) {
    card.addEventListener("touchmove", stopScroll, { passive: false });
    card.addEventListener("wheel", stopScroll, { passive: false });
  }
  window.addEventListener("keydown", function (e) {
    if (!playing || paused || G.typing()) return;
    var k = e.key;
    if (k === " " || k === "ArrowUp" || k === "ArrowDown" || k === "ArrowLeft" || k === "ArrowRight" || k === "PageUp" || k === "PageDown") e.preventDefault();
  });

  function setPaused(on) {
    if (!playing || paused === on) return;
    paused = on;
    lockScroll();
    if (S) { S.play("pause"); S.music(!on); }
    if (on) {
      if (G.onPause) G.onPause();
      $("ov-title").textContent = "Paused";
      $("ov-text").textContent = "Press P or Resume to keep playing.";
      $("start").textContent = "Resume";
      $("save").hidden = true;
      $("overlay").hidden = false;
      pauseBtn.textContent = "Resume";
    } else {
      $("overlay").hidden = true;
      if (G.onResume) G.onResume();
      pauseBtn.textContent = "Pause";
    }
  }
  pauseBtn.addEventListener("click", function () { pauseBtn.blur(); setPaused(!paused); });
  document.addEventListener("keydown", function (e) {
    if (G.typing()) return;
    var k = e.key.toLowerCase();
    if (k === "p" || (k === "escape" && playing)) { e.preventDefault(); setPaused(!paused); }
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) setPaused(true); });

  G.over = function (score) {
    playing = false;
    paused = false;
    lockScroll();
    pauseBtn.hidden = true;
    pauseBtn.textContent = "Pause";
    lastScore = score;
    if (S) { S.music(false); S.play("gameover"); }
    $("ov-title").textContent = "Game over";
    $("ov-text").textContent = "You scored " + score + ".";
    $("start").textContent = "Play again";
    $("save").hidden = !(score > 0);
    $("overlay").hidden = false;
    // One ad after every 4 games played in a row (only once cookies were accepted)
    plays++;
    if (plays >= 4) {
      plays = 0;
      var ad = $("game-ad");
      if (!ad) {
        ad = document.createElement("div");
        ad.id = "game-ad";
        ad.setAttribute("data-ad-box", "");
        ad.hidden = true;
        ad.style.cssText = "width:100%;max-width:320px;margin-top:6px;overflow:hidden";
        $("overlay").appendChild(ad);
      }
      if (window.SynswerAds) window.SynswerAds.fill(ad);
    }
  };

  $("start").addEventListener("click", function () {
    $("start").blur();
    var gad = $("game-ad");
    if (gad && window.SynswerAds) window.SynswerAds.clear(gad);
    if (paused) { setPaused(false); return; }
    $("overlay").hidden = true;
    playing = true;
    lockScroll();
    pauseBtn.hidden = false;
    if (S) { S.unlock(); S.play("start"); S.music(true); }
    if (G.onStart) G.onStart();
  });

  // ----- leaderboard -----
  var CROWN = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor" stroke="rgba(0,0,0,.35)" stroke-width="1" stroke-linejoin="round"/><circle cx="3" cy="8" r="1.6" fill="currentColor"/><circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="21" cy="8" r="1.6" fill="currentColor"/></svg>';
  var FB = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H7.9v3h2.6V21z"/></svg>';
  function gameName() { var h = document.querySelector("h1"); return h ? h.textContent : "a game"; }
  function pageUrl() {
    var m = document.querySelector('meta[name="kreova-site-origin"]');
    var origin = ((m && m.content) || location.origin).replace(/\/$/, "");
    return origin + "/" + location.pathname.split("/").pop() + location.search;
  }
  function fbShare(text) {
    var u = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(pageUrl()) + "&quote=" + encodeURIComponent(text);
    window.open(u, "_blank", "noopener,width=620,height=560");
  }
  var shareBtn = document.createElement("button");
  shareBtn.type = "button";
  shareBtn.className = "fb-share fb-share-big";
  shareBtn.setAttribute("aria-label", "Share your score on Facebook");
  shareBtn.title = "Share on Facebook";
  shareBtn.innerHTML = FB;
  shareBtn.hidden = true;
  $("save").after(shareBtn);
  shareBtn.addEventListener("click", function () {
    fbShare("I scored " + lastScore + " in " + gameName() + " on Synswer. Can you beat it?");
  });
  var _over = G.over;
  G.over = function (score) { _over(score); shareBtn.hidden = !(score > 0); };
  $("start").addEventListener("click", function () { shareBtn.hidden = true; });
  var mode = "week";
  function weekStart() {
    var d = new Date();
    var day = (d.getUTCDay() + 6) % 7;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)).toISOString();
  }
  var boardEl = document.querySelector(".board");
  var boardHead = boardEl && boardEl.querySelector("h2");
  if (boardHead) {
    var tabs = document.createElement("div");
    tabs.className = "tabs";
    tabs.innerHTML = '<button type="button" class="tab is-on" data-mode="week">This week</button><button type="button" class="tab" data-mode="all">All time</button>';
    boardHead.after(tabs);
    tabs.addEventListener("click", function (e) {
      var m = e.target.getAttribute && e.target.getAttribute("data-mode");
      if (!m) return;
      mode = m;
      tabs.querySelectorAll(".tab").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-mode") === m); });
      loadBoard();
    });
    var note = document.createElement("p");
    note.className = "board-note";
    note.textContent = "Weekly boards reset every Monday (UTC).";
    boardEl.appendChild(note);
  }
  function loadBoard() {
    var el = $("leaderboard");
    var extra = mode === "week" ? "&created_at=gte." + encodeURIComponent(weekStart()) : "";
    fetch("api/rows/scores?game=eq." + game + extra + "&select=player,score&sort=-score&limit=10")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        el.innerHTML = "";
        var rows = d.rows || [];
        if (!rows.length) {
          var e = document.createElement("li");
          e.className = "empty";
          e.textContent = mode === "week" ? "No scores this week. Be the first." : "No scores yet. Be the first.";
          el.appendChild(e);
          return;
        }
        rows.forEach(function (row, idx) {
          var li = document.createElement("li");
          if (idx < 3) {
            li.className = "podium p" + (idx + 1);
            var cr = document.createElement("span");
            cr.className = "crown";
            cr.setAttribute("role", "img");
            cr.setAttribute("aria-label", ["Gold", "Silver", "Bronze"][idx] + " crown, place " + (idx + 1));
            cr.innerHTML = CROWN;
            li.appendChild(cr);
          }
          var nm = document.createElement("span");
          nm.className = "nm";
          nm.textContent = row.player;
          var sc = document.createElement("span");
          sc.className = "sc";
          sc.textContent = row.score;
          var sh = document.createElement("button");
          sh.type = "button";
          sh.className = "fb-share";
          sh.setAttribute("aria-label", "Share " + row.player + "'s score of " + row.score + " on Facebook");
          sh.title = "Share on Facebook";
          sh.innerHTML = FB;
          sh.addEventListener("click", function () {
            fbShare(row.player + " scored " + row.score + " in " + gameName() + " on Synswer. Can you beat it?");
          });
          li.appendChild(nm);
          li.appendChild(sc);
          li.appendChild(sh);
          el.appendChild(li);
        });
      })
      .catch(function () {});
  }
  loadBoard();

  // ----- save score dialog -----
  var dlg = document.createElement("dialog");
  dlg.className = "dlg";
  dlg.innerHTML =
    '<form id="score-form" autocomplete="off">' +
    "<h2>Save your score</h2>" +
    '<p id="score-line"></p>' +
    '<label for="player-name">Your name</label>' +
    '<input id="player-name" type="text" maxlength="20" required />' +
    '<altcha-widget id="captcha-score" style="display:block;margin:14px 0 0"></altcha-widget>' +
    '<p class="form-error" id="score-error" role="alert"></p>' +
    '<div class="row"><button type="button" class="btn btn-ghost" id="score-cancel">Cancel</button>' +
    '<button type="submit" class="btn" id="score-submit">Save</button></div>' +
    "</form>";
  document.body.appendChild(dlg);

  async function armCaptcha() {
    try {
      var w = $("captcha-score");
      var challenge = await (await fetch("api/auth/challenge")).json();
      await customElements.whenDefined("altcha-widget");
      w.reset();
      w.configure({ challenge: challenge });
      w.verify();
    } catch (_) {}
  }

  $("save").addEventListener("click", function () {
    $("score-line").textContent = "Score: " + lastScore;
    $("score-error").textContent = "";
    try { $("player-name").value = (window.synswerUser && window.synswerUser.name) || localStorage.getItem("synswer-player") || ""; } catch (_) {}
    if (!$("player-name").value && window.synswerUser && window.synswerUser.name) $("player-name").value = window.synswerUser.name;
    var isNew = (window.GAME_META || []).some(function (m) { return m.id === game; });
    var locked = isNew && !window.synswerUser;
    $("score-submit").disabled = locked;
    if (locked) {
      $("score-error").innerHTML = 'Leaderboards are for signed-in players. <a href="login.html?next=index.html">Sign in</a> or <a href="signup.html?next=index.html">create an account</a>, then play again.';
    }
    dlg.showModal();
    $("player-name").focus();
    armCaptcha();
  });
  $("score-cancel").addEventListener("click", function () { dlg.close(); });

  $("score-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var name = $("player-name").value.trim();
    var err = $("score-error");
    if (!name) return;
    var field = $("captcha-score").querySelector('input[name="altcha"]');
    var altcha = field ? field.value : "";
    if (!altcha) { err.textContent = "Finishing the security check, try again in a second."; return; }
    var btn = $("score-submit");
    btn.disabled = true;
    err.textContent = "";
    try {
      var res = await fetch("api/rows/scores", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ values: { game: game, player: name, score: lastScore }, altcha: altcha })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        err.textContent = data.error || "Could not save your score. Please try again.";
        armCaptcha();
      } else {
        try { localStorage.setItem("synswer-player", name); } catch (_) {}
        dlg.close();
        if (S) S.play("saved");
        $("save").hidden = true;
        $("ov-text").textContent = "Score saved: " + lastScore + ".";
        loadBoard();
      }
    } catch (_) {
      err.textContent = "Could not save your score. Check your connection.";
      armCaptcha();
    } finally {
      btn.disabled = false;
    }
  });
})();
