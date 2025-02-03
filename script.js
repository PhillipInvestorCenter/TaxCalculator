/***** script.js *****/

// ============================================
// Global variables
// ============================================
let total_income = 0;
let monthly_income = 0;
let expense = 0;
let total_withholding_tax = 0;
let isTaxCalculated = false;

// Checkboxes for income type
let incomeTypeCheckboxes = null;

// Retirement fields => limit sum to 500,000
const retirementFields = ['pension_insurance', 'pvd', 'gpf', 'rmf', 'ssf', 'nsf'];
const MAX_TOTAL_RETIREMENT = 500000;

// We’ll also define “other deduction” fields for real-time clamp
// so you can add logic for each field’s sub-limit (like ThaiESG).
const otherDeductionFields = [
  'life_insurance',
  'health_insurance',
  'parent_health_insurance',
  'thaiesg',
  'social_enterprise',
  'nsf', // note nsf is also in retirement
  'donation_political',
  'easy_ereceipt',
  'local_travel',
  'home_loan_interest',
  'new_home'
];

// ============================================
// On window load
// ============================================
window.onload = function () {
  incomeTypeCheckboxes = document.querySelectorAll('input[name="income_type"]');

  // Attach comma-format & focus/blur logic to numeric fields
  const numberFields = [
    'annual_income', 'monthly_income', 'bonus_income', 'other_income',
    'life_insurance', 'health_insurance', 'parent_health_insurance',
    'pension_insurance', 'ssf', 'rmf', 'pvd', 'gpf', 'thaiesg',
    'social_enterprise', 'nsf', 'home_loan_interest', 'donation',
    'donation_education', 'donation_political', 'easy_ereceipt',
    'local_travel', 'new_home', 'withholding_tax_annual_input',
    'withholding_tax_monthly_input'
  ];
  numberFields.forEach((id) => {
    addCommaEvent(id);
    const input = document.getElementById(id);
    if (input) {
      // Remove '0' on focus
      input.addEventListener('focus', function () {
        if (this.value === '0') this.value = '';
      });
      // Put back '0' if empty on blur
      input.addEventListener('blur', function () {
        if (this.value === '') this.value = '0';
        updateDeductionLimits();
      });
    }
  });

  // Setup income type & withholding tax logic
  setupIncomeTypeListeners();
  setupWithholdingTaxListeners();

  // "Other income" checkbox
  document.getElementById('has_other_income').addEventListener('change', function () {
    document.getElementById('other_income_section').style.display = this.checked ? 'block' : 'none';
    updateDeductionLimits();
  });

  // Social security checkbox
  document.getElementById('has_social_security').addEventListener('change', function () {
    document.getElementById('social_security_section').style.display = this.checked ? 'block' : 'none';
    if (this.checked) calculateSocialSecurity();
    else document.getElementById('social_security').value = '0';
    updateDeductionLimits();
  });

  // Recalculate social security if monthly/annual changes
  document.getElementById('monthly_income').addEventListener('input', function () {
    const incomeType = document.querySelector('input[name="income_type"]:checked');
    if (incomeType && incomeType.value === 'monthly') {
      monthly_income = parseNumber(this.value) || 0;
      calculateSocialSecurity();
    }
  });
  document.getElementById('annual_income').addEventListener('input', function () {
    const incomeType = document.querySelector('input[name="income_type"]:checked');
    if (incomeType && incomeType.value === 'annual') {
      let val = parseNumber(this.value) || 0;
      monthly_income = val / 12;
      calculateSocialSecurity();
    }
  });

  // Retirement fields => real-time clamp
  retirementFields.forEach((fieldId) => {
    const elem = document.getElementById(fieldId);
    if (elem) {
      elem.addEventListener('input', function () {
        handleRetirementFieldChange(fieldId);
      });
    }
  });

  // Other deduction fields => real-time clamp
  otherDeductionFields.forEach((fieldId) => {
    const elem = document.getElementById(fieldId);
    if (elem) {
      elem.addEventListener('input', function () {
        handleOtherDeductionFieldChange(fieldId);
      });
    }
  });

  // Show/hide insurance/donation/stimulus sections
  document.getElementById('has_insurance').addEventListener('change', function () {
    document.getElementById('insurance_section').style.display = this.checked ? 'block' : 'none';
    updateRetirementDeductions();
    updateDeductionLimits();
  });
  document.getElementById('has_donation').addEventListener('change', function () {
    document.getElementById('donation_section').style.display = this.checked ? 'block' : 'none';
    updateDeductionLimits();
  });
  document.getElementById('has_stimulus').addEventListener('change', function () {
    document.getElementById('stimulus_section').style.display = this.checked ? 'block' : 'none';
    updateDeductionLimits();
  });

  // Stepper steps
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

  // Pension insurance + life partial fix
  document.getElementById('pension_insurance').addEventListener('blur', handlePensionInsuranceInput);

  // Life insurance clamp on blur
  document.getElementById('life_insurance').addEventListener('blur', function () {
    let val = parseNumber(this.value) || 0;
    if (val > 100000) {
      val = 100000;
      this.value = formatNumber(val);
      alert('เบี้ยประกันชีวิตไม่สามารถเกิน 100,000 บาท');
    }
    updateDeductionLimits();
  });

  // Populate children/adopted/disabled selects
  populateChildrenOptions();
};

// ============================================
// Setup & Listeners
// ============================================
function setupIncomeTypeListeners() {
  incomeTypeCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
      // Uncheck others
      incomeTypeCheckboxes.forEach((c) => {
        if (c !== this) c.checked = false;
      });

      // Hide all sections first
      document.getElementById('annual_income_section').style.display = 'none';
      document.getElementById('withholding_tax_annual_checkbox_section').style.display = 'none';
      document.getElementById('withholding_tax_annual_section').style.display = 'none';
      document.getElementById('monthly_income_section').style.display = 'none';
      document.getElementById('withholding_tax_monthly_checkbox_section').style.display = 'none';
      document.getElementById('withholding_tax_monthly_section').style.display = 'none';

      // Reset withholding fields
      document.getElementById('withholding_tax_annual_checkbox').checked = false;
      document.getElementById('withholding_tax_annual_input').value = '0';
      document.getElementById('withholding_tax_monthly_checkbox').checked = false;
      document.getElementById('withholding_tax_monthly_input').value = '0';

      if (this.value === 'annual' && this.checked) {
        document.getElementById('annual_income_section').style.display = 'block';
        document.getElementById('withholding_tax_annual_checkbox_section').style.display = 'block';
      } else if (this.value === 'monthly' && this.checked) {
        document.getElementById('monthly_income_section').style.display = 'block';
        document.getElementById('withholding_tax_monthly_checkbox_section').style.display = 'block';
      }

      total_withholding_tax = calculateTotalWithholdingTax();
      updateDeductionLimits();
    });
  });
}

function setupWithholdingTaxListeners() {
  const annualCb = document.getElementById('withholding_tax_annual_checkbox');
  const annualSec = document.getElementById('withholding_tax_annual_section');
  if (annualCb) {
    annualCb.addEventListener('change', function () {
      annualSec.style.display = this.checked ? 'block' : 'none';
      if (!this.checked) {
        document.getElementById('withholding_tax_annual_input').value = '0';
        total_withholding_tax = calculateTotalWithholdingTax();
      }
    });
  }

  const monthlyCb = document.getElementById('withholding_tax_monthly_checkbox');
  const monthlySec = document.getElementById('withholding_tax_monthly_section');
  if (monthlyCb) {
    monthlyCb.addEventListener('change', function () {
      monthlySec.style.display = this.checked ? 'block' : 'none';
      if (!this.checked) {
        document.getElementById('withholding_tax_monthly_input').value = '0';
        total_withholding_tax = calculateTotalWithholdingTax();
      }
    });
  }

  document.getElementById('withholding_tax_annual_input').addEventListener('input', function () {
    total_withholding_tax = calculateTotalWithholdingTax();
  });
  document.getElementById('withholding_tax_monthly_input').addEventListener('input', function () {
    total_withholding_tax = calculateTotalWithholdingTax();
  });
}

// ============================================
// Step Navigation
// ============================================
function startCalculator() {
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
      // Gather income data
      let incomeType = '';
      incomeTypeCheckboxes.forEach((c) => {
        if (c.checked) incomeType = c.value;
      });

      if (incomeType === 'annual') {
        let annualVal = parseNumber(document.getElementById('annual_income').value);
        total_income = annualVal;
        monthly_income = annualVal / 12;
      } else if (incomeType === 'monthly') {
        let monthlyVal = parseNumber(document.getElementById('monthly_income').value);
        let bonusVal = parseNumber(document.getElementById('bonus_income').value) || 0;
        monthly_income = monthlyVal;
        total_income = (monthlyVal * 12) + bonusVal;
      }

      if (document.getElementById('has_other_income').checked) {
        let otherVal = parseNumber(document.getElementById('other_income').value) || 0;
        total_income += otherVal;
      }

      // Expense => 50% up to 100k
      expense = total_income * 0.5;
      if (expense > 100000) expense = 100000;
      document.getElementById('expense_display').innerText = formatNumber(expense);

      total_withholding_tax = calculateTotalWithholdingTax();
      setActiveStep(2);
      showStep(2);

      updateDeductionLimits();
    } else if (currentStep === 2) {
      setActiveStep(3);
      showStep(3);
      updateDeductionLimits();
    }
  }
}

function showStep(stepNumber) {
  navigateToStep(stepNumber);
}

function navigateToStep(stepNumber) {
  document.querySelectorAll('.container .step-content').forEach((step) => {
    step.classList.remove('active');
    step.style.display = 'none';
  });
  document.getElementById(`step-${stepNumber}`).style.display = 'block';
  document.getElementById(`step-${stepNumber}`).classList.add('active');

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
}

// ============================================
// Validation
// ============================================
function validateStep(stepNumber) {
  if (stepNumber === 1) {
    let incomeTypeSelected = false;
    let incomeType = '';
    incomeTypeCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        incomeTypeSelected = true;
        incomeType = checkbox.value;
      }
    });

    if (!incomeTypeSelected) {
      document.getElementById('income_type_error').innerText = 'กรุณาเลือกประเภทของรายได้';
      return false;
    } else {
      document.getElementById('income_type_error').innerText = '';
    }

    if (incomeType === 'annual') {
      let val = parseNumber(document.getElementById('annual_income').value);
      if (val === 0) {
        document.getElementById('annual_income_error').innerText = 'กรุณากรอกรายได้ทั้งปีของคุณ';
        return false;
      } else {
        document.getElementById('annual_income_error').innerText = '';
      }
      const cb = document.getElementById('withholding_tax_annual_checkbox');
      if (cb.checked) {
        let w = parseNumber(document.getElementById('withholding_tax_annual_input').value);
        if (w === 0) {
          document.getElementById('withholding_tax_annual_error').innerText = 'กรุณากรอกจำนวนภาษีที่หัก ณ ที่จ่าย';
          return false;
        } else {
          document.getElementById('withholding_tax_annual_error').innerText = '';
        }
      } else {
        document.getElementById('withholding_tax_annual_error').innerText = '';
      }
    } else if (incomeType === 'monthly') {
      let val = parseNumber(document.getElementById('monthly_income').value);
      if (val === 0) {
        document.getElementById('monthly_income_error').innerText = 'กรุณากรอกรายได้ต่อเดือนของคุณ';
        return false;
      } else {
        document.getElementById('monthly_income_error').innerText = '';
      }
      const cb = document.getElementById('withholding_tax_monthly_checkbox');
      if (cb.checked) {
        let w = parseNumber(document.getElementById('withholding_tax_monthly_input').value);
        if (w === 0) {
          document.getElementById('withholding_tax_monthly_error').innerText = 'กรุณากรอกจำนวนภาษีที่หัก ณ ที่จ่ายต่อเดือน';
          return false;
        } else {
          document.getElementById('withholding_tax_monthly_error').innerText = '';
        }
      } else {
        document.getElementById('withholding_tax_monthly_error').innerText = '';
      }
    }
  }
  return true;
}

// ============================================
// Income & Withholding Tax
// ============================================
function calculateTotalWithholdingTax() {
  const selectedIncomeType = document.querySelector('input[name="income_type"]:checked');
  if (!selectedIncomeType) return 0;

  let total_withholding = 0;
  if (selectedIncomeType.value === 'annual') {
    const cb = document.getElementById('withholding_tax_annual_checkbox');
    const inp = document.getElementById('withholding_tax_annual_input');
    if (cb && cb.checked) {
      let val = parseNumber(inp.value) || 0;
      total_withholding += val;
    }
  } else if (selectedIncomeType.value === 'monthly') {
    const cb = document.getElementById('withholding_tax_monthly_checkbox');
    const inp = document.getElementById('withholding_tax_monthly_input');
    if (cb && cb.checked) {
      let val = parseNumber(inp.value) || 0;
      total_withholding += val * 12;
    }
  }
  return total_withholding;
}

// ============================================
// Social Security
// ============================================
function calculateSocialSecurity() {
  let social_security = 0;
  if (document.getElementById('has_social_security').checked) {
    let monthly_contribution = monthly_income * 0.05;
    monthly_contribution = Math.min(monthly_contribution, 750);
    social_security = monthly_contribution * 12;
    social_security = Math.min(social_security, 9000);
    document.getElementById('social_security').value = formatNumber(social_security);
  } else {
    document.getElementById('social_security').value = '0';
  }
  updateDeductionLimits();
}

// ============================================
// Retirement Fields: Real-Time Clamping
// ============================================
function getRetirementFieldLimit(fieldId, totalIncome) {
  switch (fieldId) {
    case 'pension_insurance':
      return Math.min(totalIncome * 0.15, 200000);
    case 'pvd':
      return Math.min(totalIncome * 0.15, 500000);
    case 'gpf':
      return Math.min(totalIncome * 0.30, 500000);
    case 'rmf':
      return Math.min(totalIncome * 0.30, 500000);
    case 'ssf':
      return Math.min(totalIncome * 0.30, 200000);
    case 'nsf':
      return 30000;
    default:
      return 0;
  }
}

function getCurrentRetirementTotalExcluding(excludeFieldId) {
  let total = 0;
  retirementFields.forEach((f) => {
    if (f !== excludeFieldId) {
      total += parseNumber(document.getElementById(f).value) || 0;
    }
  });
  return total;
}

function handleRetirementFieldChange(changedFieldId) {
  const changedElem = document.getElementById(changedFieldId);
  let typedVal = parseNumber(changedElem.value) || 0;

  // 1) clamp typedVal by field’s own sub-limit
  const subLimit = getRetirementFieldLimit(changedFieldId, total_income);
  if (typedVal > subLimit) typedVal = subLimit;

  // 2) check combined leftover
  const sumOthers = getCurrentRetirementTotalExcluding(changedFieldId);
  let newTotal = sumOthers + typedVal;
  if (newTotal > MAX_TOTAL_RETIREMENT) {
    typedVal = MAX_TOTAL_RETIREMENT - sumOthers;
    if (typedVal < 0) typedVal = 0;
  }

  // 3) update the input
  changedElem.value = formatNumber(typedVal);

  // 4) update
  updateRetirementDeductions();
  updateDeductionLimits();
}

function getCurrentRetirementTotal() {
  let sum = 0;
  retirementFields.forEach((f) => {
    sum += parseNumber(document.getElementById(f).value) || 0;
  });
  return sum;
}

function updateRetirementDeductions() {
  let total_retirement_contributions = getCurrentRetirementTotal();
  if (total_retirement_contributions > MAX_TOTAL_RETIREMENT) {
    total_retirement_contributions = MAX_TOTAL_RETIREMENT;
  }
}

// ============================================
// Other Deductions: Real-Time Clamping
// ============================================
function getOtherDeductionLimit(fieldId) {
  // Adjust as needed for each field:
  switch (fieldId) {
    case 'life_insurance':      return 100000;       // also combined logic with health_insurance => 100k
    case 'health_insurance':    return 25000;        // also combined with life_insurance
    case 'parent_health_insurance': return 15000;
    case 'thaiesg':            // min(30% * income, 300k)
      return Math.min(total_income * 0.30, 300000);
    case 'social_enterprise':   return 100000;
    case 'nsf':                 return 30000;        // also in retirement, same 30k
    case 'donation_political':  return 10000;
    case 'easy_ereceipt':       return 50000;
    case 'local_travel':        return 15000;
    case 'home_loan_interest':  return 100000;
    case 'new_home':            // The actual deduction is computed differently, but we can clamp
      return Number.MAX_VALUE;  // or if you want to clamp it, set a limit
    default:
      return Number.MAX_VALUE;
  }
}

function handleOtherDeductionFieldChange(changedFieldId) {
  const elem = document.getElementById(changedFieldId);
  let typedVal = parseNumber(elem.value) || 0;

  // 1) sub-limit
  const subLimit = getOtherDeductionLimit(changedFieldId);
  if (typedVal > subLimit) typedVal = subLimit;

  // 2) For life+health combined => sum ≤ 100,000
  if (changedFieldId === 'life_insurance' || changedFieldId === 'health_insurance') {
    const otherId = (changedFieldId === 'life_insurance') ? 'health_insurance' : 'life_insurance';
    let otherVal = parseNumber(document.getElementById(otherId).value) || 0;
    let combined = typedVal + otherVal;
    if (combined > 100000) {
      typedVal = 100000 - otherVal;
      if (typedVal < 0) typedVal = 0;
    }
  }

  // 3) update input
  elem.value = formatNumber(typedVal);

  // 4) update
  updateDeductionLimits();
}

// ============================================
// Tax Calculation
// ============================================
function calculateTax() {
  // Clear old errors
  document.querySelectorAll('.error').forEach((el) => (el.innerText = ''));

  let errorMessages = [];
  let errorFields = [];

  // Personal/family
  let personal_allowance = 60000;
  let spouse = document.getElementById('spouse').value;
  let spouse_allowance = (spouse === 'yes') ? 60000 : 0;

  // Children
  let children_own = parseInt(document.getElementById('children_own').value) || 0;
  let child_allowance = 0;
  for (let i = 1; i <= children_own; i++) {
    if (i >= 2) child_allowance += 60000; else child_allowance += 30000;
  }
  let children_adopted = parseInt(document.getElementById('children_adopted').value) || 0;
  if (children_adopted > 3) children_adopted = 3;
  child_allowance += children_adopted * 30000;

  // Parents
  let parents_allowance = 0;
  if (document.getElementById('your_father').checked) parents_allowance += 30000;
  if (document.getElementById('your_mother').checked) parents_allowance += 30000;
  if (document.getElementById('spouse_father').checked) parents_allowance += 30000;
  if (document.getElementById('spouse_mother').checked) parents_allowance += 30000;
  if (parents_allowance > 120000) parents_allowance = 120000;

  // Disabled
  let disabled_persons = parseInt(document.getElementById('disabled_persons').value) || 0;
  let disabled_allowance = disabled_persons * 60000;

  // Social security
  let social_security = 0;
  if (document.getElementById('has_social_security').checked) {
    social_security = parseNumber(document.getElementById('social_security').value);
  }

  let total_personal_deductions = personal_allowance + spouse_allowance + child_allowance + parents_allowance + disabled_allowance + social_security;

  // Insurance & retirement
  let total_investment_deductions = 0;
  let retirement_total = 0;
  let insurance_total = 0;
  let parent_health_val = 0;

  if (document.getElementById('has_insurance').checked) {
    let life_val = parseNumber(document.getElementById('life_insurance').value);
    let health_val = parseNumber(document.getElementById('health_insurance').value);
    if (life_val > 100000) {
      errorMessages.push('เบี้ยประกันชีวิตไม่ควรเกิน 100,000 บาท');
      errorFields.push('life_insurance');
    }
    life_val = Math.min(life_val, 100000);

    if (health_val > 25000) {
      errorMessages.push('เบี้ยประกันสุขภาพไม่ควรเกิน 25,000 บาท');
      errorFields.push('health_insurance');
    }
    health_val = Math.min(health_val, 25000);

    if (life_val + health_val > 100000) {
      errorMessages.push('รวมเบี้ยประกันชีวิตและสุขภาพไม่ควรเกิน 100,000 บาท');
      errorFields.push('health_insurance');
    }
    insurance_total = Math.min(life_val + health_val, 100000);

    parent_health_val = parseNumber(document.getElementById('parent_health_insurance').value);
    if (parent_health_val > 15000) {
      errorMessages.push('เบี้ยประกันสุขภาพบิดามารดาไม่ควรเกิน 15,000 บาท');
      errorFields.push('parent_health_insurance');
    }
    parent_health_val = Math.min(parent_health_val, 15000);

    // Retirement
    let pensionVal = parseNumber(document.getElementById('pension_insurance').value);
    let pensionLimit = Math.min(total_income * 0.15, 200000);
    if (pensionVal > pensionLimit) {
      errorMessages.push(`เบี้ยประกันชีวิตแบบบำนาญเกิน (จำกัด ${formatNumber(pensionLimit)} บาท)`);
      errorFields.push('pension_insurance');
    }
    pensionVal = Math.min(pensionVal, pensionLimit);

    let pvdVal = parseNumber(document.getElementById('pvd').value);
    let pvdLimit = Math.min(total_income * 0.15, 500000);
    if (pvdVal > pvdLimit) {
      errorMessages.push('PVD เกิน limit');
      errorFields.push('pvd');
    }
    pvdVal = Math.min(pvdVal, pvdLimit);

    let gpfVal = parseNumber(document.getElementById('gpf').value);
    let gpfLimit = Math.min(total_income * 0.30, 500000);
    if (gpfVal > gpfLimit) {
      errorMessages.push('กบข. เกิน limit');
      errorFields.push('gpf');
    }
    gpfVal = Math.min(gpfVal, gpfLimit);

    let ssfVal = parseNumber(document.getElementById('ssf').value);
    let ssfLimit = Math.min(total_income * 0.30, 200000);
    if (ssfVal > ssfLimit) {
      errorMessages.push('SSF เกิน limit');
      errorFields.push('ssf');
    }
    ssfVal = Math.min(ssfVal, ssfLimit);

    let rmfVal = parseNumber(document.getElementById('rmf').value);
    let rmfLimit = Math.min(total_income * 0.30, 500000);
    if (rmfVal > rmfLimit) {
      errorMessages.push('RMF เกิน limit');
      errorFields.push('rmf');
    }
    rmfVal = Math.min(rmfVal, rmfLimit);

    let thaiesgVal = parseNumber(document.getElementById('thaiesg').value);
    let thaiesgLimit = Math.min(total_income * 0.30, 300000);
    if (thaiesgVal > thaiesgLimit) {
      errorMessages.push('Thai ESG เกิน limit');
      errorFields.push('thaiesg');
    }
    thaiesgVal = Math.min(thaiesgVal, thaiesgLimit);

    let socialEntVal = parseNumber(document.getElementById('social_enterprise').value);
    if (socialEntVal > 100000) {
      errorMessages.push('เงินลงทุนธุรกิจ SE เกิน 100,000');
      errorFields.push('social_enterprise');
    }
    socialEntVal = Math.min(socialEntVal, 100000);

    let nsfVal = parseNumber(document.getElementById('nsf').value);
    if (nsfVal > 30000) {
      errorMessages.push('กอช. เกิน 30,000');
      errorFields.push('nsf');
    }
    nsfVal = Math.min(nsfVal, 30000);

    retirement_total = pensionVal + pvdVal + gpfVal + rmfVal + ssfVal + nsfVal;
    if (retirement_total > MAX_TOTAL_RETIREMENT) {
      errorMessages.push('รวมค่าลดหย่อนกลุ่มเกษียณไม่เกิน 500,000 บาท');
      errorFields.push('rmf');
    }
    retirement_total = Math.min(retirement_total, MAX_TOTAL_RETIREMENT);

    total_investment_deductions = insurance_total + parent_health_val + retirement_total + thaiesgVal + socialEntVal;
  }

  // Donation
  let total_donation_deductions = 0;
  if (document.getElementById('has_donation').checked) {
    let donationVal = parseNumber(document.getElementById('donation').value);
    let donationEdu = parseNumber(document.getElementById('donation_education').value) * 2;
    let donationPolit = parseNumber(document.getElementById('donation_political').value);
    if (donationPolit > 10000) {
      errorMessages.push('บริจาคพรรคการเมืองเกิน 10,000');
      errorFields.push('donation_political');
    }
    donationPolit = Math.min(donationPolit, 10000);

    total_donation_deductions = donationVal + donationEdu + donationPolit;
  }

  // Stimulus
  let total_stimulus_deductions = 0;
  if (document.getElementById('has_stimulus').checked) {
    let easyVal = parseNumber(document.getElementById('easy_ereceipt').value);
    if (easyVal > 50000) {
      errorMessages.push('Easy e-Receipt เกิน 50,000');
      errorFields.push('easy_ereceipt');
    }
    easyVal = Math.min(easyVal, 50000);

    let localVal = parseNumber(document.getElementById('local_travel').value);
    if (localVal > 15000) {
      errorMessages.push('เที่ยวเมืองรองเกิน 15,000');
      errorFields.push('local_travel');
    }
    localVal = Math.min(localVal, 15000);

    let homeLoanVal = parseNumber(document.getElementById('home_loan_interest').value);
    if (homeLoanVal > 100000) {
      errorMessages.push('ดอกเบี้ยบ้านเกิน 100,000');
      errorFields.push('home_loan_interest');
    }
    homeLoanVal = Math.min(homeLoanVal, 100000);

    let newHomeVal = parseNumber(document.getElementById('new_home').value);
    let newHomeDeduction = Math.floor(newHomeVal / 1000000) * 10000;
    if (newHomeDeduction > 100000) {
      errorMessages.push('ค่าสร้างบ้านใหม่ไม่ควรเกิน 100,000');
      errorFields.push('new_home');
    }
    newHomeDeduction = Math.min(newHomeDeduction, 100000);

    total_stimulus_deductions = easyVal + localVal + homeLoanVal + newHomeDeduction;
  }

  // If any errors, show modal
  if (errorMessages.length > 0) {
    showErrorModal(errorMessages, errorFields);
    return;
  }

  let total_deductions = expense + total_personal_deductions + total_investment_deductions + total_stimulus_deductions + total_donation_deductions;
  let taxable_income = total_income - total_deductions;
  if (taxable_income < 0) taxable_income = 0;

  // 10% donation limit
  if (document.getElementById('has_donation').checked) {
    let donationLimit = taxable_income * 0.10;
    if (total_donation_deductions > donationLimit) {
      total_donation_deductions = donationLimit;
    }
  }
  total_deductions = expense + total_personal_deductions + total_investment_deductions + total_stimulus_deductions + total_donation_deductions;

  let net_income = total_income - total_deductions;
  if (net_income < 0) net_income = 0;

  // Tax table
  let tax = 0;
  if (net_income <= 150000) {
    tax = 0;
  } else if (net_income <= 300000) {
    tax = (net_income - 150000) * 0.05;
  } else if (net_income <= 500000) {
    tax = ((net_income - 300000) * 0.10) + 7500;
  } else if (net_income <= 750000) {
    tax = ((net_income - 500000) * 0.15) + 27500;
  } else if (net_income <= 1000000) {
    tax = ((net_income - 750000) * 0.20) + 65000;
  } else if (net_income <= 2000000) {
    tax = ((net_income - 1000000) * 0.25) + 115000;
  } else if (net_income <= 5000000) {
    tax = ((net_income - 2000000) * 0.30) + 365000;
  } else {
    tax = ((net_income - 5000000) * 0.35) + 1265000;
  }

  let effective_tax_rate = 0;
  if (total_income > 0) {
    effective_tax_rate = (tax / total_income) * 100;
  }

  // Recommended SSF / RMF / ThaiESG
  let excess_over_150k = net_income > 150000 ? net_income - 150000 : 0;
  let ssf_limit = Math.min(total_income * 0.30, 200000);
  let rmf_limit = Math.min(total_income * 0.30, 500000);
  let thaiesg_limit_final = Math.min(total_income * 0.30, 300000);

  let current_ssf = parseNumber(document.getElementById('ssf').value) || 0;
  let current_rmf = parseNumber(document.getElementById('rmf').value) || 0;
  let current_pvd = parseNumber(document.getElementById('pvd').value) || 0;
  let current_gpf = parseNumber(document.getElementById('gpf').value) || 0;
  let current_pension = parseNumber(document.getElementById('pension_insurance').value) || 0;
  let current_nsf = parseNumber(document.getElementById('nsf').value) || 0;
  let current_thaiesg = parseNumber(document.getElementById('thaiesg').value) || 0;

  let total_retirement_contrib = current_ssf + current_rmf + current_pvd + current_gpf + current_pension + current_nsf;
  let leftover_ret_allowance = MAX_TOTAL_RETIREMENT - total_retirement_contrib;
  leftover_ret_allowance = Math.max(0, leftover_ret_allowance);

  let remaining_ssf_limit = Math.max(0, ssf_limit - current_ssf);
  let remaining_rmf_limit = Math.max(0, rmf_limit - current_rmf);

  let recommended_ssf_raw = Math.min(remaining_ssf_limit, leftover_ret_allowance);
  let recommended_rmf_raw = Math.min(remaining_rmf_limit, leftover_ret_allowance);
  let recommended_thaiesg_raw = Math.max(
    0,
    Math.min(thaiesg_limit_final - current_thaiesg, (total_income * 0.30) - current_thaiesg)
  );

  let recommended_ssf = Math.min(recommended_ssf_raw, excess_over_150k);
  let recommended_rmf = Math.min(recommended_rmf_raw, excess_over_150k);
  let recommended_thaiesg = Math.min(recommended_thaiesg_raw, excess_over_150k);

  if (net_income <= 150000) {
    recommended_ssf = 0;
    recommended_rmf = 0;
    recommended_thaiesg = 0;
  }

  // Display final
  document.getElementById('result_total_income').innerText = formatNumber(total_income);
  document.getElementById('result_expense').innerText = formatNumber(expense);
  document.getElementById('result_deductions').innerText = formatNumber(total_deductions - expense);
  document.getElementById('result_net_income').innerText = formatNumber(net_income);
  document.getElementById('result_effective_tax_rate').innerText = effective_tax_rate.toFixed(2) + '%';

  total_withholding_tax = calculateTotalWithholdingTax();
  const withholdingTaxParent = document.getElementById('result_withholding_tax').parentElement;
  if (total_withholding_tax > 0) {
    document.getElementById('result_withholding_tax').innerText = formatNumber(total_withholding_tax);
    withholdingTaxParent.style.display = 'block';
  } else {
    withholdingTaxParent.style.display = 'none';
  }

  let X = tax - total_withholding_tax;
  const taxSummaryDiv = document.getElementById('tax_summary');
  const taxDueReal = document.getElementById('tax_due_real');
  const taxCreditRefund = document.getElementById('tax_credit_refund');
  if (X > 0) {
    taxDueReal.innerText = `ภาษีที่ต้องชำระจริง: ${formatNumber(X)} บาท`;
    taxDueReal.style.color = 'red';
    taxDueReal.style.fontWeight = 'bold';
    taxDueReal.style.fontSize = '1.5em';
    taxCreditRefund.innerText = '';
    taxSummaryDiv.style.display = 'block';
  } else if (X < 0) {
    taxCreditRefund.innerText = `จำนวนเงินที่คุณต้องขอเครดิตคืน: ${formatNumber(Math.abs(X))} บาท`;
    taxCreditRefund.style.color = 'green';
    taxCreditRefund.style.fontWeight = 'bold';
    taxCreditRefund.style.fontSize = '1.5em';
    taxDueReal.innerText = '';
    taxSummaryDiv.style.display = 'block';
  } else {
    taxSummaryDiv.style.display = 'none';
  }

  // Show recommended
  updateInvestmentDisplay('max_ssf', recommended_ssf);
  updateInvestmentDisplay('max_rmf', recommended_rmf);
  updateInvestmentDisplay('max_thaiesg', recommended_thaiesg);

  isTaxCalculated = true;
  setActiveStep(4);
  showStep(4);
}

// ============================================
// Error Modal
// ============================================
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

// ============================================
// Edit and Reset
// ============================================
function editData() {
  navigateToStep(3);
}

function resetData() {
  total_income = 0;
  monthly_income = 0;
  expense = 0;
  isTaxCalculated = false;
  total_withholding_tax = 0;

  document.querySelectorAll('input[type="text"]').forEach((input) => {
    if (
      input.id === 'bonus_income' ||
      input.id === 'other_income' ||
      input.id === 'withholding_tax_annual_input' ||
      input.id === 'withholding_tax_monthly_input'
    ) {
      input.value = '0';
    } else {
      input.value = '';
    }
  });

  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false;
  });

  document.querySelectorAll('select').forEach((select) => {
    select.selectedIndex = 0;
  });

  document.getElementById('annual_income_section').style.display = 'none';
  document.getElementById('withholding_tax_annual_checkbox_section').style.display = 'none';
  document.getElementById('withholding_tax_annual_section').style.display = 'none';
  document.getElementById('monthly_income_section').style.display = 'none';
  document.getElementById('withholding_tax_monthly_checkbox_section').style.display = 'none';
  document.getElementById('withholding_tax_monthly_section').style.display = 'none';
  document.getElementById('other_income_section').style.display = 'none';
  document.getElementById('insurance_section').style.display = 'none';
  document.getElementById('donation_section').style.display = 'none';
  document.getElementById('stimulus_section').style.display = 'none';
  document.getElementById('social_security_section').style.display = 'none';

  document.getElementById('expense_display').innerText = '0';
  document.getElementById('result_withholding_tax').innerText = '0';
  document.getElementById('tax_summary').style.display = 'none';

  document.querySelectorAll('.error').forEach((el) => {
    el.innerText = '';
  });

  setActiveStep(1);
  showStep(1);

  document.getElementById('step-4').style.display = 'none';
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('main-container').style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateDeductionLimits();
}

// ============================================
// Investment Display
// ============================================
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

function updateInvestmentDisplay(elementId, amount) {
  const element = document.getElementById(elementId);
  if (!element) return;
  if (amount <= 0) {
    element.innerText = 'ไม่สามารถซื้อเพิ่มได้';
    element.style.color = 'red';
  } else {
    element.innerText = formatNumber(amount) + ' บาท';
    element.style.color = 'green';
  }
}

// ============================================
// Utility: Number formatting, Stepper, etc.
// ============================================
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
 * Adds comma formatting on the fly
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
        // Non-numeric
        this.value = this.value.substring(0, cursorPos - 1) + this.value.substring(cursorPos);
        this.selectionEnd = cursorPos - 1;
      }
      updateDeductionLimits();
    });
  }
}

// Pension + Life combined partial logic
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
      alert('ยอดรวมของเบี้ยประกันชีวิตและบำนาญไม่เกิน 300,000 บาท');
    }
  } else {
    pensionInput.value = formatNumber(pensionVal);
  }
  updateDeductionLimits();
}

// ============================================
// Deduction Limits & “สิทธิเต็ม” labels
// ============================================
function updateDeductionLimits() {
  const income = total_income || 0;

  // Insurance, health, etc.
  const lifeInsuranceLimit = 100000;
  const healthInsuranceLimit = 25000;
  const parentHealthLimit = 15000;
  const pensionInsuranceLimit = Math.min(income * 0.15, 200000);
  const pvdLimit = Math.min(income * 0.15, 500000);
  const gpfLimit = Math.min(income * 0.30, 500000);
  const ssfLimit = Math.min(income * 0.30, 200000);
  const rmfLimit = Math.min(income * 0.30, 500000);
  const thaiesgLimit = Math.min(income * 0.30, 300000);
  const socialEnterpriseLimit = 100000;
  const nsfLimit = 30000;
  const donationPoliticalLimit = 10000;
  const easyEreceiptLimit = 50000;
  const localTravelLimit = 15000;
  const homeLoanLimit = 100000;
  const newHomeLimit = 100000;

  // Retirement
  setLimitLabel('pension_insurance', 'pension_insurance_limit_label', pensionInsuranceLimit);
  setLimitLabel('pvd', 'pvd_limit_label', pvdLimit);
  setLimitLabel('gpf', 'gpf_limit_label', gpfLimit);
  setLimitLabel('ssf', 'ssf_limit_label', ssfLimit);
  setLimitLabel('rmf', 'rmf_limit_label', rmfLimit);
  setLimitLabel('nsf', 'nsf_limit_label', nsfLimit);

  // Others
  setLimitLabel('life_insurance', 'life_insurance_limit_label', lifeInsuranceLimit);
  setLimitLabel('health_insurance', 'health_insurance_limit_label', healthInsuranceLimit);
  setLimitLabel('parent_health_insurance', 'parent_health_insurance_limit_label', parentHealthLimit);
  setLimitLabel('thaiesg', 'thaiesg_limit_label', thaiesgLimit);
  setLimitLabel('social_enterprise', 'social_enterprise_limit_label', socialEnterpriseLimit);
  setLimitLabel('donation_political', 'donation_political_limit_label', donationPoliticalLimit);
  setLimitLabel('easy_ereceipt', 'easy_ereceipt_limit_label', easyEreceiptLimit);
  setLimitLabel('local_travel', 'local_travel_limit_label', localTravelLimit);
  setLimitLabel('home_loan_interest', 'home_loan_interest_limit_label', homeLoanLimit);
  setLimitLabel('new_home', 'new_home_limit_label', newHomeLimit);

  checkTotalRetirementFull();
}

/**
 * If total retirement usage ≥ 500k => “(สิทธิเต็ม)” on all retirement fields
 */
function checkTotalRetirementFull() {
  let totalUsed = getCurrentRetirementTotal();
  if (totalUsed >= MAX_TOTAL_RETIREMENT) {
    retirementFields.forEach((fieldId) => {
      let labelId = fieldId + '_limit_label';
      let labelElem = document.getElementById(labelId);
      if (labelElem) {
        labelElem.innerText = '(สิทธิเต็ม)';
        labelElem.style.color = 'red';
      }
    });
  }
}

/**
 * For retirement fields => show (current / leftover) or (สิทธิเต็ม).
 * For other fields => show (current / sub-limit) or (สิทธิเต็ม).
 */
function setLimitLabel(inputId, labelId, subLimit) {
  const inputElem = document.getElementById(inputId);
  const labelElem = document.getElementById(labelId);
  if (!inputElem || !labelElem) return;

  const currentValue = parseNumber(inputElem.value) || 0;

  if (retirementFields.includes(inputId)) {
    let leftover = MAX_TOTAL_RETIREMENT - getCurrentRetirementTotalExcluding(inputId);
    if (leftover < 0) leftover = 0;
    const effectiveLimit = Math.min(subLimit, leftover);

    if (effectiveLimit <= 0) {
      labelElem.innerText = '(สิทธิเต็ม)';
      labelElem.style.color = 'red';
    } else if (currentValue >= effectiveLimit) {
      labelElem.innerText = '(สิทธิเต็ม)';
      labelElem.style.color = 'red';
    } else {
      labelElem.innerText = `(${formatNumber(currentValue)} / ${formatNumber(effectiveLimit)})`;
      labelElem.style.color = '#888';
    }
  } else {
    // Non-retirement => normal
    if (currentValue >= subLimit) {
      labelElem.innerText = '(สิทธิเต็ม)';
      labelElem.style.color = 'red';
    } else {
      labelElem.innerText = `(${formatNumber(currentValue)} / ${formatNumber(subLimit)})`;
      labelElem.style.color = '#888';
    }
  }
}


/**
 * Populate children & disabled selects
 */
function populateChildrenOptions() {
  const childrenOwnSelect = document.getElementById('children_own');
  const childrenAdoptedSelect = document.getElementById('children_adopted');
  const disabledPersonsSelect = document.getElementById('disabled_persons');
  for (let i = 0; i <= 10; i++) {
    const optionOwn = document.createElement('option');
    optionOwn.value = i;
    optionOwn.text = i;
    if (i === 0) optionOwn.selected = true;
    if (childrenOwnSelect) childrenOwnSelect.add(optionOwn);

    const optionAdopted = document.createElement('option');
    optionAdopted.value = i;
    optionAdopted.text = i;
    if (i === 0) optionAdopted.selected = true;
    if (childrenAdoptedSelect) childrenAdoptedSelect.add(optionAdopted);

    const optionDisabled = document.createElement('option');
    optionDisabled.value = i;
    optionDisabled.text = i;
    if (i === 0) optionDisabled.selected = true;
    if (disabledPersonsSelect) disabledPersonsSelect.add(optionDisabled);
  }
}

// ============================================
// Print & Save as Image
// ============================================
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
