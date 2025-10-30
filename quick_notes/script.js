// Get elements
const mainHtml = document.querySelector('html');

const addBtn = document.querySelector("#addNote");

const searchBtn = document.getElementById('search');
const searchDlg = document.querySelector('#searchDialog');
const searchIpt = document.querySelector('#searchInput');
const searchOk = document.querySelector('#confirmButton2');

const dialog = document.querySelector("#titleDialog");
const confirmBtn = document.querySelector("#confirmButton");
const cancelBtn = document.getElementById("cancelButton");
const titleInput = document.getElementById("inputIndex");
const noteInput = document.getElementById("inputIndex2");
const confirmDialog = document.getElementById("confirm");

const savingDlg = document.getElementById('saving');
const saving1 = document.getElementById('saving1');
const saving2 = document.getElementById('saving2');
const saving3 = document.getElementById('saving3');

// Search button
searchBtn.addEventListener('click', () => {
  searchIpt.value = '';
  searchDlg.showModal();
  searchIpt.focus();
});
searchOk.addEventListener('click', (e) => {
  e.preventDefault();
  const value = searchIpt.value;
  searchDlg.close();
  const results = searchTitle(value);

});

// Open dialog when clicking "Add Note"
addBtn.addEventListener("click", () => {
  titleInput.value = ""; // clear input for new note
  noteInput.value = "";
  dialog.showModal();
  titleInput.focus();
});
confirmBtn.addEventListener("click", (e) => {
  e.preventDefault(); // prevent form submission

  const titleValue = titleInput.value.trim();
  const noteValue = noteInput.value.trim() || "( Empty )"; // fallback if empty

  if (titleValue !== "") {
    addNote(titleValue, noteValue);
  }

  dialog.close();
});

// Cancel button closes dialog
cancelBtn.addEventListener("click", () => dialog.close());

// Enter key in title input triggers confirm
titleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.shiftKey) {
    e.preventDefault();
    confirmBtn.click();
  }
});

// Function to handle duplicate titles
function getNextTitle(title) {
  const cards = document.querySelectorAll(".card h2");
  const titles = Array.from(cards).map((h2) => h2.textContent);

  let count = 0;
  titles.forEach((t) => {
    const base = t.replace(/\(\d+\)$/, "").trim();
    if (base === title) count++;
  });

  return count === 0 ? title : `${title} (${count + 1})`;
}

// Function to count words
function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// Convert text to decimal/hex entities
function toDecimalEntities(text, previewing = false) {
  if (previewing) {
    return Array.from(text)
      .map((ch) => `&#x${ch.codePointAt(0).toString(16)};`)
      .join("")
      .replaceAll(/&#x20;/g, '&nbsp;');
  }
  else {
    return Array.from(text)
      .map((ch) => `&#x${ch.codePointAt(0).toString(16)};`)
      .join("")
  }
}

// Add a note and save to localStorage
async function addNote(titleValue, noteValue) {
  titleValue = getNextTitle(titleValue);

  const id = Date.now().toString(36).toUpperCase().padStart(9, "0");
  const words = countWords(noteValue);

  const noteObj = {
    id,
    title: titleValue,
    content: noteValue,
    words,
    created: Date.now(),
    modified: Date.now(),
  };

  saveNote(noteObj);
  createCard(noteObj);
  await sleep(1);
}

// Save note to localStorage
function saveNote(noteObj) {
  let notes = JSON.parse(localStorage.getItem("quickNotes")) || [];
  notes.push(noteObj);
  localStorage.setItem("quickNotes", JSON.stringify(notes));
}

// Create a card in the DOM
async function createCard(note) {
  const main = document.querySelector("main");
  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("onclick", `previewNoteOfId('${note.id}')`);
  card.innerHTML = `
  <h2>${toDecimalEntities(note.title)}</h2>
  <p>${toDecimalEntities(note.content)}</p>
  <div>
    <span class="noteId">ID:</span>
    <span class="noteId-value">${note.id}</span>

    <span class="noteId">Created</span>
    <span class="noteId-value" style="flex: 2;">${timeSince(note.created)}</span>
  </div>
  `;

  card.style.opacity = 0;
  card.style.transform = "translateY(20px)";
  main.appendChild(card);

  requestAnimationFrame(() => {
    card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    card.style.opacity = 1;
    card.style.transform = "translateY(0)";
  });

  // Update header count
  document.querySelector("header h1").textContent = `Quick Notes (${main.children.length})`;
  await sleep(10);
}

// Load saved notes on page load
window.addEventListener("DOMContentLoaded", async () => {
  localStorage.setItem("version", '8.5.2');

  document.querySelector('main').innerHTML = '';
  if (window.matchMedia("(prefers-color-scheme: light)")) {
    mainHtml.className = 'dark-mode'
  }
  const notes = JSON.parse(localStorage.getItem("quickNotes")) || [];

  if (!window.location.href.includes('?id=')) {
    document.querySelector('title').textContent = 'Quick Notes \u2013 Main'
    let i = 0;
    for (const item of notes) {
      createCard(item);
      await sleep(1);
      i++;
      document.querySelector('loading span').textContent = 'Loading\u2026 '+i+'/'+notes.length;
    };
  } else {
    const params = new URLSearchParams(window.location.search).get("id");
    const container = document.querySelector("header");
    const buttons = container.querySelectorAll("button");
    buttons.forEach((btn) => btn.remove());
    container.innerHTML = container.innerHTML + `
    <button onclick="closeWindow()">
      <i class="fi fi-rr-arrow-left"></i>
    </button>
    <br>
    <button id="toggleMode" onclick="if (mainHtml.className==='light-mode'){mainHtml.className='dark-mode';}else{mainHtml.className='light-mode';}">
      <i class="fi fi-rr-moon"></i>
    </button>
    <button id="editNote" onclick="editNote()">
      <i class="fi fi-rr-pencil"></i>
    </button>
    <button id="viewStats" onclick="stats()">
      <i class="fi fi-rr-info"></i>
    </button>
    `

    const main = document.querySelector('main');
    main.style.display = 'block';

    let note = 'Error finding note "'+params+'"';
    for (let i=0;i<notes.length;i++) {
      if (notes[i].id === params) {
        note = notes[i].content;
        i = notes.length;
      }
    }

    // TOEITOTIOEITOEITOETIEOTIPOEITOEITOEITOEITOETIEOTIOEITEOITEOTO
    main.innerHTML = formatText(toDecimalEntities(note));

    try {

      const title = document.querySelector("header h1");
      const id = params;
      const note = notes.find((n) => n.id === id);
      title.textContent = note ? note.title : '---';
      document.querySelector("title").textContent = `Quick Notes \u2013 ${note.title}`;
    }
    catch (err) {
      document.querySelector('loading span').textContent = `Error: Cannot find note '${params}'.`
      document.querySelector("title").textContent = `Error: Cannot find note '${params}'.`;
      await sleep(3000);
      document.querySelector("loading span").textContent = `Exiting\u2026`;
      document.querySelector("title").textContent = `Exiting\u2026`;
      await sleep(1000);
      closeWindow();
    }
  };

  await sleep(500);
  document.querySelector('loading').style.display = 'none';
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Confirmation dialog
async function openConfirmDialog() {
  confirmDialog.showModal();

  // Remove old event listeners to avoid stacking
  confirmBtn.replaceWith(confirmBtn.cloneNode(true));
  cancelBtn.replaceWith(cancelBtn.cloneNode(true));

  const newYes = document.getElementById("confirmButton1");
  const newNo = document.getElementById("cancelButton1");

  newYes.addEventListener("click", async () => {
    confirmDialog.close();
    localStorage.setItem('quickNotes', '[]');
    await sleep(250);
    location.reload();
  });

  newNo.addEventListener("click", () => {
    confirmDialog.close();
  });
}
document.querySelector("#delete").addEventListener("click", async () => {
  await openConfirmDialog();
});

function timeSince(dateMs) {
  const now = Date.now();
  let diff = now - dateMs; // difference in milliseconds

  if (diff < 0) return "---";

  const units = [
    { name: "yr",     ms: 1000 * 60 * 60 * 24 * 365 },
    { name: "month",  ms: 1000 * 60 * 60 * 24 * 30 },
    { name: "week",   ms: 1000 * 60 * 60 * 24 * 7 },
    { name: "d",      ms: 1000 * 60 * 60 * 24 },
    { name: "h",      ms: 1000 * 60 * 60 },
    { name: "min",    ms: 1000 * 60 },
    { name: "s",      ms: 1000 }
  ];

  for (let {name, ms} of units) {
    const amount = Math.floor(diff / ms);
    if (amount > 0) return `${amount}${name}${amount > 1 ? (name === 's' ? '' : 's') : ""} ago`;
  }

  return "now";
}

function previewNoteOfId(id) {
  const notes = JSON.parse(localStorage.getItem("quickNotes")) || [];
  let ids = [];
  notes.forEach(item => {
    ids.push(item.id)
  });
  const url = new URL(location.href);

  if (ids.includes(id)) {
    url.searchParams.set('id', id);
    window.open(url.toString(), '_blank')
  }
  else {
    alert(`Note with id ${id} is not found.`);
  }
}

const toggleMode = document.getElementById('toggleMode');

toggleMode.addEventListener('click', () => {
  if (mainHtml.className === 'light-mode') {
    mainHtml.className = 'dark-mode';
  }
  else {
    mainHtml.className = 'light-mode';
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  while (true) {
    let date = new Date();
    date = `
    ${date.getDate().toString().padStart(2, '0')}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getFullYear()}
    ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`

    document.querySelectorAll('.footer span')[2].textContent = date;
    document.querySelectorAll('.footer span')[1].textContent = document.title;
    document.querySelectorAll('.footer span')[0].textContent = `v${localStorage.getItem("version")}`;
    await sleep(500);
  }
});

document.querySelector('.buttons button#stats-copy').addEventListener('click', () => {
  const notes = localStorage.getItem('quickNotes');
  const id = new URL(window.location.href).searchParams.get('id');
  let note;
  for (let i=0;i<notes.length;i++) {
    if (notes[i].id === id) {
      note = notes[i]; break;
    }
  }
  const statVals = document.querySelectorAll('span.value');
  let textLabels = [
    'Title', 'ID', 'Created', 'Last modified', 'Characters (with spaces)',
    'Characters (without spaces)', 'Words', 'Sentences', 'Paragraphs',
    'Lines', 'Estimated reading time (150 wpm)'
  ]
  let text = '';
  for (let i=0;i<11;i++) {
    text = text + '==== ' + textLabels[i] + ' ' + '='.repeat(50 - textLabels[i].length) + '\\n  ' + statVals[i].textContent + '\n';
  }
  text = text.replaceAll(/\n  /gu, '').replaceAll(/\\n/gu, '\n')
  copyText(text);
});

async function stats() {
  const notes = JSON.parse(localStorage.getItem('quickNotes'));
  let url = new URL(location.href);
  const id = url.searchParams.get('id');

  let note;

  for (let i=0;i<notes.length;i++) {
    if (notes[i].id === id) {
      note = notes[i]; break;
    }
  }

  const parentStats = document.querySelector('.stats-parent');
  if (parentStats.style.display === 'none') {parentStats.style.display = ''}

  const statsData = document.querySelectorAll('span.value');
  var charW = note.content;
  try { var lineSep = charW.match(/\n/gu).length } catch (err) { var lineSep = 1; };
  try { var lines = charW.match(/\n\n/gu).length } catch (err) { var lines = 1; };

  document.querySelector('.stats h2').textContent = 'Stats for note « ' + note.title + ' »'
  statsData[ 0].textContent = note.title;
  statsData[ 1].textContent = note.id;
  statsData[ 2].textContent = `${msToDate(note.created)} (${timeSince(note.created)})`;
  statsData[ 3].textContent = `${msToDate(note.modified)} (${timeSince(note.modified)})`;
  statsData[ 4].textContent = `${charW.length}`;
  statsData[ 5].textContent = `${charW.replaceAll(/ /gu, '').length}`;
  statsData[ 6].textContent = `${countWords(charW)}`;
  statsData[ 7].textContent = `${(charW.match(/[^\.!\?]+[\.!\?]+/g) || [0]).length}`;

  statsData[ 8].innerHTML   = `${lineSep}`;
  statsData[ 9].textContent = `${lines}`;
  statsData[10].textContent = `${toTime(charW.replaceAll(/ /gu, '').length / 15)} (${Math.floor(charW.replaceAll(/ /gu, '').length / .15)/100}s)`;
}
function msToDate(ms) {
  var date = new Date(ms);
  return `
  ${date.getDate().toString().padStart(2, '0')}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getFullYear()}
  ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}
function toTime(n) {
  n = Math.floor(n);
  return `${String(Math.floor(n/3600)).padStart(2, '0')}:${String(Math.floor(n/60)%60).padStart(2, '0')}:${String(n%60).padStart(2, '0')}`
}

document.querySelector('#stats-ok').addEventListener('click', () => {
  const parentStats = document.querySelector('.stats-parent');
  parentStats.style.display = 'none'
});

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Stats copied to clipboard!');
  }).catch(err => alert('🚫 Failed to copy. Reason:\n',err))
};

function closeWindow() {
  window.close();
  setTimeout(() => {
    if (!window.closed) {
      var local = new URL(window.location.href);
      local.searchParams.delete('id');
      location.href = (local);
    }
  }, 100);

};

function searchTitle(title) {
  function searchTitle(title) {
    const notes = JSON.parse(localStorage.getItem("quickNotes")) || [];
    const term = title.trim().toLowerCase();

    if (!term) {
      // If empty search, show all cards again
      document.querySelectorAll(".card").forEach((card) => {
        card.style.display = "";
      });
      return [];
    }

    const matches = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(term) ||
        note.content.toLowerCase().includes(term)
    );

    // Hide all cards first
    document.querySelectorAll(".card").forEach((card) => {
      card.style.display = "none";
      card.classList.remove("highlight");
    });

    // Show + highlight only matches
    matches.forEach((note) => {
      const card = document.querySelector(`.card[onclick*="${note.id}"]`);
      if (card) {
        card.style.display = ""; // restore default display (block/flex/etc.)
        card.classList.add("highlight");
      }
    });

    if (matches.length === 0) {
      alert("No notes found.");
    }

    return matches;
  }

}

function formatText(text) {
  let format = text;
  format = parseBold  (format);
  format = parseItalic(format);
  format = parseH3    (format);
  format = parseH2    (format);
  format = parseH1    (format);
  format = parseHB    (format);

  return format;
}

function parseBold(text) {
  let i = 0;
  return text.replace(/&#x2a;&#x2a;/g, () => {
    i++; return i % 2 === 1 ? '<b>' : '</b>'
  });
};
function parseItalic(text) {
  let i = 0;
  return text.replace(/&#x2a;/g, () => {
    i++; return i % 2 === 1 ? '<i>' : '</i>'
  })
}
function parseH1(text) {
  return text.replace(/(^|&#xa;)&#x23;&#x20;(.*?)(?=&#xa;|$)/g, '$1<h1 style="preview-text">$2</h1>');
}
function parseH2(text) {
  return text.replace(/(^|&#xa;)&#x23;&#x23;&#x20;(.*?)(?=&#xa;|$)/g, '$1<h2 style="preview-text">$2</h2>');
}
function parseH3(text) {
  return text.replace(/(^|&#xa;)&#x23;&#x23;&#x23;&#x20;(.*?)(?=&#xa;|$)/g, '$1<h3 style="preview-text">$2</h3>');
}
function parseHB(text) {
  return text.replace(/&#xa;&#xa;&#x2d;&#x2d;&#x2d;&#xa;&#xa;/gm, '<hr class="preview-hr">');
}

// Select the container you want to watch
const container = document.querySelector('main');
const noNotes = document.querySelector('.no-notes');

// Create a MutationObserver
const observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList' && mutation.addedNodes.length === 0) {
      noNotes.style.display = 'flex';
    } else
      if (mutation.type === 'childList' && mutation.addedNodes.length !== 0) {
        noNotes.style.display = 'none';
    }
  }
});

// Configure what to observe
observer.observe(container, {
    childList: true,       // Detect adding/removing child nodes
    subtree: true,         // Observe all descendants too
    characterData: true    // Detect changes to text nodes
});

// EDITING NOTES

function editNote() {
  const id = new URLSearchParams(window.location.search).get('id');
  const notes = JSON.parse(localStorage.getItem('quickNotes'));
  const main = document.querySelector('main');

  if (!main.innerHTML.includes('<textarea>')) {
    let note = new Object();
    for (let i=0;i<notes.length;i++) {
      if (notes[i].id === id) {
        note = notes[i]; break;
      }
    }
    main.innerHTML =`<textarea>${toDecimalEntities(note.content)}</textarea>`
    document.title = '(✏️) ' + document.title;
    document.querySelector('button#editNote').innerHTML = '<i class="fi fi-rr-disk"></i>'
  }
  else {
    savingDlg.showModal();
  }
}
saving1.addEventListener('click', (e) => {
  const id = new URLSearchParams(window.location.search).get('id');
  const notes = JSON.parse(localStorage.getItem('quickNotes'));

  e.preventDefault();
  let id1 = 0;
  for (let i=0;i<notes.length;i++) {
    if (notes[i].id === id) {
      id1 = i;
      break;
    }
  }
  notes[id1].content = document.querySelector('main textarea').value;
  localStorage.setItem('quickNotes', JSON.stringify(notes));

  location.reload();
})
saving2.addEventListener('click', (e) => {
  e.preventDefault();

})

window.addEventListener('beforeunload', async (e) => {
  if (document.title.includes('(✏️)')) {
    e.preventDefault();
    e.returnValue = '';
  }
});
console.log(formatText(toDecimalEntities('# Heading 1\n\n---\n\nhi')));
// returns `<h1>&#x48;&#x65;&#x61;&#x64;&#x69;&#x6e;&#x67;&#x20;&#x31;<hr class="preview-hr">&#x68;&#x69;</h1>`