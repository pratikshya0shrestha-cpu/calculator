/**
 * AuraCalc — Modern Glassmorphic Scientific & Standard Calculator
 * Core Logic, Parser, Sound Synthesis, and Interactive Controls
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const mainDisplay = document.getElementById('mainDisplay');
  const expressionDisplay = document.getElementById('expressionDisplay');
  const previewDisplay = document.getElementById('previewDisplay');
  const copyDisplayBtn = document.getElementById('copyDisplayBtn');

  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyBadge = document.getElementById('historyBadge');
  const historyDrawer = document.getElementById('historyDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');

  const modeStandardBtn = document.getElementById('modeStandardBtn');
  const modeScientificBtn = document.getElementById('modeScientificBtn');
  const scientificPanel = document.getElementById('scientificPanel');
  const appContainer = document.querySelector('.app-container');

  const radDegToggle = document.getElementById('radDegToggle');
  const memoryStatus = document.getElementById('memoryStatus');
  const memoryValuePreview = document.getElementById('memoryValuePreview');

  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  // Keypad & Scientific Buttons
  const keypadGrid = document.getElementById('keypadGrid');
  const sciGrid = document.querySelector('.sci-grid');
  const btnDegRad = document.getElementById('btnDegRad');
  const btnInv = document.getElementById('btnInv');
  const btnSin = document.getElementById('btnSin');
  const btnCos = document.getElementById('btnCos');
  const btnTan = document.getElementById('btnTan');

  // Application State
  let currentExpression = '';
  let lastResult = null;
  let hasCalculated = false;
  let angleUnit = 'DEG'; // 'DEG' or 'RAD'
  let isInverse = false;
  let memoryValue = parseFloat(localStorage.getItem('auracalc_memory')) || 0;
  let soundEnabled = localStorage.getItem('auracalc_sound') !== 'false';
  let currentThemeIndex = 0;
  const themes = ['obsidian', 'cyberpunk', 'frost'];
  let historyData = [];

  try {
    const savedHistory = localStorage.getItem('auracalc_history');
    if (savedHistory) historyData = JSON.parse(savedHistory);
  } catch (e) {
    historyData = [];
  }

  // Web Audio Context for Tactile Feedback
  let audioCtx = null;
  function playClickSound(type = 'default') {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;

      let freq = 420;
      let duration = 0.04;
      let wave = 'sine';

      if (type === 'num') {
        freq = 380;
        duration = 0.035;
      } else if (type === 'op') {
        freq = 520;
        duration = 0.045;
      } else if (type === 'equals') {
        freq = 680;
        duration = 0.08;
      } else if (type === 'clear') {
        freq = 260;
        duration = 0.05;
        wave = 'triangle';
      } else if (type === 'error') {
        freq = 180;
        duration = 0.12;
        wave = 'sawtooth';
      }

      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now);
      if (type === 'equals') {
        osc.frequency.exponentialRampToValueAtTime(840, now + duration);
      }

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (err) {
      // Audio autoplay policy or not supported
    }
  }

  // Theme Management
  function initTheme() {
    const savedTheme = localStorage.getItem('auracalc_theme') || 'obsidian';
    const index = themes.indexOf(savedTheme);
    currentThemeIndex = index !== -1 ? index : 0;
    document.documentElement.setAttribute('data-theme', themes[currentThemeIndex]);
  }

  function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    const newTheme = themes[currentThemeIndex];
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('auracalc_theme', newTheme);
    showToast(`Theme: ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`);
    playClickSound('default');
  }

  // Audio Toggle Management
  function updateSoundUI() {
    if (soundEnabled) {
      soundIconOn.classList.remove('hidden');
      soundIconOff.classList.add('hidden');
    } else {
      soundIconOn.classList.add('hidden');
      soundIconOff.classList.remove('hidden');
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('auracalc_sound', soundEnabled);
    updateSoundUI();
    if (soundEnabled) playClickSound('default');
    showToast(soundEnabled ? 'Sound Enabled' : 'Sound Muted');
  }

  // Toast Notification
  let toastTimer = null;
  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2200);
  }

  // Memory UI Management
  function updateMemoryUI() {
    if (memoryValue !== 0) {
      memoryStatus.classList.remove('hidden');
      memoryValuePreview.textContent = formatNumber(memoryValue);
    } else {
      memoryStatus.classList.add('hidden');
    }
    localStorage.setItem('auracalc_memory', memoryValue);
  }

  // Format Display Number with Thousands Separators
  function formatNumber(num) {
    if (isNaN(num) || !isFinite(num)) return num.toString();
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  // Sanitize and Format Expression for Human Display
  function formatExpressionForDisplay(expr) {
    return expr
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/(?<![eE\d])-(?!\d)/g, ' − ')
      .replace(/\^/g, ' ^ ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Real-time Display Update
  function updateDisplay() {
    expressionDisplay.textContent = formatExpressionForDisplay(currentExpression);

    if (!currentExpression) {
      mainDisplay.textContent = '0';
      previewDisplay.textContent = '';
      return;
    }

    // Extract current trailing token for the large main display
    const tokens = currentExpression.split(/[\+\-\*\/\^]/);
    const lastToken = tokens[tokens.length - 1].trim();

    if (hasCalculated && lastResult !== null) {
      mainDisplay.textContent = formatNumber(lastResult);
      previewDisplay.textContent = '';
    } else {
      mainDisplay.textContent = lastToken || '0';
      // Calculate live preview
      const preview = evaluateSafely(currentExpression);
      if (preview !== null && !isNaN(preview) && isFinite(preview)) {
        previewDisplay.textContent = `= ${formatNumber(preview)}`;
      } else {
        previewDisplay.textContent = '';
      }
    }

    // Scale font size dynamically to prevent overflow
    adjustFontSize();
  }

  function adjustFontSize() {
    const len = mainDisplay.textContent.length;
    if (len > 14) {
      mainDisplay.style.fontSize = '1.4rem';
    } else if (len > 10) {
      mainDisplay.style.fontSize = '1.8rem';
    } else {
      mainDisplay.style.fontSize = '2.35rem';
    }
  }

  // Factorial Function
  function factorial(n) {
    if (n < 0 || Math.floor(n) !== n) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= Math.min(n, 100); i++) res *= i;
    return res;
  }

  // Safe Mathematical Expression Parser and Evaluator
  function evaluateSafely(expr) {
    if (!expr || typeof expr !== 'string') return null;
    let cleaned = expr.trim();
    if (!cleaned) return null;

    // Normalize operators
    cleaned = cleaned.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

    // Replace constants
    cleaned = cleaned.replace(/\bπ\b/g, Math.PI.toString());
    cleaned = cleaned.replace(/\be\b/g, Math.E.toString());

    // Replace scientific function calls
    // Handle trig angles (DEG or RAD)
    const degToRad = (val) => (val * Math.PI) / 180;
    const radToDeg = (val) => (val * 180) / Math.PI;

    try {
      // Replace power operator a^b -> Math.pow(a, b)
      let parsed = cleaned.replace(/(\d+(\.\d+)?)\s*\^\s*(\d+(\.\d+)?)/g, 'Math.pow($1, $3)');

      // Handle custom scientific tokens
      parsed = parsed.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
      parsed = parsed.replace(/cbrt\(([^)]+)\)/g, 'Math.cbrt($1)');
      parsed = parsed.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');
      parsed = parsed.replace(/log\(([^)]+)\)/g, 'Math.log10($1)');
      parsed = parsed.replace(/abs\(([^)]+)\)/g, 'Math.abs($1)');

      if (angleUnit === 'DEG') {
        parsed = parsed.replace(/sin\(([^)]+)\)/g, 'Math.sin(($1) * Math.PI / 180)');
        parsed = parsed.replace(/cos\(([^)]+)\)/g, 'Math.cos(($1) * Math.PI / 180)');
        parsed = parsed.replace(/tan\(([^)]+)\)/g, 'Math.tan(($1) * Math.PI / 180)');
        parsed = parsed.replace(/asin\(([^)]+)\)/g, '(Math.asin($1) * 180 / Math.PI)');
        parsed = parsed.replace(/acos\(([^)]+)\)/g, '(Math.acos($1) * 180 / Math.PI)');
        parsed = parsed.replace(/atan\(([^)]+)\)/g, '(Math.atan($1) * 180 / Math.PI)');
      } else {
        parsed = parsed.replace(/sin\(([^)]+)\)/g, 'Math.sin($1)');
        parsed = parsed.replace(/cos\(([^)]+)\)/g, 'Math.cos($1)');
        parsed = parsed.replace(/tan\(([^)]+)\)/g, 'Math.tan($1)');
        parsed = parsed.replace(/asin\(([^)]+)\)/g, 'Math.asin($1)');
        parsed = parsed.replace(/acos\(([^)]+)\)/g, 'Math.acos($1)');
        parsed = parsed.replace(/atan\(([^)]+)\)/g, 'Math.atan($1)');
      }

      // Check for illegal characters to guarantee safety
      if (/[^0-9+\-*/().,%eE\sMathpowsqrctlnbfig]/.test(parsed)) {
        return null;
      }

      // Safe Function evaluation with controlled scope
      const compute = new Function('Math', 'fact', `
        try {
          return (${parsed});
        } catch(e) {
          return null;
        }
      `);

      const result = compute(Math, factorial);
      if (result !== null && !isNaN(result) && isFinite(result)) {
        // Round floating point inaccuracies (e.g. 0.1 + 0.2 = 0.30000000000000004)
        return parseFloat(result.toFixed(10));
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  // Append Character or Number
  function appendChar(char) {
    if (hasCalculated) {
      // If result was just produced and user types a number, start fresh
      if (!['+', '-', '*', '/', '×', '÷', '^'].includes(char)) {
        currentExpression = '';
      }
      hasCalculated = false;
    }

    // Decimal safety: prevent multiple decimals in one token
    if (char === '.') {
      const parts = currentExpression.split(/[\+\-\*\/\^]/);
      const last = parts[parts.length - 1];
      if (last.includes('.')) return;
      if (!last || last === '') {
        currentExpression += '0';
      }
    }

    currentExpression += char;
    updateDisplay();
    playClickSound('num');
  }

  // Append Operator
  function appendOperator(op) {
    let normalized = op;
    if (op === '×') normalized = '*';
    if (op === '÷') normalized = '/';
    if (op === '−') normalized = '-';

    if (hasCalculated && lastResult !== null) {
      currentExpression = lastResult.toString();
      hasCalculated = false;
    }

    if (!currentExpression) {
      if (normalized === '-') {
        currentExpression = '-';
        updateDisplay();
        playClickSound('op');
      }
      return;
    }

    // If last char is already an operator, replace it
    const lastChar = currentExpression.slice(-1);
    if (['+', '-', '*', '/', '^'].includes(lastChar)) {
      currentExpression = currentExpression.slice(0, -1) + normalized;
    } else {
      currentExpression += normalized;
    }

    updateDisplay();
    playClickSound('op');
  }

  // Execute Calculation (=)
  function executeCalculation() {
    if (!currentExpression) return;
    const finalResult = evaluateSafely(currentExpression);

    if (finalResult !== null && !isNaN(finalResult) && isFinite(finalResult)) {
      const entry = {
        expression: currentExpression,
        result: finalResult,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      addHistoryEntry(entry);
      lastResult = finalResult;
      hasCalculated = true;
      playClickSound('equals');
      updateDisplay();
    } else {
      playClickSound('error');
      mainDisplay.textContent = 'Error';
      previewDisplay.textContent = 'Invalid expression';
      setTimeout(() => updateDisplay(), 1400);
    }
  }

  // Clear (AC)
  function clearAll() {
    currentExpression = '';
    lastResult = null;
    hasCalculated = false;
    updateDisplay();
    playClickSound('clear');
  }

  // Backspace (Delete Last Char)
  function deleteLast() {
    if (hasCalculated) {
      clearAll();
      return;
    }
    if (currentExpression.length > 0) {
      currentExpression = currentExpression.slice(0, -1);
      updateDisplay();
      playClickSound('default');
    }
  }

  // Percentage Action
  function applyPercent() {
    if (!currentExpression) return;
    const val = evaluateSafely(currentExpression);
    if (val !== null) {
      const res = val / 100;
      currentExpression = res.toString();
      hasCalculated = true;
      lastResult = res;
      updateDisplay();
      playClickSound('op');
    }
  }

  // Plus/Minus Negate
  function applyNegate() {
    if (hasCalculated && lastResult !== null) {
      currentExpression = (-lastResult).toString();
      lastResult = -lastResult;
      updateDisplay();
      playClickSound('op');
      return;
    }
    if (!currentExpression) return;
    if (currentExpression.startsWith('-')) {
      currentExpression = currentExpression.substring(1);
    } else {
      currentExpression = '-' + currentExpression;
    }
    updateDisplay();
    playClickSound('op');
  }

  // Scientific Function Handlers
  function applyScientificFunc(func) {
    playClickSound('op');

    if (hasCalculated && lastResult !== null) {
      currentExpression = lastResult.toString();
      hasCalculated = false;
    }

    switch (func) {
      case 'deg-rad':
        angleUnit = angleUnit === 'DEG' ? 'RAD' : 'DEG';
        radDegToggle.textContent = angleUnit;
        btnDegRad.textContent = angleUnit === 'DEG' ? 'Deg' : 'Rad';
        showToast(`Angle: ${angleUnit}`);
        updateDisplay();
        break;

      case 'inv':
        isInverse = !isInverse;
        btnInv.classList.toggle('active', isInverse);
        btnSin.textContent = isInverse ? 'sin⁻¹' : 'sin';
        btnCos.textContent = isInverse ? 'cos⁻¹' : 'cos';
        btnTan.textContent = isInverse ? 'tan⁻¹' : 'tan';
        break;

      case 'sin':
        appendChar(isInverse ? 'asin(' : 'sin(');
        break;
      case 'cos':
        appendChar(isInverse ? 'acos(' : 'cos(');
        break;
      case 'tan':
        appendChar(isInverse ? 'atan(' : 'tan(');
        break;
      case 'asin':
        appendChar('asin(');
        break;
      case 'acos':
        appendChar('acos(');
        break;
      case 'atan':
        appendChar('atan(');
        break;

      case 'pi':
        appendChar('π');
        break;
      case 'e':
        appendChar('e');
        break;

      case 'square':
        currentExpression += '^2';
        updateDisplay();
        break;
      case 'cube':
        currentExpression += '^3';
        updateDisplay();
        break;
      case 'power':
        currentExpression += '^';
        updateDisplay();
        break;

      case 'sqrt':
        appendChar('sqrt(');
        break;
      case 'cbrt':
        appendChar('cbrt(');
        break;

      case 'ln':
        appendChar('ln(');
        break;
      case 'log':
        appendChar('log(');
        break;

      case 'reciprocal': {
        const val = evaluateSafely(currentExpression);
        if (val !== null && val !== 0) {
          currentExpression = (1 / val).toString();
          hasCalculated = true;
          lastResult = 1 / val;
          updateDisplay();
        }
        break;
      }

      case 'fact': {
        const val = evaluateSafely(currentExpression);
        if (val !== null) {
          const res = factorial(Math.floor(val));
          currentExpression = res.toString();
          hasCalculated = true;
          lastResult = res;
          updateDisplay();
        }
        break;
      }

      case 'abs':
        appendChar('abs(');
        break;
    }
  }

  // Memory Operations
  function handleMemory(action) {
    const currentNum = evaluateSafely(currentExpression) ?? lastResult ?? 0;
    playClickSound('op');

    switch (action) {
      case 'mc':
        memoryValue = 0;
        updateMemoryUI();
        showToast('Memory Cleared');
        break;
      case 'mr':
        if (hasCalculated) currentExpression = '';
        currentExpression += memoryValue.toString();
        hasCalculated = false;
        updateDisplay();
        showToast(`Recalled: ${memoryValue}`);
        break;
      case 'm-plus':
        memoryValue += currentNum;
        updateMemoryUI();
        showToast(`M+: ${formatNumber(memoryValue)}`);
        break;
      case 'm-minus':
        memoryValue -= currentNum;
        updateMemoryUI();
        showToast(`M−: ${formatNumber(memoryValue)}`);
        break;
      case 'ms':
        memoryValue = currentNum;
        updateMemoryUI();
        showToast(`Stored: ${formatNumber(memoryValue)}`);
        break;
    }
  }

  // History Management
  function addHistoryEntry(entry) {
    historyData.unshift(entry);
    if (historyData.length > 40) historyData.pop();
    try {
      localStorage.setItem('auracalc_history', JSON.stringify(historyData));
    } catch (e) {}
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    if (historyData.length === 0) {
      historyBadge.classList.add('hidden');
      historyList.innerHTML = `
        <div class="empty-history" id="emptyHistoryNotice">
          <p>No calculations yet.</p>
          <span class="subtext">Your calculation tape will appear here as you compute.</span>
        </div>
      `;
      return;
    }

    historyBadge.classList.remove('hidden');
    historyBadge.textContent = historyData.length;

    historyData.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'history-item';
      card.innerHTML = `
        <div class="history-item-exp">${formatExpressionForDisplay(item.expression)} =</div>
        <div class="history-item-res">${formatNumber(item.result)}</div>
        <div class="history-item-time">${item.timestamp}</div>
      `;

      card.addEventListener('click', () => {
        currentExpression = item.result.toString();
        lastResult = item.result;
        hasCalculated = false;
        updateDisplay();
        toggleHistoryDrawer(false);
        showToast('Loaded from History');
        playClickSound('default');
      });

      historyList.appendChild(card);
    });
  }

  function toggleHistoryDrawer(open) {
    const isOpen = open !== undefined ? open : !historyDrawer.classList.contains('open');
    if (isOpen) {
      historyDrawer.classList.add('open');
      drawerBackdrop.classList.remove('hidden');
      historyDrawer.setAttribute('aria-hidden', 'false');
    } else {
      historyDrawer.classList.remove('open');
      drawerBackdrop.classList.add('hidden');
      historyDrawer.setAttribute('aria-hidden', 'true');
    }
  }

  function clearHistory() {
    historyData = [];
    localStorage.removeItem('auracalc_history');
    renderHistory();
    showToast('History Cleared');
    playClickSound('clear');
  }

  // Mode Toggling (Standard vs Scientific)
  function setMode(mode) {
    if (mode === 'scientific') {
      modeScientificBtn.classList.add('active');
      modeStandardBtn.classList.remove('active');
      scientificPanel.classList.remove('collapsed');
      scientificPanel.setAttribute('aria-expanded', 'true');
      appContainer.classList.add('expanded');
    } else {
      modeStandardBtn.classList.add('active');
      modeScientificBtn.classList.remove('active');
      scientificPanel.classList.add('collapsed');
      scientificPanel.setAttribute('aria-expanded', 'false');
      appContainer.classList.remove('expanded');
    }
    playClickSound('default');
  }

  // Copy to Clipboard
  function copyResult() {
    const textToCopy = mainDisplay.textContent.replace(/,/g, '');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Result copied to clipboard!');
        playClickSound('default');
      }).catch(() => {
        showToast('Copy failed');
      });
    }
  }

  // Keyboard Event Listener
  function handlePhysicalKeyboard(e) {
    // Avoid interfering with inputs if any
    if (e.target.tagName === 'INPUT') return;

    let key = e.key;

    // Highlight corresponding UI button
    let matchingBtn = null;

    if (key >= '0' && key <= '9') {
      appendChar(key);
      matchingBtn = document.querySelector(`button[data-num="${key}"]`);
    } else if (key === '.') {
      appendChar('.');
      matchingBtn = document.getElementById('btnDecimal');
    } else if (key === '+' || key === '-') {
      appendOperator(key);
      matchingBtn = key === '+' ? document.getElementById('btnAdd') : document.getElementById('btnSubtract');
    } else if (key === '*') {
      appendOperator('×');
      matchingBtn = document.getElementById('btnMultiply');
    } else if (key === '/') {
      e.preventDefault();
      appendOperator('÷');
      matchingBtn = document.getElementById('btnDivide');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      executeCalculation();
      matchingBtn = document.getElementById('btnEquals');
    } else if (key === 'Backspace') {
      deleteLast();
      matchingBtn = document.getElementById('btnBackspace');
    } else if (key === 'Escape') {
      clearAll();
      matchingBtn = document.getElementById('btnClear');
    } else if (key === '(' || key === ')') {
      appendChar(key);
      matchingBtn = key === '(' ? document.getElementById('btnOpenParen') : document.getElementById('btnCloseParen');
    } else if (key === '%') {
      applyPercent();
      matchingBtn = document.getElementById('btnPercent');
    }

    if (matchingBtn) {
      matchingBtn.classList.add('btn-pressed');
      setTimeout(() => matchingBtn.classList.remove('btn-pressed'), 120);
    }
  }

  // Wire Keypad Events (Event Delegation)
  keypadGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.num !== undefined) {
      appendChar(btn.dataset.num);
    } else if (btn.dataset.char !== undefined) {
      appendChar(btn.dataset.char);
    } else if (btn.dataset.op !== undefined) {
      appendOperator(btn.dataset.op);
    } else if (btn.dataset.action) {
      switch (btn.dataset.action) {
        case 'clear':
          clearAll();
          break;
        case 'backspace':
          deleteLast();
          break;
        case 'percent':
          applyPercent();
          break;
        case 'negate':
          applyNegate();
          break;
        case 'calculate':
          executeCalculation();
          break;
      }
    }
  });

  // Wire Scientific Grid Events
  sciGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.func) return;
    applyScientificFunc(btn.dataset.func);
  });

  // Wire Memory Bar Events
  const memoryBar = document.getElementById('memoryBar');
  memoryBar.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.action) return;
    handleMemory(btn.dataset.action);
  });

  // Event Listeners for Header & Controls
  soundToggleBtn.addEventListener('click', toggleSound);
  themeToggleBtn.addEventListener('click', cycleTheme);
  historyToggleBtn.addEventListener('click', () => toggleHistoryDrawer(true));
  closeHistoryBtn.addEventListener('click', () => toggleHistoryDrawer(false));
  drawerBackdrop.addEventListener('click', () => toggleHistoryDrawer(false));
  clearHistoryBtn.addEventListener('click', clearHistory);
  copyDisplayBtn.addEventListener('click', copyResult);

  modeStandardBtn.addEventListener('click', () => setMode('standard'));
  modeScientificBtn.addEventListener('click', () => setMode('scientific'));
  radDegToggle.addEventListener('click', () => applyScientificFunc('deg-rad'));

  window.addEventListener('keydown', handlePhysicalKeyboard);

  // Initialize
  initTheme();
  updateSoundUI();
  updateMemoryUI();
  renderHistory();
  updateDisplay();
});
