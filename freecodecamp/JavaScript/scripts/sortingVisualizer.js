const sortBtn = document.getElementById("sort-btn");

const arrayCtn = document.getElementById("array-container");

const generateBtn = document.getElementById("generate-btn");

const startingArr = document.getElementById("starting-array");


const generateElement =   () => { return Math.floor(Math.random() * 100 + 1); }
const generateArray = () => {
  return [generateElement(),generateElement(),generateElement(),generateElement(),generateElement()]
 
}

function generateContainer () {
return document.createElement("div")  
}

function fillArrContainer (htmlElement, intArr) {
  for (let i = 0; i < intArr.length; i++) {
  const span = document.createElement('span');
  span.textContent = intArr[i];
  htmlElement.appendChild(span);
  }
return htmlElement;
}

const isOrdered = (int1, int2) => {
  if (int1 <= int2) {
    return true;
    } else {
    return false;
    }
}
const swapElements = (intArr, index) => {
 if (isOrdered(intArr[index+1], intArr[index])) {
   return [intArr[index], intArr[index+1]] = [intArr[index+1], intArr[index]];
 }
}

function highlightCurrentEls(container, index) {
  const spans = container.children;
  if (spans[index]) spans[index].style.border = "2px dashed red";
  if (spans[index + 1]) spans[index + 1].style.border = "2px dashed red";
}
let array = [];
generateBtn.addEventListener("click", () => {
      if (sortBtn.style.display === "none") {
        sortBtn.style.display = "inline-block"; 
    }
  arrayCtn.innerHTML = "";
  startingArr.innerHTML = "";
  arrayCtn.replaceChildren(startingArr);
  const currArr = generateArray();
 fillArrContainer(startingArr, currArr);
array = currArr;
})


sortBtn.addEventListener("click", () => {
  if (!array || array.length === 0) return;

        sortBtn.style.display = "none";


  let count = 0;
  highlightCurrentEls(startingArr, count);
  
const isSorted = (arr) => {
  for(let i = 0; i < arr.length; i++){
    if(arr[i] > arr[i + 1]){
      return false;
    };
    };
  return true;
};

  
for(let i = 0; i < array.length; i++){
 for(let j = 0; j < array.length - 1; j++){
   count++;

     console.log(i, j);
    if(count === 1){
     swapElements(array, j);
     }else {  
      let container = generateContainer();
      arrayCtn.append(container);
      fillArrContainer(container, array);
      highlightCurrentEls(container, j);
      swapElements(array, j);
      console.log("Sorted:", isSorted(array));
    };
 };
     const sorted = isSorted(array);
    
  if(sorted){ 
      i = array.length;
  for(let l = 0; l < array.length - 1; l++){
    let container = generateContainer();
      arrayCtn.append(container); 
      fillArrContainer(container, array);
      highlightCurrentEls(container, l);
    
  };
         
      };
  }; 
 
  let finalContainer = generateContainer();
  arrayCtn.appendChild(finalContainer);
  fillArrContainer(finalContainer, array);
  finalContainer.style.border = "3px, green, solid";
  
});

