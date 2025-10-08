/* flow.js – move ~half of main.js here, keep same globals and behavior */
(function (global) {
  // private toast (no alert)
  function toast(msg) {
    let el = document.getElementById('tc-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tc-toast';
      el.style.cssText =
        'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);' +
        'background:rgba(17,24,39,.9);color:#fff;padding:10px 14px;border-radius:12px;' +
        'font-family:Kanit,sans-serif;font-size:14px;border:1px solid rgba(255,255,255,.2);' +
        'backdrop-filter:blur(8px);opacity:0;transition:opacity .2s ease;z-index:1200';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.style.opacity = '0'), 1400);
  }

  /* ---- Revenue type toggles ---- */
  function setupRevenueTypeListeners() {
    const blocks = [
      ['rev_type_1','rev_type_1_input'],['rev_type_2','rev_type_2_input'],
      ['rev_type_3','rev_type_3_input'],['rev_type_4','rev_type_4_input'],
      ['rev_type_5','rev_type_5_input'],['rev_type_6','rev_type_6_input'],
      ['rev_type_7','rev_type_7_input'],['rev_type_8','rev_type_8_input']
    ];
    blocks.forEach(([cbId, secId]) => {
      const cb = document.getElementById(cbId);
      const sec = document.getElementById(secId);
      if (cb && sec) cb.addEventListener('change', function(){ sec.style.display = this.checked?'block':'none'; });
    });

    const wht = [
      ['rev1_withholding_checkbox','rev1_withholding_input_container'],
      ['rev2_withholding_checkbox','rev2_withholding_input_container'],
      ['rev3_withholding_checkbox','rev3_withholding_input_container'],
      ['rev4_withholding_checkbox','rev4_withholding_input_container'],
      ['rev5_withholding_checkbox','rev5_withholding_input_container'],
      ['rev6_withholding_checkbox','rev6_withholding_input_container'],
      ['rev7_withholding_checkbox','rev7_withholding_input_container'],
      ['rev8_withholding_checkbox','rev8_withholding_input_container'],
    ];
    wht.forEach(([cbId, cId]) => {
      const cb = document.getElementById(cbId);
      const c = document.getElementById(cId);
      if (cb && c) cb.addEventListener('change', function(){ c.style.display = this.checked?'block':'none'; });
    });

    const r5 = [
      ['rev5_sub_1','rev5_sub_1_input'],
      ['rev5_sub_2','rev5_sub_2_input'],
      ['rev5_sub_3','rev5_sub_3_input'],
      ['rev5_sub_4','rev5_sub_4_input'],
      ['rev5_sub_5','rev5_sub_5_input'],
    ];
    r5.forEach(([cbId, secId]) => {
      const cb = document.getElementById(cbId);
      const sec = document.getElementById(secId);
      if (cb && sec) cb.addEventListener('change', function(){ sec.style.display = this.checked?'block':'none'; });
    });

    const r6 = [
      ['rev6_sub_1','rev6_sub_1_input'],
      ['rev6_sub_2','rev6_sub_2_input'],
    ];
    r6.forEach(([cbId, secId]) => {
      const cb = document.getElementById(cbId);
      const sec = document.getElementById(secId);
      if (cb && sec) cb.addEventListener('change', function(){ sec.style.display = this.checked?'block':'none'; });
    });
  }

  /* ---- Navigation helpers ---- */
  function showStep(n){ navigateToStep(n); }

  function navigateToStep(n) {
    document.querySelectorAll('.container .step-content').forEach(s=>{ s.classList.remove('active'); s.style.display='none'; });
    const t = document.getElementById(`step-${n}`);
    if (t){ t.style.display='block'; t.classList.add('active'); }
    setActiveStep(n);
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function setActiveStep(n) {
    const stepper = document.getElementById('stepper');
    stepper.setAttribute('data-current-step', n);
    document.querySelectorAll('.stepper .stepper-step').forEach(el=>{
      const k = parseInt(el.getAttribute('data-step'),10);
      if (k < n){ el.classList.add('completed'); el.classList.remove('active'); }
      else if (k === n){ el.classList.add('active','completed'); }
      else { el.classList.remove('active','completed'); }
    });
    if (n === 4){ document.getElementById('stepper')?.classList.remove('locked'); isTaxCalculated = true; }
    document.getElementById('resetButtonStep1').style.display = (n===1)?'block':'none';
    document.getElementById('resetButtonStep3').style.display = (n===3)?'block':'none';
  }

  /* ---- Validation + Next/Prev ---- */
  function validateStep(n) {
    if (n !== 1) return true;
    let ok = false;
    document.querySelectorAll('input[name="rev_type"]').forEach(cb=>{
      if (!cb.checked) return;
      let amt = 0;
      if (cb.value==='1') amt = parseNumber(document.getElementById('rev1_amount')?.value||'0');
      else if (cb.value==='2') amt = parseNumber(document.getElementById('rev2_amount')?.value||'0');
      else if (cb.value==='3') amt = parseNumber(document.getElementById('rev3_amount')?.value||'0');
      else if (cb.value==='4') amt = parseNumber(document.getElementById('rev4_amount')?.value||'0');
      else if (cb.value==='5') {
        let s=0;
        if (document.getElementById('rev5_sub_1').checked) s+=parseNumber(document.getElementById('rev5_sub1_amount').value);
        if (document.getElementById('rev5_sub_2').checked) s+=parseNumber(document.getElementById('rev5_sub2_amount').value);
        if (document.getElementById('rev5_sub_3').checked) s+=parseNumber(document.getElementById('rev5_sub3_amount').value);
        if (document.getElementById('rev5_sub_4').checked) s+=parseNumber(document.getElementById('rev5_sub4_amount').value);
        if (document.getElementById('rev5_sub_5').checked) s+=parseNumber(document.getElementById('rev5_sub5_amount').value);
        amt = s;
      } else if (cb.value==='6') {
        let s=0;
        if (document.getElementById('rev6_sub_1').checked) s+=parseNumber(document.getElementById('rev6_sub1_amount').value);
        if (document.getElementById('rev6_sub_2').checked) s+=parseNumber(document.getElementById('rev6_sub2_amount').value);
        amt = s;
      } else if (cb.value==='7') amt = parseNumber(document.getElementById('rev7_amount')?.value||'0');
      else if (cb.value==='8') amt = parseNumber(document.getElementById('rev8_amount')?.value||'0');
      if (amt>0) ok = true;
    });
    if (!ok) toast('กรุณากรอกอย่างน้อย 1 ประเภท');
    return ok;
  }

  function prevStep(cur) {
    if (cur > 1){ const p = cur-1; setActiveStep(p); showStep(p); }
  }

  function nextStep(cur) {
    if (!validateStep(cur)) return;

    if (cur === 1) {
      const mode = document.getElementById('calc_mode').value;
      const mul = (mode === 'month') ? 12 : 1;

      rev1_amt = document.getElementById('rev_type_1').checked ? parseNumber(document.getElementById('rev1_amount').value) * mul : 0;
      rev2_amt = document.getElementById('rev_type_2').checked ? parseNumber(document.getElementById('rev2_amount').value) * mul : 0;
      rev3_amt = document.getElementById('rev_type_3').checked ? parseNumber(document.getElementById('rev3_amount').value) * mul : 0;
      rev4_amt = document.getElementById('rev_type_4').checked ? parseNumber(document.getElementById('rev4_amount').value) * mul : 0;
      rev7_amt = document.getElementById('rev_type_7').checked ? parseNumber(document.getElementById('rev7_amount').value) * mul : 0;
      rev8_amt = document.getElementById('rev_type_8').checked ? parseNumber(document.getElementById('rev8_amount').value) * mul : 0;

      let s5 = 0;
      if (document.getElementById('rev_type_5').checked) {
        if (document.getElementById('rev5_sub_1').checked) s5 += parseNumber(document.getElementById('rev5_sub1_amount').value) * mul;
        if (document.getElementById('rev5_sub_2').checked) s5 += parseNumber(document.getElementById('rev5_sub2_amount').value) * mul;
        if (document.getElementById('rev5_sub_3').checked) s5 += parseNumber(document.getElementById('rev5_sub3_amount').value) * mul;
        if (document.getElementById('rev5_sub_4').checked) s5 += parseNumber(document.getElementById('rev5_sub4_amount').value) * mul;
        if (document.getElementById('rev5_sub_5').checked) s5 += parseNumber(document.getElementById('rev5_sub5_amount').value) * mul;
      }
      rev5_amt = s5;

      let s6 = 0;
      if (document.getElementById('rev_type_6').checked) {
        if (document.getElementById('rev6_sub_1').checked) s6 += parseNumber(document.getElementById('rev6_sub1_amount').value) * mul;
        if (document.getElementById('rev6_sub_2').checked) s6 += parseNumber(document.getElementById('rev6_sub2_amount').value) * mul;
      }
      rev6_amt = s6;

      total_income = rev1_amt+rev2_amt+rev3_amt+rev4_amt+rev5_amt+rev6_amt+rev7_amt+rev8_amt;
      monthly_income = (mode === 'month') ? parseNumber(document.getElementById('rev1_amount').value) : total_income/12;

      let html = "";
      if (document.getElementById('rev_type_3').checked) {
        html += `
          <div class="custom-expense-group" id="custom_expense_3">
            <label>สำหรับ เงินได้ประเภทที่ 3:</label>
            <div class="radio-group">
              <input type="radio" name="expense_choice_3" value="standard" checked> หักเหมา
              <input type="radio" name="expense_choice_3" value="actual"> หักตามจริง
            </div>
            <div id="expense_actual_container_3" style="display:none;">
              <input type="text" id="expense_actual_3" value="0" inputmode="decimal">
            </div>
          </div>`;
      }
      if (document.getElementById('rev_type_5').checked) {
        html += `
          <div class="custom-expense-group" id="custom_expense_5">
            <label>สำหรับ เงินได้ประเภทที่ 5:</label>
            <div class="radio-group">
              <input type="radio" name="expense_choice_5" value="standard" checked> หักเหมา
              <input type="radio" name="expense_choice_5" value="actual"> หักตามจริง
            </div>
            <div id="expense_actual_container_5" style="display:none;">
              <input type="text" id="expense_actual_5" value="0" inputmode="decimal">
            </div>
          </div>`;
      }
      if (document.getElementById('rev_type_6').checked) {
        html += `
          <div class="custom-expense-group" id="custom_expense_6">
            <label>สำหรับ เงินได้ประเภทที่ 6:</label>
            <div class="radio-group">
              <input type="radio" name="expense_choice_6" value="standard" checked> หักเหมา
              <input type="radio" name="expense_choice_6" value="actual"> หักตามจริง
            </div>
            <div id="expense_actual_container_6" style="display:none;">
              <input type="text" id="expense_actual_6" value="0" inputmode="decimal">
            </div>
          </div>`;
      }
      if (document.getElementById('rev_type_7').checked) {
        html += `
          <div class="custom-expense-group" id="custom_expense_7">
            <label>สำหรับ เงินได้ประเภทที่ 7:</label>
            <div class="radio-group">
              <input type="radio" name="expense_choice_7" value="standard" checked> หักเหมา
              <input type="radio" name="expense_choice_7" value="actual"> หักตามจริง
            </div>
            <div id="expense_actual_container_7" style="display:none;">
              <input type="text" id="expense_actual_7" value="0" inputmode="decimal">
            </div>
          </div>`;
      }
      if (document.getElementById('rev_type_8').checked) {
        html += `
          <div class="custom-expense-group" id="custom_expense_8">
            <label>สำหรับ เงินได้ประเภทที่ 8:</label>
            <div class="radio-group">
              <input type="radio" name="expense_choice_8" value="standard" checked> หักเหมา
              <input type="radio" name="expense_choice_8" value="actual"> หักตามจริง
            </div>
            <div id="expense_actual_container_8" style="display:none;">
              <input type="text" id="expense_actual_8" value="0" inputmode="decimal">
            </div>
            <div id="standard_choice_container_8" style="margin-top:10px;">
              <label>เลือกอัตราหักเหมา:</label>
              <div class="radio-group">
                <input type="radio" name="standard_rate_choice_8" value="40" checked> 40%
                <input type="radio" name="standard_rate_choice_8" value="60"> 60%
              </div>
            </div>
          </div>`;
      }
      document.getElementById('custom_expense_options').innerHTML = html;

      ['3','5','6','7','8'].forEach(type=>{
        if (!document.getElementById('custom_expense_'+type)) return;

        document.getElementsByName('expense_choice_'+type).forEach(r=>{
          r.addEventListener('change', function(){
            if (type==='8') {
              const a = document.getElementById('expense_actual_container_'+type);
              const s = document.getElementById('standard_choice_container_'+type);
              if (this.value==='actual'){ if(a) a.style.display='block'; if(s) s.style.display='none'; const i=document.getElementById('expense_actual_'+type); if(i) i.value='0'; }
              else { if(a) a.style.display='none'; if(s) s.style.display='block'; }
            } else {
              const c = document.getElementById('expense_actual_container_'+type);
              c.style.display = (this.value==='actual') ? 'block' : 'none';
              if (this.value!=='actual'){ const i=document.getElementById('expense_actual_'+type); if(i) i.value='0'; }
            }
            recalcExpenses();
          });
        });

        const ai = document.getElementById('expense_actual_'+type);
        if (ai){
          addCommaEvent('expense_actual_'+type);
          ai.addEventListener('focus', function(){ if(this.value==='0') this.value=''; });
          ai.addEventListener('input', function(){ recalcExpenses(); });
        }
        if (type==='8'){
          document.getElementsByName('standard_rate_choice_8').forEach(r=>{
            r.addEventListener('change', ()=>recalcExpenses());
          });
        }
      });

      recalcExpenses();
      setActiveStep(2);
      showStep(2);
      updateDeductionLimits();
    } else if (cur === 2) {
      setActiveStep(3);
      showStep(3);
      updateDeductionLimits();
    }
  }

  /* ---- Expense recompute (Step 2) ---- */
  function recalcExpenses() {
    const mul = (document.getElementById('calc_mode').value === 'month') ? 12 : 1;
    let e12 = Math.min((rev1_amt + rev2_amt) * 0.5, 100000);

    let e3 = 0;
    if (document.getElementById('rev_type_3').checked) {
      const c3 = document.querySelector('input[name="expense_choice_3"]:checked');
      e3 = (c3 && c3.value==='actual') ? (parseNumber(document.getElementById('expense_actual_3').value)||0) : Math.min(rev3_amt*0.5,100000);
    }

    let e5 = 0;
    if (document.getElementById('rev_type_5').checked) {
      const c5 = document.querySelector('input[name="expense_choice_5"]:checked');
      if (c5 && c5.value==='actual') {
        e5 = parseNumber(document.getElementById('expense_actual_5').value) || 0;
      } else {
        let calc = 0;
        if (document.getElementById('rev5_sub_1').checked) calc += parseNumber(document.getElementById('rev5_sub1_amount').value) * mul * 0.30;
        if (document.getElementById('rev5_sub_2').checked) calc += parseNumber(document.getElementById('rev5_sub2_amount').value) * mul * 0.20;
        if (document.getElementById('rev5_sub_3').checked) calc += parseNumber(document.getElementById('rev5_sub3_amount').value) * mul * 0.15;
        if (document.getElementById('rev5_sub_4').checked) calc += parseNumber(document.getElementById('rev5_sub4_amount').value) * mul * 0.30;
        if (document.getElementById('rev5_sub_5').checked) calc += parseNumber(document.getElementById('rev5_sub5_amount').value) * mul * 0.10;
        e5 = calc;
      }
    }

    let e6 = 0;
    if (document.getElementById('rev_type_6').checked) {
      const c6 = document.querySelector('input[name="expense_choice_6"]:checked');
      if (c6 && c6.value==='actual') {
        e6 = parseNumber(document.getElementById('expense_actual_6').value) || 0;
      } else {
        let calc = 0;
        if (document.getElementById('rev6_sub_1').checked) calc += parseNumber(document.getElementById('rev6_sub1_amount').value) * mul * 0.60;
        if (document.getElementById('rev6_sub_2').checked) calc += parseNumber(document.getElementById('rev6_sub2_amount').value) * mul * 0.30;
        e6 = calc;
      }
    }

    let e7 = 0;
    if (document.getElementById('rev_type_7').checked) {
      const c7 = document.querySelector('input[name="expense_choice_7"]:checked');
      e7 = (c7 && c7.value==='actual') ? (parseNumber(document.getElementById('expense_actual_7').value)||0)
                                       : parseNumber(document.getElementById('rev7_amount').value) * mul * 0.60;
    }

    let e8 = 0;
    if (document.getElementById('rev_type_8').checked) {
      const c8 = document.querySelector('input[name="expense_choice_8"]:checked');
      if (c8 && c8.value==='actual') {
        e8 = parseNumber(document.getElementById('expense_actual_8').value) || 0;
      } else {
        const sr = document.querySelector('input[name="standard_rate_choice_8"]:checked');
        const rate = (sr && sr.value==='60') ? 0.60 : 0.40;
        e8 = parseNumber(document.getElementById('rev8_amount').value) * mul * rate;
      }
    }

    expense = e12 + e3 + e5 + e6 + e7 + e8;
    document.getElementById('expense_display').innerText = formatNumber(expense);
  }

  // expose
  global.setupRevenueTypeListeners = setupRevenueTypeListeners;
  global.navigateToStep = navigateToStep;
  global.showStep = showStep;
  global.setActiveStep = setActiveStep;
  global.validateStep = validateStep;
  global.prevStep = prevStep;
  global.nextStep = nextStep;
  global.recalcExpenses = recalcExpenses;
})(window);
