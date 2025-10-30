/*
 * ======= SHORTCUTS =========
 * (CTRL) + (K)           => Search
 * (CTRL) + (SHIFT) + (Z) => Command prompt (for debugging)
 * (CTRL) + (G)           => Toggle light/dark mode
 */

let allProjects = {}
class Fetch {
  static async get() {
    await fetch('data.json')
      .then(res => res.json())
      .then(data => {
        allProjects = data
      });
  }
}


const $    = (a) => {return document.querySelector(a)}
const $$   = (a) => {return document.querySelectorAll(a)}
const $$$  = (a) => {return document.getElementById(a)}


function toggleMode(mode = $('html').className) {
  if (mode === 'light') $('html').className = 'dark'
  else $('html').className = 'light'
}


window.addEventListener('keydown', (k) => {
  const code = k.code;
  if (k.ctrlKey && code === 'KeyK') {
    try {
      k.preventDefault();
      $$$('header-search').focus()
    } catch {}
  } if (code === 'Enter' && document.activeElement === $$$('header-search')) {
    if ($$$('header-search').value.trim() !== '') {
      const url_ = new URL(location.href);
      url_.searchParams.set("search", $$$('header-search').value);
      location.href = url_.toString();
    } else {
      location.href = location.origin + location.pathname
    }
  } if (k.ctrlKey && k.shiftKey && code === 'KeyZ') {
    k.preventDefault();
    $$$('cmd').focus()
  } if (k.ctrlKey && code === 'KeyG') {
    k.preventDefault();
    toggleMode()
  }
});

function applyStyles() {
  const sets = allProjects._meta;
  if (!sets) { throw new TypeError('\'sets\' is null') }

  /* settings.showCombinations */
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  if (isMobile || !sets["settings.showCombinations"])
    $$(".combination").forEach((el) => (el.style.display = "none"));
  else $$(".combination").forEach((el) => (el.style.display = ""));
  /* settings.accentColor */
  $('html').style = `--accent: ${sets["settings.accentColor"]}`
  return sets;
}

/* Program starting here =============> */
window.addEventListener('DOMContentLoaded', async () => {
  await Fetch.get()
  toggleMode(allProjects._meta.mode === 0 ? "dark" : "light");
  applyStyles()
  setInterval(applyStyles, 5000);
  requestAnimationFrame(() => {
    $('body').style.paddingTop = `${($('header').clientHeight) + 16}px`
  });
  if (location.search.includes('id=')) {
    const id = new URLSearchParams(window.location.search).get('id')
    const e = (allProjects)[id];
    var q = []
    e.tags.forEach(a => {
      q.push(`<tag class="hover" onclick="localFunction('${a}')">${a}</tag>`);
    });
    const tags = q.join('');
    $('header .input').remove()
    $('header h2').style = 'flex: 1;'
    $$('header button').forEach(el => {el.style = `flex: 0.3; display: flex; align-items: center; justify-content: center; max-width: 200px;`;})
    const main = document.querySelector('main')
    main.style = `display: flex; flex-direction: column; justify-self: center; gap: 16px; width: 100%; max-width: 750px; min-height: 175px;`;
    main.innerHTML = `
    <div class="top">
      <img src="${id}/thumbnail.png" class="thumbnail">
      <div class="data">
        <h2>${e.title}</h2>
        <desc>By PhantomusBiscuit</desc>
        <br>
        <div class="action">
          <button class="button${[0,-1].includes(e.info.status)?' disabled':''}" style="font-size:110%;display:flex;align-items:center;justify-content:center;gap:8px;flex:1"${e.info.status===-1?' onclick="$(\'.stats-cards\').scrollIntoView({ behavior: \'smooth\', block: \'center\' })"':'onclick="gotoProject()"'}>
            <span style="flex:1;">Open</span>
            <i class="fi fi-rr-right" style="flex:0;"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="bottom">
      <div class="description">
        <h2>Description</h2>
        <span>${marked.parse(e.desc)}</span>
      </div>
      <div class="stats">
        <h2>Info about this project</h2>
        <div class="stats-cards">
          <div class="stat">
            <span><i class="fi fi-rr-calendar"></i> Created</span>
            <span>${new Date(e.info.cdate).toLocaleDateString()}</span>
          </div>
          <div class="stat">
            <span><i class="fi fi-rr-refresh"></i> Updated</span>
            <span>${new Date(e.info.mdate).toLocaleDateString()}</span>
          </div>
          <div class="stat">
            <span><i class="fi fi-rr-info"></i> Status</span>
            <span>${e.info.status===-1?'Not accessible':e.info.status===0?'Starting\u2026':e.info.status===1?'In development':e.info.status===2?'Done':'?'}</span>
          </div>
        </div>
      </div>
      <div class="tags">
        <h2>Tags</h2>
        ${tags}
      </div>
    </div>
    `;
  } else if (location.search.includes('search=')) {
    const search = new URLSearchParams(location.search).get('search')
    $$$('header-search').value = search;

    let searchResults = [];
    Object.keys(allProjects).slice(0, -1).forEach(a => {
      const value = allProjects[a];
      if ((value.title.toLowerCase()).includes(search.toLowerCase())) {
        searchResults.push(Card.text(a))
      }
      getTags(search).forEach(b => {
        if (value.tags.includes(b) && !(($('main').innerHTML).includes(`project-${a}`))) {
          searchResults.push(Card.text(a))
        }
      });
    });


    searchResults = searchResults.join('')
    $('main').innerHTML = `
    <h2><i class="fi fi-rr-search"></i>Search results for "${search}"</h2>
    <div class="search-results">
      ${searchResults}
    </div>
    `
  } else {
    showCards()
  }
})
/* <=================================== */

async function showCards() {
  Object.keys(allProjects).slice(0, -1).forEach(project => {
    new Card(project)
  });
}

class RandomText {
  constructor(length = 16, base = 189, options) {
    let alphabet = [];
    if (options) {
      const chars = options.characters
      if (chars === 'numbers') alphabet = '0123456789'
      else if (chars === 'lowercase') alphabet = 'abcdefghijklmnopqrstuvwxyz'
      else if (chars === 'uppercase') alphabet = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase()
      else if (chars === 'symbols') alphabet = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿×÷";
      else alphabet = chars.join('')
      alphabet = alphabet.split('')
    } else alphabet = `!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ`.split('');
    if (base < 1 || base > alphabet.length) throw new RangeError(`Base must be between 1 and ${alphabet.length}`);
    if (length === 'auto') length = 16
    if (base === 'auto') base = alphabet.length

    const chars = alphabet.slice(0, base);
    let result = "";

    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * base);
      result += chars[idx];
    }
    this.result = result;
    this.length = length;
    this.base = base;
    this.options = options;
  }
}

class Card {
  constructor(id) {
    (async () => {
      const e = (allProjects)[id]
      const t = `
      <div class="project" id="project-${id}">
        ${e.featured?'<div class="featured"></div>':''}
        <img src="${encodeURIComponent(id)+'/thumbnail.png'}" alt="">
        <div>
          <span class="title">
            <p>${e.title}</p>
          </span>
          <button class="button" onclick="openProject('${id}')">
            <i class="fi fi-rr-arrow-right"></i>
          </button>
        </div>
      </div>`
      $('.projects').innerHTML += t
      return t
    })();
  } static text(a) {
    const e = allProjects[a];
    const t = `
      <div class="project" id="project-${a}">
        ${e.featured ? '<div class="featured"></div>' : ""}
        <img src="${encodeURIComponent(a)+"/thumbnail.png"}" alt="">
        <div>
          <span class="title">
            <p>${e.title}</p>
          </span>
          <button class="button" onclick="openProject('${a}')">
            <i class="fi fi-rr-arrow-right"></i>
          </button>
        </div>
      </div>`;
    return t;
  }
}


function openProject(_id) {
  const url_ = new URL(location.href);
  url_.searchParams.set("id", _id);
  location.href = url_.toString();
}


function gotoProject() {
  const id = new URLSearchParams(location.search).get('id')
  window.open(id+'/index.html', '_blank')
}
function getTags(text) {
  return (text.match(/#[\w]+/g) || []).map(a => a.slice(1));
}
function localFunction(a) {
  const url_ = new URL(location.href);
  url_.searchParams.set("search", `#${a}`);
  url_.searchParams.delete("id");
  location.href = url_.toString();
}