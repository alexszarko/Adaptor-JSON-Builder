const status = document.getElementById("status");

function matchPanelHeights() {
  const builder = document.querySelector(".builder-card");
  const preview = document.querySelector(".output-card");
  preview.style.height = `${builder.offsetHeight}px`;
}

new ResizeObserver(matchPanelHeights).observe(document.querySelector(".builder-card"));
window.addEventListener("resize", matchPanelHeights);
document.getElementById("reset-page").addEventListener("click", () => window.location.reload());

async function loadFilterOptions() {
  try {
    const [configResponse, setupResponse] = await Promise.all([
      fetch("config.json", { cache: "no-store" }),
      fetch("environment-setup.json", { cache: "no-store" }),
    ]);
    if (!configResponse.ok) throw new Error(`Configuration request failed (${configResponse.status})`);
    if (!setupResponse.ok) throw new Error(`Environment setup request failed (${setupResponse.status})`);

    const filterOptions = await configResponse.json();
    const environmentSetup = await setupResponse.json();
    const filters = [
      { id: "environment", options: filterOptions.environment },
      { id: "role", options: filterOptions.role },
      { id: "duis-version", options: filterOptions.duisVersion },
    ];

    for (const filter of filters) {
      if (!Array.isArray(filter.options)) {
        throw new Error(`Configuration value for ${filter.id} must be an array`);
      }

      const select = document.getElementById(filter.id);
      for (const value of filter.options) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.append(option);
      }
    }

    if (!Array.isArray(filterOptions.serviceRequestVariant)) {
      throw new Error("Configuration value for service-request-variant must be an array");
    }
    renderMissingTemplateSrvs(filterOptions.serviceRequestVariant);
    initialiseSrvCombobox(filterOptions.serviceRequestVariant, filterOptions.role);
    initialiseOriginatorLookup(environmentSetup);
    initialisePayloadPreview(filterOptions.serviceRequestVariant, filterOptions.curlCommandTemplate);
  } catch (error) {
    console.error(error);
    status.textContent = "Unable to load the filter configuration.";
  }
}

function renderMissingTemplateSrvs(serviceRequestVariants) {
  const list = document.getElementById("missing-template-srvs");
  const missingSrvs = [...new Set(
    serviceRequestVariants
      .filter((option) => typeof option === "object" && !(option.payloadTemplates?.length > 0))
      .map((option) => option.srv),
  )];

  list.replaceChildren();
  for (const srv of missingSrvs) {
    const item = document.createElement("li");
    item.textContent = srv;
    list.append(item);
  }

  if (!missingSrvs.length) {
    const item = document.createElement("li");
    item.className = "missing-templates-empty";
    item.textContent = "All configured SRVs have templates.";
    list.append(item);
  }
}

function initialiseOriginatorLookup(environmentSetup) {
  const environmentSelect = document.getElementById("environment");
  const roleSelect = document.getElementById("role");
  const versionSelect = document.getElementById("duis-version");
  const originatorInput = document.getElementById("determined-originator-name");

  const normaliseEnvironment = (value) => value.replaceAll("-", "").toUpperCase();

  function resolveOriginator() {
    const environment = environmentSelect.value;
    const role = roleSelect.value;
    const version = versionSelect.value;
    originatorInput.value = "";
    originatorInput.setCustomValidity("");
    status.textContent = "";

    if (!environment || !role || !version) return;

    const environmentKey = Object.keys(environmentSetup).find(
      (key) => normaliseEnvironment(key) === normaliseEnvironment(environment),
    );
    const records = environmentSetup[environmentKey]?.[version] ?? [];
    const match = records.find((record) => record.role === role);

    if (match) {
      originatorInput.value = match.determinedOriginatorName;
    } else {
      originatorInput.setCustomValidity("No Determined Originator Name matches these selections.");
      status.textContent = "No Determined Originator Name matches these selections.";
    }
  }

  environmentSelect.addEventListener("change", resolveOriginator);
  roleSelect.addEventListener("change", resolveOriginator);
  versionSelect.addEventListener("change", resolveOriginator);
}

function initialiseSrvCombobox(options, roleOptions) {
  const combo = document.getElementById("srv-combobox");
  const input = document.getElementById("service-request-variant-input");
  const list = document.getElementById("service-request-variant-list");
  const roleSelect = document.getElementById("role");
  const commandVariantSelect = document.getElementById("command-variant");
  const commandVariantWarning = document.getElementById("command-variant-warning");
  const roleCodes = {
    "Import Supplier 1": "IS",
    "Import Supplier 2": "IS",
    "Gas Supplier 1": "GS",
    "Gas Supplier 2": "GS",
    "Export Supplier": "ES",
    "Electricity Distributor": "ED",
    "Gas Transporter": "GT",
    "Other User": "OU",
    "Registered Supplier Agent": "RSA",
    "Meter Data Retriever": "MDR",
  };
  const allSrvValues = options.map((option) =>
    typeof option === "string" ? option : option.srv,
  );

  function updateRoleOptions(srv) {
    const selectedRole = roleSelect.value;
    const srvConfig = options.find((option) =>
      typeof option === "object" && option.srv === srv,
    );
    const permittedUsers = srvConfig?.permittedUsers;
    const availableRoles = Array.isArray(permittedUsers)
      ? roleOptions.filter((role) => permittedUsers.includes(roleCodes[role]))
      : roleOptions;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a role";
    roleSelect.replaceChildren(placeholder);

    for (const role of availableRoles) {
      const option = document.createElement("option");
      option.value = role;
      option.textContent = role;
      roleSelect.append(option);
    }

    roleSelect.value = availableRoles.includes(selectedRole) ? selectedRole : "";
    if (roleSelect.value !== selectedRole) {
      roleSelect.dispatchEvent(new Event("change"));
    }
  }

  function availableSrvOptions() {
    const roleCode = roleCodes[roleSelect.value];
    if (!roleCode) return options;
    return options.filter((option) =>
      typeof option === "object" && option.permittedUsers?.includes(roleCode),
    );
  }

  function availableSrvValues() {
    return availableSrvOptions().map((option) =>
      typeof option === "string" ? option : option.srv,
    );
  }

  function updateCommandVariants(srv) {
    const selectedCommandVariant = commandVariantSelect.value;
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a command variant";
    placeholder.selected = true;
    commandVariantSelect.replaceChildren(placeholder);

    const srvConfig = options.find((option) =>
      typeof option === "object" && option.srv === srv,
    );
    const commandVariants = srvConfig?.commandVariants ?? [];
    for (const value of commandVariants) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      commandVariantSelect.append(option);
    }
    if (commandVariants.includes(selectedCommandVariant)) {
      commandVariantSelect.value = selectedCommandVariant;
    }
  }

  function warnIfSrvIsMissing() {
    if (!availableSrvValues().includes(input.value)) {
      commandVariantWarning.hidden = false;
    }
  }

  commandVariantSelect.addEventListener("pointerdown", warnIfSrvIsMissing);
  commandVariantSelect.addEventListener("focus", warnIfSrvIsMissing);

  function closeList() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  function showMatches(showAll = false) {
    const query = showAll ? "" : input.value.trim().toLowerCase();
    const matches = availableSrvValues().filter((value) => value.toLowerCase().includes(query));
    list.replaceChildren();

    if (matches.length === 0) {
      const empty = document.createElement("div");
      empty.className = "combo-empty";
      empty.textContent = "No matching SRVs";
      list.append(empty);
    } else {
      for (const value of matches) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "combo-option";
        option.setAttribute("role", "option");
        option.textContent = value;
        option.addEventListener("click", () => {
          input.value = value;
          input.setCustomValidity("");
          commandVariantWarning.hidden = true;
          updateRoleOptions(value);
          updateCommandVariants(value);
          input.dispatchEvent(new Event("srvchange"));
          closeList();
          input.focus();
        });
        list.append(option);
      }
    }

    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  input.addEventListener("click", () => showMatches(true));
  input.addEventListener("input", () => {
    input.setCustomValidity("");
    commandVariantWarning.hidden = true;
    const validSrv = allSrvValues.includes(input.value) ? input.value : "";
    updateRoleOptions(validSrv);
    updateCommandVariants(validSrv);
    input.dispatchEvent(new Event("srvchange"));
    showMatches();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeList();
  });
  document.addEventListener("click", (event) => {
    if (!combo.contains(event.target)) closeList();
  });
  roleSelect.addEventListener("change", () => {
    if (input.value && !availableSrvValues().includes(input.value)) {
      input.value = "";
      input.setCustomValidity("");
    }
    commandVariantWarning.hidden = true;
    updateCommandVariants(input.value);
    input.dispatchEvent(new Event("srvchange"));
    closeList();
  });

  document.getElementById("filter-form").addEventListener("submit", (event) => {
    if (!availableSrvValues().includes(input.value)) {
      event.preventDefault();
      input.setCustomValidity("Please choose an SRV from the list.");
      input.reportValidity();
      showMatches();
    }
  });
}

function initialisePayloadPreview(srvOptions, curlCommandTemplate) {
  const form = document.getElementById("filter-form");
  const srvInput = document.getElementById("service-request-variant-input");
  const templateSelect = document.getElementById("payload-template");
  const remotePartyRoleField = document.getElementById("remote-party-role-field");
  const remotePartyRoleInputs = [...remotePartyRoleField.querySelectorAll("input[type=checkbox]")];
  const credentialTypeField = document.getElementById("credential-type-field");
  const credentialTypeInputs = [...credentialTypeField.querySelectorAll("input[type=checkbox]")];
  const esmeEventLogTypeField = document.getElementById("esme-event-log-type-field");
  const esmeEventLogTypeInputs = [...esmeEventLogTypeField.querySelectorAll("input[type=radio]")];
  const futureDatedField = document.getElementById("future-dated-field");
  const futureDatedInput = document.getElementById("future-dated");
  const futureDatedValue = document.getElementById("future-dated-value");
  const futureDatedFormatted = document.getElementById("future-dated-formatted");
  const payloadOutput = document.getElementById("payload-output");
  const copyButton = document.getElementById("copy-payload");
  const environmentSelect = document.getElementById("environment");
  const roleSelect = document.getElementById("role");
  const versionSelect = document.getElementById("duis-version");
  const originatorInput = document.getElementById("determined-originator-name");
  const headerSelectionWarning = document.getElementById("header-selection-warning");
  const commandVariantSelect = document.getElementById("command-variant");
  const targetInput = document.getElementById("target");
  let currentSrv = "";
  let loadedPayload = null;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  futureDatedInput.min = `${year}-${month}-${day}T00:00`;

  function selectedSrvConfig() {
    return srvOptions.find((option) =>
      typeof option === "object" && option.srv === srvInput.value,
    );
  }

  function updateFutureDatedVisibility() {
    const isAvailable = selectedSrvConfig()?.futureDated === "yes" && Boolean(templateSelect.value);
    futureDatedField.hidden = !isAvailable;
    if (!isAvailable) {
      futureDatedInput.value = "";
      futureDatedValue.value = "";
      futureDatedFormatted.value = "";
      futureDatedFormatted.hidden = true;
    }
  }

  function remotePartyRolesAvailable() {
    return srvInput.value === "6.24.1"
      && templateSelect.value === "templates/6.24.1/default.json";
  }

  function updateRemotePartyRoleVisibility() {
    const isAvailable = remotePartyRolesAvailable();
    remotePartyRoleField.hidden = !isAvailable;
    if (!isAvailable) {
      for (const input of remotePartyRoleInputs) input.checked = false;
    }
  }

  function credentialTypesAvailable() {
    return srvInput.value === "6.24.2"
      && templateSelect.value === "templates/6.24.2/default.json";
  }

  function updateCredentialTypeVisibility() {
    const isAvailable = credentialTypesAvailable();
    credentialTypeField.hidden = !isAvailable;
    if (!isAvailable) {
      for (const input of credentialTypeInputs) input.checked = false;
    }
  }

  function esmeEventLogTypesAvailable() {
    return srvInput.value === "3.3"
      && templateSelect.value === "templates/3.3/default.json";
  }

  function updateEsmeEventLogTypeVisibility() {
    const isAvailable = esmeEventLogTypesAvailable();
    esmeEventLogTypeField.hidden = !isAvailable;
    if (isAvailable && !esmeEventLogTypeInputs.some((input) => input.checked)) {
      esmeEventLogTypeInputs[0].checked = true;
    } else if (!isAvailable) {
      for (const input of esmeEventLogTypeInputs) input.checked = false;
    }
  }

  function renderPayload(payload) {
    const command = curlCommandTemplate.replace("{srv}", srvInput.value);
    const shellEscape = (value) => value.replaceAll("'", String.raw`'\''`);
    const appendText = (value) => payloadOutput.append(document.createTextNode(shellEscape(value)));
    const isEditablePath = (path) =>
      (path.length === 2 && path[0] === "header" && ["target", "cv"].includes(path[1]))
      || path[0] === "bodyParameters";

    function setPayloadValue(path, value) {
      const property = path.at(-1);
      const parent = path.slice(0, -1).reduce((current, key) => current[key], loadedPayload);
      parent[property] = value;
    }

    function appendPrimitive(value, path) {
      const literal = JSON.stringify(value);
      if (!isEditablePath(path)) {
        appendText(literal);
        return;
      }

      const editor = document.createElement("span");
      editor.className = "payload-editable";
      editor.contentEditable = "plaintext-only";
      editor.spellcheck = false;
      editor.textContent = shellEscape(literal);
      editor.setAttribute("role", "textbox");
      editor.setAttribute("aria-label", `Edit ${path.join(".")}`);
      editor.addEventListener("input", () => {
        try {
          const jsonLiteral = editor.textContent.replaceAll(String.raw`'\''`, "'");
          setPayloadValue(path, JSON.parse(jsonLiteral));
          editor.classList.remove("payload-editable-invalid");
          copyButton.disabled = false;
          status.textContent = "Payload updated with the edited value.";
        } catch {
          editor.classList.add("payload-editable-invalid");
          copyButton.disabled = true;
          status.textContent = `${path.join(".")} must be a valid JSON value.`;
        }
      });
      editor.addEventListener("blur", () => {
        if (!editor.classList.contains("payload-editable-invalid")) renderPayload(loadedPayload);
      });
      payloadOutput.append(editor);
    }

    function appendJson(value, path = [], depth = 0) {
      if (value === null || typeof value !== "object") {
        appendPrimitive(value, path);
        return;
      }

      const isArray = Array.isArray(value);
      const entries = isArray ? value.map((item, index) => [index, item]) : Object.entries(value);
      appendText(isArray ? "[" : "{");
      if (entries.length) appendText("\n");
      entries.forEach(([key, item], index) => {
        appendText("  ".repeat(depth + 1));
        if (!isArray) appendText(`${JSON.stringify(key)}: `);
        appendJson(item, [...path, key], depth + 1);
        appendText(index < entries.length - 1 ? ",\n" : "\n");
      });
      if (entries.length) appendText("  ".repeat(depth));
      appendText(isArray ? "]" : "}");
    }

    payloadOutput.replaceChildren(document.createTextNode(`${command} '`));
    appendJson(payload);
    payloadOutput.append(document.createTextNode("'"));
    copyButton.disabled = false;
  }

  function updateTemplates() {
    const srvChanged = srvInput.value !== currentSrv;
    const selectedTemplate = templateSelect.value;
    currentSrv = srvInput.value;
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.selected = true;

    const srvConfig = selectedSrvConfig();
    const templates = srvConfig?.payloadTemplates ?? [];
    placeholder.textContent = templates.length
      ? "Choose a payload template"
      : "No payload templates available";
    templateSelect.replaceChildren(placeholder);

    for (const template of templates) {
      const option = document.createElement("option");
      option.value = template.path;
      option.textContent = template.label;
      templateSelect.append(option);
    }

    if (templates.length === 1) {
      templateSelect.value = templates[0].path;
    } else if (!srvChanged && templates.some((template) => template.path === selectedTemplate)) {
      templateSelect.value = selectedTemplate;
    }
    if (srvChanged) {
      loadedPayload = null;
      copyButton.disabled = true;
      payloadOutput.textContent = "Your generated payload will appear here.";
    }
    updateFutureDatedVisibility();
    updateRemotePartyRoleVisibility();
    updateCredentialTypeVisibility();
    updateEsmeEventLogTypeVisibility();
  }

  srvInput.addEventListener("srvchange", updateTemplates);
  templateSelect.addEventListener("change", () => {
    loadedPayload = null;
    copyButton.disabled = true;
    payloadOutput.textContent = "Your generated payload will appear here.";
    updateFutureDatedVisibility();
    updateRemotePartyRoleVisibility();
    updateCredentialTypeVisibility();
    updateEsmeEventLogTypeVisibility();
  });
  futureDatedInput.addEventListener("change", () => {
    const formattedValue = futureDatedInput.value
      ? `${futureDatedInput.value}:00.00Z`
      : "";
    futureDatedValue.value = formattedValue;
    futureDatedFormatted.value = formattedValue;
    futureDatedFormatted.hidden = !formattedValue;
  });

  form.addEventListener("submit", async (event) => {
    if (event.defaultPrevented) return;
    event.preventDefault();

    const selectedRemotePartyRoles = remotePartyRoleInputs
      .filter((input) => input.checked)
      .map((input) => input.value);
    const selectedCredentialTypes = credentialTypeInputs
      .filter((input) => input.checked)
      .map((input) => input.value);
    const selectedEsmeEventLogType = esmeEventLogTypeInputs
      .find((input) => input.checked)?.value;

    const headerSelectionCount = [
      environmentSelect.value,
      roleSelect.value,
      versionSelect.value,
    ].filter(Boolean).length;
    if (headerSelectionCount > 0 && headerSelectionCount < 3) {
      headerSelectionWarning.textContent = "Select Environment, Role, and DUIS Version together to update the payload header. The stored template values will be retained.";
      headerSelectionWarning.hidden = false;
    } else {
      headerSelectionWarning.hidden = true;
    }

    try {
      const response = await fetch(templateSelect.value, { cache: "no-store" });
      if (!response.ok) throw new Error(`Payload template request failed (${response.status})`);
      loadedPayload = await response.json();
      let appliedSelections = false;
      if (["6.11", "8.1.1"].includes(srvInput.value)) {
        loadedPayload.bodyParameters ??= {};
        loadedPayload.bodyParameters.currentDateTime = new Date()
          .toISOString()
          .replace(/\.\d{3}Z$/, ".00Z");
        appliedSelections = true;
      }
      if (remotePartyRolesAvailable() && selectedRemotePartyRoles.length) {
        loadedPayload.bodyParameters ??= {};
        loadedPayload.bodyParameters.remotePartyRole = selectedRemotePartyRoles;
        appliedSelections = true;
      }
      if (credentialTypesAvailable() && selectedCredentialTypes.length) {
        loadedPayload.bodyParameters ??= {};
        loadedPayload.bodyParameters.credentialType = selectedCredentialTypes;
        appliedSelections = true;
      }
      if (esmeEventLogTypesAvailable() && selectedEsmeEventLogType) {
        loadedPayload.bodyParameters ??= {};
        loadedPayload.bodyParameters.esmeEventLogType = selectedEsmeEventLogType;
        appliedSelections = true;
      }
      if (versionSelect.value && originatorInput.value) {
        loadedPayload.duisVersion = versionSelect.value;
        loadedPayload.header.originatorName = originatorInput.value;
        appliedSelections = true;
      }
      if (commandVariantSelect.value) {
        loadedPayload.header.cv = Number(commandVariantSelect.value);
        appliedSelections = true;
      }
      if (targetInput.value) {
        loadedPayload.header.target = targetInput.value;
        appliedSelections = true;
      }
      if (futureDatedValue.value) {
        const {
          executionDateTime: existingExecutionDateTime,
          ...bodyParameters
        } = loadedPayload.bodyParameters ?? {};
        loadedPayload.bodyParameters = {
          executionDateTime: futureDatedValue.value,
          ...bodyParameters,
        };
        appliedSelections = true;
      }
      renderPayload(loadedPayload);
      status.textContent = appliedSelections
        ? "Payload template loaded with the selected values."
        : "Original payload template loaded.";
    } catch (error) {
      console.error(error);
      payloadOutput.textContent = "Unable to load the selected payload template.";
      copyButton.disabled = true;
      status.textContent = "Unable to generate the payload.";
    }
  });

  targetInput.addEventListener("input", (event) => {
    const cursorPosition = targetInput.selectionStart ?? targetInput.value.length;
    const hexadecimalBeforeCursor = targetInput.value
      .slice(0, cursorPosition)
      .replace(/[^0-9a-f]/gi, "").length;
    const hexadecimal = targetInput.value
      .replace(/[^0-9a-f]/gi, "")
      .slice(0, 16)
      .toUpperCase();
    const pairs = hexadecimal.match(/.{1,2}/g) ?? [];
    const addTrailingHyphen = hexadecimal.length > 0
      && hexadecimal.length < 16
      && hexadecimal.length % 2 === 0
      && !event.inputType?.startsWith("delete");

    targetInput.value = `${pairs.join("-")}${addTrailingHyphen ? "-" : ""}`;

    const pairsBeforeCursor = Math.floor(hexadecimalBeforeCursor / 2);
    const formattedCursorPosition = Math.min(
      hexadecimalBeforeCursor + pairsBeforeCursor,
      targetInput.value.length,
    );
    targetInput.setSelectionRange(formattedCursorPosition, formattedCursorPosition);
  });

  for (const select of [environmentSelect, roleSelect, versionSelect]) {
    select.addEventListener("change", () => {
      const selectedCount = [environmentSelect.value, roleSelect.value, versionSelect.value]
        .filter(Boolean).length;
      if (selectedCount === 0 || selectedCount === 3) {
        headerSelectionWarning.hidden = true;
      }
    });
  }

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(payloadOutput.textContent);
      copyButton.textContent = "Copied";
      setTimeout(() => { copyButton.textContent = "Copy"; }, 1600);
    } catch (error) {
      console.error(error);
      status.textContent = "Unable to copy the payload.";
    }
  });
}

loadFilterOptions();
