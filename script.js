
(() => {
  "use strict";

  const questions = [
    {
      key: "gdp_current",
      label: "PIB real actual",
      question: "¿Cuál es el PIB real actual?",
      help: "Introduce el valor del PIB real para el período que estás estudiando.",
      unit: "unidades",
      min: 0
    },
    {
      key: "gdp_potential",
      label: "PIB potencial",
      question: "¿Cuál es el PIB potencial?",
      help: "Es la producción que la economía podría alcanzar de manera sostenible con sus recursos disponibles.",
      unit: "unidades",
      min: 0
    },
    {
      key: "gdp_previous",
      label: "PIB real anterior",
      question: "¿Conoces el PIB real del período anterior?",
      help: "Este dato permite observar si la producción real aumentó o disminuyó.",
      unit: "unidades",
      min: 0
    },
    {
      key: "price_current",
      label: "Nivel de precios actual",
      question: "¿Cuál es el nivel de precios actual?",
      help: "Puede ser un índice de precios u otra medida que use tu ejercicio.",
      unit: "índice",
      min: 0
    },
    {
      key: "price_previous",
      label: "Nivel de precios anterior",
      question: "¿Conoces el nivel de precios del período anterior?",
      help: "Lo compararemos con el nivel actual para identificar el movimiento general de precios.",
      unit: "índice",
      min: 0
    },
    {
      key: "consumption",
      label: "Consumo",
      question: "¿Conoces el consumo (C)?",
      help: "Dato utilizado en el enfoque del gasto para el PIB.",
      unit: "unidades",
      min: 0
    },
    {
      key: "investment",
      label: "Inversión",
      question: "¿Conoces la inversión (I)?",
      help: "Incluye inversión económica según la definición usada en tu curso.",
      unit: "unidades",
      min: 0
    },
    {
      key: "government",
      label: "Gasto público",
      question: "¿Conoces el gasto público (G)?",
      help: "Dato utilizado en el enfoque del gasto para el PIB.",
      unit: "unidades",
      min: 0
    },
    {
      key: "exports",
      label: "Exportaciones",
      question: "¿Conoces las exportaciones (X)?",
      help: "Valor de bienes y servicios vendidos al exterior.",
      unit: "unidades",
      min: 0
    },
    {
      key: "imports",
      label: "Importaciones",
      question: "¿Conoces las importaciones (M)?",
      help: "Valor de bienes y servicios comprados al exterior.",
      unit: "unidades",
      min: 0
    },
    {
      key: "unemployment",
      label: "Desempleo",
      question: "¿Conoces la tasa de desempleo?",
      help: "Introduce el porcentaje de desempleo del período actual.",
      unit: "%",
      min: 0,
      max: 100
    },
    {
      key: "unemployment_previous",
      label: "Desempleo anterior",
      question: "¿Conoces la tasa de desempleo del período anterior?",
      help: "Permite observar si el desempleo aumentó o disminuyó.",
      unit: "%",
      min: 0,
      max: 100
    },
    {
      key: "expected_inflation",
      label: "Inflación esperada",
      question: "¿Conoces la inflación esperada?",
      help: "Introduce la expectativa de inflación para el período.",
      unit: "%",
      min: -100
    }
  ];

  const state = { data: {}, index: 0, answered: {} };

  const $ = (id) => document.getElementById(id);
  const questionText = $("questionText");
  const questionHelp = $("questionHelp");
  const questionNumber = $("questionNumber");
  const progressBar = $("progressBar");
  const progressText = $("progressText");
  const inputArea = $("inputArea");
  const valueInput = $("valueInput");
  const unitLabel = $("unitLabel");
  const errorMessage = $("errorMessage");
  const nextBtn = $("nextBtn");
  const backBtn = $("backBtn");
  const choiceGrid = $("choiceGrid");
  const questionArea = $("questionArea");
  const resultsArea = $("resultsArea");
  const quizPanel = $("quizPanel");
  const intro = $("intro");

  function currentQuestion() {
    return questions[state.index];
  }

  function formatNumber(value, digits = 2) {
    return new Intl.NumberFormat("es-CR", {
      maximumFractionDigits: digits
    }).format(value);
  }

  function renderQuestion() {
    const q = currentQuestion();
    const hasValue = Object.prototype.hasOwnProperty.call(state.data, q.key);

    questionNumber.textContent = `Pregunta ${state.index + 1}`;
    questionText.textContent = q.question;
    questionHelp.textContent = q.help;
    unitLabel.textContent = q.unit;
    progressText.textContent = `${state.index + 1} / ${questions.length}`;
    progressBar.style.width = `${((state.index + 1) / questions.length) * 100}%`;
    errorMessage.textContent = "";

    inputArea.classList.toggle("active", hasValue);
    valueInput.value = hasValue ? state.data[q.key] : "";
    nextBtn.disabled = !hasValue;
    nextBtn.textContent = state.index === questions.length - 1 ? "Ver panorama →" : "Continuar →";
    backBtn.disabled = state.index === 0;

    if (hasValue) {
      choiceGrid.querySelectorAll(".choice").forEach(btn => {
        btn.setAttribute("aria-pressed", "false");
      });
    }

    setTimeout(() => {
      if (hasValue) valueInput.focus();
    }, 50);
  }

  function choose(choice) {
    const q = currentQuestion();

    if (choice === "no") {
      delete state.data[q.key];
      state.answered[q.key] = false;
      goNext();
      return;
    }

    state.answered[q.key] = true;
    inputArea.classList.add("active");
    valueInput.value = Object.prototype.hasOwnProperty.call(state.data, q.key) ? state.data[q.key] : "";
    nextBtn.disabled = valueInput.value === "";
    errorMessage.textContent = "";
    valueInput.focus();
  }

  function validateValue() {
    const q = currentQuestion();
    const raw = valueInput.value.trim();

    if (raw === "") {
      errorMessage.textContent = "Introduce un valor o selecciona “No tengo ese dato”.";
      return false;
    }

    const value = Number(raw);
    if (!Number.isFinite(value)) {
      errorMessage.textContent = "Introduce un número válido.";
      return false;
    }

    if (q.min !== undefined && value < q.min) {
      errorMessage.textContent = `El valor no puede ser menor que ${q.min}.`;
      return false;
    }

    if (q.max !== undefined && value > q.max) {
      errorMessage.textContent = `El valor no puede ser mayor que ${q.max}.`;
      return false;
    }

    state.data[q.key] = value;
    state.answered[q.key] = true;
    return true;
  }

  function goNext() {
    if (state.index < questions.length - 1) {
      state.index += 1;
      renderQuestion();
    } else {
      showResults();
    }
  }

  function goBack() {
    if (state.index > 0) {
      state.index -= 1;
      renderQuestion();
    }
  }

  function pctChange(current, previous) {
    if (previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  function showResults() {
    if (Object.prototype.hasOwnProperty.call(state.data, "gdp_current") &&
        Object.prototype.hasOwnProperty.call(state.data, "gdp_potential")) {
      const current = state.data.gdp_current;
      const potential = state.data.gdp_potential;
      state.data.output_gap = pctChange(current, potential);
    }

    questionArea.classList.add("hidden");
    resultsArea.classList.add("active");
    progressText.textContent = "Completado";
    progressBar.style.width = "100%";

    renderStats();
    renderAnalysis();
    renderDataTable();

    window.scrollTo({ top: quizPanel.offsetTop - 20, behavior: "smooth" });
  }

  function renderStats() {
    const stats = $("stats");
    stats.innerHTML = "";

    const cards = [];

    if (Number.isFinite(state.data.output_gap)) {
      cards.push({
        label: "Brecha del producto",
        value: `${formatNumber(state.data.output_gap)}%`
      });
    }

    if (state.data.gdp_current !== undefined && state.data.gdp_previous !== undefined) {
      const growth = pctChange(state.data.gdp_current, state.data.gdp_previous);
      if (growth !== null) cards.push({ label: "Crecimiento del PIB real", value: `${formatNumber(growth)}%` });
    }

    if (state.data.price_current !== undefined && state.data.price_previous !== undefined) {
      const priceChange = pctChange(state.data.price_current, state.data.price_previous);
      if (priceChange !== null) cards.push({ label: "Cambio del nivel de precios", value: `${formatNumber(priceChange)}%` });
    }

    if (state.data.unemployment !== undefined) {
      cards.push({ label: "Desempleo actual", value: `${formatNumber(state.data.unemployment)}%` });
    }

    cards.slice(0, 4).forEach(item => {
      const div = document.createElement("div");
      div.className = "stat";
      div.innerHTML = `<div class="label">${item.label}</div><div class="value">${item.value}</div>`;
      stats.appendChild(div);
    });
  }

  function renderAnalysis() {
    const container = $("analysisCards");
    container.innerHTML = "";

    const observations = [];

    if (state.data.gdp_current !== undefined && state.data.gdp_potential !== undefined) {
      const gap = state.data.gdp_current - state.data.gdp_potential;
      if (gap > 0) {
        observations.push(["PIB vs. PIB potencial",
          "El PIB real está por encima del PIB potencial. Esto apunta a una brecha positiva: la economía está produciendo por encima de su capacidad potencial estimada. Analiza si existen presiones de demanda, empleo elevado u otras tensiones."]);
      } else if (gap < 0) {
        observations.push(["PIB vs. PIB potencial",
          "El PIB real está por debajo del PIB potencial. Esto apunta a una brecha negativa: existe capacidad productiva que no se estaría utilizando plenamente. Analiza qué podría estar ocurriendo con la demanda y el empleo."]);
      } else {
        observations.push(["PIB vs. PIB potencial",
          "El PIB real coincide con el PIB potencial. En este escenario no aparece una brecha del producto según estos datos."]);
      }
    }

    if (state.data.price_current !== undefined && state.data.price_previous !== undefined) {
      const change = state.data.price_current - state.data.price_previous;
      if (change > 0) {
        observations.push(["Nivel de precios",
          "El nivel de precios es mayor que en el período anterior. Esto indica un aumento general del nivel de precios; para expresarlo como tasa de inflación, utiliza el cambio porcentual calculado y considera el período."]);
      } else if (change < 0) {
        observations.push(["Nivel de precios",
          "El nivel de precios es menor que en el período anterior. Esto es consistente con una disminución general del nivel de precios (deflación) si los datos son comparables."]);
      } else {
        observations.push(["Nivel de precios",
          "El nivel de precios no cambió entre ambos períodos."]);
      }
    }

    if (state.data.gdp_current !== undefined && state.data.gdp_previous !== undefined) {
      const growth = pctChange(state.data.gdp_current, state.data.gdp_previous);
      if (growth !== null) {
        observations.push(["Producción",
          growth > 0
            ? `El PIB real aumentó aproximadamente ${formatNumber(growth)}% respecto al período anterior.`
            : growth < 0
              ? `El PIB real disminuyó aproximadamente ${formatNumber(Math.abs(growth))}% respecto al período anterior.`
              : "El PIB real se mantuvo sin cambios respecto al período anterior."
        ]);
      }
    }

    if (state.data.unemployment !== undefined && state.data.unemployment_previous !== undefined) {
      const diff = state.data.unemployment - state.data.unemployment_previous;
      observations.push(["Mercado laboral",
        diff > 0
          ? `La tasa de desempleo aumentó ${formatNumber(Math.abs(diff))} puntos porcentuales.`
          : diff < 0
            ? `La tasa de desempleo disminuyó ${formatNumber(Math.abs(diff))} puntos porcentuales.`
            : "La tasa de desempleo se mantuvo igual."
      ]);
    }

    if (state.data.consumption !== undefined && state.data.investment !== undefined &&
        state.data.government !== undefined && state.data.exports !== undefined &&
        state.data.imports !== undefined) {
      const expenditureGDP = state.data.consumption + state.data.investment +
        state.data.government + state.data.exports - state.data.imports;

      observations.push(["PIB por el enfoque del gasto",
        `Con todos los componentes disponibles, C + I + G + (X − M) da ${formatNumber(expenditureGDP)} unidades. Compáralo con el PIB real solo si todos los datos usan las mismas unidades, período y valoración.`
      ]);
    }

    if (state.data.expected_inflation !== undefined) {
      observations.push(["Inflación esperada",
        `La inflación esperada introducida es ${formatNumber(state.data.expected_inflation)}%. Es una expectativa, no necesariamente la inflación que finalmente ocurrirá.`
      ]);
    }

    if (observations.length === 0) {
      observations.push(["Primer paso",
        "Hay pocos datos disponibles para construir indicadores. Esto también es una lección: antes de concluir algo sobre una economía, identifica qué información falta."]);
    }

    observations.forEach(([title, text]) => {
      const card = document.createElement("article");
      card.className = "result-card";
      const h = document.createElement("h3");
      h.textContent = title;
      const p = document.createElement("p");
      p.textContent = text;
      card.append(h, p);
      container.appendChild(card);
    });
  }

  function renderDataTable() {
    const body = $("dataTableBody");
    body.innerHTML = "";

    questions.forEach(q => {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td");
      const td2 = document.createElement("td");
      td1.textContent = q.label;

      if (state.data[q.key] !== undefined) {
        td2.textContent = `${formatNumber(state.data[q.key])} ${q.unit}`;
      } else {
        td2.textContent = "No disponible";
      }

      tr.append(td1, td2);
      body.appendChild(tr);
    });
  }

  function reset() {
    state.data = {};
    state.answered = {};
    state.index = 0;
    questionArea.classList.remove("hidden");
    resultsArea.classList.remove("active");
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  choiceGrid.addEventListener("click", (event) => {
    const btn = event.target.closest(".choice");
    if (!btn) return;
    choose(btn.dataset.choice);
  });

  valueInput.addEventListener("input", () => {
    nextBtn.disabled = valueInput.value.trim() === "";
    errorMessage.textContent = "";
  });

  valueInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !nextBtn.disabled) {
      event.preventDefault();
      nextBtn.click();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (validateValue()) goNext();
  });

  backBtn.addEventListener("click", goBack);
  $("restartBtn").addEventListener("click", reset);

  renderQuestion();
})();
