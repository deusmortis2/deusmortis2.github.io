const books = [
    {title: "The Wheel of Time: The Eye of The World", authorName: "Robert Jordan", releaseYear: 1990},
    {title: "A Game of Thrones", authorName: "George R. R. Martin", releaseYear: 1996},
    {title: "The Hobbit", authorName: "J.R.R. Tolkien", releaseYear: 1937},
    {title: "The Chronicles of Narnia: The Lion, The Witch, and the Wardrobe", authorName: "C.S. Lewis", releaseYear: 1950},
    {title: "Harry Potter and the Sorcerer's Stone", authorName: "J.K. Rowling", releaseYear: 1997}
];

function sortByYear (book1, book2) {
    if (book1.releaseYear > book2.releaseYear) {
        return 1;
    } else if (book1.releaseYear < book2.releaseYear) {
        return -1;
    } else {
        return 0;
    }
};

const filteredBooks = books.filter(books => books.releaseYear >= 1990);

console.log(filteredBooks);
filteredBooks.sort(sortByYear);
console.log(filteredBooks);