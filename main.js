/* main.js – keep globals, init, start/reset, and non-flow bits */

/* ---- Global state ---- */
let total_income = 0;
let monthly_income = 0;
let expense = 0;
let total_withholding_tax = 0;
let isTaxCalculated = false;
let selectedTaxYear = 2568;
let socialSecurityManual = false;

let rev1_amt = 0, rev2_amt = 0, rev3_amt = 0, rev4_amt = 0, rev5_amt = 0, rev6_amt = 0, rev7_amt = 0, rev8_amt = 0;

const retirementFields = ['pension_insurance','pvd','gpf','rmf','ssf','nsf'];
const otherDeductionFields = [
  'life_insurance','health_insurance','parent_health_insurance','thaiesg',
  'social_enterprise','donation_political','easy_ereceipt','local_travel',
  'home_loan_interest','new_home','solar_rooftop'
];

/* ---- Init ---- */
window.onload = function () {
  const numberFields = [
    'rev1_amount','rev1_withholding_input','rev2_amount','rev2_withholding_input',
    'rev3_amount','rev3_withholding_input','rev4_amount','rev4_withholding_input',
    'rev7_amount','rev7_withholding_input',
    'rev5_sub1_amount','rev5_sub2_amount','rev5_sub3_amount','rev5_sub4_amount','rev5_sub5_amount',
    'rev5_withholding_input','rev6_sub1_amount','rev6_sub2_amount','rev6_withholding_input',
    'rev8_amount','rev8_withholding_input',
    'bonus_income','other_income',
    'life_insurance','health_insurance','parent_health_insurance',
    'pension_insurance','ssf','rmf','pvd','gpf','thaiesg',
    'social_enterprise','nsf','home_loan_interest','donation',
    'donation_education','donation_political','easy_ereceipt',
    'local_travel','new_home','social_security',
    'thaiesg_extra_transfer','thaiesg_extra_new','solar_rooftop'
  ];
  numberFields.forEach((id) => {
    addCommaEvent(id);
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('focus', function(){ if (this.value==='0') this.value=''; });
    el.addEventListener('blur', function(){
      if (this.value==='') this.value='0';
      if (typeof updateDeductionLimits==='function') updateDeductionLimits();
    });
  });

  const ss = document.getElementById('social_security');
  if (ss){
    ss.addEventListener('input', function(){
      socialSecurityManual = true;
      const v = parseNumber(this.value);
      if (v>9000) this.value = formatNumber(9000);
    });
  }

  setupRevenueTypeListeners();

  document.getElementById('has_insurance').addEventListener('change', function () {
    const s = document.getElementById('insurance_section');
    if (s) s.style.display = this.checked ? 'block' : 'none';
    updateDeductionLimits();
  });
  document.getElementById('has_social_security').addEventListener('change', function () {
    const s = document.getElementById('social_security_section');
    if (s) s.style.display = this.checked ? 'block' : 'none';
    if (this.checked) calculateSocialSecurity();
    else { document.getElementById('social_security').value = '0'; socialSecurityManual = false; }
    updateDeductionLimits();
  });
  document.getElementById('has_donation').addEventListener('change', function () {
    const s = document.getElementById('donation_section');
    if (s) s.style.display = this.checked ? 'block' : 'none';
    updateDeductionLimits();
  });
  document.getElementById('has_stimulus').addEventListener('change', function () {
    const s = document.getElementById('stimulus_section');
    if (s) s.style.display = this.checked ? 'block' : 'none';
    updateDeductionLimits();
  });

  retirementFields.forEach(id=>{
    const e = document.getElementById(id);
    if (e) e.addEventListener('input', ()=>handleRetirementFieldChange(id));
  });
  otherDeductionFields.forEach(id=>{
    const e = document.getElementById(id);
    if (e) e.addEventListener('input', ()=>handleOtherDeductionFieldChange(id));
  });
  ['thaiesg_extra_transfer','thaiesg_extra_new'].forEach(id=>{
    const e = document.getElementById(id);
    if (e){ addCommaEvent(id); e.addEventListener('input', ()=>handleOtherDeductionFieldChange(id)); }
  });

  // stepper gating
  const stepper = document.getElementById('stepper');
  if (stepper) stepper.classList.add('locked');
  document.querySelectorAll('.stepper .stepper-step').forEach(st=>{
    st.addEventListener('click', function(e){
      const target = parseInt(this.getAttribute('data-step'),10);
      const current = parseInt(document.querySelector('.stepper .stepper-step.active').getAttribute('data-step'),10);
      if (!isTaxCalculated && target !== current){
        e.preventDefault();
        const t = document.getElementById('tc-toast');
        if (t){ t.remove(); }
        const msg = 'โปรดใช้ปุ่ม "ถัดไป"';
        const evtToast = new CustomEvent('tc_toast', { detail: msg });
        document.dispatchEvent(evtToast);
      }
      if (isTaxCalculated) navigateToStep(target);
    });
  });
  // toast proxy
  document.addEventListener('tc_toast', e=>{
    const d = e.detail || 'ดำเนินการต่อ';
    const n = document.getElementById('tc-toast');
    if (n){ n.textContent=d; n.style.opacity='1'; clearTimeout(n._t); n._t=setTimeout(()=>n.style.opacity='0',1400); }
    else {
      const el = document.createElement('div');
      el.id='tc-toast';
      el.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:rgba(17,24,39,.9);color:#fff;padding:10px 14px;border-radius:12px;font-family:Kanit,sans-serif;font-size:14px;border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(8px);opacity:1;transition:opacity .2s ease;z-index:1200';
      el.textContent=d; document.body.appendChild(el);
      el._t=setTimeout(()=>el.style.opacity='0',1400);
    }
  });

  // deduction breakdown toggle
  const tgl = document.getElementById('toggle_deduction_breakdown');
  const panel = document.getElementById('deduction_breakdown');
  if (tgl && panel){
    tgl.addEventListener('click', function(){
      const open = this.classList.toggle('open');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.display = open ? 'block' : 'none';
    });
  }

  populateChildrenOptions();

};

/* ---- Start + Reset ---- */
function startCalculator() {
  selectedTaxYear = 2568;

  const ssfC = document.getElementById('ssf_container');
  if (ssfC) ssfC.style.display = 'none';
  const ssf = document.getElementById('ssf');
  if (ssf) ssf.value = '0';

  const esgX = document.getElementById('thaiesg_extra_container');
  if (esgX) esgX.style.display = 'block';

  const travel = document.getElementById('local_travel_container');
  if (travel) travel.style.display = 'none';

  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('main-container').style.display = 'block';
  setActiveStep(1);
  window.scrollTo({ top:0, behavior:'smooth' });

  isTaxCalculated = false;
  document.getElementById('stepper')?.classList.add('locked');
}

function resetData() {
  total_income = 0; monthly_income = 0; expense = 0; total_withholding_tax = 0; isTaxCalculated = false; socialSecurityManual = false;

  document.querySelectorAll('input[type="text"]').forEach(i=>i.value='0');
  document.querySelectorAll('input[type="checkbox"]').forEach(c=>{ c.checked=false; c.dispatchEvent(new Event('change')); });
  document.querySelectorAll('input[type="radio"]').forEach(r=>{ r.checked=false; r.dispatchEvent(new Event('change')); });
  document.querySelectorAll('select').forEach(s=>{ s.selectedIndex=0; s.dispatchEvent(new Event('change')); });

  [
    'rev_type_1_input','rev_type_2_input','rev_type_3_input','rev_type_4_input',
    'rev_type_5_input','rev_type_6_input','rev_type_7_input','rev_type_8_input',
    'rev1_withholding_input_container','rev2_withholding_input_container',
    'rev3_withholding_input_container','rev4_withholding_input_container',
    'rev5_withholding_input_container','rev6_withholding_input_container',
    'rev7_withholding_input_container','rev8_withholding_input_container',
    'expense_actual_container_3','expense_actual_container_5',
    'expense_actual_container_6','expense_actual_container_7','expense_actual_container_8',
    'insurance_section','donation_section','stimulus_section','social_security_section','thaiesg_extra_container'
  ].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });

  document.getElementById('expense_display').innerText='0';
  document.getElementById('result_withholding_tax').innerText='0';
  const sum = document.getElementById('tax_summary'); if (sum) sum.style.display='none';
  document.querySelectorAll('.error').forEach(el=>el.innerText='');

  setActiveStep(1); showStep(1);

  const lp = document.getElementById('landing-page');
  const mc = document.getElementById('main-container');
  if (lp && mc){ lp.style.display='flex'; mc.style.display='none'; }

  window.scrollTo({ top:0, behavior:'smooth' });
  updateDeductionLimits();
  document.getElementById('stepper')?.classList.add('locked');
}

function resetPage1() {
  [
    ['rev_type_1','rev_type_1_input'],['rev_type_2','rev_type_2_input'],
    ['rev_type_3','rev_type_3_input'],['rev_type_4','rev_type_4_input'],
    ['rev_type_5','rev_type_5_input'],['rev_type_6','rev_type_6_input'],
    ['rev_type_7','rev_type_7_input'],['rev_type_8','rev_type_8_input']
  ].forEach(([cId,sId])=>{ const cb=document.getElementById(cId); if(cb) cb.checked=false; const s=document.getElementById(sId); if(s) s.style.display='none'; });

  [
    'rev1_amount','rev1_withholding_input','rev2_amount','rev2_withholding_input',
    'rev3_amount','rev3_withholding_input','rev4_amount','rev4_withholding_input',
    'rev7_amount','rev7_withholding_input','rev8_amount','rev8_withholding_input',
    'rev5_sub1_amount','rev5_sub2_amount','rev5_sub3_amount','rev5_sub4_amount','rev5_sub5_amount',
    'rev5_withholding_input','rev6_sub1_amount','rev6_sub2_amount','rev6_withholding_input'
  ].forEach(id=>{ const el=document.getElementById(id); if(el) el.value='0'; });

  const cm = document.getElementById('calc_mode'); if (cm) cm.value='year';
  total_income = 0; monthly_income = 0;
}

function resetPage3() {
  const spouse = document.getElementById('spouse'); if (spouse) spouse.value='no';
  const childrenOwn = document.getElementById('children_own'); if (childrenOwn) childrenOwn.value='0';
  const childrenAdopted = document.getElementById('children_adopted'); if (childrenAdopted) childrenAdopted.value='0';
  const disabledPersons = document.getElementById('disabled_persons'); if (disabledPersons) disabledPersons.value='0';

  ['your_father','your_mother','spouse_father','spouse_mother'].forEach(id=>{ const cb=document.getElementById(id); if (cb) cb.checked=false; });

  ['has_insurance','has_donation','has_stimulus','has_social_security'].forEach(id=>{
    const cb=document.getElementById(id);
    if (cb){ cb.checked=false; cb.dispatchEvent(new Event('change')); }
  });

  [
    'life_insurance','health_insurance','parent_health_insurance',
    'pension_insurance','ssf','rmf','pvd','gpf','thaiesg',
    'social_enterprise','nsf','thaiesg_extra_transfer','thaiesg_extra_new',
    'donation','donation_education','donation_political',
    'easy_ereceipt','local_travel','home_loan_interest','new_home',
    'social_security','solar_rooftop'
  ].forEach(id=>{ const el=document.getElementById(id); if(el) el.value='0'; });

  ['insurance_section','donation_section','stimulus_section','social_security_section'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
}

/* ---- Scroll control ---- */
function scrollPage() {
  const y = window.pageYOffset;
  const h = window.innerHeight;
  const dh = document.documentElement.scrollHeight;
  const t = 50;
  if (y < t) window.scrollTo({ top: dh-h, behavior: 'smooth' });
  else if (y + h > dh - t) window.scrollTo({ top: 0, behavior: 'smooth' });
  else window.scrollTo({ top: dh-h, behavior: 'smooth' });
}
