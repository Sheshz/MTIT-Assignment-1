/* ================= DATA ================= */

let books = JSON.parse(localStorage.getItem("books")) || [];
let editingId = null;

const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");

/* Inputs */
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const totalPagesInput = document.getElementById("totalPages");
const pagesReadInput = document.getElementById("pagesReadInput");
const ratingInput = document.getElementById("rating");
const errorEl = document.getElementById("error");

/* Dashboard */
const totalBooksEl = document.getElementById("totalBooks");
const completedBooksEl = document.getElementById("completedBooks");
const pagesReadEl = document.getElementById("pagesRead");

/* Toggle form */
document.getElementById("addBtn").onclick = () => {
  formSection.classList.toggle("hidden");
  clearForm();
};

/* Keyboard shortcuts */
document.addEventListener("keydown", e => {
  if(e.key === "Escape") formSection.classList.add("hidden");
  if(e.key === "Enter" && !formSection.classList.contains("hidden"))
    saveBook();
});

/* ================= SAVE BOOK ================= */

document.getElementById("saveBook").onclick = saveBook;

function saveBook(){

  const title = sanitize(titleInput.value);
  const author = sanitize(authorInput.value);
  const totalPages = Number(totalPagesInput.value);
  let pagesRead = Number(pagesReadInput.value);
  const rating = Number(ratingInput.value);

  /* Validation */
  if(!title || !author){
    showError("Title and Author required");
    return;
  }

  if(totalPages <= 0){
    showError("Total pages must be positive");
    return;
  }

  if(pagesRead < 0) pagesRead = 0;
  if(pagesRead > totalPages) pagesRead = totalPages;

  /* Prevent duplicates */
  const duplicate = books.find(b =>
    b.title.toLowerCase() === title.toLowerCase() &&
    b.author.toLowerCase() === author.toLowerCase() &&
    b.id !== editingId
  );

  if(duplicate){
    showError("Book already exists");
    return;
  }

  if(editingId){
    const book = books.find(b => b.id === editingId);
    Object.assign(book,{title,author,totalPages,pagesRead,rating});
    editingId = null;
  } else {
    books.push({
      id: Date.now(),
      title,
      author,
      totalPages,
      pagesRead,
      rating
    });
  }

  save();
  render();
  formSection.classList.add("hidden");
  clearForm();
}

/* ================= HELPERS ================= */

function sanitize(text){
  return text.replace(/[<>]/g,"");
}

function showError(msg){
  errorEl.textContent = msg;
}

function clearForm(){
  titleInput.value="";
  authorInput.value="";
  totalPagesInput.value="";
  pagesReadInput.value="";
  ratingInput.value="";
  errorEl.textContent="";
}

function save(){
  localStorage.setItem("books", JSON.stringify(books));
}

/* ================= RENDER ================= */

function render(){

  grid.innerHTML="";

  if(books.length === 0){
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  books.forEach(book => {

    const percent = Math.floor((book.pagesRead / book.totalPages) * 100);
    const completed = percent === 100;

    const card = document.createElement("div");
    card.className="book";

    card.innerHTML = `
      <h3>${book.title}</h3>
      <p>${book.author}</p>

      <div class="progress">
        <div class="progress-bar" style="width:${percent}%"></div>
      </div>

      <p>${percent}% read</p>
      ${completed ? "<p class='complete'>✅ Completed</p>" : ""}

      <div class="actions">
        <button class="update">Update</button>
        <button class="delete">Delete</button>
      </div>
    `;

    /* Delete */
    card.querySelector(".delete").onclick = () => {
      books = books.filter(b => b.id !== book.id);
      save();
      render();
    };

    /* Update */
    card.querySelector(".update").onclick = () => {
      editingId = book.id;
      titleInput.value = book.title;
      authorInput.value = book.author;
      totalPagesInput.value = book.totalPages;
      pagesReadInput.value = book.pagesRead;
      ratingInput.value = book.rating;
      formSection.classList.remove("hidden");
    };

    grid.appendChild(card);
  });

  updateDashboard();
  generateInsights();
}

/* ================= DASHBOARD ================= */

function updateDashboard(){

  totalBooksEl.textContent = books.length;

  const completed = books.filter(b => b.pagesRead === b.totalPages);
  completedBooksEl.textContent = completed.length;

  const pages = books.reduce((s,b)=>s+b.pagesRead,0);
  pagesReadEl.textContent = pages;
}

/* ================= SEARCH (DEBOUNCED) ================= */

let timeout;
document.getElementById("search").oninput = e => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {

    const q = e.target.value.toLowerCase();

    document.querySelectorAll(".book").forEach(card => {
      card.style.display =
        card.innerText.toLowerCase().includes(q) ? "block" : "none";
    });

  }, 300);
};

/* ================= AI INSIGHTS ================= */

const aiPanel = document.getElementById("aiPanel");
const aiToggle = document.getElementById("aiToggle");
const aiContent = document.getElementById("aiContent");
const refreshAI = document.getElementById("refreshAI");

aiToggle.onclick = () => {
  aiPanel.classList.toggle("hidden");
  generateInsights();
};

refreshAI.onclick = generateInsights;

function generateInsights(){

  if(books.length === 0){
    aiContent.innerHTML = "Add books to get insights";
    return;
  }

  const completed = books.filter(b => b.pagesRead === b.totalPages);

  const personality =
    completed.length > 5 ? "🏆 Finisher Reader" : "📖 Focused Reader";

  const goal = 10;
  const remaining = goal - completed.length;

  aiContent.innerHTML = `
    <p><b>${personality}</b></p>
    <p>Completed Books: ${completed.length}</p>
    <p>${remaining > 0
      ? remaining + " books to reach goal!"
      : "🎉 Goal achieved!"}</p>
  `;
}

/* INITIAL */
render();