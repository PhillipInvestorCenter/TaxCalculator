/* main.js */

// Global variables
let total_income = 0;
let monthly_income = 0;
let expense = 0;
let total_withholding_tax = 0;
let isTaxCalculated = false;
let selectedTaxYear = 2567; // default tax year, overwritten by selection
let socialSecurityManual = false;

// Store final revenue amounts for each type so we can recalc in Step 2
let rev1_amt = 0; // Type 1
let rev2_amt = 0; // Type 2
let rev3_amt = 0; // Type 3
let rev4_amt = 0; // Type 4
let rev5_amt = 0; // Type 5 (sum of sub-checks)
let rev6_amt = 0; // Type 6 (sum of sub-checks)
let rev7_amt = 0; // Type 7

const retirementFields = ['pension_insurance', 'pvd', 'gpf', 'rmf', 'ssf', 'nsf'];
const otherDeductionFields = [
  'life_insurance',
  'health_insurance',
  'parent_health_insurance',
  'thaiesg',
  'social_enterprise',
  'donation_political',
  'easy_ereceipt',
  'local_travel',
  'home_loan_interest',
  'new_home'
];

window.onload = function () {
  const numberFields = [
    'rev1_amount', 'rev1_withholding_input',
    'rev2_amount', 'rev2_withholding_input',
    'rev3_amount', 'rev3_withholding_input',
    'rev4_amount', 'rev4_withholding_input',
    'rev7_amount', 'rev7_withholding_input',
    'rev5_sub1_amount', 'rev5_sub2_amount', 'rev5_sub3_amount', 'rev5_sub4_amount', 'rev5_sub5_amount',
    'rev5_withholding_input',
    'rev6_sub1_amount', 'rev6_sub2_amount', 'rev6_withholding_input',
    'bonus_income', 'other_income',
    'life_insurance', 'health_insurance', 'parent_health_insurance',
    'pension_insurance', 'ssf', 'rmf', 'pvd', 'gpf', 'thaiesg',
    'social_enterprise', 'nsf', 'home_loan_interest', 'donation',
    'donation_education', 'donation_political', 'easy_ereceipt',
    'local_travel', 'new_home', 'social_security',
    'thaiesg_extra_transfer', 'thaiesg_extra_new'
  ];
  numberFields.forEach((id) => {
    addCommaEvent(id);
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('focus', function () {
        if (this.value === '0') this.value = '';
      });
      input.addEventListener('blur', function () {
        if (this.value === '') this.value = '0';
        if (typeof updateDeductionLimits === 'function') {
          updateDeductionLimits();
        }
      });
    }
  });

  // Real-time clamping for social_security (max 9,000)
  const socialSecurityInput = document.getElementById('social_security');
  if (socialSecurityInput) {
    socialSecurityInput.addEventListener('input', function () {
      socialSecurityManual = true;
      let val = parseNumber(this.value);
      if (val > 9000) {
        this.value = formatNumber(9000);
      }
    });
  }

  // Setup revenue type listeners (show/hide input sections in Step 1)
  setupRevenueTypeListeners();

  // Listener for Insurance/Investment section
  document.getElementById('has_insurance').addEventListener('change', function () {
    const sec = document.getElementById('insurance_section');
    if (sec) sec.style.display = this.checked ? 'block' : 'none';
    updateDeductionLimits();
  });

  // Listeners for social security, donation, stimulus sections
  document.getElementById('has_social_security').addEventListener('change', function () {
    const sec = document.getElementById('social_security_section');
    if (sec) sec.style.display = this.checked ? 'block' : 'none';
    if (this.checked) {
      calculateSocialSecurity();
    } else {
      document.getElementById('social_security').value = '0';
      socialSecurityManual = false;
    }
    updateDeductionLimits();
  });
  document.getElementById('has_donation').addEventListener('change', function () {
    const sec = document.getElementById('donation_section');
    if (sec) sec.style.display = this.checked ? 'block' : 'none';
    updateDeductionLimits();
  });
  document.getElementById('has_stimulus').addEventListener('change', function () {
    const sec = document.getElementById('stimulus_section');
    if (sec) sec.style.display = this.checked ? 'block' : 'none';
    updateDeductionLimits();
  });

  // Add real-time clamping event listeners for retirement deduction fields
  retirementFields.forEach(fieldId => {
    const elem = document.getElementById(fieldId);
    if (elem) {
      elem.addEventListener('input', () => handleRetirementFieldChange(fieldId));
    }
  });
  
  // Add real-time clamping event listeners for other deduction fields
  otherDeductionFields.forEach(fieldId => {
    const elem = document.getElementById(fieldId);
    if (elem) {
      elem.addEventListener('input', () => handleOtherDeductionFieldChange(fieldId));
    }
  });
  
  // Also add event listeners for new Thai ESG Extra fields
  ['thaiesg_extra_transfer', 'thaiesg_extra_new'].forEach(fieldId => {
    const elem = document.getElementById(fieldId);
    if (elem) {
      addCommaEvent(fieldId);
      elem.addEventListener('input', () => handleOtherDeductionFieldChange(fieldId));
    }
  });

  // Stepper click event listeners
  const stepperSteps = document.querySelectorAll('.stepper .stepper-step');
  stepperSteps.forEach((step) => {
    step.addEventListener('click', function () {
      const targetStep = parseInt(this.getAttribute('data-step'));
      const currentStepElement = document.querySelector('.stepper .stepper-step.active');
      const currentStep = parseInt(currentStepElement.getAttribute('data-step'));
      if (currentStep === 1 && targetStep !== 1) {
        if (validateStep(1)) navigateToStep(targetStep);
      } else if (!isTaxCalculated && targetStep === 4) {
        alert('กรุณาคลิกปุ่ม "คำนวณภาษี" เพื่อดูผลการคำนวณ');
      } else {
        navigateToStep(targetStep);
      }
    });
  });

  populateChildrenOptions();

  /* ---------------------- Floating Scroll Arrow Behavior ---------------------- */
  // Always display the scroll arrow; update its icon based on scroll position.
  window.addEventListener("scroll", function() {
    const scrollArrow = document.getElementById("scrollArrow");
    scrollArrow.style.display = "block";
    const scrollTop = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const threshold = 50; // threshold in pixels
    if (scrollTop < threshold) {
      scrollArrow.innerHTML = "&#x2193;"; // down arrow
    } else if (scrollTop + windowHeight > docHeight - threshold) {
      scrollArrow.innerHTML = "&#x2191;"; // up arrow
    } else {
      scrollArrow.innerHTML = "&#x2193;";
    }
  });
};

/**
 * Sets up event listeners for revenue type checkboxes.
 */
function setupRevenueTypeListeners() {
  const revenueTypes = [
    { checkboxId: 'rev_type_1', inputId: 'rev_type_1_input' },
    { checkboxId: 'rev_type_2', inputId: 'rev_type_2_input' },
    { checkboxId: 'rev_type_3', inputId: 'rev_type_3_input' },
    { checkboxId: 'rev_type_4', inputId: 'rev_type_4_input' },
    { checkboxId: 'rev_type_5', inputId: 'rev_type_5_input' },
    { checkboxId: 'rev_type_6', inputId: 'rev_type_6_input' },
    { checkboxId: 'rev_type_7', inputId: 'rev_type_7_input' }
  ];
  revenueTypes.forEach(item => {
    const cb = document.getElementById(item.checkboxId);
    const section = document.getElementById(item.inputId);
    if (cb && section) {
      cb.addEventListener('change', function () {
        section.style.display = this.checked ? 'block' : 'none';
      });
    }
  });

  const withholdingIDs = [
    { checkbox: 'rev1_withholding_checkbox', container: 'rev1_withholding_input_container' },
    { checkbox: 'rev2_withholding_checkbox', container: 'rev2_withholding_input_container' },
    { checkbox: 'rev3_withholding_checkbox', container: 'rev3_withholding_input_container' },
    { checkbox: 'rev4_withholding_checkbox', container: 'rev4_withholding_input_container' },
    { checkbox: 'rev5_withholding_checkbox', container: 'rev5_withholding_input_container' },
    { checkbox: 'rev6_withholding_checkbox', container: 'rev6_withholding_input_container' },
    { checkbox: 'rev7_withholding_checkbox', container: 'rev7_withholding_input_container' }
  ];
  withholdingIDs.forEach(item => {
    const cb = document.getElementById(item.checkbox);
    const cont = document.getElementById(item.container);
    if (cb && cont) {
      cb.addEventListener('change', function () {
        cont.style.display = this.checked ? 'block' : 'none';
      });
    }
  });

  const rev5Subs = [
    { checkboxId: 'rev5_sub_1', inputId: 'rev5_sub_1_input' },
    { checkboxId: 'rev5_sub_2', inputId: 'rev5_sub_2_input' },
    { checkboxId: 'rev5_sub_3', inputId: 'rev5_sub_3_input' },
    { checkboxId: 'rev5_sub_4', inputId: 'rev5_sub_4_input' },
    { checkboxId: 'rev5_sub_5', inputId: 'rev5_sub_5_input' }
  ];
  rev5Subs.forEach(item => {
    const cb = document.getElementById(item.checkboxId);
    const section = document.getElementById(item.inputId);
    if (cb && section) {
      cb.addEventListener('change', function () {
        section.style.display = this.checked ? 'block' : 'none';
      });
    }
  });

  const rev6Subs = [
    { checkboxId: 'rev6_sub_1', inputId: 'rev6_sub_1_input' },
    { checkboxId: 'rev6_sub_2', inputId: 'rev6_sub_2_input' }
  ];
  rev6Subs.forEach(item => {
    const cb = document.getElementById(item.checkboxId);
    const section = document.getElementById(item.inputId);
    if (cb && section) {
      cb.addEventListener('change', function () {
        section.style.display = this.checked ? 'block' : 'none';
      });
    }
  });
}

/** 
 * Called when user clicks one of the tax year buttons on the landing page 
 */
function startCalculator(taxYear) {
  selectedTaxYear = taxYear;
  if (selectedTaxYear === 2568) {
    const ssfContainer = document.getElementById('ssf_container');
    if (ssfContainer) ssfContainer.style.display = 'none';
    const ssfInput = document.getElementById('ssf');
    if (ssfInput) ssfInput.value = '0';

    // Show new Thai ESG Extra fields for tax year 2568
    const thaiesgExtraContainer = document.getElementById('thaiesg_extra_container');
    if (thaiesgExtraContainer) thaiesgExtraContainer.style.display = 'block';
  } else {
    const ssfContainer = document.getElementById('ssf_container');
    if (ssfContainer) ssfContainer.style.display = 'block';

    // Hide new Thai ESG Extra fields for non-2568 years
    const thaiesgExtraContainer = document.getElementById('thaiesg_extra_container');
    if (thaiesgExtraContainer) thaiesgExtraContainer.style.display = 'none';
  }
  if (selectedTaxYear === 2568) {
    const localTravelContainer = document.getElementById('local_travel_container');
    if (localTravelContainer) localTravelContainer.style.display = 'none';
  } else {
    const localTravelContainer = document.getElementById('local_travel_container');
    if (localTravelContainer) localTravelContainer.style.display = 'block';
  }
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('main-container').style.display = 'block';
  setActiveStep(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(currentStep) {
  if (currentStep > 1) {
    const previousStep = currentStep - 1;
    setActiveStep(previousStep);
    showStep(previousStep);
  }
}

function nextStep(currentStep) {
  if (validateStep(currentStep)) {
    if (currentStep === 1) {
      // Get calculation mode multiplier
      let calcMode = document.getElementById('calc_mode').value;
      let multiplier = (calcMode === 'month') ? 12 : 1;
      
      // Compute each revenue type
      rev1_amt = document.getElementById('rev_type_1').checked
                 ? parseNumber(document.getElementById('rev1_amount').value) * multiplier : 0;
      rev2_amt = document.getElementById('rev_type_2').checked
                 ? parseNumber(document.getElementById('rev2_amount').value) * multiplier : 0;
      rev3_amt = document.getElementById('rev_type_3').checked
                 ? parseNumber(document.getElementById('rev3_amount').value) * multiplier : 0;
      rev4_amt = document.getElementById('rev_type_4').checked
                 ? parseNumber(document.getElementById('rev4_amount').value) * multiplier : 0;
      rev7_amt = document.getElementById('rev_type_7').checked
                 ? parseNumber(document.getElementById('rev7_amount').value) * multiplier : 0;
      
      // For type 5
      let sum5 = 0;
      if (document.getElementById('rev_type_5').checked) {
        if(document.getElementById('rev5_sub_1').checked)
          sum5 += parseNumber(document.getElementById('rev5_sub1_amount').value) * multiplier;
        if(document.getElementById('rev5_sub_2').checked)
          sum5 += parseNumber(document.getElementById('rev5_sub2_amount').value) * multiplier;
        if(document.getElementById('rev5_sub_3').checked)
          sum5 += parseNumber(document.getElementById('rev5_sub3_amount').value) * multiplier;
        if(document.getElementById('rev5_sub_4').checked)
          sum5 += parseNumber(document.getElementById('rev5_sub4_amount').value) * multiplier;
        if(document.getElementById('rev5_sub_5').checked)
          sum5 += parseNumber(document.getElementById('rev5_sub5_amount').value) * multiplier;
      }
      rev5_amt = sum5;

      // For type 6
      let sum6 = 0;
      if (document.getElementById('rev_type_6').checked) {
        if(document.getElementById('rev6_sub_1').checked)
          sum6 += parseNumber(document.getElementById('rev6_sub1_amount').value) * multiplier;
        if(document.getElementById('rev6_sub_2').checked)
          sum6 += parseNumber(document.getElementById('rev6_sub2_amount').value) * multiplier;
      }
      rev6_amt = sum6;

      // Total income
      total_income = rev1_amt + rev2_amt + rev3_amt + rev4_amt + rev5_amt + rev6_amt + rev7_amt;
      monthly_income = (calcMode === 'month') ? parseNumber(document.getElementById('rev1_amount').value) : total_income / 12;
      
      // Build Step 2 UI for types 3, 5, 6, 7
      let customExpenseHTML = "";
      if (document.getElementById('rev_type_3').checked) {
        customExpenseHTML += `
          <div class="custom-expense-group" id="custom_expense_3">
            <label>สำหรับ เงินได้ประเภทที่ 3:</label>
            <div class="radio-group">
              <input type="radio" name="expense_choice_3" value="standard" checked> หักเหมา
              <input type="radio" name="expense_choice_3" value="actual"> หักตามจริง
            </div>
            <div id="expense_actual_container_3" style="display:none;">
              <input type="text" id="expense_actual_3" placeholder="ระบุค่าใช้จ่ายจริง" value="0" inputmode="decimal">
            </div>
          </div>`;
      }
      if (document.getElementById('rev_type_5').checked) {
        customExpenseHTML += `
          <div class="custom-expense-group" id="custom_expense_5">
            <label>สำหรับ เงินได้ประเภทที่ 5:</label>
            <div class="radio-group">
              <input type="radio" name="expense_choice_5" value="standard" checked> หักเหมา
              <input type="radio" name="expense_choice_5" value="actual"> หักตามจริง
            </div>
            <div id="expense_actual_container_5" style="display:none;">
              <input type="text" id="expense_actual_5" placeholder="ระบุค่าใช้จ่ายจริง" value="0" inputmode="decimal">
            </div>
          </div>`;
      }
      if (document.getElementById('rev_type_6').checked) {
        customExpenseHTML += `
          <div class="custom-expense-group" id="custom_expense_6">
            <label>สำหรับ เงินได้ประเภทที่ 6:</label>
            <div class="radio-group">
              <input type="radio" name="expense_choice_6" value="standard" checked> หักเหมา
              <input type="radio" name="expense_choice_6" value="actual"> หักตามจริง
            </div>
            <div id="expense_actual_container_6" style="display:none;">
              <input type="text" id="expense_actual_6" placeholder="ระบุค่าใช้จ่ายจริง" value="0" inputmode="decimal">
            </div>
          </div>`;
      }
      if (document.getElementById('rev_type_7').checked) {
        customExpenseHTML += `
          <div class="custom-expense-group" id="custom_expense_7">
            <label>สำหรับ เงินได้ประเภทที่ 7:</label>
            <div class="radio-group">
              <input type="radio" name="expense_choice_7" value="standard" checked> หักเหมา
              <input type="radio" name="expense_choice_7" value="actual"> หักตามจริง
            </div>
            <div id="expense_actual_container_7" style="display:none;">
              <input type="text" id="expense_actual_7" placeholder="ระบุค่าใช้จ่ายจริง" value="0" inputmode="decimal">
            </div>
          </div>`;
      }
      document.getElementById('custom_expense_options').innerHTML = customExpenseHTML;

      // Attach event listeners for dynamic inputs in Step 2
      ['3','5','6','7'].forEach((type) => {
        if (!document.getElementById('custom_expense_'+type)) return;
        
        let radios = document.getElementsByName("expense_choice_" + type);
        radios.forEach(radio => {
          radio.addEventListener('change', function() {
            const container = document.getElementById("expense_actual_container_" + type);
            if (this.value === "actual") {
              const actualInput = document.getElementById("expense_actual_"+type);
              if (actualInput) actualInput.value = "0";
              container.style.display = 'block';
            } else {
              container.style.display = 'none';
            }
            recalcExpenses(); 
          });
        });

        let actualInput = document.getElementById("expense_actual_" + type);
        if (actualInput) {
          addCommaEvent("expense_actual_" + type);
          actualInput.addEventListener('focus', function() {
            if (this.value === "0") this.value = "";
          });
          actualInput.addEventListener('input', function() {
            recalcExpenses();
          });
        }
      });

      recalcExpenses();

      setActiveStep(2);
      showStep(2);
      updateDeductionLimits();
    } 
    else if (currentStep === 2) {
      setActiveStep(3);
      showStep(3);
      updateDeductionLimits();
    }
  }
}

/**
 * Recalculates the total expense in real time (Step 2) and updates the display.
 */
function recalcExpenses() {
  let expense_12 = Math.min((rev1_amt + rev2_amt) * 0.5, 100000);

  let expense_3 = 0;
  if (document.getElementById('rev_type_3').checked) {
    let choice3 = document.querySelector('input[name="expense_choice_3"]:checked');
    if (choice3 && choice3.value === "actual") {
      expense_3 = parseNumber(document.getElementById('expense_actual_3').value) || 0;
    } else {
      expense_3 = Math.min(rev3_amt * 0.5, 100000);
    }
  }

  let expense_5 = 0;
  if (document.getElementById('rev_type_5').checked) {
    let choice5 = document.querySelector('input[name="expense_choice_5"]:checked');
    if (choice5 && choice5.value === "actual") {
      expense_5 = parseNumber(document.getElementById('expense_actual_5').value) || 0;
    } else {
      let calc = 0;
      if(document.getElementById('rev5_sub_1').checked) {
        let subVal = parseNumber(document.getElementById('rev5_sub1_amount').value);
        let multiplier = (document.getElementById('calc_mode').value === 'month') ? 12 : 1;
        calc += subVal * multiplier * 0.30;
      }
      if(document.getElementById('rev5_sub_2').checked) {
        let subVal = parseNumber(document.getElementById('rev5_sub2_amount').value);
        let multiplier = (document.getElementById('calc_mode').value === 'month') ? 12 : 1;
        calc += subVal * multiplier * 0.20;
      }
      if(document.getElementById('rev5_sub_3').checked) {
        let subVal = parseNumber(document.getElementById('rev5_sub3_amount').value);
        let multiplier = (document.getElementById('calc_mode').value === 'month') ? 12 : 1;
        calc += subVal * multiplier * 0.15;
      }
      if(document.getElementById('rev5_sub_4').checked) {
        let subVal = parseNumber(document.getElementById('rev5_sub4_amount').value);
        let multiplier = (document.getElementById('calc_mode').value === 'month') ? 12 : 1;
        calc += subVal * multiplier * 0.30;
      }
      if(document.getElementById('rev5_sub_5').checked) {
        let subVal = parseNumber(document.getElementById('rev5_sub5_amount').value);
        let multiplier = (document.getElementById('calc_mode').value === 'month') ? 12 : 1;
        calc += subVal * multiplier * 0.10;
      }
      expense_5 = calc;
    }
  }

  let expense_6 = 0;
  if (document.getElementById('rev_type_6').checked) {
    let choice6 = document.querySelector('input[name="expense_choice_6"]:checked');
    if (choice6 && choice6.value === "actual") {
      expense_6 = parseNumber(document.getElementById('expense_actual_6').value) || 0;
    } else {
      let calc = 0;
      if(document.getElementById('rev6_sub_1').checked) {
        let subVal = parseNumber(document.getElementById('rev6_sub1_amount').value);
        let multiplier = (document.getElementById('calc_mode').value === 'month') ? 12 : 1;
        calc += subVal * multiplier * 0.60;
      }
      if(document.getElementById('rev6_sub_2').checked) {
        let subVal = parseNumber(document.getElementById('rev6_sub2_amount').value);
        let multiplier = (document.getElementById('calc_mode').value === 'month') ? 12 : 1;
        calc += subVal * multiplier * 0.30;
      }
      expense_6 = calc;
    }
  }

  let expense_7 = 0;
  if (document.getElementById('rev_type_7').checked) {
    let choice7 = document.querySelector('input[name="expense_choice_7"]:checked');
    if (choice7 && choice7.value === "actual") {
      expense_7 = parseNumber(document.getElementById('expense_actual_7').value) || 0;
    } else {
      let multiplier = (document.getElementById('calc_mode').value === 'month') ? 12 : 1;
      expense_7 = parseNumber(document.getElementById('rev7_amount').value) * multiplier * 0.60;
    }
  }

  expense = expense_12 + expense_3 + expense_5 + expense_6 + expense_7;
  document.getElementById('expense_display').innerText = formatNumber(expense);
}

function showStep(stepNumber) {
  navigateToStep(stepNumber);
}

function navigateToStep(stepNumber) {
  document.querySelectorAll('.container .step-content').forEach((step) => {
    step.classList.remove('active');
    step.style.display = 'none';
  });
  const targetStep = document.getElementById(`step-${stepNumber}`);
  if (targetStep) {
    targetStep.style.display = 'block';
    targetStep.classList.add('active');
  }
  setActiveStep(stepNumber);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setActiveStep(stepNumber) {
  const stepper = document.getElementById('stepper');
  stepper.setAttribute('data-current-step', stepNumber);
  const stepperSteps = document.querySelectorAll('.stepper .stepper-step');
  stepperSteps.forEach((step) => {
    const stepDataNumber = parseInt(step.getAttribute('data-step'));
    if (stepDataNumber < stepNumber) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (stepDataNumber === stepNumber) {
      step.classList.add('active');
      step.classList.add('completed');
    } else {
      step.classList.remove('active');
      step.classList.remove('completed');
    }
  });
  
  document.getElementById('resetButtonStep1').style.display = (stepNumber === 1) ? 'block' : 'none';
  document.getElementById('resetButtonStep3').style.display = (stepNumber === 3) ? 'block' : 'none';
}

/**
 * Validate Step 1 (ensure at least one revenue type is selected with amount > 0).
 */
function validateStep(stepNumber) {
  if (stepNumber === 1) {
    let valid = false;
    document.querySelectorAll('input[name="rev_type"]').forEach((cb) => {
      if (cb.checked) {
        let amt = 0;
        if (cb.value === "1") {
          amt = parseNumber(document.getElementById('rev1_amount')?.value || "0");
        } else if (cb.value === "2") {
          amt = parseNumber(document.getElementById('rev2_amount')?.value || "0");
        } else if (cb.value === "3") {
          amt = parseNumber(document.getElementById('rev3_amount')?.value || "0");
        } else if (cb.value === "4") {
          amt = parseNumber(document.getElementById('rev4_amount')?.value || "0");
        } else if (cb.value === "5") {
          let sum = 0;
          if (document.getElementById('rev5_sub_1').checked)
            sum += parseNumber(document.getElementById('rev5_sub1_amount').value);
          if (document.getElementById('rev5_sub_2').checked)
            sum += parseNumber(document.getElementById('rev5_sub2_amount').value);
          if (document.getElementById('rev5_sub_3').checked)
            sum += parseNumber(document.getElementById('rev5_sub3_amount').value);
          if (document.getElementById('rev5_sub_4').checked)
            sum += parseNumber(document.getElementById('rev5_sub4_amount').value);
          if (document.getElementById('rev5_sub_5').checked)
            sum += parseNumber(document.getElementById('rev5_sub5_amount').value);
          amt = sum;
        } else if (cb.value === "6") {
          let sum = 0;
          if (document.getElementById('rev6_sub_1').checked)
            sum += parseNumber(document.getElementById('rev6_sub1_amount').value);
          if (document.getElementById('rev6_sub_2').checked)
            sum += parseNumber(document.getElementById('rev6_sub2_amount').value);
          amt = sum;
        } else if (cb.value === "7") {
          amt = parseNumber(document.getElementById('rev7_amount')?.value || "0");
        }
        if (amt > 0) valid = true;
      }
    });
    if (!valid) {
      alert("กรุณาเลือกและกรอกจำนวนเงินสำหรับอย่างน้อยหนึ่งประเภทของรายได้");
      return false;
    }
  }
  return true;
}

// Updated Reset Function: Resets all inputs, checkboxes, radio buttons, and hides dynamic sections.
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
  
  // Reset all checkboxes and dispatch change event to hide dependent sections
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
  });
  
  // Reset all radio buttons and dispatch change event
  document.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.checked = false;
    radio.dispatchEvent(new Event('change'));
  });
  
  // Reset all select elements to first option and dispatch change event
  document.querySelectorAll('select').forEach((select) => {
    select.selectedIndex = 0;
    select.dispatchEvent(new Event('change'));
  });
  
  // Hide dynamic sections
  const sectionsToHide = [
    'rev_type_1_input', 'rev_type_2_input', 'rev_type_3_input', 'rev_type_4_input',
    'rev_type_5_input', 'rev_type_6_input', 'rev_type_7_input',
    'rev1_withholding_input_container', 'rev2_withholding_input_container',
    'rev3_withholding_input_container', 'rev4_withholding_input_container',
    'rev5_withholding_input_container', 'rev6_withholding_input_container',
    'rev7_withholding_input_container',
    'expense_actual_container_3', 'expense_actual_container_5',
    'expense_actual_container_6', 'expense_actual_container_7',
    'insurance_section', 'donation_section', 'stimulus_section',
    'social_security_section', 'thaiesg_extra_container'
  ];
  sectionsToHide.forEach((id) => {
    const elem = document.getElementById(id);
    if (elem) elem.style.display = 'none';
  });
  
  // Reset displayed calculated values
  document.getElementById('expense_display').innerText = '0';
  document.getElementById('result_withholding_tax').innerText = '0';
  const taxSummary = document.getElementById('tax_summary');
  if (taxSummary) taxSummary.style.display = 'none';
  
  // Clear error messages
  document.querySelectorAll('.error').forEach((el) => {
    el.innerText = '';
  });
  
  // Reset the stepper and go back to step 1
  if (typeof setActiveStep === 'function') {
    setActiveStep(1);
  }
  if (typeof showStep === 'function') {
    showStep(1);
  }
  
  // Show landing page and hide main container
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

/* ---------------------- Floating Scroll Arrow ---------------------- */
window.addEventListener("scroll", function() {
  const scrollArrow = document.getElementById("scrollArrow");
  scrollArrow.style.display = "block";
  const scrollTop = window.pageYOffset;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  const threshold = 50;
  if (scrollTop < threshold) {
    scrollArrow.innerHTML = "&#x2193;";
  } else if (scrollTop + windowHeight > docHeight - threshold) {
    scrollArrow.innerHTML = "&#x2191;";
  } else {
    scrollArrow.innerHTML = "&#x2193;";
  }
});

function scrollPage() {
  const scrollTop = window.pageYOffset;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  const threshold = 50;

  if (scrollTop < threshold) {
    window.scrollTo({ top: docHeight - windowHeight, behavior: 'smooth' });
  } else if (scrollTop + windowHeight > docHeight - threshold) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: docHeight - windowHeight, behavior: 'smooth' });
  }
}

// Reset function for Step 1 (Revenue Inputs)
function resetPage1() {
  // Reset revenue type checkboxes and hide their input sections
  const revenueTypes = [
    { checkboxId: 'rev_type_1', inputId: 'rev_type_1_input' },
    { checkboxId: 'rev_type_2', inputId: 'rev_type_2_input' },
    { checkboxId: 'rev_type_3', inputId: 'rev_type_3_input' },
    { checkboxId: 'rev_type_4', inputId: 'rev_type_4_input' },
    { checkboxId: 'rev_type_5', inputId: 'rev_type_5_input' },
    { checkboxId: 'rev_type_6', inputId: 'rev_type_6_input' },
    { checkboxId: 'rev_type_7', inputId: 'rev_type_7_input' }
  ];
  revenueTypes.forEach(item => {
    const cb = document.getElementById(item.checkboxId);
    if (cb) cb.checked = false;
    const section = document.getElementById(item.inputId);
    if (section) section.style.display = 'none';
  });

  // Reset all revenue input fields to "0"
  const revenueFields = [
    'rev1_amount', 'rev1_withholding_input',
    'rev2_amount', 'rev2_withholding_input',
    'rev3_amount', 'rev3_withholding_input',
    'rev4_amount', 'rev4_withholding_input',
    'rev7_amount', 'rev7_withholding_input',
    'rev5_sub1_amount', 'rev5_sub2_amount', 'rev5_sub3_amount', 'rev5_sub4_amount', 'rev5_sub5_amount',
    'rev5_withholding_input',
    'rev6_sub1_amount', 'rev6_sub2_amount', 'rev6_withholding_input'
  ];
  revenueFields.forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = "0";
  });

  // Reset calculation mode to default (yearly)
  const calcMode = document.getElementById('calc_mode');
  if (calcMode) calcMode.value = 'year';

  // Optionally, reset related global variables
  total_income = 0;
  monthly_income = 0;
}

// Reset function for Step 3 (Deductions)
function resetPage3() {
  // Reset selections in the deductions section
  const spouse = document.getElementById('spouse');
  if (spouse) spouse.value = 'no';

  const childrenOwn = document.getElementById('children_own');
  if (childrenOwn) childrenOwn.value = "0";
  const childrenAdopted = document.getElementById('children_adopted');
  if (childrenAdopted) childrenAdopted.value = "0";
  const disabledPersons = document.getElementById('disabled_persons');
  if (disabledPersons) disabledPersons.value = "0";

  // Reset parent's checkboxes
  ['your_father', 'your_mother', 'spouse_father', 'spouse_mother'].forEach(id => {
    const cb = document.getElementById(id);
    if (cb) cb.checked = false;
  });

  // Reset additional deduction checkboxes and trigger change events to hide dependent sections
  ['has_insurance', 'has_donation', 'has_stimulus', 'has_social_security'].forEach(id => {
    const cb = document.getElementById(id);
    if (cb) {
      cb.checked = false;
      cb.dispatchEvent(new Event('change'));
    }
  });

  // Reset all deduction-related input fields to "0"
  const deductionInputs = [
    'life_insurance', 'health_insurance', 'parent_health_insurance', 
    'pension_insurance', 'ssf', 'rmf', 'pvd', 'gpf', 'thaiesg',
    'social_enterprise', 'nsf', 'thaiesg_extra_transfer', 'thaiesg_extra_new',
    'donation', 'donation_education', 'donation_political',
    'easy_ereceipt', 'local_travel', 'home_loan_interest', 'new_home',
    'social_security'
  ];
  deductionInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = "0";
  });

  // Hide dynamic sections if visible
  const sectionsToHide = [
    'insurance_section', 'donation_section', 'stimulus_section', 
    'social_security_section', 'thaiesg_extra_container'
  ];
  sectionsToHide.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.style.display = 'none';
  });
}
