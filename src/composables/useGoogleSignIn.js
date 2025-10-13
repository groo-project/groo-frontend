let gsiLoaded;

function loadGsi() {
  if (gsiLoaded) return gsiLoaded;
  gsiLoaded = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client"; 
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return gsiLoaded;
}

export function useGoogleSignIn({ clientId, callback }) {
  async function init() {
    await loadGsi();
    window.google.accounts.id.initialize({
      client_id: clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID,     
      callback,                       
      ux_mode: "popup",               
    });
  }

  function renderButton(el) {
    if (!el) return;
    window.google.accounts.id.renderButton(el, {
      type: "icon",                   
      size: "large",
      theme: "outline",
      shape: "circle",
      text: "signin_with",
      logo_alignment: "center",
    });
  }


  return { init, renderButton};
}
