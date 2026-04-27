
const API_BASE_URL = "https://restcountries.com/v3.1";
const ALL_COUNTRIES_FIELDS = "/all?fields=name";
const COUNTRY_NAME_ENDPOINT = "/name/";

//!========== çoklu seçim ================

const countriesSelect = document.getElementById("countrySelect");
const countriesDiv = document.querySelector(".countries");

let renderSeq = 0; // aktif render sürümü

// 1) CTRL/CMD gerekmeden çoklu seçim: mousedown ile toggle
countriesSelect.addEventListener("mousedown", (e) => {
  const opt = e.target;
  if (opt.tagName === "OPTION") {
    e.preventDefault();            // tarayıcının varsayılan seçim davranışını durdur
    opt.selected = !opt.selected;  // kendimiz toggle edelim
    // değişikliği tetikle
    countriesSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }
});

// Tüm ülkeleri çek – sadece isimler
const fetchAllCountries = async () => {
  const url = `${API_BASE_URL}${ALL_COUNTRIES_FIELDS}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ülkeler yüklenemedi! Status: ${res.status}`);
    const data = await res.json();

    data.sort((a, b) => a.name.common.localeCompare(b.name.common));

    countriesSelect.innerHTML = "";
    data.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.name.common;   // örn: "Türkiye", "United States"
      option.textContent = country.name.common;
      countriesSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Hata:", error);
  }
};

// Tek ülke datasını dönen yardımcı
const fetchCountryData = async (name) => {
  const url = `${API_BASE_URL}${COUNTRY_NAME_ENDPOINT}${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Something went wrong: ${res.status}`);
    const data = await res.json();
    return data[0];
  } catch (err) {
    console.error(err);
    return null;
  }
};

const renderError = (err) => {
  const errorCard = document.createElement("div");
  errorCard.className = "text-center";
  errorCard.innerHTML = `
    <h1 class="text-danger fs-4">${err}</h1>
    <img src="./assets/404.png" alt="" style="max-width:200px"/>
  `;
  countriesDiv.appendChild(errorCard);
};

const renderCountry = (country) => {
  if (!country) return;

  const {
    capital,
    name: { common },
    region,
    flags: { svg },
    languages,
    currencies,
  } = country;

  const capitalStr = Array.isArray(capital) ? capital[0] : capital || "-";
  const langs = languages ? Object.values(languages).join(", ") : "-";
  const currObj = currencies ? Object.values(currencies)[0] : null;
  const currStr = currObj ? `${currObj.name} ${currObj.symbol || ""}` : "-";

  const card = document.createElement("div");
  card.classList.add("card", "shadow-lg");
  card.style.width = "18rem";

  card.innerHTML = `
    <img src="${svg}" class="card-img-top" alt="${common}">
    <div class="card-body">
      <h5 class="card-title">${common}</h5>
      <p class="card-text">${region || "-"}</p>
    </div>
    <ul class="list-group list-group-flush">
      <li class="list-group-item"><i class="fas fa-lg fa-landmark"></i> ${capitalStr}</li>
      <li class="list-group-item"><i class="fas fa-lg fa-comments"></i> ${langs}</li>
      <li class="list-group-item"><i class="fas fa-lg fa-money-bill-wave"></i> ${currStr}</li>
    </ul>
  `;

  countriesDiv.appendChild(card);
};

// Çoklu seçim değiştiğinde render et
countriesSelect.addEventListener("change", async (e) => {
  const thisSeq = ++renderSeq; // yeni bir render sürümü başlıyor
  const selected = Array.from(e.target.options)
    .filter((o) => o.selected)
    .map((o) => o.value);

  countriesDiv.innerHTML = "";

  if (selected.length === 0) return;

  try {
    // Paralel fetch + sıralı render (seçim sırasına göre)
    const results = await Promise.all(selected.map((name) => fetchCountryData(name)));

    // bu arada başka bir seçim olduysa, bu render'ı iptal et
    if (thisSeq !== renderSeq) return;

    results.forEach((cty) => {
      if (!cty) renderError("Ülke alınamadı.");
      else renderCountry(cty);
    });
  } catch (err) {
    if (thisSeq !== renderSeq) return;
    renderError("Bir şeyler ters gitti.");
  }
});

// sayfa açılışında listeyi doldur
fetchAllCountries();