// deductions.js

// Retirement Fields: Real-Time Clamping
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
  const retirementFields = ['pension_insurance', 'pvd', 'gpf', 'rmf', 'ssf', 'nsf'];
  retirementFields.forEach((f) => {
    if (f !== excludeFieldId) {
      const elem = document.getElementById(f);
      if (elem) {
        total += parseNumber(elem.value) || 0;
      }
    }
  });
  return total;
}

function handleRetirementFieldChange(changedFieldId) {
  const changedElem = document.getElementById(changedFieldId);
  let typedVal = parseNumber(changedElem.value) || 0;
  const subLimit = getRetirementFieldLimit(changedFieldId, total_income);
  if (typedVal > subLimit) typedVal = subLimit;
  const sumOthers = getCurrentRetirementTotalExcluding(changedFieldId);
  const MAX_TOTAL_RETIREMENT = 500000;
  let newTotal = sumOthers + typedVal;
  if (newTotal > MAX_TOTAL_RETIREMENT) {
    typedVal = MAX_TOTAL_RETIREMENT - sumOthers;
    if (typedVal < 0) typedVal = 0;
  }
  changedElem.value = formatNumber(typedVal);
  updateRetirementDeductions();
  updateDeductionLimits();
}

function getCurrentRetirementTotal() {
  let sum = 0;
  const retirementFields = ['pension_insurance', 'pvd', 'gpf', 'rmf', 'ssf', 'nsf'];
  retirementFields.forEach((f) => {
    const elem = document.getElementById(f);
    if (elem) {
      sum += parseNumber(elem.value) || 0;
    }
  });
  return sum;
}

function updateRetirementDeductions() {
  const MAX_TOTAL_RETIREMENT = 500000;
  let total_retirement_contributions = getCurrentRetirementTotal();
  if (total_retirement_contributions > MAX_TOTAL_RETIREMENT) {
    total_retirement_contributions = MAX_TOTAL_RETIREMENT;
  }
}

// Other Deductions: Real-Time Clamping
function getOtherDeductionLimit(fieldId) {
  switch (fieldId) {
    case 'life_insurance':           return 100000;
    case 'health_insurance':         return 25000;
    case 'parent_health_insurance':  return 15000;
    case 'thaiesg':                  return Math.min(total_income * 0.30, 300000);
    case 'thaiesg_extra_transfer':   return Math.min(total_income * 0.30, 300000);
    case 'thaiesg_extra_new':        return Math.min(total_income * 0.30, 300000);
    case 'social_enterprise':        return 100000;
    case 'nsf':                      return 30000;
    case 'donation_political':       return 10000;
    case 'easy_ereceipt':            return 50000;
    case 'local_travel':             return 15000;
    case 'home_loan_interest':       return 100000;
    case 'new_home':                 return Number.MAX_VALUE;
    default:
      return Number.MAX_VALUE;
  }
}

function handleOtherDeductionFieldChange(changedFieldId) {
  const elem = document.getElementById(changedFieldId);
  let typedVal = parseNumber(elem.value) || 0;
  const subLimit = getOtherDeductionLimit(changedFieldId);
  if (typedVal > subLimit) typedVal = subLimit;
  if (changedFieldId === 'life_insurance' || changedFieldId === 'health_insurance') {
    const otherId = (changedFieldId === 'life_insurance') ? 'health_insurance' : 'life_insurance';
    let otherVal = parseNumber(document.getElementById(otherId).value) || 0;
    let combined = typedVal + otherVal;
    if (combined > 100000) {
      typedVal = 100000 - otherVal;
      if (typedVal < 0) typedVal = 0;
    }
  }
  elem.value = formatNumber(typedVal);
  updateDeductionLimits();
}

// Deduction Limits & “สิทธิเต็ม” labels
function updateDeductionLimits() {
  const income = total_income || 0;
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
  const donationPoliticalLimit = 10000;
  const easyEreceiptLimit = 50000;
  const localTravelLimit = 15000;
  const homeLoanLimit = 100000;
  const newHomeLimit = 100000;
  const nsfLimit = 30000;
  const socialSecurityCap = 9000; // For Social Security

  setLimitLabel('pension_insurance', 'pension_insurance_limit_label', pensionInsuranceLimit);
  setLimitLabel('pvd', 'pvd_limit_label', pvdLimit);
  setLimitLabel('gpf', 'gpf_limit_label', gpfLimit);
  if (selectedTaxYear === 2567) {
    setLimitLabel('ssf', 'ssf_limit_label', ssfLimit);
  } else {
    const ssfLabel = document.getElementById('ssf_limit_label');
    if (ssfLabel) {
      ssfLabel.innerText = 'ไม่สามารถซื้อเพิ่มได้';
      ssfLabel.style.color = 'red';
    }
  }
  setLimitLabel('rmf', 'rmf_limit_label', rmfLimit);
  setLimitLabel('nsf', 'nsf_limit_label', nsfLimit);

  setLimitLabel('life_insurance', 'life_insurance_limit_label', lifeInsuranceLimit);
  setLimitLabel('health_insurance', 'health_insurance_limit_label', healthInsuranceLimit);
  setLimitLabel('parent_health_insurance', 'parent_health_insurance_limit_label', parentHealthLimit);
  setLimitLabel('thaiesg', 'thaiesg_limit_label', Math.min(income * 0.30, 300000));
  // Updated limits for Thai ESG Extra fields
  setLimitLabel('thaiesg_extra_transfer', 'thaiesg_extra_transfer_limit_label', Math.min(income * 0.30, 300000));
  setLimitLabel('thaiesg_extra_new', 'thaiesg_extra_new_limit_label', Math.min(income * 0.30, 300000));
  
  setLimitLabel('social_enterprise', 'social_enterprise_limit_label', socialEnterpriseLimit);
  setLimitLabel('donation_political', 'donation_political_limit_label', donationPoliticalLimit);
  setLimitLabel('easy_ereceipt', 'easy_ereceipt_limit_label', easyEreceiptLimit);
  setLimitLabel('local_travel', 'local_travel_limit_label', localTravelLimit);
  setLimitLabel('home_loan_interest', 'home_loan_interest_limit_label', homeLoanLimit);
  setLimitLabel('new_home', 'new_home_limit_label', newHomeLimit);

  setLimitLabel('social_security', 'social_security_limit_label', socialSecurityCap);

  checkTotalRetirementFull();
}

function checkTotalRetirementFull() {
  const MAX_TOTAL_RETIREMENT = 500000;
  let totalUsed = getCurrentRetirementTotal();
  if (totalUsed >= MAX_TOTAL_RETIREMENT) {
    const retirementFields = ['pension_insurance', 'pvd', 'gpf', 'rmf', 'ssf', 'nsf'];
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

function setLimitLabel(inputId, labelId, subLimit) {
  const inputElem = document.getElementById(inputId);
  const labelElem = document.getElementById(labelId);
  if (!inputElem || !labelElem) return;
  const currentValue = parseNumber(inputElem.value) || 0;
  const retirementFields = ['pension_insurance', 'pvd', 'gpf', 'rmf', 'ssf', 'nsf'];
  if (retirementFields.includes(inputId)) {
    let leftover = 500000 - getCurrentRetirementTotalExcluding(inputId);
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
    if (currentValue >= subLimit) {
      labelElem.innerText = '(สิทธิเต็ม)';
      labelElem.style.color = 'red';
    } else {
      labelElem.innerText = `(${formatNumber(currentValue)} / ${formatNumber(subLimit)})`;
      labelElem.style.color = '#888';
    }
  }
}

function populateChildrenOptions() {
  const childrenOwnSelect = document.getElementById('children_own');
  const childrenAdoptedSelect = document.getElementById('children_adopted');
  const disabledPersonsSelect = document.getElementById('disabled_persons');
  for (let i = 0; i <= 10; i++) {
    if (childrenOwnSelect) {
      const optionOwn = document.createElement('option');
      optionOwn.value = i;
      optionOwn.text = i;
      if (i === 0) optionOwn.selected = true;
      childrenOwnSelect.add(optionOwn);
    }
    if (childrenAdoptedSelect) {
      const optionAdopted = document.createElement('option');
      optionAdopted.value = i;
      optionAdopted.text = i;
      if (i === 0) optionAdopted.selected = true;
      childrenAdoptedSelect.add(optionAdopted);
    }
    if (disabledPersonsSelect) {
      const optionDisabled = document.createElement('option');
      optionDisabled.value = i;
      optionDisabled.text = i;
      if (i === 0) optionDisabled.selected = true;
      disabledPersonsSelect.add(optionDisabled);
    }
  }
}
