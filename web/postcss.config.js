// Empty on purpose: the web app uses plain CSS, not Tailwind. This overrides
// the repo-root postcss.config so Vite doesn't inherit the extension's Tailwind
// pipeline (which would emit a "content option missing" warning).
export default { plugins: {} };
