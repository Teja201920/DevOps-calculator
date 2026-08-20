const currentOperandElement = document.querySelector("[data-current-operand]");
const previousOperandElement = document.querySelector("[data-previous-operand]");
const buttonsContainer = document.querySelector(".buttons");

let currentOperand = "0";
let previousOperand = "";
let operation = null;
let shouldResetScreen = false;
let hasError = false;

const OPERATION_SYMBOLS = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

initCalculator();

function initCalculator() {
  buttonsContainer.addEventListener("click", handleButtonClick);
  document.addEventListener("keydown", handleKeyboard);
}

function handleButtonClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  addPressAnimation(button);

  if (button.dataset.number !== undefined) {
    appendNumber(button.dataset.number);
    return;
  }

  switch (button.dataset.action) {
    case "clear":
      clearCalculator();
      break;
    case "delete":
      deleteNumber();
      break;
    case "percent":
      handlePercentage();
      break;
    case "add":
    case "subtract":
    case "multiply":
    case "divide":
      chooseOperation(button.dataset.action);
      break;
    case "equals":
      compute();
      break;
    default:
      break;
  }
}

function addPressAnimation(button) {
  button.classList.add("pressed");
  window.setTimeout(() => button.classList.remove("pressed"), 120);
}

function appendNumber(digit) {
  if (hasError) {
    clearCalculator();
  }

  if (digit === ".") {
    if (shouldResetScreen) {
      currentOperand = "0.";
      shouldResetScreen = false;
      updateDisplay();
      return;
    }

    if (currentOperand.includes(".")) return;
    if (currentOperand === "" || currentOperand === "-") {
      currentOperand += "0.";
      updateDisplay();
      return;
    }
  }

  if (shouldResetScreen) {
    currentOperand = digit === "." ? "0." : digit;
    shouldResetScreen = false;
    updateDisplay();
    return;
  }

  if (digit !== "." && currentOperand === "0") {
    currentOperand = digit;
    updateDisplay();
    return;
  }

  if (currentOperand.replace(".", "").length >= 12) return;

  currentOperand += digit;
  updateDisplay();
}

function chooseOperation(nextOperation) {
  if (hasError) return;

  const currentValue = parseFloat(currentOperand);
  if (Number.isNaN(currentValue)) return;

  if (currentOperand === "" && previousOperand !== "") {
    operation = nextOperation;
    updateDisplay();
    return;
  }

  if (previousOperand !== "" && !shouldResetScreen) {
    compute(false);
    if (hasError) return;
  }

  operation = nextOperation;
  previousOperand = currentOperand;
  shouldResetScreen = true;
  updateDisplay();
}

function compute(finalize = true) {
  if (hasError) return;

  if (operation == null || previousOperand === "") return;

  const prev = parseFloat(previousOperand);
  const current = parseFloat(currentOperand);

  if (Number.isNaN(prev) || Number.isNaN(current)) {
    showError();
    return;
  }

  let result;

  switch (operation) {
    case "add":
      result = prev + current;
      break;
    case "subtract":
      result = prev - current;
      break;
    case "multiply":
      result = prev * current;
      break;
    case "divide":
      if (current === 0) {
        showError();
        return;
      }
      result = prev / current;
      break;
    default:
      return;
  }

  result = roundResult(result);

  if (!Number.isFinite(result)) {
    showError();
    return;
  }

  currentOperand = formatNumber(result);
  previousOperand = "";
  operation = null;
  shouldResetScreen = true;

  if (finalize) {
    updateDisplay();
  } else {
    updateDisplay();
  }
}

function clearCalculator() {
  currentOperand = "0";
  previousOperand = "";
  operation = null;
  shouldResetScreen = false;
  hasError = false;
  updateDisplay();
}

function deleteNumber() {
  if (hasError) {
    clearCalculator();
    return;
  }

  if (shouldResetScreen) return;

  if (currentOperand.length <= 1 || (currentOperand.length === 2 && currentOperand.startsWith("-"))) {
    currentOperand = "0";
  } else {
    currentOperand = currentOperand.slice(0, -1);
  }

  updateDisplay();
}

function handlePercentage() {
  if (hasError) return;

  const value = parseFloat(currentOperand);
  if (Number.isNaN(value)) {
    showError();
    return;
  }

  const result = roundResult(value / 100);
  currentOperand = formatNumber(result);
  shouldResetScreen = true;
  updateDisplay();
}

function showError() {
  currentOperand = "Error";
  previousOperand = "";
  operation = null;
  shouldResetScreen = true;
  hasError = true;
  updateDisplay();
}

function roundResult(value) {
  return Math.round((value + Number.EPSILON) * 1e10) / 1e10;
}

function formatNumber(value) {
  const stringValue = String(value);

  if (stringValue.includes("e") || stringValue.includes("E")) {
    return Number(value).toPrecision(8).replace(/\.?0+$/, "");
  }

  if (stringValue.length > 12) {
    const rounded = roundResult(value);
    const roundedString = String(rounded);
    if (roundedString.length <= 12) {
      return roundedString;
    }
    return Number(value).toExponential(6);
  }

  return stringValue;
}

function updateDisplay() {
  currentOperandElement.textContent = currentOperand;
  currentOperandElement.classList.toggle("error", hasError);

  if (operation != null && previousOperand !== "" && !hasError) {
    previousOperandElement.textContent = `${formatDisplayValue(previousOperand)} ${OPERATION_SYMBOLS[operation]}`;
  } else {
    previousOperandElement.textContent = previousOperand && !hasError
      ? formatDisplayValue(previousOperand)
      : "";
  }
}

function formatDisplayValue(value) {
  if (value === "Error") return value;
  const numericValue = parseFloat(value);
  if (Number.isNaN(numericValue)) return value;
  return formatNumber(numericValue);
}

function handleKeyboard(event) {
  const { key } = event;

  if (/^[0-9]$/.test(key)) {
    event.preventDefault();
    appendNumber(key);
    return;
  }

  switch (key) {
    case ".":
      event.preventDefault();
      appendNumber(".");
      break;
    case "+":
      event.preventDefault();
      chooseOperation("add");
      break;
    case "-":
      event.preventDefault();
      chooseOperation("subtract");
      break;
    case "*":
      event.preventDefault();
      chooseOperation("multiply");
      break;
    case "/":
      event.preventDefault();
      chooseOperation("divide");
      break;
    case "%":
      event.preventDefault();
      handlePercentage();
      break;
    case "Enter":
    case "=":
      event.preventDefault();
      compute();
      break;
    case "Escape":
      event.preventDefault();
      clearCalculator();
      break;
    case "Backspace":
      event.preventDefault();
      deleteNumber();
      break;
    default:
      break;
  }
}
