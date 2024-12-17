// Variable declarations
let total_income = 0;
let monthly_income = 0; // Monthly income variable
let expense = 0;
const retirementFields = ['pension_insurance', 'pvd', 'gpf', 'rmf', 'nsf', 'ssf'];
let incomeTypeCheckboxes = null;
let remaining_retirement_allowance = 0; // Global variable
let isTaxCalculated = false; // Tracks if tax has been calculated
let total_withholding_tax = 0; // Will be calculated from selected income type only

// Function to start the calculator
function startCalculator() {
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';
    setActiveStep(1); // Set the first step as active
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Function to format numbers with commas
function formatNumber(num) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

// Function to parse numbers from strings with commas
function parseNumber(str) {
    if (typeof str === 'string') {
        return parseFloat(str.replace(/,/g, '')) || 0;
    }
    return 0;
}

// Function to move to the previous step
function prevStep(currentStep) {
    if (currentStep > 1) {
        const previousStep = currentStep - 1;
        setActiveStep(previousStep);
        showStep(previousStep);
    }
}

// Function to add comma formatting to input fields
function addCommaEvent(id) {
    let input = document.getElementById(id);
    if (input) {
        input.addEventListener('input', function () {
            let cursorPosition = this.selectionStart;
            let value = this.value.replace(/,/g, '');
            if (value === '') {
                this.value = '';
                return;
            }
            if (!isNaN(value)) {
                let parts = value.split('.');
                let integerPart = parts[0];
                let decimalPart = parts[1];

                let formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                let formattedValue = formattedInteger;
                if (decimalPart !== undefined) {
                    formattedValue += '.' + decimalPart;
                }
                this.value = formattedValue;
                let diff = this.value.length - value.length;
                this.selectionEnd = cursorPosition + diff;
            } else {
                this.value = this.value.substring(0, cursorPosition - 1) + this.value.substring(cursorPosition);
                this.selectionEnd = cursorPosition - 1;
            }
        });
    }
}

// Updated calculateTotalWithholdingTax function to only consider the currently selected income type
function calculateTotalWithholdingTax() {
    const selectedIncomeType = document.querySelector('input[name="income_type"]:checked');
    if (!selectedIncomeType) return 0; // If no income type selected, no withholding tax

    let total_withholding = 0;

    if (selectedIncomeType.value === 'annual') {
        // Only consider annual withholding tax
        const withholdingTaxAnnualCheckbox = document.getElementById('withholding_tax_annual_checkbox');
        const withholdingTaxAnnualInput = document.getElementById('withholding_tax_annual_input');
        if (withholdingTaxAnnualCheckbox && withholdingTaxAnnualCheckbox.checked) {
            const annualTax = parseNumber(withholdingTaxAnnualInput.value) || 0;
            total_withholding += annualTax;
        }
    } else if (selectedIncomeType.value === 'monthly') {
        // Only consider monthly withholding tax
        const withholdingTaxMonthlyCheckbox = document.getElementById('withholding_tax_monthly_checkbox');
        const withholdingTaxMonthlyInput = document.getElementById('withholding_tax_monthly_input');
        if (withholdingTaxMonthlyCheckbox && withholdingTaxMonthlyCheckbox.checked) {
            const monthlyTax = parseNumber(withholdingTaxMonthlyInput.value) || 0;
            total_withholding += monthlyTax * 12; // Convert monthly tax to annual total
        }
    }

    return total_withholding;
}

// Function to move to the next step
function nextStep(currentStep) {
    if (validateStep(currentStep)) {
        if (currentStep === 1) {
            // Perform calculations specific to step 1

            // Get income type
            let incomeType = '';
            incomeTypeCheckboxes.forEach(function (checkbox) {
                if (checkbox.checked) {
                    incomeType = checkbox.value;
                }
            });

            // Get income data
            if (incomeType === 'annual') {
                let annual_income = parseNumber(document.getElementById('annual_income').value);
                total_income = annual_income;
                monthly_income = annual_income / 12; // Calculate monthly income
            } else if (incomeType === 'monthly') {
                let monthly_income_input = parseNumber(document.getElementById('monthly_income').value);
                let bonus_income = parseNumber(document.getElementById('bonus_income').value) || 0;
                monthly_income = monthly_income_input; // Set monthly income
                total_income = (monthly_income * 12) + bonus_income;
            }

            // Get other income if checkbox is checked
            let other_income = 0;
            if (document.getElementById('has_other_income').checked) {
                other_income = parseNumber(document.getElementById('other_income').value) || 0;
            }
            total_income += other_income;

            // Calculate expense (50% but not more than 100,000 THB)
            expense = total_income * 0.50;
            if (expense > 100000) expense = 100000;

            // Display expense
            document.getElementById('expense_display').innerText = formatNumber(expense);

            // Calculate total withholding tax based on current selection
            total_withholding_tax = calculateTotalWithholdingTax();

            // Update stepper to step 2
            setActiveStep(2);

            // Go to step 2
            showStep(2);
        } else if (currentStep === 2) {
            // Go to step 3
            setActiveStep(3);
            showStep(3);
        }
    }
}

// Function to calculate Social Security contribution
function calculateSocialSecurity() {
    let social_security = 0;
    if (document.getElementById('has_social_security').checked) {
        // Calculate as 5% of monthly income, max 750 baht per month
        let monthly_contribution = monthly_income * 0.05;
        monthly_contribution = Math.min(monthly_contribution, 750);
        social_security = monthly_contribution * 12; // Annual contribution
        social_security = Math.min(social_security, 9000); // Max 9,000 baht per year
        // Display the calculated value
        document.getElementById('social_security').value = formatNumber(social_security);
    } else {
        document.getElementById('social_security').value = '0';
    }
}

// Modify window.onload to add event listeners
window.onload = function () {
    // Initialize incomeTypeCheckboxes
    incomeTypeCheckboxes = document.querySelectorAll('input[name="income_type"]');

    // Attach event listeners to number fields
    let numberFields = [
        'annual_income', 'monthly_income', 'bonus_income', 'other_income',
        'life_insurance', 'health_insurance', 'parent_health_insurance', 'pension_insurance',
        'ssf', 'rmf', 'pvd', 'gpf', 'thaiesg', 'social_enterprise', 'nsf',
        'home_loan_interest', 'donation', 'donation_education', 'donation_political',
        'easy_ereceipt', 'local_travel', 'new_home',
        'withholding_tax_annual_input', 'withholding_tax_monthly_input'
    ];

    numberFields.forEach(function (id) {
        addCommaEvent(id);
        let input = document.getElementById(id);
        if (input) {
            input.addEventListener('focus', function () {
                if (this.value === '0') {
                    this.value = '';
                }
            });
            input.addEventListener('blur', function () {
                if (this.value === '') {
                    this.value = '0';
                }
            });
        }
    });

    const withholdingTaxAnnualCheckbox = document.getElementById('withholding_tax_annual_checkbox');
    const withholdingTaxAnnualSection = document.getElementById('withholding_tax_annual_section');
    if (withholdingTaxAnnualCheckbox) {
        withholdingTaxAnnualCheckbox.addEventListener('change', function () {
            withholdingTaxAnnualSection.style.display = this.checked ? 'block' : 'none';
            if (!this.checked) {
                document.getElementById('withholding_tax_annual_input').value = '0';
                total_withholding_tax = calculateTotalWithholdingTax();
            }
        });
    }

    const withholdingTaxMonthlyCheckbox = document.getElementById('withholding_tax_monthly_checkbox');
    const withholdingTaxMonthlySection = document.getElementById('withholding_tax_monthly_section');
    if (withholdingTaxMonthlyCheckbox) {
        withholdingTaxMonthlyCheckbox.addEventListener('change', function () {
            withholdingTaxMonthlySection.style.display = this.checked ? 'block' : 'none';
            if (!this.checked) {
                document.getElementById('withholding_tax_monthly_input').value = '0';
                total_withholding_tax = calculateTotalWithholdingTax();
            }
        });
    }

    // Handling income type selection and resetting withholding fields
    incomeTypeCheckboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
            // Uncheck other income type and reset values
            incomeTypeCheckboxes.forEach(function (box) {
                if (box !== this) {
                    box.checked = false;
                }
            }, this);

            // Hide all income-related sections
            document.getElementById('annual_income_section').style.display = 'none';
            document.getElementById('withholding_tax_annual_checkbox_section').style.display = 'none';
            document.getElementById('withholding_tax_annual_section').style.display = 'none';
            document.getElementById('monthly_income_section').style.display = 'none';
            document.getElementById('withholding_tax_monthly_checkbox_section').style.display = 'none';
            document.getElementById('withholding_tax_monthly_section').style.display = 'none';

            // Reset withholding tax fields when switching type
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

            // Recalculate total withholding tax for the newly selected income type
            total_withholding_tax = calculateTotalWithholdingTax();
        });
    });

    // Event listener for "Other Income" checkbox
    document.getElementById('has_other_income').addEventListener('change', function () {
        document.getElementById('other_income_section').style.display = this.checked ? 'block' : 'none';
    });

    // Social security checkbox
    document.getElementById('has_social_security').addEventListener('change', function () {
        document.getElementById('social_security_section').style.display = this.checked ? 'block' : 'none';
        if (this.checked) {
            calculateSocialSecurity();
        } else {
            document.getElementById('social_security').value = '0';
        }
    });

    // Recalculate Social Security when income changes
    document.getElementById('monthly_income').addEventListener('input', function () {
        let incomeType = document.querySelector('input[name="income_type"]:checked');
        if (incomeType && incomeType.value === 'monthly') {
            monthly_income = parseNumber(this.value) || 0;
            calculateSocialSecurity();
        }
    });

    document.getElementById('annual_income').addEventListener('input', function () {
        let incomeType = document.querySelector('input[name="income_type"]:checked');
        if (incomeType && incomeType.value === 'annual') {
            let annual_income = parseNumber(this.value) || 0;
            monthly_income = annual_income / 12;
            calculateSocialSecurity();
        }
    });

    // Event listeners for withholding tax inputs
    document.getElementById('withholding_tax_annual_input').addEventListener('input', function () {
        total_withholding_tax = calculateTotalWithholdingTax();
    });
    document.getElementById('withholding_tax_monthly_input').addEventListener('input', function () {
        total_withholding_tax = calculateTotalWithholdingTax();
    });

    // Populate children options
    populateChildrenOptions();

    // Additional deduction sections toggles
    document.getElementById('has_insurance').addEventListener('change', function () {
        document.getElementById('insurance_section').style.display = this.checked ? 'block' : 'none';
        updateRetirementDeductions();
    });
    document.getElementById('has_donation').addEventListener('change', function () {
        document.getElementById('donation_section').style.display = this.checked ? 'block' : 'none';
    });
    document.getElementById('has_stimulus').addEventListener('change', function () {
        document.getElementById('stimulus_section').style.display = this.checked ? 'block' : 'none';
    });

    // Retirement fields
    retirementFields.forEach(function (field) {
        let elem = document.getElementById(field);
        if (elem) {
            elem.addEventListener('input', updateRetirementDeductions);
        }
    });

    // Stepper steps navigation
    const stepperSteps = document.querySelectorAll('.stepper .stepper-step');
    stepperSteps.forEach(function (step) {
        step.addEventListener('click', function () {
            const targetStep = parseInt(this.getAttribute('data-step'));

            const currentStepElement = document.querySelector('.stepper .stepper-step.active');
            const currentStep = parseInt(currentStepElement.getAttribute('data-step'));

            if (currentStep === 1 && targetStep !== 1) {
                if (validateStep(1)) {
                    navigateToStep(targetStep);
                }
            } else if (!isTaxCalculated && targetStep === 4) {
                alert('กรุณาคลิกปุ่ม "คำนวณภาษี" เพื่อดูผลการคำนวณ');
            } else {
                navigateToStep(targetStep);
            }
        });
    });

    // Pension insurance field blur event
    document.getElementById('pension_insurance').addEventListener('blur', handlePensionInsuranceInput);

    // Life insurance input limit
    document.getElementById('life_insurance').addEventListener('blur', function () {
        let lifeInsuranceInput = document.getElementById('life_insurance');
        let lifeInsuranceValue = parseNumber(lifeInsuranceInput.value) || 0;

        if (lifeInsuranceValue > 100000) {
            lifeInsuranceValue = 100000;
            lifeInsuranceInput.value = formatNumber(lifeInsuranceValue);
            alert('เบี้ยประกันชีวิตไม่สามารถเกิน 100,000 บาท');
        }
    });
};

// Handle pension insurance input
function handlePensionInsuranceInput() {
    let pensionInput = document.getElementById('pension_insurance');
    let lifeInsuranceInput = document.getElementById('life_insurance');

    let pensionValue = parseNumber(pensionInput.value) || 0;
    let lifeInsuranceValue = parseNumber(lifeInsuranceInput.value) || 0;

    const maxLifeInsurance = 100000;
    const maxPensionInsurance = 200000;
    const combinedLimit = 300000;

    let lifeInsuranceAvailable = maxLifeInsurance - lifeInsuranceValue;
    lifeInsuranceAvailable = Math.max(0, lifeInsuranceAvailable);

    let transferAmount = Math.min(pensionValue, lifeInsuranceAvailable);

    if (transferAmount > 0) {
        lifeInsuranceValue += transferAmount;
        lifeInsuranceInput.value = formatNumber(lifeInsuranceValue);
    }

    pensionValue = pensionValue - transferAmount;

    if (pensionValue > maxPensionInsurance) {
        pensionValue = maxPensionInsurance;
        pensionInput.value = formatNumber(pensionValue);

        let totalInsurance = pensionValue + lifeInsuranceValue;
        if (totalInsurance > combinedLimit) {
            let excess = totalInsurance - combinedLimit;
            pensionValue -= excess;
            pensionInput.value = formatNumber(pensionValue);
            alert('ยอดรวมของเบี้ยประกันชีวิตและเบี้ยประกันชีวิตแบบบำนาญไม่ควรเกิน 300,000 บาท');
        }
    } else {
        pensionInput.value = formatNumber(pensionValue);
    }
}

// Validate steps
function validateStep(stepNumber) {
    if (stepNumber === 1) {
        let incomeTypeSelected = false;
        let incomeType = '';
        incomeTypeCheckboxes.forEach(function (checkbox) {
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
            let annual_income = parseNumber(document.getElementById('annual_income').value);
            if (annual_income === 0) {
                document.getElementById('annual_income_error').innerText = 'กรุณากรอกรายได้ทั้งปีของคุณ';
                return false;
            } else {
                document.getElementById('annual_income_error').innerText = '';
            }
        } else if (incomeType === 'monthly') {
            let monthly_income_input = parseNumber(document.getElementById('monthly_income').value);
            if (monthly_income_input === 0) {
                document.getElementById('monthly_income_error').innerText = 'กรุณากรอกรายได้ต่อเดือนของคุณ';
                return false;
            } else {
                document.getElementById('monthly_income_error').innerText = '';
            }
        }

        // Validate Withholding Tax for Annual Income
        const withholdingTaxAnnualCheckbox = document.getElementById('withholding_tax_annual_checkbox');
        const withholdingTaxAnnualInput = document.getElementById('withholding_tax_annual_input');
        if (withholdingTaxAnnualCheckbox.checked) {
            let withholdingTaxAnnual = parseNumber(withholdingTaxAnnualInput.value);
            if (withholdingTaxAnnual === 0) {
                document.getElementById('withholding_tax_annual_error').innerText = 'กรุณากรอกจำนวนภาษีที่หัก ณ ที่จ่าย';
                return false;
            } else {
                document.getElementById('withholding_tax_annual_error').innerText = '';
            }
        } else {
            document.getElementById('withholding_tax_annual_error').innerText = '';
        }

        // Validate Withholding Tax for Monthly Income
        const withholdingTaxMonthlyCheckbox = document.getElementById('withholding_tax_monthly_checkbox');
        const withholdingTaxMonthlyInput = document.getElementById('withholding_tax_monthly_input');
        if (withholdingTaxMonthlyCheckbox.checked) {
            let withholdingTaxMonthly = parseNumber(withholdingTaxMonthlyInput.value);
            if (withholdingTaxMonthly === 0) {
                document.getElementById('withholding_tax_monthly_error').innerText = 'กรุณากรอกจำนวนภาษีที่หัก ณ ที่จ่ายต่อเดือน';
                return false;
            } else {
                document.getElementById('withholding_tax_monthly_error').innerText = '';
            }
        } else {
            document.getElementById('withholding_tax_monthly_error').innerText = '';
        }

        return true;
    } else {
        return true;
    }
}

// Calculate tax
function calculateTax() {
    document.querySelectorAll('.error').forEach(function (el) {
        el.innerText = '';
    });

    let errorMessages = [];
    let errorFields = [];

    // Personal deductions
    let personal_allowance = 60000;
    let spouse = document.getElementById('spouse').value;
    let spouse_allowance = (spouse === 'yes') ? 60000 : 0;

    // Children
    let children_own = parseInt(document.getElementById('children_own').value) || 0;
    let child_allowance = 0;
    for (let i = 1; i <= children_own; i++) {
        if (i >= 2) {
            child_allowance += 60000;
        } else {
            child_allowance += 30000;
        }
    }

    let children_adopted = parseInt(document.getElementById('children_adopted').value) || 0;
    if (children_adopted > 3) children_adopted = 3;
    child_allowance += children_adopted * 30000;

    // Parents
    let parents_allowance = 0;
    if (document.getElementById('your_father').checked) {
        parents_allowance += 30000;
    }
    if (document.getElementById('your_mother').checked) {
        parents_allowance += 30000;
    }
    if (document.getElementById('spouse_father').checked) {
        parents_allowance += 30000;
    }
    if (document.getElementById('spouse_mother').checked) {
        parents_allowance += 30000;
    }
    if (parents_allowance > 120000) parents_allowance = 120000;

    let disabled_persons = parseInt(document.getElementById('disabled_persons').value) || 0;
    let disabled_allowance = disabled_persons * 60000;

    let social_security = 0;
    if (document.getElementById('has_social_security').checked) {
        social_security = parseNumber(document.getElementById('social_security').value);
    }

    let total_personal_deductions = personal_allowance + spouse_allowance + child_allowance + parents_allowance + disabled_allowance + social_security;

    // Investment deductions
    let total_investment_deductions = 0;

    let retirement_total = 0;
    let insurance_total = 0;
    let parent_health_insurance = 0;

    if (document.getElementById('has_insurance').checked) {
        let life_insurance = parseNumber(document.getElementById('life_insurance').value);
        if (life_insurance > 100000) {
            errorMessages.push('เบี้ยประกันชีวิตและประกันสะสมทรัพย์ไม่ควรเกิน 100,000 บาท');
            errorFields.push('life_insurance');
        }
        life_insurance = Math.min(life_insurance, 100000);

        let health_insurance = parseNumber(document.getElementById('health_insurance').value);
        if (health_insurance > 25000) {
            errorMessages.push('เบี้ยประกันสุขภาพไม่ควรเกิน 25,000 บาท');
            errorFields.push('health_insurance');
        }
        health_insurance = Math.min(health_insurance, 25000);

        insurance_total = life_insurance + health_insurance;
        if (insurance_total > 100000) {
            errorMessages.push('รวมเบี้ยประกันชีวิตและสุขภาพไม่ควรเกิน 100,000 บาท');
            errorFields.push('health_insurance');
        }
        insurance_total = Math.min(insurance_total, 100000);

        parent_health_insurance = parseNumber(document.getElementById('parent_health_insurance').value);
        if (parent_health_insurance > 15000) {
            errorMessages.push('เบี้ยประกันสุขภาพบิดามารดาไม่ควรเกิน 15,000 บาท');
            errorFields.push('parent_health_insurance');
        }
        parent_health_insurance = Math.min(parent_health_insurance, 15000);

        let pension_insurance = parseNumber(document.getElementById('pension_insurance').value);
        if (pension_insurance > 200000) {
            errorMessages.push('เบี้ยประกันชีวิตแบบบำนาญไม่ควรเกิน 200,000 บาท');
            errorFields.push('pension_insurance');
        }
        pension_insurance = Math.min(pension_insurance, 200000);

        let pvd = parseNumber(document.getElementById('pvd').value);
        let pvd_limit = Math.min(total_income * 0.15, 500000);
        if (pvd > pvd_limit) {
            errorMessages.push('เงินสมทบกองทุนสำรองเลี้ยงชีพ (PVD) ไม่ควรเกิน 15% ของรายได้หรือ 500,000 บาท');
            errorFields.push('pvd');
        }
        pvd = Math.min(pvd, pvd_limit);

        let gpf = parseNumber(document.getElementById('gpf').value);
        let gpf_limit = Math.min(total_income * 0.30, 500000);
        if (gpf > gpf_limit) {
            errorMessages.push('กองทุนบำเหน็จบำนาญราชการ (กบข.) ไม่ควรเกิน 30% ของรายได้หรือ 500,000 บาท');
            errorFields.push('gpf');
        }
        gpf = Math.min(gpf, gpf_limit);

        let ssf = parseNumber(document.getElementById('ssf').value);
        let ssf_limit = Math.min(total_income * 0.30, 200000);
        if (ssf > ssf_limit) {
            errorMessages.push('กองทุนรวมเพื่อการออม (SSF) ไม่ควรเกิน 30% ของรายได้หรือ 200,000 บาท');
            errorFields.push('ssf');
        }
        ssf = Math.min(ssf, ssf_limit);

        let rmf = parseNumber(document.getElementById('rmf').value);
        let rmf_limit = Math.min(total_income * 0.30, 500000);
        if (rmf > rmf_limit) {
            errorMessages.push('กองทุนรวมเพื่อการเลี้ยงชีพ (RMF) ไม่ควรเกิน 30% ของรายได้หรือ 500,000 บาท');
            errorFields.push('rmf');
        }
        rmf = Math.min(rmf, rmf_limit);

        let thaiesg = parseNumber(document.getElementById('thaiesg').value);
        let thaiesg_limit = Math.min(total_income * 0.30, 300000);
        if (thaiesg > thaiesg_limit) {
            errorMessages.push('กองทุนรวมไทยเพื่อความยั่งยืน (Thai ESG) ไม่ควรเกิน 30% ของรายได้หรือ 300,000 บาท');
            errorFields.push('thaiesg');
        }
        thaiesg = Math.min(thaiesg, thaiesg_limit);

        let social_enterprise = parseNumber(document.getElementById('social_enterprise').value);
        if (social_enterprise > 100000) {
            errorMessages.push('เงินลงทุนธุรกิจ Social Enterprise ไม่ควรเกิน 100,000 บาท');
            errorFields.push('social_enterprise');
        }
        social_enterprise = Math.min(social_enterprise, 100000);

        let nsf = parseNumber(document.getElementById('nsf').value);
        if (nsf > 30000) {
            errorMessages.push('เงินสมทบกองทุนการออมแห่งชาติ (กอช.) ไม่ควรเกิน 30,000 บาท');
            errorFields.push('nsf');
        }
        nsf = Math.min(nsf, 30000);

        retirement_total = pension_insurance + pvd + gpf + rmf + nsf + ssf;
        if (retirement_total > 500000) {
            errorMessages.push('รวมค่าลดหย่อนกลุ่มเกษียณไม่ควรเกิน 500,000 บาท');
            errorFields.push('pension_insurance');
        }
        retirement_total = Math.min(retirement_total, 500000);

        total_investment_deductions = insurance_total + parent_health_insurance + retirement_total + thaiesg + social_enterprise;
    }

    // Donation deductions
    let total_donation_deductions = 0;
    if (document.getElementById('has_donation').checked) {
        let donation = parseNumber(document.getElementById('donation').value);
        let donation_education = parseNumber(document.getElementById('donation_education').value) * 2;
        let donation_political = parseNumber(document.getElementById('donation_political').value);
        if (donation_political > 10000) {
            errorMessages.push('เงินบริจาคพรรคการเมืองไม่ควรเกิน 10,000 บาท');
            errorFields.push('donation_political');
        }
        donation_political = Math.min(donation_political, 10000);

        total_donation_deductions = donation + donation_education + donation_political;
    }

    // Stimulus deductions
    let total_stimulus_deductions = 0;
    if (document.getElementById('has_stimulus').checked) {
        let easy_ereceipt = parseNumber(document.getElementById('easy_ereceipt').value);
        if (easy_ereceipt > 50000) {
            errorMessages.push('ช้อปดีมีคืน 2567 ไม่ควรเกิน 50,000 บาท');
            errorFields.push('easy_ereceipt');
        }
        easy_ereceipt = Math.min(easy_ereceipt, 50000);

        let local_travel = parseNumber(document.getElementById('local_travel').value);
        if (local_travel > 15000) {
            errorMessages.push('ค่าลดหย่อนเที่ยวเมืองรอง 2567 ไม่ควรเกิน 15,000 บาท');
            errorFields.push('local_travel');
        }
        local_travel = Math.min(local_travel, 15000);

        let home_loan_interest = parseNumber(document.getElementById('home_loan_interest').value);
        if (home_loan_interest > 100000) {
            errorMessages.push('ดอกเบี้ยกู้ยืมเพื่อที่อยู่อาศัยไม่ควรเกิน 100,000 บาท');
            errorFields.push('home_loan_interest');
        }
        home_loan_interest = Math.min(home_loan_interest, 100000);

        let new_home = parseNumber(document.getElementById('new_home').value);
        let new_home_deduction = Math.floor(new_home / 1000000) * 10000;
        if (new_home_deduction > 100000) {
            errorMessages.push('ค่าสร้างบ้านใหม่ 2567-2568 ไม่ควรเกิน 100,000 บาท');
            errorFields.push('new_home');
        }
        new_home_deduction = Math.min(new_home_deduction, 100000);

        total_stimulus_deductions = easy_ereceipt + local_travel + home_loan_interest + new_home_deduction;
    }

    if (errorMessages.length > 0) {
        showErrorModal(errorMessages, errorFields);
        return;
    }

    let total_deductions = expense + total_personal_deductions + total_investment_deductions + total_stimulus_deductions + total_donation_deductions;
    let taxable_income = total_income - total_deductions;
    if (taxable_income < 0) taxable_income = 0;

    // Donation limit 10% rule
    if (document.getElementById('has_donation').checked) {
        let donation_limit = taxable_income * 0.10;
        if (total_donation_deductions > donation_limit) {
            total_donation_deductions = donation_limit;
        }
    }

    total_deductions = expense + total_personal_deductions + total_investment_deductions + total_stimulus_deductions + total_donation_deductions;

    let net_income = total_income - total_deductions;
    if (net_income < 0) net_income = 0;

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

    let ssf_limit = Math.min(total_income * 0.30, 200000); 
    let rmf_limit = Math.min(total_income * 0.30, 500000); 
    let retirement_total_limit = 500000; 

    let current_ssf = parseNumber(document.getElementById('ssf').value) || 0;
    let current_rmf = parseNumber(document.getElementById('rmf').value) || 0;
    let current_pvd = parseNumber(document.getElementById('pvd').value) || 0;
    let current_gpf = parseNumber(document.getElementById('gpf').value) || 0;
    let current_pension_insurance = parseNumber(document.getElementById('pension_insurance').value) || 0;
    let current_nsf = parseNumber(document.getElementById('nsf').value) || 0;

    let total_retirement_contributions = current_ssf + current_rmf + current_pvd + current_gpf + current_pension_insurance + current_nsf;

    remaining_retirement_allowance = retirement_total_limit - total_retirement_contributions;
    remaining_retirement_allowance = Math.max(0, remaining_retirement_allowance);

    let remaining_ssf_limit = ssf_limit - current_ssf;
    remaining_ssf_limit = Math.max(0, remaining_ssf_limit);

    let remaining_rmf_limit = rmf_limit - current_rmf;
    remaining_rmf_limit = Math.max(0, remaining_rmf_limit);

    let recommended_ssf = Math.min(remaining_ssf_limit, remaining_retirement_allowance);
    let recommended_rmf = Math.min(remaining_rmf_limit, remaining_retirement_allowance);

    let current_thaiesg = parseNumber(document.getElementById('thaiesg').value) || 0;
    let thaiesg_limit_final = Math.min(total_income * 0.30, 300000);
    let recommended_thaiesg = Math.max(0, Math.min(thaiesg_limit_final - current_thaiesg, total_income * 0.30 - current_thaiesg));

    document.getElementById('result_total_income').innerText = formatNumber(total_income);
    document.getElementById('result_expense').innerText = formatNumber(expense);
    document.getElementById('result_deductions').innerText = formatNumber(total_deductions - expense);
    document.getElementById('result_net_income').innerText = formatNumber(net_income);
    document.getElementById('result_effective_tax_rate').innerText = effective_tax_rate.toFixed(2) + '%';

    total_withholding_tax = calculateTotalWithholdingTax();
    let withholdingTaxParent = document.getElementById('result_withholding_tax').parentElement;
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

    updateInvestmentDisplay('max_ssf', recommended_ssf);
    updateInvestmentDisplay('max_rmf', recommended_rmf);
    updateInvestmentDisplay('max_thaiesg', recommended_thaiesg);

    isTaxCalculated = true;
    setActiveStep(4);
    showStep(4);
}

// Update retirement deductions
function updateRetirementDeductions() {
    let ssf = parseNumber(document.getElementById('ssf').value) || 0;
    let rmf = parseNumber(document.getElementById('rmf').value) || 0;
    let pvd = parseNumber(document.getElementById('pvd').value) || 0;
    let gpf = parseNumber(document.getElementById('gpf').value) || 0;
    let pension_insurance = parseNumber(document.getElementById('pension_insurance').value) || 0;
    let nsf = parseNumber(document.getElementById('nsf').value) || 0;

    let total_retirement_contributions = ssf + rmf + pvd + gpf + pension_insurance + nsf;

    let retirement_total_limit = 500000;
    remaining_retirement_allowance = retirement_total_limit - total_retirement_contributions;
    remaining_retirement_allowance = Math.max(0, remaining_retirement_allowance);

    let ssf_limit = Math.min(total_income * 0.30, 200000);
    let rmf_limit = Math.min(total_income * 0.30, 500000);

    let remaining_ssf_limit = ssf_limit - ssf;
    remaining_ssf_limit = Math.max(0, remaining_ssf_limit);

    let remaining_rmf_limit = rmf_limit - rmf;
    remaining_rmf_limit = Math.max(0, remaining_rmf_limit);

    let recommended_ssf = Math.min(remaining_ssf_limit, remaining_retirement_allowance);
    let recommended_rmf = Math.min(remaining_rmf_limit, remaining_retirement_allowance);

    let thaiesg = parseNumber(document.getElementById('thaiesg').value) || 0;
    let thaiesg_limit = Math.min(total_income * 0.30, 300000);
    let recommended_thaiesg = Math.max(0, Math.min(thaiesg_limit - thaiesg, total_income * 0.30 - thaiesg));

    updateInvestmentDisplay('max_ssf', recommended_ssf);
    updateInvestmentDisplay('max_rmf', recommended_rmf);
    updateInvestmentDisplay('max_thaiesg', recommended_thaiesg);
}

// Show error modal
function showErrorModal(messages, fields) {
    const errorModal = document.getElementById('errorModal');
    const errorList = document.getElementById('errorList');
    errorList.innerHTML = '';
    messages.forEach(function (msg) {
        const li = document.createElement('li');
        li.innerText = msg;
        errorList.appendChild(li);
    });
    errorModal.style.display = 'block';
    errorModal.errorFields = fields;
}

// Close error modal
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

// Edit data
function editData() {
    navigateToStep(3);
}

// Reset data
function resetData() {
    total_income = 0;
    monthly_income = 0;
    expense = 0;
    isTaxCalculated = false;
    total_withholding_tax = 0;

    document.querySelectorAll('input[type="text"]').forEach(function(input) {
        if (input.id === 'bonus_income' || input.id === 'other_income' || input.id === 'withholding_tax_annual_input' || input.id === 'withholding_tax_monthly_input') {
            input.value = '0';
        } else {
            input.value = '';
        }
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(function(checkbox) {
        checkbox.checked = false;
    });

    document.querySelectorAll('select').forEach(function(select) {
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

    document.querySelectorAll('.error').forEach(function(el) {
        el.innerText = '';
    });

    setActiveStep(1);
    showStep(1);

    document.getElementById('step-4').style.display = 'none';
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Go to investment section
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

// Update investment display
function updateInvestmentDisplay(elementId, amount) {
    const element = document.getElementById(elementId);
    if (elementId === 'max_ssf' || elementId === 'max_rmf') {
        if (amount <= 0) {
            element.innerText = 'ไม่สามารถซื้อเพิ่มได้';
            element.style.color = 'red';
        } else {
            element.innerText = formatNumber(amount) + ' บาท ';
            element.style.color = 'green';
        }
    } else if (elementId === 'max_thaiesg') {
        if (amount <= 0) {
            element.innerText = 'ไม่สามารถซื้อเพิ่มได้';
            element.style.color = 'red';
        } else {
            element.innerText = formatNumber(amount) + ' บาท';
            element.style.color = 'green';
        }
    }
}

// Set active step in stepper
function setActiveStep(stepNumber) {
    const stepper = document.getElementById('stepper');
    stepper.setAttribute('data-current-step', stepNumber);

    const stepperSteps = document.querySelectorAll('.stepper .stepper-step');
    stepperSteps.forEach(function (step) {
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

// Navigate to a specific step
function navigateToStep(stepNumber) {
    document.querySelectorAll('.container .step-content').forEach(function (step) {
        step.classList.remove('active');
        step.style.display = 'none';
    });

    document.getElementById(`step-${stepNumber}`).style.display = 'block';
    document.getElementById(`step-${stepNumber}`).classList.add('active');

    setActiveStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show a specific step
function showStep(stepNumber) {
    navigateToStep(stepNumber);
}

// Populate children options
function populateChildrenOptions() {
    const childrenOwnSelect = document.getElementById('children_own');
    const childrenAdoptedSelect = document.getElementById('children_adopted');
    const disabledPersonsSelect = document.getElementById('disabled_persons');
    for (let i = 0; i <= 10; i++) {
        const optionOwn = document.createElement('option');
        optionOwn.value = i;
        optionOwn.text = i;
        if (i === 0) {
            optionOwn.selected = true;
        }
        if (childrenOwnSelect) {
            childrenOwnSelect.add(optionOwn);
        }

        const optionAdopted = document.createElement('option');
        optionAdopted.value = i;
        optionAdopted.text = i;
        if (i === 0) {
            optionAdopted.selected = true;
        }
        if (childrenAdoptedSelect) {
            childrenAdoptedSelect.add(optionAdopted);
        }

        const optionDisabled = document.createElement('option');
        optionDisabled.value = i;
        optionDisabled.text = i;
        if (i === 0) {
            optionDisabled.selected = true;
        }
        if (disabledPersonsSelect) {
            disabledPersonsSelect.add(optionDisabled);
        }
    }
}

// Print result (with inline CSS for reliability)
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
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();

    printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
    };
}

// Save result as image
function saveAsImage() {
    const printableArea = document.getElementById('printable-area');

    html2canvas(printableArea).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        // Open a new tab with the image
        const newWindow = window.open('', '_blank');
        newWindow.document.write('<html><head><title>ผลลัพธ์การคำนวณภาษี</title></head><body style="margin:0; padding:0; text-align:center;">');
        newWindow.document.write('<img src="' + imgData + '" style="max-width:100%; height:auto; display:block; margin:0 auto;" />');
        newWindow.document.write('</body></html>');
        newWindow.document.close();
        // No download triggered here. The user can now press and hold the image on iOS to save it.
    }).catch(error => {
        console.error('Error saving image:', error);
        alert('ไม่สามารถบันทึกรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    });
}

// Make functions available globally if needed
window.printResult = printResult;
window.saveAsImage = saveAsImage;
