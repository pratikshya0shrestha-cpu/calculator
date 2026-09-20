# ⚡ AuraCalc

> A modern, glassmorphic scientific and standard calculator web application crafted with precision and rich dynamic aesthetics.

![AuraCalc Banner](assets/preview.jpg)

---

## ✨ Features

- 💎 **Glassmorphic Design System**: Ambient background glow, frosted glass calculator body with backdrop blur, and responsive tactile animations.
- 🎨 **Multi-Theme Engine**:
  - **Obsidian Glow**: Cyber-dark aesthetics with electric cyan accents.
  - **Cyberpunk Violet**: Neon magenta, vivid cyan, and deep indigo gradients.
  - **Frost Glass**: Crisp, frosted winter daylight theme.
- 🔬 **Dual Calculation Modes**:
  - **Standard Mode**: Everyday arithmetic, percentages, parentheses, and negation.
  - **Scientific Mode**: Trigonometry ($\sin$, $\cos$, $\tan$), inverse functions ($\sin^{-1}$, $\cos^{-1}$, $\tan^{-1}$), degree/radian switching, logarithms ($\ln$, $\log_{10}$), square roots ($\sqrt{x}$, $\sqrt[3]{x}$), powers ($x^2$, $x^3$, $x^y$), factorials ($x!$), constants ($\pi$, $e$), and absolute values.
- 📜 **Interactive History Tape**: Slide-out calculation drawer that automatically logs your calculations with timestamps. Tap any entry to recall the value into your current calculation.
- 🧠 **Full Memory Controls**: `MC`, `MR`, `M+`, `M-`, and `MS` with an active memory indicator badge.
- 🔊 **Synthesized Audio Feedback**: Native tactile audio feedback synthesized dynamically using the browser's Web Audio API (zero external audio file dependencies, fully toggleable).
- ⌨️ **Physical Keyboard Integration**: Complete keyboard navigation for digits, operators, Enter (`=`), Backspace, and Escape (`AC`), synchronized with on-screen visual ripple feedback.
- 📋 **Copy to Clipboard**: One-click quick copy of the current result with a sleek toast alert.

---

## ⌨️ Keyboard Shortcuts

| Key | Function |
| :--- | :--- |
| `0` – `9` | Input Digits |
| `.` | Decimal Point |
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `Enter` or `=` | Calculate / Evaluate |
| `Backspace` | Delete last character |
| `Escape` | Clear all (AC) |
| `(` and `)` | Parentheses |
| `%` | Percentage |

---

## 🚀 Getting Started Locally

### Prerequisites
All you need is a modern web browser (Chrome, Safari, Edge, or Firefox).

### Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pratikshya0shrestha-cpu/calculator.git
   cd calculator
   ```

2. **Serve with any local HTTP server**:
   - Using Python 3:
     ```bash
     python3 -m http.server 3000
     ```
   - Or using Node.js `npx`:
     ```bash
     npx serve -l 3000
     ```

3. **Open in your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Built With

- **HTML5**: Semantic, accessible structure with ARIA landmark tags.
- **Vanilla CSS3**: Custom properties (CSS variables), glassmorphism (`backdrop-filter`), flexbox, CSS grid, and GPU-accelerated micro-animations.
- **Modern JavaScript (ES6+)**: Custom math evaluator, Web Audio API synthesis, and local storage state persistence.

---

## 👤 Author

Developed by **[Pratikshya Shrestha](https://github.com/pratikshya0shrestha-cpu)**.
