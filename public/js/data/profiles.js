// Placeholder investigation profiles (editorial estimates, not NASA ratings).
export const W=[["Crew habitat relevance","crew"],["Supports predictive modeling","model"],["Informs new safety equipment","equip"],["Earth applications","earth"]];
export const D=[
{id:"saffire",n:"Saffire-I, -II, -III",cat:"Prevention",fuel:"Solid",hw:"Cygnus spacecraft, free-flyer",hi:1,s:[5,4,4,3],b:"Fire spread on fabrics and plastics at spacecraft scale, in a vehicle rather than a lab box.",earth:"Material selection for enclosed vehicles and buildings."},
{id:"bass",n:"BASS, BASS-II",cat:"Prevention",fuel:"Solid",hw:"Microgravity Science Glovebox, fan-driven flow duct",hi:1,s:[5,5,3,3],b:"Burning and suppression of solid materials, with airflow and oxygen as key variables.",earth:"Flammability testing standards for materials."},
{id:"same",n:"SAME, SAME-R",cat:"Detection",fuel:"Aerosol",hw:"Smoke measurement instruments on the ISS",hi:0,s:[5,3,5,5],b:"Tested how smoke particles look in microgravity so alarms can detect them reliably.",earth:"Better terrestrial smoke detection."},
{id:"flex",n:"FLEX, FLEX-2",cat:"Suppression",fuel:"Liquid droplet",hw:"MDCA in the Combustion Integrated Rack",hi:0,s:[4,3,5,3],b:"Burning droplets put out by diluting the atmosphere with carbon dioxide and helium.",earth:"Fine-water-mist and agent design."},
{id:"cfig",n:"CFI-G (ACME)",cat:"Prevention",fuel:"Gas",hw:"ACME modular hardware in the CIR",hi:1,s:[4,4,2,2],b:"Highest oxygen tests in microgravity: up to 85% O₂ flowing from a spherical burner.",earth:"Oxygen-enriched fire behavior."},
{id:"bre",n:"BRE (ACME)",cat:"Prevention",fuel:"Gas",hw:"ACME modular hardware in the CIR",hi:0,s:[4,5,2,2],b:"Gaseous fuel used as a model of material flammability in still atmospheres.",earth:"Links flammability to material properties."},
{id:"efield",n:"E-FIELD Flames (ACME)",cat:"Related",fuel:"Gas",hw:"ACME modular hardware in the CIR",hi:0,s:[3,4,1,2],b:"Electric fields push on flame ions, mimicking partial gravity.",earth:"Flame control by electric fields.",pg:1},
{id:"spice",n:"SPICE",cat:"Related",fuel:"Gas",hw:"Glovebox flow duct built for SPICE",hi:0,s:[3,4,2,3],b:"Smoke point in a co-flow flame: when soot starts escaping.",earth:"Soot and smoke production."},
{id:"slice",n:"SLICE",cat:"Related",fuel:"Gas",hw:"Glovebox flow duct built for SPICE",hi:0,s:[2,4,1,2],b:"Flame structure and liftoff from the burner.",earth:"Burner and flame stability."},
{id:"cfi",n:"CFI (droplets)",cat:"Related",fuel:"Liquid droplet",hw:"MDCA in the Combustion Integrated Rack",hi:0,s:[2,3,1,2],b:"Cool flames on burning liquid fuel droplets.",earth:"Low-temperature combustion in engines."},
{id:"daft",n:"DAFT, DAFT-2",cat:"Detection",fuel:"Aerosol",hw:"SAME instrument reused for dust",hi:0,s:[2,1,3,3],b:"Detecting dust and aerosols with a smoke-detection instrument.",earth:"Dust monitoring."}
];
