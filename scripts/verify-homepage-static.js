const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const htmlFiles = fs
  .readdirSync(root)
  .filter((file) => file.endsWith(".html"));
const htmlByFile = Object.fromEntries(
  htmlFiles.map((file) => [file, fs.readFileSync(path.join(root, file), "utf8")]),
);
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets", "css", "style.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets", "js", "main.js"), "utf8");

const allHtml = Object.values(htmlByFile).join("\n");
const placeholderPattern = /\[(?:Insert|Your|Company|Email|Contact)[^\]]*\]|YOUR_|TODO|TBD/i;
const genericAltText = new Set(["image", "photo", "service", "our team", "team", "placeholder"]);
const imageTags = Object.entries(htmlByFile).flatMap(([file, source]) =>
  Array.from(source.matchAll(/<img\b[^>]*>/gi)).map((match) => ({ file, tag: match[0] })),
);
const failedImageAlts = imageTags.filter(({ tag }) => {
  const altMatch = tag.match(/\balt=(["'])(.*?)\1/i);
  if (!altMatch) return true;
  const alt = altMatch[2].trim();
  if (!alt) return true;
  return genericAltText.has(alt.toLowerCase());
});
const yearIssues = Object.entries(htmlByFile).filter(([, source]) =>
  source.includes("data-year") && !source.includes("<span data-year>2026</span>"),
);
const headingIssues = Object.entries(htmlByFile).flatMap(([file, source]) => {
  const levels = Array.from(source.matchAll(/<h([1-6])\b/gi), (match) => Number(match[1]));
  const issues = [];
  if (levels.filter((level) => level === 1).length !== 1) {
    issues.push(`${file}: expected exactly one h1`);
  }
  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index] > levels[index - 1] + 1) {
      issues.push(`${file}: heading jumps from h${levels[index - 1]} to h${levels[index]}`);
    }
  }
  return issues;
});
const internalLinkIssues = Object.entries(htmlByFile).flatMap(([file, source]) =>
  Array.from(source.matchAll(/<a\b[^>]*\bhref=(['"])(.*?)\1/gi)).flatMap((match) => {
    const href = match[2];
    if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) return [];
    const [rawPath, fragment] = href.split("#", 2);
    const targetFile = !rawPath
      ? file
      : rawPath === "/"
        ? "index.html"
        : decodeURIComponent(rawPath.replace(/^\//, ""));
    const target = htmlByFile[targetFile];
    if (!target) return [`${file}: missing target ${href}`];
    if (fragment && !new RegExp(`\\bid=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(target)) {
      return [`${file}: missing fragment ${href}`];
    }
    return [];
  }),
);
const nonModernImages = imageTags.filter(({ tag }) => {
  const src = tag.match(/\bsrc=(['"])(.*?)\1/i)?.[2] || "";
  return src && !/\.(?:svg|webp|avif)(?:[?#].*)?$/i.test(src);
});
const jsonLdBlocks = Array.from(
  html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi),
  (match) => JSON.parse(match[1]),
);
const schemaTypes = new Set(
  jsonLdBlocks.flatMap((block) => {
    const entries = block["@graph"] || [block];
    return entries.flatMap((entry) => Array.isArray(entry["@type"]) ? entry["@type"] : [entry["@type"]]);
  }),
);

const checks = [
  ["all static HTML has no obvious placeholders", !placeholderPattern.test(allHtml)],
  ["all dynamic year fallbacks show 2026", yearIssues.length === 0],
  ["year script updates every data-year element", js.includes("querySelectorAll('[data-year]')")],
  ["all image tags have descriptive alt text or intentional decorative blanks", failedImageAlts.length === 0],
  ["homepage title targets UK B2B 3D printing prototypes jigs fixtures", /<title>[^<]*UK B2B 3D Printing[^<]*Prototypes[^<]*Jigs[^<]*Fixtures/i.test(html)],
  ["homepage meta description targets UK B2B prototypes jigs fixtures", /<meta name="description" content="[^"]*UK B2B 3D printing[^"]*prototypes[^"]*jigs[^"]*fixtures/i.test(html)],
  ["homepage explains custom parts in plain English", html.includes("Custom parts, prototypes and practical fixes.")],
  ["homepage uses the required feasibility CTA", html.includes("Get a feasibility review")],
  ["homepage welcomes non-technical enquiries", html.includes("Send us a photo, sketch, sample or design file") && html.includes("Tell us what you need")],
  ["homepage presents all five B2B service categories", ["Rapid Prototyping", "Jigs &amp; Fixtures", "Replacement Parts", "Tooling Aids", "Small-Batch Production"].every((label) => html.includes(label))],
  ["homepage contains evidence-led 2025 impact reporting", html.includes("2025 Impact Reporting") && html.includes("not published because the underlying measurements have not been independently assured")],
  ["homepage has a responsive material comparison table", html.includes('class="material-table"') && css.includes(".material-table td::before")],
  ["technical case studies include every required field", ["Client industry", "The problem", "The solution", "Material used", "Final result"].every((label) => html.includes(label))],
  ["B2B FAQ covers files lead times limitations and NDAs", ["Which file formats", "typical lead times", "safety-critical parts", "work under an NDA"].every((label) => html.includes(label))],
  ["homepage schema includes Organization LocalBusiness and Service", ["Organization", "LocalBusiness", "Service"].every((type) => schemaTypes.has(type))],
  ["all pages have one h1 and logical heading levels", headingIssues.length === 0],
  ["all internal links and fragments resolve", internalLinkIssues.length === 0],
  ["all HTML image assets use SVG WebP or AVIF", nonModernImages.length === 0],
  ["contact form has explicit success and error states", js.includes("is-success") && js.includes("is-error") && htmlByFile["contact.html"].includes("data-form-status")],
  ["homepage has futuristic shell", html.includes('class="future-shell"')],
  ["homepage uses professional engineering photography", ["workshop-printer.webp", "prototype-iterations.webp", "positioning-jig.webp", "printer-farm.webp"].every((asset) => html.includes(asset))],
  ["homepage restores the established brand logo", html.includes("logo-brand.webp")],
  ["homepage restores visual material examples", ["material-pla.webp", "material-pet.webp", "material-wood.webp"].every((asset) => html.includes(asset))],
  ["homepage no longer uses the apple or tree metaphor", !html.includes('class="apple-stage"') && !html.includes("story-tree-engineering.svg")],
  ["homepage has B2B application development and impact pillars", html.includes('id="applications"') && html.includes('id="development"') && html.includes('id="impact"')],
  ["homepage has mini case studies", html.includes('id="case-studies"')],
  ["homepage has B2B story section", html.includes('id="b2b"')],
  ["homepage has problem-to-solution section", html.includes('id="solutions"')],
  ["homepage has capability matrix", html.includes('class="capability-grid"')],
  ["homepage has delivery workflow", html.includes('id="workflow"')],
  ["homepage has final conversion flow", html.includes('id="brief"')],
  ["stylesheet defines future color tokens", css.includes("--void") && css.includes("--plasma")],
  ["stylesheet defines the photographic hero", css.includes(".hero-media") && css.includes(".development-proof")],
  ["stylesheet supports reduced motion", css.includes("@media (prefers-reduced-motion: reduce)")],
  ["script handles scrolled header state", js.includes("is-scrolled")],
  ["script staggers reveal children", js.includes("data-stagger")],
];

const failed = checks.filter(([, passed]) => !passed);

if (failed.length) {
  console.error("Homepage static verification failed:");
  for (const [name] of failed) {
    console.error(`- ${name}`);
  }
  if (failedImageAlts.length) {
    console.error("Image alt issues:");
    for (const issue of failedImageAlts) {
      console.error(`- ${issue.file}: ${issue.tag}`);
    }
  }
  if (yearIssues.length) {
    console.error("Year fallback issues:");
    for (const [file] of yearIssues) {
      console.error(`- ${file}`);
    }
  }
  if (headingIssues.length) {
    console.error("Heading issues:");
    for (const issue of headingIssues) console.error(`- ${issue}`);
  }
  if (internalLinkIssues.length) {
    console.error("Internal link issues:");
    for (const issue of internalLinkIssues) console.error(`- ${issue}`);
  }
  if (nonModernImages.length) {
    console.error("Non-modern image issues:");
    for (const issue of nonModernImages) console.error(`- ${issue.file}: ${issue.tag}`);
  }
  process.exit(1);
}

console.log("Homepage static verification passed.");
