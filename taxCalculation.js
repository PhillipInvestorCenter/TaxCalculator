// taxCalculation.js

// Income & Withholding Tax functions

function calculateTotalWithholdingTax() {
  // Get the calculation mode multiplier: 12 for "รายเดือน", 1 for "รายปี"
  let calcMode = document.getElementById('calc_mode').value;
  let multiplier = (calcMode === 'month') ? 12 : 1;
  
  let withholding1 = document.getElementById('rev_type_1').checked &&
                     document.getElementById('rev1_withholding_checkbox').checked
                     ? parseNumber(document.getElementById('rev1_withholding_input').value) * multiplier : 0;
  let withholding2 = document.getElementById('rev_type_2').checked &&
                     document.getElementById('rev2_withholding_checkbox').checked
                     ? parseNumber(document.getElementById('rev2_withholding_input').value) * multiplier : 0;
  let withholding3 = document.getElementById('rev_type_3').checked &&
                     document.getElementById('rev3_withholding_checkbox').checked
                     ? parseNumber(document.getElementById('rev3_withholding_input').value) * multiplier : 0;
  let withholding4 = document.getElementById('rev_type_4').checked &&
                     document.getElementById('rev4_withholding_checkbox').checked
                     ? parseNumber(document.getElementById('rev4_withholding_input').value) * multiplier : 0;
  let withholding5 = document.getElementById('rev_type_5').checked &&
                     document.getElementById('rev5_withholding_checkbox').checked
                     ? parseNumber(document.getElementById('rev5_withholding_input').value) * multiplier : 0;
  let withholding6 = document.getElementById('rev_type_6').checked &&
                     document.getElementById('rev6_withholding_checkbox').checked
                     ? parseNumber(document.getElementById('rev6_withholding_input').value) * multiplier : 0;
  let withholding7 = document.getElementById('rev_type_7').checked &&
                     document.getElementById('rev7_withholding_checkbox').checked
                     ? parseNumber(document.getElementById('rev7_withholding_input').value) * multiplier : 0;
                     
  return withholding1 + withholding2 + withholding3 + withholding4 + withholding5 + withholding6 + withholding7;
}

function calculateSocialSecurity() {
  if (document.getElementById('has_social_security').checked) {
    if (!socialSecurityManual) {
      let monthly_contribution = monthly_income * 0.05;
      monthly_contribution = Math.min(monthly_contribution, 750);
      let social_security = monthly_contribution * 12;
      social_security = Math.min(social_security, 9000);
      document.getElementById('social_security').value = formatNumber(social_security);
    }
  } else {
    document.getElementById('social_security').value = '0';
    socialSecurityManual = false;
  }
  if (typeof updateDeductionLimits === 'function') {
    updateDeductionLimits();
  }
}

function calculateTax() {
  // Clear error messages
  document.querySelectorAll('.error').forEach((el) => (el.innerText = ''));
  
  // ------------------- Personal Deductions -------------------
  let personal_allowance = 60000;
  let spouse = document.getElementById('spouse').value;
  let spouse_allowance = (spouse === 'yes') ? 60000 : 0;

  let children_own = parseInt(document.getElementById('children_own').value) || 0;
  let child_allowance = 0;
  for (let i = 1; i <= children_own; i++) {
    child_allowance += (i === 1) ? 30000 : 60000;
  }
  let children_adopted = parseInt(document.getElementById('children_adopted').value) || 0;
  if (children_adopted > 3) children_adopted = 3;
  child_allowance += children_adopted * 30000;

  let parents_allowance = 0;
  if (document.getElementById('your_father').checked) parents_allowance += 30000;
  if (document.getElementById('your_mother').checked) parents_allowance += 30000;
  if (document.getElementById('spouse_father').checked) parents_allowance += 30000;
  if (document.getElementById('spouse_mother').checked) parents_allowance += 30000;
  if (parents_allowance > 120000) parents_allowance = 120000;

  let disabled_persons = parseInt(document.getElementById('disabled_persons').value) || 0;
  let disabled_allowance = disabled_persons * 60000;

  let social_security = 0;
  if (document.getElementById('has_social_security').checked) {
    social_security = parseNumber(document.getElementById('social_security').value);
  }

  let total_personal_deductions = personal_allowance + spouse_allowance + child_allowance +
    parents_allowance + disabled_allowance + social_security;

  // ------------------- Investment Deductions -------------------
  let total_investment_deductions = 0;
  let retirement_total = 0;
  let insurance_total = 0;
  let parent_health_val = 0;
  
  if (document.getElementById('has_insurance').checked) {
    let life_val = parseNumber(document.getElementById('life_insurance').value);
    let health_val = parseNumber(document.getElementById('health_insurance').value);
    insurance_total = Math.min(life_val + health_val, 100000);
    parent_health_val = parseNumber(document.getElementById('parent_health_insurance').value);
    
    let pensionVal = parseNumber(document.getElementById('pension_insurance').value);
    let pvdVal = parseNumber(document.getElementById('pvd').value);
    let gpfVal = parseNumber(document.getElementById('gpf').value);
    let ssfVal = 0;
    if (selectedTaxYear === 2567) {
      ssfVal = parseNumber(document.getElementById('ssf').value) || 0;
    }
    let rmfVal = parseNumber(document.getElementById('rmf').value);
    let thaiesgVal = parseNumber(document.getElementById('thaiesg').value);
    let socialEntVal = parseNumber(document.getElementById('social_enterprise').value);
    let nsfVal = parseNumber(document.getElementById('nsf').value);

    retirement_total = pensionVal + pvdVal + gpfVal + rmfVal + ssfVal + nsfVal;
    if (retirement_total > 500000) {
      retirement_total = 500000;
    }
    
    // For Tax Year 2568, include the two new Thai ESG Extra deductions.
    // Each field is clamped to the lower of 300,000 or 30% of total income.
    let thaiesgExtraTransferVal = 0;
    let thaiesgExtraNewVal = 0;
    if (selectedTaxYear === 2568) {
      thaiesgExtraTransferVal = parseNumber(document.getElementById('thaiesg_extra_transfer').value) || 0;
      thaiesgExtraNewVal = parseNumber(document.getElementById('thaiesg_extra_new').value) || 0;
      let maxExtraLimit = Math.min(300000, total_income * 0.30);
      thaiesgExtraTransferVal = Math.min(thaiesgExtraTransferVal, maxExtraLimit);
      thaiesgExtraNewVal = Math.min(thaiesgExtraNewVal, maxExtraLimit);
    }
    
    total_investment_deductions = insurance_total + parent_health_val + retirement_total +
      thaiesgVal + thaiesgExtraTransferVal + thaiesgExtraNewVal + socialEntVal;
  }

  // ------------------- Donation and Stimulus Deductions -------------------
  let total_donation_deductions = 0;
  if (document.getElementById('has_donation').checked) {
    let donationVal = parseNumber(document.getElementById('donation').value);
    let donationEdu = parseNumber(document.getElementById('donation_education').value) * 2;
    let donationPolit = parseNumber(document.getElementById('donation_political').value);
    donationPolit = Math.min(donationPolit, 10000);
    total_donation_deductions = donationVal + donationEdu + donationPolit;
  }

  let total_stimulus_deductions = 0;
  if (document.getElementById('has_stimulus').checked) {
    let easyVal = parseNumber(document.getElementById('easy_ereceipt').value);
    let localVal = parseNumber(document.getElementById('local_travel').value);
    let homeLoanVal = parseNumber(document.getElementById('home_loan_interest').value);
    let newHomeVal = parseNumber(document.getElementById('new_home').value);
    // E.g., every 1,000,000 => 10,000
    let newHomeDeduction = Math.floor(newHomeVal / 1000000) * 10000;
    if (newHomeDeduction > 100000) newHomeDeduction = 100000;
    total_stimulus_deductions = easyVal + localVal + homeLoanVal + newHomeDeduction;
  }
  
  // ------------------- Total Deductions and Net Income -------------------
  let total_deductions = expense +
    total_personal_deductions +
    total_investment_deductions +
    total_stimulus_deductions +
    total_donation_deductions;
  
  let taxable_income = total_income - total_deductions;
  if (taxable_income < 0) taxable_income = 0;
  
  // Clamp donation if > 10% of taxable_income
  if (document.getElementById('has_donation').checked) {
    let donationLimit = taxable_income * 0.10;
    if (total_donation_deductions > donationLimit) {
      total_donation_deductions = donationLimit;
    }
  }
  total_deductions = expense +
    total_personal_deductions +
    total_investment_deductions +
    total_stimulus_deductions +
    total_donation_deductions;
  
  let net_income = total_income - total_deductions;
  if (net_income < 0) net_income = 0;
  
  // ------------------- Progressive Tax Calculation -------------------
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
  
  // Effective Tax Rate
  let effective_tax_rate = 0;
  if (total_income > 0) {
    effective_tax_rate = (tax / total_income) * 100;
  }
  
  // ------------------- Fill in Summary Fields -------------------
  // Basic results
  document.getElementById('result_total_income').innerText = formatNumber(total_income);
  document.getElementById('result_expense').innerText = formatNumber(expense);
  document.getElementById('result_deductions').innerText = formatNumber(total_deductions - expense);
  document.getElementById('result_net_income').innerText = formatNumber(net_income);
  document.getElementById('result_effective_tax_rate').innerText = effective_tax_rate.toFixed(2) + '%';

  // Show the tax (before withholding) in new field "result_tax_before_wh"
  const taxBeforeWH = document.getElementById('result_tax_before_wh');
  if (taxBeforeWH) {
    taxBeforeWH.innerText = formatNumber(tax);
  }

  // Withholding Tax
  total_withholding_tax = calculateTotalWithholdingTax();
  document.getElementById('result_withholding_tax').innerText = formatNumber(total_withholding_tax);

  // ------------------- Final Net Tax Due or Refund -------------------
  let X = tax - total_withholding_tax;
  const taxSummaryDiv = document.getElementById('tax_summary');
  const taxDueReal = document.getElementById('tax_due_real');
  const taxCreditRefund = document.getElementById('tax_credit_refund');

  if (X > 0) {
    // "ภาษีที่ต้องชำระจริง" on the left, numeric value on the right (red)
    taxDueReal.innerText = 'ภาษีที่ต้องชำระจริง';
    taxCreditRefund.innerText = formatNumber(X);
    taxCreditRefund.style.color = 'red';
  } else if (X < 0) {
    // "ท่านต้องขอเครดิตคืน" on the left, numeric value on the right (green)
    taxDueReal.innerText = 'ท่านต้องขอเครดิตคืน';
    taxCreditRefund.innerText = formatNumber(Math.abs(X));
    taxCreditRefund.style.color = 'green';
  } else {
    // "ท่านไม่ต้องจ่ายภาษี!" on the left, nothing on the right (default #333)
    taxDueReal.innerText = 'ท่านไม่ต้องจ่ายภาษี!';
    taxCreditRefund.innerText = '';
    taxCreditRefund.style.color = '#333';
  }  
  
  // ------------------- Determine Max Bracket Rate -------------------
  let maxTaxRate = 0;
  if (net_income > 5000000) {
    maxTaxRate = 35;
  } else if (net_income > 2000000) {
    maxTaxRate = 30;
  } else if (net_income > 1000000) {
    maxTaxRate = 25;
  } else if (net_income > 750000) {
    maxTaxRate = 20;
  } else if (net_income > 500000) {
    maxTaxRate = 15;
  } else if (net_income > 300000) {
    maxTaxRate = 10;
  } else if (net_income > 150000) {
    maxTaxRate = 5;
  } else {
    maxTaxRate = 0;
  }
  const maxTaxRateElem = document.getElementById('result_max_tax_rate');
  if (maxTaxRateElem) {
    maxTaxRateElem.innerText = maxTaxRate + '%';
  }
  
  // ------------------- Compute leftover for recommended investments -------------------
  // 1) SSF leftover (only if year 2567)
  let leftoverSSF = 0;
  if (selectedTaxYear === 2567) {
    const ssfLimit = Math.min(total_income * 0.30, 200000);
    const currentSSF = parseNumber(document.getElementById('ssf').value);
    leftoverSSF = ssfLimit - currentSSF;
    if (leftoverSSF < 0) leftoverSSF = 0;
  }
  
  // 2) RMF leftover with overall retirement cap considered
  const rmfIndividualLimit = Math.min(total_income * 0.30, 500000);
  const currentRMF = parseNumber(document.getElementById('rmf').value);

  let pensionVal = parseNumber(document.getElementById('pension_insurance').value);
  let pvdVal = parseNumber(document.getElementById('pvd').value);
  let gpfVal = parseNumber(document.getElementById('gpf').value);
  let ssfVal = (selectedTaxYear === 2567) ? parseNumber(document.getElementById('ssf').value) || 0 : 0;
  let nsfVal = parseNumber(document.getElementById('nsf').value);

  // Calculate the total retirement contributions excluding RMF
  let totalRetirementWithoutRMF = pensionVal + pvdVal + gpfVal + ssfVal + nsfVal;
  const overallCap = 500000;

  // Calculate the additional amount allowed under the overall retirement cap
  let allowedOverallAdditional = overallCap - (totalRetirementWithoutRMF + currentRMF);
  if (allowedOverallAdditional < 0) allowedOverallAdditional = 0;

  // The leftover RMF investment is the minimum between the individual RMF limit remaining and the overall cap allowance.
  let leftoverRMF = Math.min(rmfIndividualLimit - currentRMF, allowedOverallAdditional);
  if (leftoverRMF < 0) leftoverRMF = 0;
  
  // 3) ThaiESG leftover
  const thaiesgLimit = Math.min(total_income * 0.30, 300000);
  const currentThaiesg = parseNumber(document.getElementById('thaiesg').value);
  let leftoverThaiesg = thaiesgLimit - currentThaiesg;
  if (leftoverThaiesg < 0) leftoverThaiesg = 0;
  
  // ------------------- Update recommended investments display -------------------
  if (selectedTaxYear === 2567) {
    updateInvestmentDisplay('max_ssf', leftoverSSF);
    document.getElementById('max_ssf').parentElement.style.display = 'block';
  } else {
    // Hide SSF recommendation for tax year 2568
    document.getElementById('max_ssf').parentElement.style.display = 'none';
  }
  updateInvestmentDisplay('max_rmf', leftoverRMF);
  updateInvestmentDisplay('max_thaiesg', leftoverThaiesg);
  
  if (selectedTaxYear === 2568) {
    const thaiesgExtraNewLimit = Math.min(300000, total_income * 0.30);
    const currentThaiesgExtraNew = parseNumber(document.getElementById('thaiesg_extra_new').value);
    let leftoverThaiesgExtraNew = thaiesgExtraNewLimit - currentThaiesgExtraNew;
    if (leftoverThaiesgExtraNew < 0) leftoverThaiesgExtraNew = 0;
    updateInvestmentDisplay('max_thaiesg_extra_new', leftoverThaiesgExtraNew);
    document.getElementById('max_thaiesg_extra_container').style.display = 'block';
  } else {
    document.getElementById('max_thaiesg_extra_container').style.display = 'none';
  }
  
  // Finish: Go to Step 4 to show summary
  isTaxCalculated = true;
  setActiveStep(4);
  showStep(4);
}
