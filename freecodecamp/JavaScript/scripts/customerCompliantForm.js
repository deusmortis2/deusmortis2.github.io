'use strict';

const fullName = document.getElementById("full-name");
fullName.addEventListener("change", function () { if (fullName.value.trim() !== "") { fullName.style.borderColor = "green";  console.log(fullName.value);} else { fullName.style.borderColor = "red"; console.log(fullName.value);}});
const email = document.getElementById("email");
email.addEventListener("change", function () {if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
email.style.borderColor = "green"; } else { email.style.borderColor = "red";}});
const orderNo = document.getElementById("order-no");
orderNo.addEventListener("change", function () {if (/^(2024)\d{6}/.test(orderNo.value)) {orderNo.style.borderColor = "green";}else{orderNo.style.borderColor = "red";}});
const productCode = document.getElementById("product-code");
productCode.addEventListener("input", function (e) {
let input = e.target;
let value = input.value.replace(/-/g, ''); 
  let formattedValue = '';

  for (let i = 0; i < value.length; i++) {
    if (i > 0 && i % 4 === 0) {
      formattedValue += '-';
    }
    formattedValue += value[i];
  }
  
  input.value = formattedValue;
});
const otherCheck = document.getElementById("other-complaint");
const complaintDesc = document.getElementById("complaint-description-container");
let checked = 0;

productCode.addEventListener("change", function () {if (/^[A-Za-z]{2}\d{2}-[A-Za-z]\d{3}-[A-Za-z]{2}\d/.test(productCode.value)) {productCode.style.borderColor = "green";}else{productCode.style.borderColor = "red";}});
const quantity = document.getElementById("quantity");
quantity.addEventListener("change", function () {if (quantity.value != "" && quantity.value % 1 === 0 && quantity.value > 0) {quantity.style.borderColor = "green";} else { quantity.style.borderColor = "red";}});

const complaintFieldSet = document.getElementById("complaints-group");
complaintFieldSet.addEventListener("change", function (e) {
if (e.target.checked) {
checked++;
} else {
checked--;
} 
if (checked === 0) {
complaintFieldSet.style.borderColor = "red";
} else {
complaintFieldSet.style.borderColor = "green";
}
if (otherCheck.checked) {
complaintDesc.style.display = "block";
}
if (complaintDesc.style.display === "block" && !otherCheck.checked) {
complaintDesc.style.display = "none";
}
});

const solutionGrpFieldSet = document.getElementById("solutions-group");
const solutionDescription = document.getElementById("solution-description-container");
const otherRadio = document.getElementById("other-solution");
solutionGrpFieldSet.addEventListener("change", function(e) {
if (e.target.checked) {
solutionGrpFieldSet.style.borderColor = "green";
} else {
solutionGrpFieldSet.style.borderColor = "red";
}
if (otherRadio.checked) {
solutionDescription.style.display = "block";
} else {
solutionDescription.style.display = "none";
}
});

const complaintDescText = document.getElementById("complaint-description");
const solutionDescText = document.getElementById("solution-description");
complaintDescText.addEventListener("change", function(e) {
const complaintText = e.target.value.replace(/\s+/g, "");
if (complaintText.length >= 20) {
complaintDescText.style.borderColor = "green";
} else {
complaintDescText.style.borderColor = "red";
}
});

solutionDescText.addEventListener("change", function(e) {
const solutionText = e.target.value.replace(/\s+/g, "");
if (solutionText.length >= 20) {
solutionDescText.style.borderColor = "green";
} else {
solutionDescText.style.borderColor = "red";
}
});


function validateForm () {
const formObj = {};
    if (fullName.value !== '') {
     formObj["full-name"] = true;
    } else {
    formObj["full-name"] = false;
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
     formObj["email"] = true;
    } else {
    formObj["email"] = false;
    } 
    if (/^(2024)\d{6}/.test(orderNo.value)) {
    formObj["order-no"] = true;
    }
    else {
    formObj["order-no"] = false;
    }
    if (/^[A-Za-z]{2}\d{2}-[A-Za-z]\d{3}-[A-Za-z]{2}\d/.test(productCode.value)) {
    formObj["product-code"] = true;
    }
    else {
    formObj["product-code"] = false;    
    }
    if (quantity.value != "" && quantity.value % 1 === 0 && quantity.value > 0) {
    formObj.quantity = true;     
    }
    else {
    formObj.quantity = false;
    }  
    const damagedProduct = document.getElementById("damaged-product");
    const nonConformedProduct = document.getElementById("nonconforming-product");
    const delayedDispatch = document.getElementById("delayed-dispatch");
    if (otherCheck.checked || damagedProduct.checked || nonConformedProduct.checked || delayedDispatch.checked ) {
    formObj["complaints-group"] = true;
    } else {
    formObj["complaints-group"] = false;
    }
    if (otherCheck.checked && complaintDescText.value.length >= 20) {
    formObj["complaint-description"] = true;
    }
else {
    formObj["complaint-description"] = false;
    }
    if (!otherCheck.checked && (damagedProduct.checked || nonConformedProduct.checked || delayedDispatch.checked)) {
    formObj["complaint-description"] = true;
    }
    
    const refund = document.getElementById("refund");
    const exchange = document.getElementById("exchange");
    if (otherRadio.checked || refund.checked || exchange.checked) {
    formObj["solutions-group"] = true;   
    } else {
    formObj["solutions-group"] = false;
    }
    if (solutionDescText.value.length >= 20 && otherRadio.checked) {
    formObj["solution-description"] = true;
    } else {
    formObj["solution-description"] = false;
    }
    if (!otherRadio.checked && (refund.checked || exchange.checked)) {
    formObj["solution-description"] = true;
    }

return formObj;
}

function isValid (formObject) {

const values = Object.values(formObject);
console.log("current value " + values);
for (const value of values) {
if (value === false) {
return false;
}
}
return true;
}
const submitBtn = document.getElementById("submit-btn");
const form = document.getElementById("form");
form.addEventListener("submit", (e) => { e.preventDefault(); });
form.addEventListener("submit", (e) => {
if (isValid(validateForm()) === true) {
form.submit;
}
else {
alert("error");
}
});
submitBtn.addEventListener("click", () => {
if (isValid(validateForm()) === true) {
form.submit;
}
console.log(isValid(validateForm()));
});
// submitBtn.addEventListener("submit", () => {isValid(validateForm)});