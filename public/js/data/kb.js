// Background facts from the NASA Space Apps challenge brief (NOT library evidence) and offline fallback answers.
export const KB=`Background facts from the NASA Space Apps "Flame in Freefall" challenge brief (these are context, not library evidence):
- In microgravity, buoyancy-driven convection is greatly reduced. Oxygen and heat are then carried by diffusion and by any forced or ventilation flow. A quiescent flame can look like a rounder, bluer shape; flames in forced flow can look different.
- NASA spacecraft fire safety covers prevention (ignition control, material selection, flammability limits), detection, and suppression.
- Spacesuits: 100% oxygen at 4.3 psi; Earth sea level 14.7 psi. Lunar habitats and rovers are expected to use more than 30% oxygen at 10.2 psi or less (more than 40% more oxygen than air).
- Flammability depends strongly on oxygen concentration, and also on pressure, airflow, fuel properties, geometry and ignition conditions. Oxygen concentration alone does not determine ignition risk.
- Investigations named in the brief: BASS and BASS-II and Saffire (solids), SAME and SAME-R (smoke detection), FLEX (suppression by diluting with CO2 and helium), ACME (gaseous fuels; CFI-G reached up to 85% oxygen), E-FIELD Flames (studies electric-field effects on flame ions and ion-driven airflow; it does not simulate partial gravity).
- The current IGNIS collection does not include partial-gravity tests in its PSI records. NASA's LUCI has conducted combustion tests in simulated lunar gravity aboard a rotating sounding rocket. FM² is a separate investigation of material flammability on the lunar surface; its results are not included in this collection.
- Rocket and propellant fire safety is mostly outside PSI scope.
- Earth spin-offs named in the brief: fine-water-mist extinguishers, smoke detection, firefighter gear.`;

const FB="Built-in fallback answer (not a live AI response): ";
export const QA=[
["microgravity weightlessness weightless freefall",FB+"Microgravity is an environment in which apparent weight is very small, so objects and fluids behave as though they are nearly weightless. Gravity is still present; it is not zero gravity. In spacecraft, buoyancy-driven convection is greatly reduced, so heat and oxygen transport rely more on diffusion and any forced airflow. This is background science, not a finding from one specific experiment."],
["flame sphere round blue shape",FB+"With buoyancy greatly reduced in microgravity, hot gases no longer rise strongly, so flames are often rounder and bluer than on Earth. Oxygen and heat are still carried by diffusion and by any airflow, such as ventilation. The flame shape depends on those conditions, so this is a general description, not a result from one experiment. See the Research Library for specific studies."],
["oxygen moon lunar habitat",FB+"Lunar habitats are expected to use 30% oxygen or more at 10.2 psi or less. Higher oxygen can make some materials more flammable, but ignition and flame spread also depend on pressure, airflow, the fuel, its shape and the ignition source. Oxygen alone cannot establish ignition risk. In the library, only one study group (Saffire V) tested around 71 kPa with 25 to 26% oxygen, and none tested 30% or more."],
["partial gravity moon mars",FB+"The challenge brief says the PSI database has no partial-gravity combustion data yet. LUCI and FM2 may add some. Microgravity and normal-gravity results may bound what happens, but that has not been shown here."],
["suppress extinguish extinguishment",FB+"Library evidence is limited. FLEX droplet tests (liquid fuel, quiescent) varied carbon dioxide and helium dilution; the Saffire IV and V paper reports that extinguishment cannot be assumed to be quick without flow. These do not show how to suppress a real cabin fire."],
["smoke detect detector",FB+"Library studies suggest that in low gravity smoke particles can stay near the source longer, and that early detection targets pyrolysis products rather than soot. SAME tested overheated spacecraft materials, not flames."],
["rocket propellant",FB+"Rocket and propellant fires are mostly outside the PSI database’s scope, because high velocities make combustion nearly independent of gravity."]
];

// Match complete words so "microgravity" cannot accidentally match "partial gravity".
export function findFallback(question){
 const words=new Set((question.toLowerCase().match(/[a-z0-9]+/g)||[]));
 let best=null,score=0;
 QA.forEach(([key,answer])=>{
  const terms=key.split(/\s+/);
  const hits=terms.filter(term=>words.has(term)).length;
  if(hits>score){score=hits;best=answer;}
 });
 return best||FB+"no built-in answer covers this question. Try the Research Library, Comparison Lab or Insights, or ask again when the live assistant is available.";
}
