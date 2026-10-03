# Asset provenance and use conditions

## EMU model
- Asset: **Extravehicular Mobility Unit**, NASA / Michael D. Carbajal
- Official model record: https://science.nasa.gov/3d-resources/extravehicular-mobility-unit/
- Download, verified 2026-10-03: https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/extravehicular-mobility-unit/Extravehicular%20Mobility%20Unit.glb
- Official repository: https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Extravehicular%20Mobility%20Unit
- NASA's 3D resource hub explicitly permits downloading and using these assets: https://science.nasa.gov/3d-resources/
- Applicable media usage guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/

This is an educational motion reconstruction, not a NASA product, endorsement or scientific simulation. NASA is not responsible for this generated scene or its accuracy. The GLB file is unmodified. At runtime, this study normalizes/reorients the mesh, omits backpack subsets, replaces materials with an original cloth/black-visor finish, omits logo/mission-patch maps, and applies limited procedural limb deformation. The model is unrigged; it is not the reference's astronaut or performance. No Lusion model, animation, shader, recording, screenshot or texture is included in the runtime.

## Original room and graphics
The corridor geometry, triangular crystal construction, environment reflections, procedural cloth bump texture, blue room pattern, rockets, monitor, debris and sticker illustrations are authored in `scene.js` / `art.js` for this study. They were not extracted or traced as pixel assets from Lusion's website.

## Runtime libraries
Three.js (including its postprocessing utilities) is used under MIT; see THREE-LICENSE.txt. The NASA GLB uses Draco compression. The Draco decoder distributed in the existing Three.js dependency is used under Apache-2.0; see DRACO-LICENSE.txt. Decoder files are imported as Vite-managed URLs so the production build is self-contained.
