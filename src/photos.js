// ONE folder for all pictures: src/assets/photos
// Drop any .jpg / .jpeg / .png / .webp file in that folder and it is picked up automatically:
//   - rotating page background (AppBackdrop.jsx)
//   - Company Showcase tab gallery (App.jsx)
//   - login page slideshow (App.jsx -> LoginScreen)
// (After adding pictures: run `npm run deploy` so the live site gets them.)
const modules = import.meta.glob('./assets/photos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true });

export const PHOTOS = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, m]) => m.default);
