(function () {
  if (window.marcelChatbotLoaded) return;
  window.marcelChatbotLoaded = true;

  // Vercel URL - ZMENIŤ LEN TU
  const VERCEL_URL = "https://fifuk-chatbot.vercel.app/";

  // Povolene domény
  const allowed = ["uniba.sk", "ragnetiq.com", "www.ragnetiq.com", "localhost", "127.0.0.1"];
  if (!allowed.includes(window.location.hostname)) {
    console.warn("Tento widget nie je povolený na tejto doméne");
    return; // NEvytvára iframe
  }

  const iframe = document.createElement("iframe");
  iframe.src = VERCEL_URL;
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.right = "20px";
  iframe.style.width = "280px"; // Začína zatvorený
  iframe.style.height = "56px"; // Začína zatvorený
  iframe.style.border = "none";
  iframe.style.borderRadius = "28px"; // Zaoblené rohy pre zatvorený stav
  iframe.style.zIndex = "99999";
  iframe.style.boxShadow = "0 8px 24px rgba(33, 89, 160, 0.3)";
  iframe.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
  iframe.style.overflow = "hidden";
  
  // Kritické nastavenia pre konzistentný rendering
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("allow", "clipboard-write");
  iframe.style.margin = "0";
  iframe.style.padding = "0";
  iframe.style.display = "block";
  
  document.body.appendChild(iframe);

  // Responsive breakpoints
  function getResponsiveSizes() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    if (vw <= 420) {
      // Veľmi malé mobilné zariadenia
      return {
        openWidth: `${Math.min(vw - 20, 380)}px`,
        openHeight: `${Math.min(vh - 40, 650)}px`,
        closedWidth: "240px",
        closedHeight: "50px",
        bottom: "10px",
        right: "10px",
        borderRadius: {
          open: "16px",
          closed: "25px"
        }
      };
    } else if (vw <= 768) {
      // Mobilné zariadenia a tablety
      return {
        openWidth: `${Math.min(vw - 40, 380)}px`,
        openHeight: `${Math.min(vh - 60, 650)}px`,
        closedWidth: "260px",
        closedHeight: "52px",
        bottom: "15px",
        right: "15px",
        borderRadius: {
          open: "18px",
          closed: "26px"
        }
      };
    } else {
      // Desktop - presné rozmery
      return {
        openWidth: "380px",
        openHeight: "650px",
        closedWidth: "280px",
        closedHeight: "56px", 
        bottom: "20px",
        right: "20px",
        borderRadius: {
          open: "20px",
          closed: "28px"
        }
      };
    }
  }

  // Aplikuje responzívne veľkosti
  function applyResponsiveSizes(isOpen = false) {
    const sizes = getResponsiveSizes();
    
    if (isOpen) {
      iframe.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
      iframe.style.width = sizes.openWidth;
      iframe.style.height = sizes.openHeight;
      iframe.style.borderRadius = sizes.borderRadius.open;
      iframe.style.boxShadow = "0 24px 48px rgba(33, 89, 160, 0.35)";
      
      // Pošle správu do iframe o otvorení
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "widget-opened" }, "*");
        }
      }, 50);
    } else {
      iframe.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
      iframe.style.width = sizes.closedWidth;
      iframe.style.height = sizes.closedHeight;
      iframe.style.borderRadius = sizes.borderRadius.closed;
      iframe.style.boxShadow = "0 8px 24px rgba(33, 89, 160, 0.3)";
      
      // Pošle správu do iframe o zatvorení
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "widget-closed" }, "*");
        }
      }, 50);
    }
    
    iframe.style.bottom = sizes.bottom;
    iframe.style.right = sizes.right;
    iframe.style.left = "auto";
  }

  let isOpen = false;

  // Po načítaní iframe nastaví počiatočný zatvorený stav
  iframe.addEventListener("load", function() {
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "widget-closed" }, "*");
      }
    }, 100);
  });

  // Počúva správy z iframe
  window.addEventListener("message", function(event) {
    // Kontrola pôvodu správy
    if (event.origin !== VERCEL_URL.replace(/\/$/, '')) return;
    
    if (event.data.type === "chatbot-toggle") {
      isOpen = !isOpen;
      applyResponsiveSizes(isOpen);
    } else if (event.data.type === "chatbot-open") {
      isOpen = true;
      applyResponsiveSizes(true);
    } else if (event.data.type === "chatbot-close") {
      isOpen = false;
      applyResponsiveSizes(false);
    }
  });

  // Responzívne zmeny pri zmene veľkosti okna
  window.addEventListener("resize", function() {
    applyResponsiveSizes(isOpen);
  });

  // Nastaví počiatočné responzívne veľkosti
  applyResponsiveSizes(false);
})();
