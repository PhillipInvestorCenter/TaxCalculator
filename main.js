// main.js
/* main.js – keep globals, init, start/reset, and non-flow bits */

/* ---- Global state ---- */
let total_income = 0;
let monthly_income = 0;
let expense = 0;
let total_withholding_tax = 0;
let isTaxCalculated = false;
let selectedTaxYear = 2568;
let socialSecurityManual = false;
let maxVisitedStep = 1;

let rev1_amt = 0, rev2_amt = 0, rev3_amt = 0, rev4_amt = 0, rev5_amt = 0, rev6_amt = 0, rev7_amt = 0, rev8_amt = 0;

const retirementFields = ['pension_insurance','pvd','gpf','rmf','nsf'];
const otherDeductionFields = [
  'life_insurance','health_insurance','parent_health_insurance','thaiesg',
  'social_enterprise','donation_political','easy_ereceipt',
  'travel_main_secondary_2568','home_loan_interest','new_home','solar_rooftop',
  'thaiesg_extra_transfer','thaiesg_extra_new','nsf'
];

/* ---- Navigation gate ---- */
function canNavigateToStep(target){
  if (isTaxCalculated) return true;
  const cap = Math.min(3, Math.max(1, maxVisitedStep || 1));
  return target <= cap;
}

/* ---- Init ---- */
window.onload = function () {
  const numberFields = [
    'rev1_amount','rev1_withholding_input','rev2_amount','rev2_withholding_input',
    'rev3_amount','rev3_withholding_input','rev4_amount','rev4_withholding_input',
    'rev7_amount','rev7_withholding_input',
    'rev5_sub1_amount','rev5_sub2_amount','rev5_sub3_amount','rev5_sub4_amount','rev5_sub5_amount',
    'rev5_withholding_input','rev6_sub1_amount','rev6_sub2_amount','rev6_withholding_input',
    'rev8_amount','rev8_withholding_input',
    'life_insurance','health_insurance','parent_health_insurance',
    'pension_insurance','rmf','pvd','gpf','thaiesg',
    'social_enterprise','nsf','home_loan_interest','donation',
    'donation_education','donation_political','easy_ereceipt',
    'travel_main_secondary_2568','new_home','social_security',
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

  // social security toggle (kept)
  const ssChk = document.getElementById('has_social_security');
  if (ssChk){
    ssChk.addEventListener('change', function () {
      const s = document.getElementById('social_security_section');
      if (s) s.style.display = this.checked ? 'block' : 'none';
      if (this.checked) calculateSocialSecurity(); else { document.getElementById('social_security').value = '0'; socialSecurityManual = false; }
      if (typeof updateDeductionLimits==='function') updateDeductionLimits();
    });
  }

  retirementFields.forEach(id=>{
    const e = document.getElementById(id);
    if (e) e.addEventListener('input', ()=>handleRetirementFieldChange(id));
  });
  otherDeductionFields.forEach(id=>{
    const e = document.getElementById(id);
    if (e) e.addEventListener('input', ()=>handleOtherDeductionFieldChange(id));
  });

  // stepper click with gate
  const stepBar = document.getElementById('stepper');
  if (stepBar){
    stepBar.addEventListener('click', function(e){
      const node = e.target.closest('.stepper-step');
      if (!node) return;
      const target = parseInt(node.getAttribute('data-step'),10);
      if (canNavigateToStep(target)) navigateToStep(target);
      else {
        e.preventDefault();
        const cur = parseInt(stepBar.getAttribute('data-current-step')||'1',10);
        if (typeof moveLensToStep==='function') moveLensToStep(cur);
        document.dispatchEvent(new CustomEvent('tc_toast',{detail:'โปรดใช้ปุ่ม "ถัดไป"'}));
      }
    });
  }

  // visited tracker
  if (stepBar){
    const obs = new MutationObserver(()=>{
      const n = parseInt(stepBar.getAttribute('data-current-step')||'1',10);
      if (!isTaxCalculated && n < 4){ maxVisitedStep = Math.max(maxVisitedStep||1, Math.min(3, n)); }
    });
    obs.observe(stepBar, { attributes:true, attributeFilter:['data-current-step'] });
  }

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

  // breakdown toggle
  const tgl = document.getElementById('toggle_deduction_breakdown');
  const panel = document.getElementById('deduction_breakdown');
  if (tgl && panel){
    tgl.addEventListener('click', function(){
      const open = this.classList.toggle('open');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.display = open ? 'block' : 'none';
    });
  }

  if (typeof initLiquidStepper === 'function') initLiquidStepper();

  // segmented tabs for Step 3
  const tabbar = document.getElementById('deductTabs');
  if (tabbar){
    tabbar.addEventListener('click', (e)=>{
      const btn = e.target.closest('.seg-tab');
      if (!btn) return;
      tabbar.querySelectorAll('.seg-tab').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      document.querySelectorAll('#step-3 .tab-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active'); btn.setAttribute('aria-selected','true');
      const tgt = document.querySelector(btn.getAttribute('data-target'));
      if (tgt) tgt.classList.add('active');
      window.scrollTo({ top: tabbar.getBoundingClientRect().top + window.scrollY - 12, behavior:'smooth' });
    });
  }

  populateChildrenOptions();
  if (typeof updateDeductionLimits==='function') updateDeductionLimits();
};

/* ---- Start + Reset ---- */
function startCalculator() {
  selectedTaxYear = 2568;
  maxVisitedStep = 1;
  isTaxCalculated = false;

  const esgX = document.getElementById('thaiesg_extra_container');
  if (esgX) esgX.style.display = 'block';

  const travelMS = document.getElementById('travel_main_secondary_container');
  if (travelMS) travelMS.style.display = 'block';

  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('main-container').style.display = 'block';
  setActiveStep(1);
  window.scrollTo({ top:0, behavior:'smooth' });
}

function resetData() {
  total_income = 0; monthly_income = 0; expense = 0; total_withholding_tax = 0; isTaxCalculated = false; socialSecurityManual = false; maxVisitedStep = 1;

  document.querySelectorAll('input[type="text"]').forEach(i=>i.value='0');
  document.querySelectorAll('input[type="checkbox"]').forEach(c=>{ 
    if (c.id !== 'has_social_security') c.checked=false;
  });

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
    'social_security_section','thaiesg_extra_container'
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
  if (typeof updateDeductionLimits==='function') updateDeductionLimits();
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

  ['your_father','your_mother','spouse_father','spouse_mother','has_social_security'].forEach(id=>{ const cb=document.getElementById(id); if (cb) cb.checked=false; });

  [
    'life_insurance','health_insurance','parent_health_insurance',
    'pension_insurance','rmf','pvd','gpf','thaiesg',
    'social_enterprise','nsf','thaiesg_extra_transfer','thaiesg_extra_new',
    'donation','donation_education','donation_political',
    'easy_ereceipt','home_loan_interest','new_home',
    'social_security','solar_rooftop','travel_main_secondary_2568'
  ].forEach(id=>{ const el=document.getElementById(id); if(el) el.value='0'; });

  const ssSec = document.getElementById('social_security_section'); if (ssSec) ssSec.style.display='none';
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

/* --- keep floating controls attached to <body> so "position:fixed" is true viewport-fixed --- */
function _ensureFloatingButtonsToBody(){
  ['resetButtonStep1','resetButtonStep3','scrollArrow'].forEach(id=>{
    const el = document.getElementById(id);
    if (el && el.parentElement !== document.body){
      document.body.appendChild(el);
    }
  });
}

/* optional: keep arrow pointing down at top, up after you scroll */
function _updateScrollArrow(){
  const el = document.getElementById('scrollArrow');
  if (!el) return;
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  el.innerHTML = (y <= 24) ? '&#x2193;' : '&#x2191;'; // down / up
}

/* define scrollPage if missing (keeps your existing onclick) */
if (typeof window.scrollPage !== 'function'){
  window.scrollPage = function(){
    const y  = window.scrollY || document.documentElement.scrollTop || 0;
    const dh = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight
    );
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const nearBottom = (y + vh) > (dh - 48);
    window.scrollTo({ top: nearBottom ? 0 : (dh - vh), behavior: 'smooth' });
  };
}

/* run at startup */
document.addEventListener('DOMContentLoaded', ()=>{
  _ensureFloatingButtonsToBody();
  _updateScrollArrow();
  window.addEventListener('scroll', _updateScrollArrow, { passive:true });
});

/* also run whenever you change pages/steps, so they never get stuck in a panel */
(function(orig){
  window.setActiveStep = function(n){
    if (orig) orig(n);
    _ensureFloatingButtonsToBody();
    _updateScrollArrow();
  };
})(window.setActiveStep);

function _toggleScrollArrowForLanding(){
  const arrow = document.getElementById('scrollArrow');
  const landing = document.getElementById('landing-page');
  const main = document.getElementById('main-container');
  if (!arrow) return;
  const onLanding = landing && getComputedStyle(landing).display !== 'none'
                 && main && getComputedStyle(main).display === 'none';
  arrow.style.display = onLanding ? 'none' : 'flex';
}

document.addEventListener('DOMContentLoaded', _toggleScrollArrowForLanding);

// ensure it shows once app starts
(function(orig){
  window.startCalculator = function(y){
    if (typeof orig === 'function') orig(y);
    _toggleScrollArrowForLanding();
  };
})(window.startCalculator);

// keep in sync when switching steps
(function(orig){
  window.setActiveStep = function(n){
    if (typeof orig === 'function') orig(n);
    _toggleScrollArrowForLanding();
  };
})(window.setActiveStep);
