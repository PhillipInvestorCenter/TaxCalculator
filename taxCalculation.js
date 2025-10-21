// taxCalculation.js

// -------- Withholding Tax Total --------
function calculateTotalWithholdingTax() {
  const calcMode = document.getElementById('calc_mode').value;
  const m = (calcMode === 'month') ? 12 : 1;

  const w1 = document.getElementById('rev_type_1').checked && document.getElementById('rev1_withholding_checkbox').checked ? parseNumber(document.getElementById('rev1_withholding_input').value) * m : 0;
  const w2 = document.getElementById('rev_type_2').checked && document.getElementById('rev2_withholding_checkbox').checked ? parseNumber(document.getElementById('rev2_withholding_input').value) * m : 0;
  const w3 = document.getElementById('rev_type_3').checked && document.getElementById('rev3_withholding_checkbox').checked ? parseNumber(document.getElementById('rev3_withholding_input').value) * m : 0;
  const w4 = document.getElementById('rev_type_4').checked && document.getElementById('rev4_withholding_checkbox').checked ? parseNumber(document.getElementById('rev4_withholding_input').value) * m : 0;
  const w5 = document.getElementById('rev_type_5').checked && document.getElementById('rev5_withholding_checkbox').checked ? parseNumber(document.getElementById('rev5_withholding_input').value) * m : 0;
  const w6 = document.getElementById('rev_type_6').checked && document.getElementById('rev6_withholding_checkbox').checked ? parseNumber(document.getElementById('rev6_withholding_input').value) * m : 0;
  const w7 = document.getElementById('rev_type_7').checked && document.getElementById('rev7_withholding_checkbox').checked ? parseNumber(document.getElementById('rev7_withholding_input').value) * m : 0;
  const w8 = document.getElementById('rev_type_8').checked && document.getElementById('rev8_withholding_checkbox').checked ? parseNumber(document.getElementById('rev8_withholding_input').value) * m : 0;

  return w1 + w2 + w3 + w4 + w5 + w6 + w7 + w8;
}

// -------- Social Security (auto unless manual) --------
function calculateSocialSecurity() {
  if (document.getElementById('has_social_security').checked) {
    if (!socialSecurityManual) {
      let monthly = monthly_income * 0.05;
      monthly = Math.min(monthly, 750);
      let ss = monthly * 12;
      ss = Math.min(ss, 9000);
      document.getElementById('social_security').value = formatNumber(ss);
    }
  } else {
    document.getElementById('social_security').value = '0';
    socialSecurityManual = false;
  }
  if (typeof updateDeductionLimits === 'function') updateDeductionLimits();
}

/* ========================= Helpers for breakdown ========================= */

function computeExpenseBreakdown() {
  const mul = (document.getElementById('calc_mode').value === 'month') ? 12 : 1;
  const items = [];

  const e12 = Math.min((rev1_amt + rev2_amt) * 0.5, 100000);
  if (e12 > 0) items.push(['ประเภท 1–2 (หักเหมา)', e12]);

  if (document.getElementById('rev_type_3').checked) {
    const c3 = document.querySelector('input[name="expense_choice_3"]:checked');
    const e3 = (c3 && c3.value === 'actual')
      ? (parseNumber(document.getElementById('expense_actual_3')?.value) || 0)
      : Math.min(rev3_amt * 0.5, 100000);
    if (e3 > 0) items.push(['ประเภท 3 (' + ((c3 && c3.value === 'actual') ? 'ตามจริง' : 'หักเหมา') + ')', e3]);
  }

  if (document.getElementById('rev_type_5').checked) {
    const c5 = document.querySelector('input[name="expense_choice_5"]:checked');
    let e5 = 0;
    if (c5 && c5.value === 'actual') {
      e5 = parseNumber(document.getElementById('expense_actual_5')?.value) || 0;
    } else {
      if (document.getElementById('rev5_sub_1').checked) e5 += parseNumber(document.getElementById('rev5_sub1_amount').value) * mul * 0.30;
      if (document.getElementById('rev5_sub_2').checked) e5 += parseNumber(document.getElementById('rev5_sub2_amount').value) * mul * 0.20;
      if (document.getElementById('rev5_sub_3').checked) e5 += parseNumber(document.getElementById('rev5_sub3_amount').value) * mul * 0.15;
      if (document.getElementById('rev5_sub_4').checked) e5 += parseNumber(document.getElementById('rev5_sub4_amount').value) * mul * 0.30;
      if (document.getElementById('rev5_sub_5').checked) e5 += parseNumber(document.getElementById('rev5_sub5_amount').value) * mul * 0.10;
    }
    if (e5 > 0) items.push(['ประเภท 5 (' + ((c5 && c5.value === 'actual') ? 'ตามจริง' : 'หักเหมา') + ')', e5]);
  }

  if (document.getElementById('rev_type_6').checked) {
    const c6 = document.querySelector('input[name="expense_choice_6"]:checked');
    let e6 = 0;
    if (c6 && c6.value === 'actual') {
      e6 = parseNumber(document.getElementById('expense_actual_6')?.value) || 0;
    } else {
      if (document.getElementById('rev6_sub_1').checked) e6 += parseNumber(document.getElementById('rev6_sub1_amount').value) * mul * 0.60;
      if (document.getElementById('rev6_sub_2').checked) e6 += parseNumber(document.getElementById('rev6_sub2_amount').value) * mul * 0.30;
    }
    if (e6 > 0) items.push(['ประเภท 6 (' + ((c6 && c6.value === 'actual') ? 'ตามจริง' : 'หักเหมา') + ')', e6]);
  }

  if (document.getElementById('rev_type_7').checked) {
    const c7 = document.querySelector('input[name="expense_choice_7"]:checked');
    const base7 = parseNumber(document.getElementById('rev7_amount')?.value) || 0;
    const e7 = (c7 && c7.value === 'actual')
      ? (parseNumber(document.getElementById('expense_actual_7')?.value) || 0)
      : base7 * mul * 0.60;
    if (e7 > 0) items.push(['ประเภท 7 (' + ((c7 && c7.value === 'actual') ? 'ตามจริง' : 'หักเหมา') + ')', e7]);
  }

  if (document.getElementById('rev_type_8').checked) {
    const c8 = document.querySelector('input[name="expense_choice_8"]:checked');
    let e8 = 0;
    if (c8 && c8.value === 'actual') {
      e8 = parseNumber(document.getElementById('expense_actual_8')?.value) || 0;
    } else {
      const rateChoice = document.querySelector('input[name="standard_rate_choice_8"]:checked');
      const rate = (rateChoice && rateChoice.value === '60') ? 0.60 : 0.40;
      e8 = (parseNumber(document.getElementById('rev8_amount')?.value) || 0) * mul * rate;
    }
    if (e8 > 0) items.push(['ประเภท 8 (' + ((c8 && c8.value === 'actual') ? 'ตามจริง' : 'หักเหมา') + ')', e8]);
  }

  return items;
}

function buildDeductionItemsUsed(ctx) {
  const items = [];
  if (ctx.personal_allowance > 0) items.push(['ส่วนตัว', ctx.personal_allowance]);
  if (ctx.spouse_allowance > 0) items.push(['คู่สมรสไม่มีรายได้', ctx.spouse_allowance]);
  if (ctx.child_allowance > 0) items.push(['บุตร', ctx.child_allowance]);
  if (ctx.parents_allowance > 0) items.push(['อุปการะบิดามารดา', ctx.parents_allowance]);
  if (ctx.disabled_allowance > 0) items.push(['ผู้พิการ/ทุพพลภาพ', ctx.disabled_allowance]);
  if (ctx.social_security > 0) items.push(['ประกันสังคม', ctx.social_security]);

  if (ctx.life_val > 0) items.push(['ประกันชีวิต', ctx.life_val]);
  if (ctx.health_val > 0) items.push(['ประกันสุขภาพ', ctx.health_val]);
  if (ctx.parent_health_val > 0) items.push(['ประกันสุขภาพบิดามารดา', ctx.parent_health_val]);

  if (ctx.pensionVal > 0) items.push(['ประกันชีวิตแบบบำนาญ', ctx.pensionVal]);
  if (ctx.pvdVal > 0) items.push(['PVD', ctx.pvdVal]);
  if (ctx.gpfVal > 0) items.push(['กบข.', ctx.gpfVal]);
  if (ctx.rmfVal > 0) items.push(['RMF', ctx.rmfVal]);
  if (ctx.nsfVal > 0) items.push(['กอช.', ctx.nsfVal]);

  if (ctx.thaiesgVal > 0) items.push(['Thai ESG', ctx.thaiesgVal]);
  if (ctx.thaiesgExtraTransferVal > 0) items.push(['Thai ESG Extra (โอน LTF)', ctx.thaiesgExtraTransferVal]);
  if (ctx.thaiesgExtraNewVal > 0) items.push(['Thai ESG Extra (ซื้อปี 2568)', ctx.thaiesgExtraNewVal]);

  if (ctx.socialEntVal > 0) items.push(['ลงทุน Social Enterprise', ctx.socialEntVal]);

  if (ctx.total_donation_deductions > 0) {
    if (ctx.donation_capped) items.push(['บริจาค (ตามเพดาน 10%)', ctx.total_donation_deductions]);
    else {
      if (ctx.donationVal > 0) items.push(['บริจาคทั่วไป', ctx.donationVal]);
      if (ctx.donationEdu2x > 0) items.push(['บริจาคเพื่อการศึกษา (x2)', ctx.donationEdu2x]);
      if (ctx.donationPolit > 0) items.push(['บริจาคพรรคการเมือง', ctx.donationPolit]);
    }
  }

  if (ctx.easyVal > 0) items.push(['Easy e-Receipt', ctx.easyVal]);
  if (ctx.localVal > 0) items.push(['เที่ยวเมืองรอง', ctx.localVal]);
  if (ctx.homeLoanVal > 0) items.push(['ดอกเบี้ยกู้ซื้อที่อยู่อาศัย', ctx.homeLoanVal]);
  if (ctx.newHomeDeduction > 0) items.push(['ซื้อบ้านใหม่ (สิทธิที่ใช้ได้)', ctx.newHomeDeduction]);
  if (ctx.solarVal > 0) items.push(['Solar Rooftop', ctx.solarVal]);

  return items;
}

function renderDeductionBreakdown(expenseItems, deductionItems) {
  const expBox = document.getElementById('breakdown_expense');
  const dedBox = document.getElementById('breakdown_deductions');

  if (expBox) {
    expBox.innerHTML = expenseItems.map(([label, val]) =>
      `<div class="mini-row"><div class="mini-label">${label}</div><div class="mini-value">${formatNumber(val)}</div></div>`
    ).join('') || '<div class="mini-row"><div class="mini-label">ไม่มี</div><div class="mini-value">0</div></div>';
  }
  if (dedBox) {
    dedBox.innerHTML = deductionItems.map(([label, val]) =>
      `<div class="mini-row"><div class="mini-label">${label}</div><div class="mini-value">${formatNumber(val)}</div></div>`
    ).join('') || '<div class="mini-row"><div class="mini-label">ไม่มี</div><div class="mini-value">0</div></div>';
  }

  const t = document.getElementById('toggle_deduction_breakdown');
  const p = document.getElementById('deduction_breakdown');
  if (t && p) { t.classList.remove('open'); t.setAttribute('aria-expanded', 'false'); p.style.display = 'none'; }
}

/* =============================== Main calc =============================== */

function calculateTax() {
  document.querySelectorAll('.error').forEach((el) => (el.innerText = ''));

  const personal_allowance = 60000;
  const spouse = document.getElementById('spouse').value;
  let spouse_allowance = (spouse === 'yes') ? 60000 : 0;

  const children_own = parseInt(document.getElementById('children_own').value) || 0;
  let child_allowance = 0;
  for (let i = 1; i <= children_own; i++) child_allowance += (i === 1) ? 30000 : 60000;

  let children_adopted = parseInt(document.getElementById('children_adopted').value) || 0;
  if (children_adopted > 3) children_adopted = 3;
  child_allowance += children_adopted * 30000;

  let parents_allowance = 0;
  if (document.getElementById('your_father').checked) parents_allowance += 30000;
  if (document.getElementById('your_mother').checked) parents_allowance += 30000;
  if (document.getElementById('spouse_father').checked) parents_allowance += 30000;
  if (document.getElementById('spouse_mother').checked) parents_allowance += 30000;
  if (parents_allowance > 120000) parents_allowance = 120000;

  const disabled_persons = parseInt(document.getElementById('disabled_persons').value) || 0;
  const disabled_allowance = disabled_persons * 60000;

  let social_security = 0;
  if (document.getElementById('has_social_security').checked) social_security = parseNumber(document.getElementById('social_security').value);

  const total_personal_deductions =
    personal_allowance + spouse_allowance + child_allowance + parents_allowance + disabled_allowance + social_security;

  // insurance + investment
  let total_investment_deductions = 0;
  let retirement_total = 0;
  let insurance_total = 0;
  let parent_health_val = 0;

  let life_val = 0, health_val = 0;
  let pensionVal = 0, pvdVal = 0, gpfVal = 0, rmfVal = 0, nsfVal = 0;
  let thaiesgVal = 0, thaiesgExtraTransferVal = 0, thaiesgExtraNewVal = 0, socialEntVal = 0;

  if (document.getElementById('has_insurance').checked) {
    life_val = parseNumber(document.getElementById('life_insurance').value);
    health_val = parseNumber(document.getElementById('health_insurance').value);
    insurance_total = Math.min(life_val + health_val, 100000);

    parent_health_val = parseNumber(document.getElementById('parent_health_insurance').value);

    pensionVal = parseNumber(document.getElementById('pension_insurance').value);
    pvdVal     = parseNumber(document.getElementById('pvd').value);
    gpfVal     = parseNumber(document.getElementById('gpf').value);
    rmfVal     = parseNumber(document.getElementById('rmf').value);
    nsfVal     = parseNumber(document.getElementById('nsf').value);

    retirement_total = pensionVal + pvdVal + gpfVal + rmfVal + nsfVal;
    if (retirement_total > 500000) retirement_total = 500000;

    thaiesgVal = parseNumber(document.getElementById('thaiesg').value);
    thaiesgExtraTransferVal = parseNumber(document.getElementById('thaiesg_extra_transfer').value) || 0;
    thaiesgExtraNewVal = parseNumber(document.getElementById('thaiesg_extra_new').value) || 0;
    const maxExtraLimit = Math.min(300000, total_income * 0.30);
    thaiesgExtraTransferVal = Math.min(thaiesgExtraTransferVal, maxExtraLimit);
    thaiesgExtraNewVal = Math.min(thaiesgExtraNewVal, maxExtraLimit);

    socialEntVal = parseNumber(document.getElementById('social_enterprise').value);

    total_investment_deductions = insurance_total + parent_health_val + retirement_total +
      thaiesgVal + thaiesgExtraTransferVal + thaiesgExtraNewVal + socialEntVal;
  }

  // donation + stimulus
  let donationVal = 0, donationEdu2x = 0, donationPolit = 0;
  let total_donation_deductions = 0;
  if (document.getElementById('has_donation').checked) {
    donationVal = parseNumber(document.getElementById('donation').value);
    donationEdu2x = parseNumber(document.getElementById('donation_education').value) * 2;
    donationPolit = parseNumber(document.getElementById('donation_political').value);
    donationPolit = Math.min(donationPolit, 10000);
    total_donation_deductions = donationVal + donationEdu2x + donationPolit;
  }
  const donationRawTotal = total_donation_deductions;

  let total_stimulus_deductions = 0;
  let easyVal = 0, localVal = 0, homeLoanVal = 0, newHomeVal = 0, newHomeDeduction = 0, solarVal = 0;
  if (document.getElementById('has_stimulus').checked) {
    easyVal = parseNumber(document.getElementById('easy_ereceipt').value);
    localVal = parseNumber(document.getElementById('local_travel').value);
    homeLoanVal = parseNumber(document.getElementById('home_loan_interest').value);
    newHomeVal = parseNumber(document.getElementById('new_home').value);
    newHomeDeduction = Math.floor(newHomeVal / 1000000) * 10000;
    if (newHomeDeduction > 100000) newHomeDeduction = 100000;
    solarVal = parseNumber(document.getElementById('solar_rooftop').value);
    total_stimulus_deductions = easyVal + localVal + homeLoanVal + newHomeDeduction + solarVal;
  }

  let total_deductions =
    expense +
    total_personal_deductions +
    total_investment_deductions +
    total_stimulus_deductions +
    total_donation_deductions;

  let taxable_income = total_income - total_deductions;
  if (taxable_income < 0) taxable_income = 0;

  let donationLimit = 0;
  let donationWasCapped = false;
  if (document.getElementById('has_donation').checked) {
    donationLimit = taxable_income * 0.10;
    if (total_donation_deductions > donationLimit) {
      total_donation_deductions = donationLimit;
      donationWasCapped = (donationRawTotal > donationLimit);
    }
  }

  total_deductions =
    expense +
    total_personal_deductions +
    total_investment_deductions +
    total_stimulus_deductions +
    total_donation_deductions;

  let net_income = total_income - total_deductions;
  if (net_income < 0) net_income = 0;

  let tax = 0;
  if (net_income <= 150000) tax = 0;
  else if (net_income <= 300000) tax = (net_income - 150000) * 0.05;
  else if (net_income <= 500000) tax = ((net_income - 300000) * 0.10) + 7500;
  else if (net_income <= 750000) tax = ((net_income - 500000) * 0.15) + 27500;
  else if (net_income <= 1000000) tax = ((net_income - 750000) * 0.20) + 65000;
  else if (net_income <= 2000000) tax = ((net_income - 1000000) * 0.25) + 115000;
  else if (net_income <= 5000000) tax = ((net_income - 2000000) * 0.30) + 365000;
  else tax = ((net_income - 5000000) * 0.35) + 1265000;

  let effective_tax_rate = 0;
  if (total_income > 0) effective_tax_rate = (tax / total_income) * 100;

  document.getElementById('result_total_income').innerText = formatNumber(total_income);
  document.getElementById('result_expense').innerText = formatNumber(expense);
  document.getElementById('result_deductions').innerText = formatNumber(total_deductions - expense);
  document.getElementById('result_net_income').innerText = formatNumber(net_income);
  document.getElementById('result_effective_tax_rate').innerText = effective_tax_rate.toFixed(2) + '%';

  const taxBeforeWH = document.getElementById('result_tax_before_wh');
  if (taxBeforeWH) taxBeforeWH.innerText = formatNumber(tax);

  total_withholding_tax = calculateTotalWithholdingTax();
  document.getElementById('result_withholding_tax').innerText = formatNumber(total_withholding_tax);

  const X = tax - total_withholding_tax;
  const taxDueReal = document.getElementById('tax_due_real');
  const taxCreditRefund = document.getElementById('tax_credit_refund');

  if (X > 0) { taxDueReal.innerText = 'ภาษีที่ต้องชำระจริง'; taxCreditRefund.innerText = formatNumber(X); taxCreditRefund.style.color = 'red'; }
  else if (X < 0) { taxDueReal.innerText = 'ท่านต้องขอเครดิตคืน'; taxCreditRefund.innerText = formatNumber(Math.abs(X)); taxCreditRefund.style.color = 'green'; }
  else { taxDueReal.innerText = 'ท่านไม่ต้องจ่ายภาษี!'; taxCreditRefund.innerText = ''; taxCreditRefund.style.color = '#333'; }

  let maxTaxRate = 0;
  if (net_income > 5000000) maxTaxRate = 35;
  else if (net_income > 2000000) maxTaxRate = 30;
  else if (net_income > 1000000) maxTaxRate = 25;
  else if (net_income > 750000) maxTaxRate = 20;
  else if (net_income > 500000) maxTaxRate = 15;
  else if (net_income > 300000) maxTaxRate = 10;
  else if (net_income > 150000) maxTaxRate = 5;
  else maxTaxRate = 0;
  const maxTaxRateElem = document.getElementById('result_max_tax_rate');
  if (maxTaxRateElem) maxTaxRateElem.innerText = maxTaxRate + '%';

  // Hide SSF
  const ssfRow = document.getElementById('max_ssf') && document.getElementById('max_ssf').parentElement;
  if (ssfRow) ssfRow.style.display = 'none';

  // RMF cap
  const rmfIndividualLimit = Math.min(total_income * 0.30, 500000);
  const currentRMF = parseNumber(document.getElementById('rmf').value);
  pensionVal = parseNumber(document.getElementById('pension_insurance').value);
  pvdVal     = parseNumber(document.getElementById('pvd').value);
  gpfVal     = parseNumber(document.getElementById('gpf').value);
  nsfVal     = parseNumber(document.getElementById('nsf').value);
  const totalRetirementWithoutRMF = pensionVal + pvdVal + gpfVal + nsfVal;
  const overallCap = 500000;
  let allowedOverallAdditional = overallCap - (totalRetirementWithoutRMF + currentRMF);
  if (allowedOverallAdditional < 0) allowedOverallAdditional = 0;
  let leftoverRMF = Math.min(rmfIndividualLimit - currentRMF, allowedOverallAdditional);
  if (leftoverRMF < 0) leftoverRMF = 0;
  updateInvestmentDisplay('max_rmf', leftoverRMF);

  const thaiesgLimit = Math.min(total_income * 0.30, 300000);
  const currentThaiesg = parseNumber(document.getElementById('thaiesg').value);
  let leftoverThaiesg = thaiesgLimit - currentThaiesg;
  if (leftoverThaiesg < 0) leftoverThaiesg = 0;
  updateInvestmentDisplay('max_thaiesg', leftoverThaiesg);

  const extraEl = document.getElementById('max_thaiesg_extra_new');
  if (extraEl) { extraEl.innerText = 'ไม่สามารถซื้อเพิ่มได้'; extraEl.style.color = 'red'; }
  const extraBox = document.getElementById('max_thaiesg_extra_container');
  if (extraBox) extraBox.style.display = 'block';

  const expenseItems = computeExpenseBreakdown();
  const ctx = {
    personal_allowance, spouse_allowance, child_allowance, parents_allowance, disabled_allowance, social_security,
    life_val, health_val, parent_health_val,
    pensionVal, pvdVal, gpfVal, rmfVal, nsfVal,
    thaiesgVal, thaiesgExtraTransferVal, thaiesgExtraNewVal, socialEntVal,
    donationVal, donationEdu2x, donationPolit, total_donation_deductions, donation_capped: donationWasCapped,
    easyVal, localVal, homeLoanVal, newHomeDeduction, solarVal,
  };
  const deductionItems = buildDeductionItemsUsed(ctx);
  renderDeductionBreakdown(expenseItems, deductionItems);

  isTaxCalculated = true;
  setActiveStep(4);
  showStep(4);

  renderTaxWaterfall(total_income, net_income, expense, personal_allowance);

  try { if (typeof postLog === 'function') postLog(); } catch (_){}
}

/* ====================== Waterfall stacked by tax bracket ===================== */
function renderTaxWaterfall(totalIncome, netIncome, expenseVal, personalAllowance){
  const el = document.getElementById('tax_waterfall');
  if (!el || typeof Chart === 'undefined') return;

  Chart.defaults.font.family = "'Kanit', sans-serif";
  Chart.defaults.font.size = 12;

  // Tax brackets
  const BRACKETS = [
    { label:'0%',  size:150000,  rate:0.00 },
    { label:'5%',  size:150000,  rate:0.05 },
    { label:'10%', size:200000,  rate:0.10 },
    { label:'15%', size:250000,  rate:0.15 },
    { label:'20%', size:250000,  rate:0.20 },
    { label:'25%', size:1000000, rate:0.25 },
    { label:'30%', size:3000000, rate:0.30 },
    { label:'35%', size:Number.POSITIVE_INFINITY, rate:0.35 }
  ];

  // Allocate net income into reached brackets
  let remain = netIncome;
  const used = [];
  for (const b of BRACKETS){
    if (remain <= 0) break;
    const inc = Math.max(0, Math.min(remain, b.size));
    used.push({ label:b.label, income:inc - inc*b.rate, tax:inc*b.rate, total:inc });
    remain -= inc;
  }

  // Labels
  const labels = ['รายได้พึงประเมิน', ...used.map(b => b.label)];

  // First bar = net income (positive part only)
  const firstPositive = Math.max(0, netIncome);

  // Negative stacks on the first bar
  const otherDeductions = Math.max(0, totalIncome - expenseVal - netIncome); // all non-expense deductions
  const negExpense  = [-Math.max(0, expenseVal), ...Array(used.length).fill(0)];  // light orange
  const negPersonal = [-otherDeductions,         ...Array(used.length).fill(0)];  // dark orange (personal+invest/etc.)

  // Offset + bracket stacks
  const offset = [0];
  const incomePart = [0];
  const taxPart = [0];
  let cum = 0;
  for (const b of used){
    offset.push(cum);
    incomePart.push(b.income);
    taxPart.push(b.tax);
    cum += b.total;
  }

  // First positive bar dataset
  const firstPos = [firstPositive, ...Array(used.length).fill(0)];

  // Nice step helper → prefers 1/2/2.5/5/10 × 10^k (≈10 ticks)
  function niceStepFor(target, desired=10){
    if (target <= 0) return 10000;
    const raw = target / desired;
    const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
    const frac = raw / pow10;
    let nice;
    if (frac <= 1) nice = 1;
    else if (frac <= 2) nice = 2;
    else if (frac <= 2.5) nice = 2.5;
    else if (frac <= 5) nice = 5;
    else nice = 10;
    return nice * pow10;
  }

  // Dynamic scales: positive auto, negative ≥ 200,000 and expands with deductions
  const posPeak = Math.max(firstPositive, cum);
  const step = niceStepFor(posPeak, 10);
  const yMax = step * 10;

  const negPeak = Math.max(expenseVal + otherDeductions, 0);
  const NEG_MIN_BASE = 200000; // two 100k boundaries minimum
  const yMinAbs = Math.max(NEG_MIN_BASE, Math.ceil(negPeak / step) * step);
  const yMin = -yMinAbs;

  if (window._taxChart) window._taxChart.destroy();

  window._taxChart = new Chart(el.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { // offset for waterfall stacking
          label: 'offset',
          data: offset,
          backgroundColor: 'rgba(0,0,0,0)',
          borderColor: 'rgba(0,0,0,0)',
          stack: 'wf',
          tooltip: { enabled: false }
        },
        { // first bar positive (net income)
          label: 'รายได้สุทธิ',
          data: firstPos,
          backgroundColor: 'rgba(99,200,177,0.55)',
          borderColor: 'rgba(99,200,177,0.9)',
          borderWidth: 1,
          stack: 'wf',
          borderRadius: 6
        },
        { // bracket income parts
          label: 'รายได้สุทธิ',
          data: [0, ...incomePart.slice(1)],
          backgroundColor: 'rgba(99,200,177,0.55)',
          borderColor: 'rgba(99,200,177,0.9)',
          borderWidth: 1,
          stack: 'wf',
          borderRadius: 6
        },
        { // bracket tax parts
          label: 'ภาษี',
          data: taxPart,
          backgroundColor: 'rgba(16,185,129,0.9)',
          borderColor: 'rgba(16,185,129,1)',
          borderWidth: 1,
          stack: 'wf',
          borderRadius: 6
        },
        { // expense (light orange)
          label: 'ค่าใช้จ่าย',
          data: negExpense,
          backgroundColor: 'rgba(255,180,110,0.9)',
          borderColor: 'rgba(255,180,110,1)',
          borderWidth: 1,
          stack: 'wf',
          borderRadius: 6
        },
        { // other deductions (dark orange)
          label: 'หักลดหย่อน',
          data: negPersonal,
          backgroundColor: 'rgba(234,120,60,0.95)',
          borderColor: 'rgba(234,120,60,1)',
          borderWidth: 1,
          stack: 'wf',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false }, // whole-column hit area
      scales: {
        y: {
          min: yMin,
          max: yMax,
          ticks: { stepSize: step, callback: v => formatNumber(v) },
          grid: { display: true, color: 'rgba(0,0,0,0.1)' },
          title: { display: true, text: 'รายได้ (บาท)' }
        },
        x: {
          title: { display: true, text: 'ขั้นภาษี' },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (items) => {
              const lab = items[0].label;
              return lab === 'รายได้พึงประเมิน' ? lab : `ช่วง ${lab}`; // no colon
            },
            label: (ctx) => {
              const ds = ctx.dataset.label;
              const lab = ctx.label;
              const v = ctx.parsed.y || 0;
              const abs = Math.abs(v);
              if (lab === 'รายได้พึงประเมิน') {
                if (ds === 'ค่าใช้จ่าย' && v < 0)  return `ค่าใช้จ่าย -${formatNumber(abs)} บาท`;
                if (ds === 'หักลดหย่อน' && v < 0) return `หักลดหย่อน -${formatNumber(abs)} บาท`;
                if (ds === 'รายได้สุทธิ' && v > 0) return `รายได้พึงประเมิน ${formatNumber(v)} บาท`;
                return null;
              } else {
                if (ds === 'รายได้สุทธิ' && v > 0) return `รายได้สุทธิ ${formatNumber(v)} บาท`;
                if (ds === 'ภาษี' && v > 0)      return `ภาษี ${formatNumber(v)} บาท`;
                return null;
              }
            }
          }
        }
      },
      onClick: (evt, _els, chart) => {
        const els = chart.getElementsAtEventForMode(evt, 'index', { intersect:false }, true);
        if (!els.length) return;
        const idx = els[0].index;

        const targets = (idx === 0)
          ? [{ datasetIndex:4, index:0 }, { datasetIndex:5, index:0 }]           // show two orange parts on first bar
          : [{ datasetIndex:2, index:idx }, { datasetIndex:3, index:idx }];       // show income+tax on selected bracket

        const anchor = chart.getDatasetMeta(targets[0].datasetIndex).data[idx];
        const pt = anchor && anchor.getCenterPoint ? anchor.getCenterPoint() : { x: evt.x, y: evt.y };

        chart.setActiveElements(targets);
        chart.tooltip.setActiveElements(targets, pt);
        chart.update();
      }
    }
  });
}
