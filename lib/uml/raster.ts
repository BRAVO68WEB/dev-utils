export function withXmlns(svg: string) {
  if (svg.includes("xmlns=")) return svg;
  return svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
}

export async function svgToPng(svg: string) {
  const parsed = new DOMParser().parseFromString(withXmlns(svg), "image/svg+xml");
  const element = parsed.querySelector("svg");
  if (!element || parsed.querySelector("parsererror")) throw new Error("The diagram SVG could not be read.");
  const box = element.viewBox?.baseVal;
  const widthAttr = Number(element.getAttribute("width"));
  const heightAttr = Number(element.getAttribute("height"));
  const width = box && box.width > 0 ? box.width : Number.isFinite(widthAttr) && widthAttr > 0 ? widthAttr : 800;
  const height = box && box.height > 0 ? box.height : Number.isFinite(heightAttr) && heightAttr > 0 ? heightAttr : 600;
  element.setAttribute("width", String(width));
  element.setAttribute("height", String(height));
  const markup = new XMLSerializer().serializeToString(element);
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = await loadImage(url);
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare the PNG.");
    const surface = getComputedStyle(document.documentElement).getPropertyValue("--surface").trim() || "#ffffff";
    context.fillStyle = surface;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Could not export a PNG."))), "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not draw the diagram."));
    image.src = url;
  });
}
