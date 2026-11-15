// Background facts (from the NASA Space Apps challenge brief) and offline fallback answers.
export const KB=`Facts from the challenge background:
- Without buoyancy flames rely on diffusion for oxygen; a candle flame becomes a blue sphere.
- NASA fire safety: prevention (ignition control, material selection, flammability limits), detection, suppression.
- Spacesuits: 100% O2 at 4.3 psi; Earth sea level 14.7 psi. Moon base/rovers expected 30% O2 or more at 10.2 psi or less, over 40% more O2 than air.
- Flammability depends strongly on O2 concentration; airflow also matters in microgravity.
- Solid-material studies: BASS, BASS-II, Saffire-I/-II/-III. Detection: SAME, SAME-R (instrument reused for dust in DAFT, DAFT-2). Suppression: FLEX with CO2 and helium dilution.
- ACME: six gaseous-fuel experiments in the Combustion Integrated Rack; CFI-G reached up to 85% O2; BRE studies flammability in still atmospheres vs material properties; E-FIELD mimics partial gravity with electric fields.
- FLEX, FLEX-2, CFI use droplets in MDCA. BASS, BASS-II, SPICE, SLICE use the glovebox flow duct.
- PSI has no partial-gravity combustion data yet; LUCI and FM2 are expected to add some.
- Rocket/propellant fire safety is mostly outside PSI scope.
- Earth spin-offs: fine-water-mist extinguishers, smoke detection, firefighter gear.`;
export const QA=[["flame sphere","Without gravity there is no buoyancy, so hot gases do not rise. Oxygen arrives by diffusion, giving a dim blue sphere instead of a teardrop."],["oxygen moon","Moon habitats are expected at 30% O₂ or more at 10.2 psi or less, over 40% more O₂ than air. Flammability depends strongly on oxygen, so materials burn more easily."],["partial gravity","PSI has no partial-gravity combustion data yet. LUCI and FM2 may add some. E-FIELD mimics partial gravity with electric fields."],["suppress extinguish","FLEX tested suppression by diluting the atmosphere with carbon dioxide and helium, both of which suppress fire."],["smoke detect","SAME and SAME-R tested smoke detection in microgravity on the ISS."],["rocket propellant","Rocket and propellant fires are mostly outside PSI’s scope, because high velocities make combustion nearly independent of gravity."]];
