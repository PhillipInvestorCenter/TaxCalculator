// utils.js

// Utility: Number formatting and parsing
function formatNumber(num) {
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
  }
  
  function parseNumber(str) {
    if (typeof str === 'string') {
      return parseFloat(str.replace(/,/g, '')) || 0;
    }
    return 0;
  }
  
  /**
   * Adds comma formatting on the fly for an input field.
   */
  function addCommaEvent(id) {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', function () {
        let cursorPos = this.selectionStart;
        let raw = this.value.replace(/,/g, '');
        if (raw === '') {
          this.value = '';
          return;
        }
        if (!isNaN(raw)) {
          let parts = raw.split('.');
          let integerPart = parts[0];
          let decimalPart = parts[1];
          let formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          let formattedValue = formattedInteger;
          if (decimalPart !== undefined) {
            formattedValue += '.' + decimalPart;
          }
          this.value = formattedValue;
          let diff = this.value.length - raw.length;
          this.selectionEnd = cursorPos + diff;
        } else {
          this.value = this.value.substring(0, cursorPos - 1) + this.value.substring(cursorPos);
          this.selectionEnd = cursorPos - 1;
        }
        if (typeof updateDeductionLimits === 'function') {
          updateDeductionLimits();
        }
      });
    }
  }
  
  // Handle pension insurance input combining with life insurance
  function handlePensionInsuranceInput() {
    let pensionInput = document.getElementById('pension_insurance');
    let lifeInsuranceInput = document.getElementById('life_insurance');
  
    let pensionVal = parseNumber(pensionInput.value) || 0;
    let lifeVal = parseNumber(lifeInsuranceInput.value) || 0;
  
    const maxLife = 100000;
    const maxPension = 200000;
    const combinedLimit = 300000;
  
    let lifeAvail = maxLife - lifeVal;
    lifeAvail = Math.max(0, lifeAvail);
  
    let transferAmount = Math.min(pensionVal, lifeAvail);
    if (transferAmount > 0) {
      lifeVal += transferAmount;
      lifeInsuranceInput.value = formatNumber(lifeVal);
    }
    pensionVal -= transferAmount;
  
    if (pensionVal > maxPension) {
      pensionVal = maxPension;
      pensionInput.value = formatNumber(pensionVal);
      let totalIns = pensionVal + lifeVal;
      if (totalIns > combinedLimit) {
        let excess = totalIns - combinedLimit;
        pensionVal -= excess;
        pensionInput.value = formatNumber(pensionVal);
      }
    } else {
      pensionInput.value = formatNumber(pensionVal);
    }
    if (typeof updateDeductionLimits === 'function') {
      updateDeductionLimits();
    }
  }
  
  // Print and Save as Image functions
  function printResult() {
    const printableArea = document.getElementById('printable-area');
    const inlineStyles = `
      body {
        font-family: 'Kanit', sans-serif;
        color: #333;
        font-size: 18px;
        padding: 20px;
      }
      #printable-area {
        padding-left: 20px; 
        padding-right: 20px; 
      }
      h2 {
        color: #28a745;
        font-size: 2rem;
        margin-top: 0;
      }
      p {
        font-size: 1.3rem;
        margin: 10px 0;
      }
      .effective-tax-rate {
        font-weight: bold;
      }
      .tax-due-real {
        color: red;
        font-weight: bold;
        font-size: 1.5em;
      }
      .tax-credit-refund {
        color: green;
        font-weight: bold;
        font-size: 1.5em;
      }
      #recommended-investments {
        margin-top: 30px;
        padding: 20px;
        background-color: #f0f8ff;
        border-radius: 8px;
      }
      #recommended-investments h3 {
        color: #007bff;
        font-size: 1.5rem;
        margin-bottom: 15px;
      }
      #recommended-investments p {
        font-size: 1.2rem;
        color: #333333;
      }
    `;
  
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>พิมพ์ผลลัพธ์</title>');
    printWindow.document.write('<style>' + inlineStyles + '</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printableArea.innerHTML);
    printWindow.document.close();
    printWindow.focus();
  
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
  }
  
  function saveAsImage() {
    const printableArea = document.getElementById('printable-area');
    html2canvas(printableArea).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = userAgent.includes('iphone') || userAgent.includes('ipad') 
                    || userAgent.includes('ipod') || userAgent.includes('android');
      if (isMobile) {
        const newWindow = window.open('', '_blank');
        if (!newWindow) {
          alert('โปรดอนุญาตให้เปิดหน้าต่างใหม่เพื่อดูรูปภาพ');
          return;
        }
        newWindow.document.write('<html><head><title>ผลลัพธ์การคำนวณภาษี</title></head><body style="margin:0; padding:0; text-align:center;">');
        newWindow.document.write('<img src="' + imgData + '" style="max-width:100%; height:auto; display:block; margin:0 auto;" />');
        newWindow.document.close();
      } else {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'tax_calculation_result.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }).catch(error => {
      console.error('Error saving image:', error);
      alert('ไม่สามารถบันทึกรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    });
  }
  
  // Error Modal functions
  function showErrorModal(messages, fields) {
    const errorModal = document.getElementById('errorModal');
    const errorList = document.getElementById('errorList');
    errorList.innerHTML = '';
    messages.forEach((msg) => {
      const li = document.createElement('li');
      li.innerText = msg;
      errorList.appendChild(li);
    });
    errorModal.style.display = 'block';
    errorModal.errorFields = fields;
  }
  
  function closeErrorModal() {
    const errorModal = document.getElementById('errorModal');
    errorModal.style.display = 'none';
    if (errorModal.errorFields && errorModal.errorFields.length > 0) {
      const firstErrorField = document.getElementById(errorModal.errorFields[0]);
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
    }
  }
  
  // Edit and Reset functions
  function editData() {
    if (typeof navigateToStep === 'function') {
      navigateToStep(3);
    }
  }
  
  function resetData() {
    // Reset global variables
    total_income = 0;
    monthly_income = 0;
    expense = 0;
    isTaxCalculated = false;
    total_withholding_tax = 0;
    socialSecurityManual = false;
  
    // Reset all text inputs to "0"
    document.querySelectorAll('input[type="text"]').forEach((input) => {
      input.value = "0";
    });
  
    // Reset all checkboxes to unchecked
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = false;
    });
  
    // Reset all radio buttons to unchecked
    document.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.checked = false;
    });
  
    // Reset all select elements to the first option
    document.querySelectorAll('select').forEach((select) => {
      select.selectedIndex = 0;
    });
  
    // Hide sections that are not visible by default
    const sectionsToHide = [
      'annual_income_section', 'withholding_tax_annual_checkbox_section', 'withholding_tax_annual_section',
      'monthly_income_section', 'withholding_tax_monthly_checkbox_section', 'withholding_tax_monthly_section',
      'other_income_section', 'insurance_section', 'donation_section', 'stimulus_section', 'social_security_section'
    ];
    sectionsToHide.forEach(id => {
      const elem = document.getElementById(id);
      if (elem) elem.style.display = 'none';
    });
  
    // Reset displayed values
    document.getElementById('expense_display').innerText = '0';
    document.getElementById('result_withholding_tax').innerText = '0';
    const taxSummary = document.getElementById('tax_summary');
    if (taxSummary) taxSummary.style.display = 'none';
  
    // Clear any error messages
    document.querySelectorAll('.error').forEach((el) => {
      el.innerText = '';
    });
  
    // Reset the stepper and show the first step
    if (typeof setActiveStep === 'function') {
      setActiveStep(1);
    }
    if (typeof showStep === 'function') {
      showStep(1);
    }
  
    // Reset visibility: show landing page, hide main container
    const landingPage = document.getElementById('landing-page');
    const mainContainer = document.getElementById('main-container');
    if (landingPage && mainContainer) {
      landingPage.style.display = 'flex';
      mainContainer.style.display = 'none';
    }
  
    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  
    // Update deduction limits after resetting
    if (typeof updateDeductionLimits === 'function') {
      updateDeductionLimits();
    }
  }
  
  