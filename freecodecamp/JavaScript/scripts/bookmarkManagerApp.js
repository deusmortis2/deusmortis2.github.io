const bookmarkButton = document.getElementById("add-bookmark-button");
const closeFormButton = document.getElementById("close-form-button");
const categoryDropDown = document.getElementById("category-dropdown");
const nameInput = document.getElementById("name");
const urlInput = document.getElementById("url");
const mainSection = document.getElementById("main-section");
const formSection = document.getElementById("form-section");
const bookmarkSection = document.getElementById("bookmark-list-section");
const categoryList = document.getElementById("category-list");
const categoryButton = document.getElementById("view-category-button");
const deleteBookmarkButton = document.getElementById("delete-bookmark-button");
const closeBookmarkButton = document.getElementById("close-list-button");
const addBookmarkFormButton = document.getElementById("add-bookmark-button-form");
const categoryName = document.querySelectorAll(".category-name");


function getBookmarks () {
try {
let bookmarks = JSON.parse(localStorage.getItem("bookmarks"));
 if (Array.isArray(bookmarks) && bookmarks.every(bookmark => bookmark.hasOwnProperty('name') && bookmark.hasOwnProperty('category') && bookmark.hasOwnProperty('url'))) {
            return bookmarks;
        } else {
            return [];
        } 
} catch { return [];} 
};


addBookmarkFormButton.addEventListener("click", () => {
  const name = document.getElementById('name').value;
  const category = categoryDropDown.value;
  const url = document.getElementById('url').value;
  let bookmarks = getBookmarks();
  bookmarks.push({name, category, url});
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  document.getElementById('name').value = '';
  document.getElementById('url').value = '';
  displayOrCloseForm();
});


function displayOrHideCategory() {
bookmarkSection.classList.toggle("hidden");
mainSection.classList.toggle("hidden");
}


bookmarkButton.addEventListener("click", () => {
  displayOrCloseForm();
  categoryName.forEach((c) => {
    const rest = categoryDropDown.value.slice(1);
    const firstLetter = categoryDropDown.value.slice(0, 1).       toUpperCase();
    const newC = firstLetter + rest;
    c.textContent = newC;
  });  
});


closeFormButton.addEventListener("click", displayOrCloseForm);


categoryButton.addEventListener("click", () => {
  displayOrHideCategory();
  categoryName.forEach((c) => {
const rest = categoryDropDown.value.slice(1);
const firstLetter = categoryDropDown.value.slice(0, 1).toUpperCase();
const newC = firstLetter + rest;
    c.textContent = newC;
  });
displayBookmarks(getBookmarks());
});



deleteBookmarkButton.addEventListener("click",()=>{
  const checkedRadioButtonId = document.querySelector('#category-list input:checked');
  if (!checkedRadioButtonId) {
        alert("Please select a bookmark to delete.");
        return;
 }
  if (checkedRadioButtonId) {
  let bookmarks = JSON.parse(localStorage.getItem("bookmarks"));
  const newArr = bookmarks.filter(bookmark => !(bookmark.category === categoryDropDown.value && bookmark.name === checkedRadioButtonId.value));
  localStorage.setItem('bookmarks', JSON.stringify(newArr));
  displayBookmarks(getBookmarks());
  }});



function displayBookmarks (bookmarks) {
   const filteredBookmarks = bookmarks.filter((bookmark) => bookmark.category === categoryDropDown.value);
  categoryList.innerHTML = "";
  if (filteredBookmarks.some(bookmark => bookmark.category === categoryDropDown.value)) {
    filteredBookmarks.forEach((bookmark) => {
  categoryList.innerHTML += `<label for="${bookmark.name.trim()}"><input type="radio" id="${bookmark.name.trim()}" value="${bookmark.name.trim()}" name="radio"><a href="${bookmark.url.trim()}">${bookmark.name.trim()}</a></label>`;});
  
  } else {   
  categoryList.innerHTML = '<p>No Bookmarks Found</p>';
  }
}


closeBookmarkButton.addEventListener("click", displayOrHideCategory);










function displayOrCloseForm () {
nameInput.value = "";
urlInput.value = "";
formSection.classList.toggle("hidden");
mainSection.classList.toggle("hidden");
}

localStorage.clear();
