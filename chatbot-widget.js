(function () {
  if (window.marcelChatbotLoaded) return;
  window.marcelChatbotLoaded = true;

  // Vercel URL - ZMENIŤ LEN TU
  const VERCEL_URL = "https://fifuk-chatbot.vercel.app/";

  // Povolene domény
  const allowed = ["uniba.sk", "fphil.uniba.sk", "ragnetiq.com", "www.ragnetiq.com", "localhost", "127.0.0.1"];
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
  iframe.style.borderRadius = "0"; // Ostré rohy pre zatvorený stav
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
    
    if (vw <= 768) {
      // Mobilné zariadenia a tablety - celá šírka a výška pri otvorení
      return {
        openWidth: `${vw}px`,
        openHeight: `${vh}px`,
        closedWidth: vw <= 420 ? "240px" : "260px",
        closedHeight: vw <= 420 ? "50px" : "52px",
        bottom: "0",
        right: "0",
        borderRadius: {
          open: "0",
          closed: "0"
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
          open: "0",
          closed: "0"
        }
      };
    }
  }

  // Aplikuje responzívne veľkosti
  function applyResponsiveSizes(isOpen = false) {
    const sizes = getResponsiveSizes();
    const isMobile = window.innerWidth <= 768;
    
    if (isOpen) {
      iframe.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
      iframe.style.width = sizes.openWidth;
      iframe.style.height = sizes.openHeight;
      iframe.style.borderRadius = sizes.borderRadius.open;
      iframe.style.boxShadow = isMobile ? "none" : "0 24px 48px rgba(33, 89, 160, 0.35)";
      
      // Na mobiloch nastaví iframe na celú obrazovku
      if (isMobile) {
        iframe.style.bottom = "0";
        iframe.style.right = "0";
        iframe.style.left = "0";
        iframe.style.top = "0";
        iframe.style.position = "fixed";
      } else {
        iframe.style.bottom = sizes.bottom;
        iframe.style.right = sizes.right;
        iframe.style.left = "auto";
        iframe.style.top = "auto";
      }
      
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
      
      // Zatvorený stav vždy v rohu
      if (isMobile) {
        iframe.style.bottom = "10px";
        iframe.style.right = "10px";
      } else {
        iframe.style.bottom = sizes.bottom;
        iframe.style.right = sizes.right;
      }
      iframe.style.left = "auto";
      iframe.style.top = "auto";
      
      // Pošle správu do iframe o zatvorení
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "widget-closed" }, "*");
        }
      }, 50);
    }
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

