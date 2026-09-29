const app = document.querySelector(".app");
const campaignView = document.getElementById("campaignView");

const data = window.PALANTIR_DATA;

const STORAGE_KEY = "palantir-gm-data";

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return;
  }

  try {
    const parsedData = JSON.parse(savedData);

    if (parsedData && Array.isArray(parsedData.campaigns)) {
      data.campaigns = parsedData.campaigns;
    }
  } catch (error) {
    console.error("Erro ao carregar memória do Palantir:", error);
  }

if (!data || !Array.isArray(data.campaigns)) {
  campaignView.innerHTML = `
    <section class="error-panel">
      <p class="eyebrow">ERRO DE ARQUIVO</p>
      <h2>Dados do Palantir não encontrados.</h2>
      <p class="muted">
        Verifique se o data.js está carregando corretamente.
      </p>
    </section>
  `;
} else {
  loadData();
  renderCampaignList();
}

function getCampaigns() {
  return data.campaigns;
}

function getCampaignById(id) {
  return getCampaigns().find((campaign) => campaign.id === id);
}

function getNode(campaign, nodeId) {
  return campaign.nodes.find((node) => node.id === nodeId);
}

function getNodeChildren(campaign, node) {
  return (node.children || [])
    .map((childId) => getNode(campaign, childId))
    .filter(Boolean);
}

function getNodeRelations(campaign, node) {
  return (node.relations || [])
    .map((relation) => ({
      ...relation,
      node: getNode(campaign, relation.targetId)
    }))
    .filter((relation) => relation.node);
}


/* =========================================================
   CAMINHO / BREADCRUMB
   ========================================================= */

function getNodePath(campaign, node) {
  const path = [];
  let current = node;

  while (current) {
    path.unshift(current);

    if (!current.parentId) {
      break;
    }

    current = getNode(campaign, current.parentId);
  }

  return path;
}

function renderBreadcrumb(campaign, node) {
  const path = getNodePath(campaign, node);

  return `
    <nav
      class="breadcrumb"
      aria-label="Localização"
    >
      ${path.map((item, index) => `
        <button
          class="breadcrumb-item"
          data-breadcrumb-id="${item.id}"
        >
          ${escapeHtml(item.name)}
        </button>

        ${
          index < path.length - 1
            ? `<span class="breadcrumb-separator">›</span>`
            : ""
        }
      `).join("")}
    </nav>
  `;
}


/* =========================================================
   CAMPANHAS
   ========================================================= */

function renderCampaignList() {
  campaignView.innerHTML = `
    <section class="welcome">
      <p class="eyebrow">SISTEMA ONLINE</p>
      <h2>Campanhas</h2>

      <p class="muted">
        Selecione um universo para entrar no Palantir.
      </p>
    </section>

    <section class="campaign-grid">
      ${getCampaigns().map((campaign) => `
        <button
          class="campaign-card"
          data-campaign-id="${campaign.id}"
        >
          <span class="icon">◉</span>

          <span class="card-title">
            ${escapeHtml(campaign.name)}
          </span>

          <span class="card-subtitle">
            ${escapeHtml(
              campaign.description || "Campanha"
            )}
          </span>
        </button>
      `).join("")}
    </section>

    <button
      class="new-campaign"
      id="newCampaign"
    >
      + NOVA CAMPANHA
    </button>
  `;

  document
    .querySelectorAll("[data-campaign-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        renderCampaign(button.dataset.campaignId);
      });
    });

  document
    .getElementById("newCampaign")
    .addEventListener("click", () => {
      alert(
        "Criador de campanhas: EM CONSTRUÇÃO."
      );
    });
}


function renderCampaign(campaignId) {
  const campaign = getCampaignById(campaignId);

  if (!campaign) {
    renderCampaignList();
    return;
  }

  const root = getNode(
    campaign,
    campaign.rootNodeId
  );

  campaignView.innerHTML = `
    <section class="view-header">

      <button
        class="back-button"
        id="backToCampaigns"
      >
        ← CAMPANHAS
      </button>

      <div class="node-heading">

        <p class="eyebrow">
          UNIVERSO
        </p>

        <h2>
          ${escapeHtml(campaign.name)}
        </h2>

        <p class="muted">
          ${escapeHtml(
            campaign.description || ""
          )}
        </p>

      </div>
    </section>

    <section class="node-panel">

      <div class="node-panel-header">

        <div>

          <span class="node-type">
            RAIZ DA CAMPANHA
          </span>

          <h3>
            ${escapeHtml(
              root ? root.name : campaign.name
            )}
          </h3>

        </div>

      </div>

      <div class="tree-section">

        <p class="section-label">
          ESTRUTURA
        </p>

        <div
          id="tree"
          class="tree"
        ></div>

      </div>

    </section>
  `;

  document
    .getElementById("backToCampaigns")
    .addEventListener(
      "click",
      renderCampaignList
    );

  if (root) {
    renderTree(
      campaign,
      root,
      document.getElementById("tree"),
      0
    );
  }
}


/* =========================================================
   ÁRVORE
   ========================================================= */

function renderTree(
  campaign,
  node,
  container,
  depth
) {
  const children = getNodeChildren(
    campaign,
    node
  );

  const item =
    document.createElement("div");

  item.className = "tree-item";

  item.style.setProperty(
    "--depth",
    depth
  );

  const row =
    document.createElement("div");

  row.className = "tree-row";

  const expandButton =
    document.createElement("button");

  expandButton.className =
    "tree-toggle";

  expandButton.textContent =
    children.length ? "▸" : "•";

  expandButton.setAttribute(
    "aria-label",
    children.length
      ? "Expandir"
      : "Node"
  );

  const nodeButton =
    document.createElement("button");

  nodeButton.className =
    "tree-node";

  nodeButton.innerHTML = `
    <span class="tree-icon">
      ${getNodeIcon(node.type)}
    </span>

    <span class="tree-name">
      ${escapeHtml(node.name)}
    </span>

    <span class="tree-type">
      ${escapeHtml(
        node.type || "node"
      )}
    </span>
  `;

  row.appendChild(expandButton);
  row.appendChild(nodeButton);

  item.appendChild(row);

  container.appendChild(item);

  const childContainer =
    document.createElement("div");

  childContainer.className =
    "tree-children hidden";

  children.forEach((child) => {
    renderTree(
      campaign,
      child,
      childContainer,
      depth + 1
    );
  });

  item.appendChild(
    childContainer
  );

  if (children.length) {

    expandButton.addEventListener(
      "click",
      () => {

        const isHidden =
          childContainer.classList.toggle(
            "hidden"
          );

        expandButton.textContent =
          isHidden ? "▸" : "▾";
      }
    );

  } else {

    expandButton.disabled = true;

  }

  nodeButton.addEventListener(
    "click",
    () => {
      openNode(
        campaign,
        node
      );
    }
  );
}


/* =========================================================
   ABRIR NODE
   ========================================================= */

function openNode(
  campaign,
  node
) {
  const children =
    getNodeChildren(
      campaign,
      node
    );

  const relations =
    getNodeRelations(
      campaign,
      node
    );

  campaignView.innerHTML = `
    <section class="view-header">

      ${renderBreadcrumb(
        campaign,
        node
      )}

      <button
        class="back-button"
        id="backToTree"
      >
        ← ${escapeHtml(
          campaign.name
        )}
      </button>

      <div class="node-heading">

        <p class="eyebrow">
          ${escapeHtml(
            node.type || "NODE"
          )}
        </p>

        <h2>
          ${escapeHtml(
            node.name
          )}
        </h2>

      </div>

    </section>

    <section class="node-detail">

      <div class="node-actions">

        <button
          class="edit-node-button"
          id="editNode"
        >
          ✎ EDITAR NODE
        </button>

        <button
          class="create-node-button"
          id="createNode"
        >
          ＋ CRIAR NODE
        </button>

      </div>

      <div class="detail-content">

        <p class="section-label">
          CONTEÚDO
        </p>

        <p class="node-content">
          ${escapeHtml(
            node.content ||
            "Este Node ainda não possui conteúdo."
          )}
        </p>

      </div>

      ${
        children.length
          ? `
        <div class="detail-section">

          <p class="section-label">
            CONTÉM
          </p>

          <div class="link-list">

            ${children.map((child) => `
              <button
                class="link-card"
                data-node-id="${child.id}"
              >

                <span>
                  ${getNodeIcon(
                    child.type
                  )}
                </span>

                <span>

                  <strong>
                    ${escapeHtml(
                      child.name
                    )}
                  </strong>

                  <small>
                    ${escapeHtml(
                      child.type ||
                      "node"
                    )}
                  </small>

                </span>

              </button>
            `).join("")}

          </div>

        </div>
      `
          : ""
      }

      ${
        relations.length
          ? `
        <div class="detail-section">

          <p class="section-label">
            RELAÇÕES
          </p>

          <div class="link-list">

            ${relations.map(
              (relation) => `
              <button
                class="link-card relation-card"
                data-node-id="${relation.node.id}"
              >

                <span>
                  ↗
                </span>

                <span>

                  <strong>
                    ${escapeHtml(
                      relation.node.name
                    )}
                  </strong>

                  <small>
                    ${escapeHtml(
                      relation.type ||
                      "relacionado-a"
                    )}
                  </small>

                </span>

              </button>
            `
            ).join("")}

          </div>

        </div>
      `
          : ""
      }

    </section>
  `;


  /* =======================================================
     BOTÃO EDITAR
     ======================================================= */

  document
    .getElementById("editNode")
    .addEventListener(
      "click",
      () => {
        openNodeEditor(
          campaign,
          node
        );
      }
    );


  /* =======================================================
     BOTÃO CRIAR
     ======================================================= */

  document
    .getElementById("createNode")
    .addEventListener(
      "click",
      () => {
        openCreateNodeEditor(
          campaign,
          node
        );
      }
    );


  /* =======================================================
     BREADCRUMB
     ======================================================= */

  document
    .querySelectorAll(
      "[data-breadcrumb-id]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const target =
            getNode(
              campaign,
              button.dataset
                .breadcrumbId
            );

          if (target) {
            openNode(
              campaign,
              target
            );
          }

        }
      );

    });


  /* =======================================================
     VOLTAR PARA ÁRVORE
     ======================================================= */

  document
    .getElementById(
      "backToTree"
    )
    .addEventListener(
      "click",
      () => {
        renderCampaign(
          campaign.id
        );
      }
    );


  /* =======================================================
     LINKS INTERNOS E RELAÇÕES
     ======================================================= */

  document
    .querySelectorAll(
      "[data-node-id]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const target =
            getNode(
              campaign,
              button.dataset
                .nodeId
            );

          if (target) {
            openNode(
              campaign,
              target
            );
          }

        }
      );

    });
}


/* =========================================================
   EDITOR DE NODE EXISTENTE
   ========================================================= */

function openNodeEditor(
  campaign,
  node
) {
  const isRoot =
    node.id === campaign.rootNodeId;

  const possibleParents =
    getPossibleParents(
      campaign,
      node
    );

  const overlay =
    document.createElement("div");

  overlay.className =
    "node-editor-overlay";

  overlay.innerHTML = `
    <div class="node-editor">

      <div class="node-editor-header">

        <div>
          <p class="eyebrow">
            EDITOR DE NODE
          </p>

          <h2>
            ${escapeHtml(node.name)}
          </h2>
        </div>

        <button
          class="node-editor-close"
          id="closeNodeEditor"
        >
          ×
        </button>

      </div>

      <div class="node-editor-body">

        <label>
          <span>NOME</span>

          <input
            id="editNodeName"
            type="text"
            value="${escapeHtml(node.name)}"
          >
        </label>

        <label>
          <span>TIPO</span>

          <input
            id="editNodeType"
            type="text"
            value="${escapeHtml(
              node.type || "node"
            )}"
          >
        </label>

        <label>
          <span>CONTEÚDO</span>

          <textarea
            id="editNodeContent"
            rows="8"
          >${escapeHtml(
            node.content || ""
          )}</textarea>
        </label>

        <label>
          <span>LOCALIZAÇÃO NA ÁRVORE</span>

          <select
            id="editNodeParent"
            ${isRoot ? "disabled" : ""}
          >

            ${
              isRoot
                ? `
                  <option>
                    RAIZ DA CAMPANHA
                  </option>
                `
                : possibleParents
                    .map(
                      (parent) => `
                      <option
                        value="${parent.id}"
                        ${
                          node.parentId === parent.id
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(
                          getNodeLocationLabel(
                            campaign,
                            parent
                          )
                        )}
                      </option>
                    `
                    )
                    .join("")
            }

          </select>

          ${
            isRoot
              ? `
                <small>
                  A raiz da campanha não pode ser movida.
                </small>
              `
              : ""
          }

        </label>

      </div>

      <div class="node-editor-actions">

        <button
          class="node-editor-cancel"
          id="cancelNodeEditor"
        >
          CANCELAR
        </button>

        <button
          class="node-editor-save"
          id="saveNodeEditor"
        >
          SALVAR ALTERAÇÕES
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );


  document
    .getElementById(
      "closeNodeEditor"
    )
    .addEventListener(
      "click",
      () => {
        overlay.remove();
      }
    );


  document
    .getElementById(
      "cancelNodeEditor"
    )
    .addEventListener(
      "click",
      () => {
        overlay.remove();
      }
    );


  document
    .getElementById(
      "saveNodeEditor"
    )
    .addEventListener(
      "click",
      () => {

        const newName =
          document
            .getElementById(
              "editNodeName"
            )
            .value
            .trim();

        const newType =
          document
            .getElementById(
              "editNodeType"
            )
            .value
            .trim();

        const newContent =
          document
            .getElementById(
              "editNodeContent"
            )
            .value;

        const newParentId =
          isRoot
            ? node.parentId
            : document
                .getElementById(
                  "editNodeParent"
                )
                .value;

        if (!newName) {
          alert(
            "O Node precisa ter um nome."
          );
          return;
        }

        const oldParentId =
          node.parentId;

        node.name =
          newName;

        node.type =
          newType || "node";

        node.content =
          newContent;

        if (
          !isRoot &&
          oldParentId !== newParentId
        ) {
          moveNode(
            campaign,
            node,
            newParentId
          );
        }

        overlay.remove();

        openNode(
          campaign,
          node
        );
      }
    );


  overlay.addEventListener(
    "click",
    (event) => {

      if (
        event.target === overlay
      ) {
        overlay.remove();
      }

    }
  );
}


/* =========================================================
   NOVO NODE
   ========================================================= */

function openCreateNodeEditor(
  campaign,
  currentParent
) {
  const overlay =
    document.createElement("div");

  overlay.className =
    "node-editor-overlay";

  const possibleParents =
    getAllNodesSorted(
      campaign
    );

  overlay.innerHTML = `
    <div class="node-editor">

      <div class="node-editor-header">

        <div>
          <p class="eyebrow">
            NOVO NODE
          </p>

          <h2>
            Criar entidade
          </h2>
        </div>

        <button
          class="node-editor-close"
          id="closeCreateNodeEditor"
        >
          ×
        </button>

      </div>

      <div class="node-editor-body">

        <label>
          <span>NOME</span>

          <input
            id="createNodeName"
            type="text"
            placeholder="Nome do novo Node"
            autofocus
          >
        </label>

        <label>
          <span>TIPO</span>

          <input
            id="createNodeType"
            type="text"
            placeholder="Ex.: personagem, evento, local..."
          >
        </label>

        <label>
          <span>LOCALIZAÇÃO NA ÁRVORE</span>

          <select
            id="createNodeParent"
          >

            ${possibleParents
              .map(
                (parent) => `
                <option
                  value="${parent.id}"
                  ${
                    parent.id === currentParent.id
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(
                    getNodeLocationLabel(
                      campaign,
                      parent
                    )
                  )}
                </option>
              `
              )
              .join("")}

          </select>
        </label>

        <label>
          <span>CONTEÚDO</span>

          <textarea
            id="createNodeContent"
            rows="8"
            placeholder="Escreva o conteúdo deste Node..."
          ></textarea>
        </label>

      </div>

      <div class="node-editor-actions">

        <button
          class="node-editor-cancel"
          id="cancelCreateNode"
        >
          CANCELAR
        </button>

        <button
          class="node-editor-save"
          id="confirmCreateNode"
        >
          CRIAR NODE
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );


  document
    .getElementById(
      "closeCreateNodeEditor"
    )
    .addEventListener(
      "click",
      () => {
        overlay.remove();
      }
    );


  document
    .getElementById(
      "cancelCreateNode"
    )
    .addEventListener(
      "click",
      () => {
        overlay.remove();
      }
    );


  document
    .getElementById(
      "confirmCreateNode"
    )
    .addEventListener(
      "click",
      () => {

        const name =
          document
            .getElementById(
              "createNodeName"
            )
            .value
            .trim();

        const type =
          document
            .getElementById(
              "createNodeType"
            )
            .value
            .trim();

        const content =
          document
            .getElementById(
              "createNodeContent"
            )
            .value;

        const parentId =
          document
            .getElementById(
              "createNodeParent"
            )
            .value;

        if (!name) {
          alert(
            "O Node precisa ter um nome."
          );
          return;
        }

        const parent =
          getNode(
            campaign,
            parentId
          );

        if (!parent) {
          alert(
            "Localização do Node inválida."
          );
          return;
        }


        /* ===============================================
           CRIA O ID
           =============================================== */

        const id =
          generateNodeId();


        /* ===============================================
           CRIA A ENTIDADE
           =============================================== */

        const newNode = {
          id,
          name,
          type: type || "node",
          content,
          parentId,
          children: [],
          relations: []
        };


        /* ===============================================
           ADICIONA AO UNIVERSO
           =============================================== */

        campaign.nodes.push(
  newNode
);

/* ===============================================
   ADICIONA AO PAI
   =============================================== */

if (!Array.isArray(
  parent.children
)) {
  parent.children = [];
}

parent.children.push(
  newNode.id
);

saveData();

/* ===============================================
   FECHA E ABRE O NODE
   =============================================== */

overlay.remove();

openNode(
  campaign,
  newNode
);

  overlay.addEventListener(
    "click",
    (event) => {

      if (
        event.target === overlay
      ) {
        overlay.remove();
      }

    }
  );
}


/* =========================================================
   CRIA ID ÚNICO
   ========================================================= */

function generateNodeId() {
  return (
    "node-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );
}


/* =========================================================
   TODOS OS NODES
   ========================================================= */

function getAllNodesSorted(
  campaign
) {
  return [...campaign.nodes]
    .sort((a, b) =>
      getNodeLocationLabel(
        campaign,
        a
      ).localeCompare(
        getNodeLocationLabel(
          campaign,
          b
        ),
        "pt-BR"
      )
    );
}


/* =========================================================
   LOCALIZAÇÃO COMPLETA
   ========================================================= */

function getNodeLocationLabel(
  campaign,
  node
) {
  const path =
    getNodePath(
      campaign,
      node
    );

  return path
    .map(
      (item) => item.name
    )
    .join(" › ");
}


/* =========================================================
   DESCENDENTES
   ========================================================= */

function getDescendantIds(
  campaign,
  node
) {
  const descendants = [];

  function collect(current) {

    const children =
      getNodeChildren(
        campaign,
        current
      );

    children.forEach(
      (child) => {

        descendants.push(
          child.id
        );

        collect(child);

      }
    );
  }

  collect(node);

  return descendants;
}


/* =========================================================
   POSSÍVEIS PAIS PARA EDIÇÃO
   ========================================================= */

function getPossibleParents(
  campaign,
  node
) {
  const excludedIds =
    new Set([
      node.id,
      ...getDescendantIds(
        campaign,
        node
      )
    ]);

  return getAllNodesSorted(
    campaign
  ).filter(
    (possibleParent) =>
      !excludedIds.has(
        possibleParent.id
      )
  );
}


/* =========================================================
   MOVER NODE
   ========================================================= */

function moveNode(
  campaign,
  node,
  newParentId
) {
  const oldParentId =
    node.parentId;

  if (
    oldParentId ===
    newParentId
  ) {
    return;
  }

  const oldParent =
    getNode(
      campaign,
      oldParentId
    );

  const newParent =
    getNode(
      campaign,
      newParentId
    );

  if (!newParent) {
    return;
  }

  if (oldParent) {

    oldParent.children =
      (oldParent.children || [])
        .filter(
          (childId) =>
            childId !== node.id
        );

  }

  if (!Array.isArray(
    newParent.children
  )) {
    newParent.children = [];
  }

  if (
    !newParent.children.includes(
      node.id
    )
  ) {
    newParent.children.push(
      node.id
    );
  }

  node.parentId =
    newParent.id;
}


/* =========================================================
   ÍCONES
   ========================================================= */

function getNodeIcon(type) {

  const icons = {

    "campaign-root": "◉",

    folder: "▱",

    faction: "◇",

    "character-sheet": "◈",

    biography: "▤",

    event: "◆",

    threat: "☠"

  };

  return (
    icons[type] ||
    "•"
  );
}


/* =========================================================
   SEGURANÇA DE HTML
   ========================================================= */

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}
