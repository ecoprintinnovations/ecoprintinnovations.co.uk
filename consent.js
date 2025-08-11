(function() {
  const consentScript = document.currentScript;

  function loadGA(gaId) {
    if (window.gaLoaded || !gaId) return;
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = window.gtag || gtag;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', gaId);
    window.gaLoaded = true;
  }

  function loadFB(pixelId) {
    if (window.fbq || !pixelId) return;
    !(function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', pixelId);
    fbq('track', 'PageView');
  }

  function enableAnalytics() {
    if (window.analyticsEnabled) return;
    window.analyticsEnabled = true;
    const gaId = consentScript.dataset.gaId || window.GA_MEASUREMENT_ID;
    const pixelId = consentScript.dataset.pixelId || window.FB_PIXEL_ID;
    if (gaId) loadGA(gaId);
    if (pixelId) loadFB(pixelId);
  }

  function showBanner() {
    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.innerHTML = `
      <span>We use cookies for analytics.</span>
      <div>
        <button id="consent-accept">Accept</button>
        <button id="consent-decline">Decline</button>
      </div>`;

    const style = document.createElement('style');
    style.textContent = `
      #consent-banner{position:fixed;bottom:0;left:0;right:0;background:#1f2937;color:#fff;padding:0.75rem;font-size:0.875rem;display:flex;justify-content:space-between;align-items:center;z-index:1000;}
      #consent-banner button{margin-left:0.5rem;padding:0.25rem 0.75rem;border:none;border-radius:0.25rem;cursor:pointer;}
      #consent-accept{background:#16a34a;color:#fff;}
      #consent-decline{background:#6b7280;color:#fff;}
    `;
    document.head.appendChild(style);
    document.body.appendChild(banner);

    document.getElementById('consent-accept').addEventListener('click', function(){
      localStorage.setItem('cookieConsent', 'granted');
      banner.remove();
      enableAnalytics();
    });

    document.getElementById('consent-decline').addEventListener('click', function(){
      localStorage.setItem('cookieConsent', 'denied');
      banner.remove();
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'granted') {
      enableAnalytics();
    } else if (consent !== 'denied') {
      showBanner();
    }
  });
})();
