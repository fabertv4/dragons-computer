const CONFIG = {
  whatsappNumber: "390000000000",
  defaultReferral: "FABRYPC",
  googleAdsSendTo: "AW-XXXXXXXXXX/XXXXXXXXXXXX"
};

function getParams() {
  return new URLSearchParams(window.location.search);
}

function getTrackingData() {
  const params = getParams();

  return {
    utm_source: params.get("utm_source") || "direct",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_term: params.get("utm_term") || "",
    utm_content: params.get("utm_content") || "",
    gclid: params.get("gclid") || "",
    referral: params.get("ref") || localStorage.getItem("dragon_referral") || CONFIG.defaultReferral
  };
}

function persistTracking() {
  const data = getTrackingData();

  if (data.referral) {
    localStorage.setItem("dragon_referral", data.referral);
  }

  localStorage.setItem("dragon_tracking", JSON.stringify(data));

  const referralInput = document.getElementById("referralInput");
  if (referralInput && !referralInput.value) {
    referralInput.value = data.referral;
  }
}

function trackEvent(eventName, params = {}) {
  const tracking = getTrackingData();

  const payload = {
    ...tracking,
    ...params
  };

  if (window.gtag) {
    gtag("event", eventName, payload);
  }

  console.log("Tracked:", eventName, payload);
}

function sendGoogleAdsConversion() {
  if (window.gtag && CONFIG.googleAdsSendTo.includes("AW-")) {
    gtag("event", "conversion", {
      send_to: CONFIG.googleAdsSendTo
    });
  }
}

function buildWhatsappUrl(service) {
  const tracking = getTrackingData();

  const message = `
Ciao Dragon's Computer, vorrei informazioni.

Servizio: ${service}
Codice referral: ${tracking.referral}

Origine:
utm_source: ${tracking.utm_source}
utm_medium: ${tracking.utm_medium}
utm_campaign: ${tracking.utm_campaign}
utm_term: ${tracking.utm_term}
gclid: ${tracking.gclid}
`.trim();

  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function setupWhatsappButtons() {
  document.querySelectorAll(".js-whatsapp").forEach(button => {
    button.addEventListener("click", function(e) {
      e.preventDefault();

      const service = this.dataset.service || "Contatto generico";

      trackEvent("whatsapp_click", {
        service: service
      });

      sendGoogleAdsConversion();

      window.location.href = buildWhatsappUrl(service);
    });
  });
}

function setupPhoneButtons() {
  document.querySelectorAll(".js-phone").forEach(button => {
    button.addEventListener("click", function() {
      trackEvent("phone_click", {
        service: "Telefonata"
      });

      sendGoogleAdsConversion();
    });
  });
}

function setupLeadForm() {
  const form = document.getElementById("leadForm");
  if (!form) return;

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const formData = new FormData(form);
    const tracking = getTrackingData();

    const lead = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      service: formData.get("service"),
      budget: formData.get("budget"),
      referral: formData.get("referral") || tracking.referral,
      ...tracking
    };

    trackEvent("form_submit", lead);
    sendGoogleAdsConversion();

    const message = `
Nuova richiesta preventivo Dragon's Computer

Nome: ${lead.name}
Telefono: ${lead.phone}
Servizio: ${lead.service}
Budget: ${lead.budget}
Codice referral: ${lead.referral}

Tracking:
utm_source: ${lead.utm_source}
utm_medium: ${lead.utm_medium}
utm_campaign: ${lead.utm_campaign}
utm_term: ${lead.utm_term}
utm_content: ${lead.utm_content}
gclid: ${lead.gclid}
`.trim();

    window.location.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  persistTracking();
  setupWhatsappButtons();
  setupPhoneButtons();
  setupLeadForm();

  trackEvent("page_view_custom", {
    page: window.location.pathname
  });
});
