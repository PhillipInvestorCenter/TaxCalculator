// investment.js

// Investment Display functions
function goToInvestmentSection() {
  navigateToStep(3);
  if (!document.getElementById('has_insurance').checked) {
    document.getElementById('has_insurance').checked = true;
    document.getElementById('insurance_section').style.display = 'block';
  }
  const ssfField = document.getElementById('ssf');
  if (ssfField) {
    ssfField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ssfField.focus();
  }
}

/**
 * Updates the element with `elementId` to show the amount
 * the user can still invest in a given product.
 * If `amount <= 0`, displays "ไม่สามารถซื้อเพิ่มได้" in red;
 * otherwise, displays the amount in green.
 */
function updateInvestmentDisplay(elementId, amount) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  if (amount <= 0) {
    element.innerText = 'ไม่สามารถซื้อเพิ่มได้';
    element.style.color = 'red';
  } else {
    element.innerText = formatNumber(amount); // Removed " บาท"
    element.style.color = 'green';
  }
}

