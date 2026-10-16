import { getDocument, GlobalWorkerOptions } from "../vendor/pdfjs/build/pdf.min.mjs";
import { EventBus, PDFLinkService, PDFViewer } from "../vendor/pdfjs/web/pdf_viewer.mjs";

const root = document.querySelector("[data-pdf-viewer]");

if (root) {
  const container = root.querySelector(".adma-pdf-container");
  const status = root.querySelector("[data-pdf-status]");
  const scale = root.querySelector("[data-pdf-scale]");
  const zoomOut = root.querySelector("[data-pdf-zoom-out]");
  const zoomIn = root.querySelector("[data-pdf-zoom-in]");
  const fit = root.querySelector("[data-pdf-fit]");

  async function loadProgram() {
    GlobalWorkerOptions.workerSrc = new URL("../vendor/pdfjs/build/pdf.worker.min.mjs", import.meta.url).href;
    const eventBus = new EventBus();
    const linkService = new PDFLinkService({ eventBus });
    const viewer = new PDFViewer({
      container,
      viewer: container.querySelector(".pdfViewer"),
      eventBus,
      linkService,
      removePageBorders: true,
    });
    linkService.setViewer(viewer);

    function updateZoomControls() {
      scale.textContent = `${Math.round(viewer.currentScale * 100)}%`;
      zoomOut.disabled = viewer.currentScale <= 0.25;
      zoomIn.disabled = viewer.currentScale >= 4;
    }

    eventBus.on("pagesinit", () => {
      viewer.currentScaleValue = "page-width";
      fit.disabled = false;
      updateZoomControls();
    });
    eventBus.on("scalechanging", updateZoomControls);
    eventBus.on("pagerendered", (event) => {
      if (event.error) {
        status.textContent = "The PDF could not be displayed. Please use the open or download link above.";
        status.hidden = false;
      } else {
        status.hidden = true;
      }
    });

    zoomOut.addEventListener("click", () => {
      viewer.currentScale = Math.max(0.25, viewer.currentScale / 1.25);
    });
    zoomIn.addEventListener("click", () => {
      viewer.currentScale = Math.min(4, viewer.currentScale * 1.25);
    });
    fit.addEventListener("click", () => {
      viewer.currentScaleValue = "page-width";
    });

    const pdf = await getDocument({
      url: new URL("../documents/ADMA-2026-Program-Overview.pdf", import.meta.url).href,
      isEvalSupported: false,
    }).promise;
    root.querySelector("[data-pdf-page-count]").textContent = `${pdf.numPages} ${pdf.numPages === 1 ? "page" : "pages"}`;
    linkService.setDocument(pdf);
    viewer.setDocument(pdf);

    new ResizeObserver(() => {
      if (viewer.currentScaleValue === "page-width") {
        viewer.currentScaleValue = "page-width";
      }
    }).observe(container);
  }

  loadProgram().catch((error) => {
    status.textContent = "The PDF could not be displayed. Please use the open or download link above.";
    status.hidden = false;
    console.error("Unable to load the program PDF:", error);
  });
}
