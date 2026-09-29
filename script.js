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


/* =========================================================
   CAMPANHAS
   ========================================================= */

function getCampaigns() {
  return data.campaigns || [];
}


/* =========================================================
   BUSCAR CAMPANHA
   ========================================================= */

function getCampaign(campaignId) {
  return getCampaigns().find(
    (campaign) =>
      campaign.id === campaignId
  );
}


/* =========================================================
   BUSCAR NODE
   ========================================================= */

function getNode(
  campaign,
  nodeId
) {
  if (!campaign) {
    return null;
  }

  return campaign.nodes.find(
    (node) =>
      node.id === nodeId
  );
}


/* =========================================================
   BUSCAR CAMINHO DO NODE
   ========================================================= */

function getNodePath(
  campaign,
  node
) {
  const path = [];

  let current = node;

  while (current) {
    path.unshift(current);

    if (!current.parentId) {
      break;
    }

    current =
      getNode(
        campaign,
        current.parentId
      );
  }

  return path;
}


/* =========================================================
   BREADCRUMB
   ========================================================= */

function renderBreadcrumb(
  campaign,
  node
) {
  const path =
    getNodePath(
      campaign,
      node
    );

  return `
    <nav class="breadcrumb">
      ${path
        .map(
          (item, index) => `
            <button
              class="breadcrumb-item"
              data-node-id="${item.id}"
            >
              ${escapeHtml(
                item.name
              )}
            </button>

            ${
              index <
              path.length - 1
                ? `<span class="breadcrumb-separator">›</span>`
                : ""
            }
          `
        )
        .join("")}
    </nav>
  `;
}


/* =========================================================
   LISTA DE CAMPANHAS
   ========================================================= */

function renderCampaignList() {
  campaignView.innerHTML = "";

  const campaigns =
    getCampaigns();

  if (!campaigns.length) {
    campaignView.innerHTML = `
      <section class="empty-state">
        <p class="eyebrow">
          PALANTIR
        </p>

        <h2>
          Nenhuma campanha encontrada.
        </h2>

        <p class="muted">
          O arquivo de dados ainda está vazio.
        </p>
      </section>
    `;

    return;
  }

  const section =
    document.createElement(
      "section"
    );

  section.className =
    "campaign-list";

  const title =
    document.createElement(
      "div"
    );

  title.className =
    "section-heading";

  title.innerHTML = `
    <p class="eyebrow">
      CAMPANHAS
    </p>

    <h2>
      Arquivos disponíveis
    </h2>
  `;

  section.appendChild(
    title
  );

  campaigns.forEach(
    (campaign) => {
      const button =
        document.createElement(
          "button"
        );

      button.className =
        "campaign-card";

      button.innerHTML = `
        <span class="campaign-card-type">
          CAMPANHA
        </span>

        <span class="campaign-card-name">
          ${escapeHtml(
            campaign.name
          )}
        </span>
      `;

      button.addEventListener(
        "click",
        () => {
          renderCampaign(
            campaign
          );
        }
      );

      section.appendChild(
        button
      );
    }
  );

  campaignView.appendChild(
    section
  );
}


/* =========================================================
   RENDERIZAR CAMPANHA
   ========================================================= */

function renderCampaign(
  campaign
) {
  campaignView.innerHTML = "";

  const wrapper =
    document.createElement(
      "section"
    );

  wrapper.className =
    "campaign-view";

  const header =
    document.createElement(
      "div"
    );

  header.className =
    "campaign-header";

  header.innerHTML = `
    <div>
      <p class="eyebrow">
        CAMPANHA
      </p>

      <h2>
        ${escapeHtml(
          campaign.name
        )}
      </h2>
    </div>

    <button
      class="back-button"
      id="backToCampaigns"
    >
      ← CAMPANHAS
    </button>
  `;

  wrapper.appendChild(
    header
  );

  const layout =
    document.createElement(
      "div"
    );

  layout.className =
    "campaign-layout";

  const tree =
    document.createElement(
      "aside"
    );

  tree.className =
    "tree-panel";

  const treeTitle =
    document.createElement(
      "div"
    );

  treeTitle.className =
    "tree-title";

  treeTitle.innerHTML = `
    <p class="eyebrow">
      ESTRUTURA
    </p>

    <span>
      Árvore da campanha
    </span>
  `;

  tree.appendChild(
    treeTitle
  );

  const treeContent =
    document.createElement(
      "div"
    );

  treeContent.id =
    "campaignTree";

  tree.appendChild(
    treeContent
  );

  const detail =
    document.createElement(
      "section"
    );

  detail.className =
    "node-detail";

  detail.id =
    "nodeDetail";

  detail.innerHTML = `
    <div class="empty-node">
      <p class="eyebrow">
        PALANTIR
      </p>

      <h3>
        Selecione um Node
      </h3>

      <p class="muted">
        Navegue pela árvore para abrir
        uma entidade da campanha.
      </p>
    </div>
  `;

  layout.appendChild(
    tree
  );

  layout.appendChild(
    detail
  );

  wrapper.appendChild(
    layout
  );

  campaignView.appendChild(
    wrapper
  );

  document
    .getElementById(
      "backToCampaigns"
    )
    .addEventListener(
      "click",
      renderCampaignList
    );

  renderTree(
    campaign,
    treeContent
  );
}


/* =========================================================
   ÁRVORE
   ========================================================= */

function renderTree(
  campaign,
  container
) {
  container.innerHTML = "";

  const root =
    campaign.nodes.find(
      (node) =>
        !node.parentId
    );

  if (!root) {
    container.innerHTML = `
      <p class="muted">
        Nenhum Node raiz encontrado.
      </p>
    `;

    return;
  }

  const tree =
    document.createElement(
      "ul"
    );

  tree.className =
    "tree-root";

  tree.appendChild(
    renderTreeNode(
      campaign,
      root
    )
  );

  container.appendChild(
    tree
  );
}


/* =========================================================
   NODE DA ÁRVORE
   ========================================================= */

function renderTreeNode(
  campaign,
  node
) {
  const li =
    document.createElement(
      "li"
    );

  li.className =
    "tree-node";

  const button =
    document.createElement(
      "button"
    );

  button.className =
    "tree-node-button";

  button.dataset.nodeId =
    node.id;

  button.innerHTML = `
    <span class="tree-node-icon">
      ${getNodeIcon(
        node.type
      )}
    </span>

    <span class="tree-node-name">
      ${escapeHtml(
        node.name
      )}
    </span>
  `;

  button.addEventListener(
    "click",
    () => {
      openNode(
        campaign,
        node
      );
    }
  );

  li.appendChild(
    button
  );

  const children =
    Array.isArray(
      node.children
    )
      ? node.children
      : [];

  if (children.length) {
    const ul =
      document.createElement(
        "ul"
      );

    ul.className =
      "tree-children";

    children.forEach(
      (childId) => {
        const child =
          getNode(
            campaign,
            childId
          );

        if (child) {
          ul.appendChild(
            renderTreeNode(
              campaign,
              child
            )
          );
        }
      }
    );

    li.appendChild(
      ul
    );
  }

  return li;
}


/* =========================================================
   ABRIR NODE
   ========================================================= */

function openNode(
  campaign,
  node
) {
  const detail =
    document.getElementById(
      "nodeDetail"
    );

  if (!detail) {
    return;
  }

  const breadcrumb =
    renderBreadcrumb(
      campaign,
      node
    );

  const children =
    Array.isArray(
      node.children
    )
      ? node.children
      : [];

  const relations =
    Array.isArray(
      node.relations
    )
      ? node.relations
      : [];

  detail.innerHTML = `
    ${breadcrumb}

    <article class="node-card">

      <div class="node-card-header">

        <div>
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

      </div>

      <div class="node-content">
        ${
          node.content
            ? escapeHtml(
                node.content
              ).replace(
                /\n/g,
                "<br>"
              )
            : `
              <span class="muted">
                Este Node ainda não possui conteúdo.
              </span>
            `
        }
      </div>

      ${
        children.length
          ? `
            <section class="node-section">

              <p class="eyebrow">
                FILHOS
              </p>

              <div class="node-links">
                ${children
                  .map(
                    (childId) => {
                      const child =
                        getNode(
                          campaign,
                          childId
                        );

                      if (!child) {
                        return "";
                      }

                      return `
                        <button
                          class="node-link"
                          data-node-id="${child.id}"
                        >
                          ${escapeHtml(
                            child.name
                          )}
                        </button>
                      `;
                    }
                  )
                  .join("")}
              </div>

            </section>
          `
          : ""
      }

      ${
        relations.length
          ? `
            <section class="node-section">

              <p class="eyebrow">
                RELAÇÕES
              </p>

              <div class="relation-list">

                ${relations
                  .map(
                    (relation) => {

                      const target =
                        getNode(
                          campaign,
                          relation.targetId
                        );

                      if (!target) {
                        return "";
                      }

                      return `
                        <div class="relation-item">

                          <span class="relation-type">
                            ${escapeHtml(
                              relation.type ||
                              "relacionado-a"
                            )}
                          </span>

                          <button
                            class="node-link relation-link"
                            data-node-id="${target.id}"
                          >
                            ${escapeHtml(
                              target.name
                            )}
                          </button>

                        </div>
                      `;
                    }
                  )
                  .join("")}

              </div>

            </section>
          `
          : ""
      }

    </article>
  `;

  detail
    .querySelectorAll(
      ".breadcrumb-item"
    )
    .forEach(
      (button) => {

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

      }
    );

  detail
    .querySelectorAll(
      ".node-link"
    )
    .forEach(
      (button) => {

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

      }
    );

  const editButton =
    document.getElementById(
      "editNode"
    );

  if (editButton) {
    editButton.addEventListener(
      "click",
      () => {
        openNodeEditor(
          campaign,
          node
        );
      }
    );
  }

  const createButton =
    document.getElementById(
      "createNode"
    );

  if (createButton) {
    createButton.addEventListener(
      "click",
      () => {
        openCreateNodeEditor(
          campaign,
          node
        );
      }
    );
  }
}


/* =========================================================
   EDITAR NODE
   ========================================================= */

function openNodeEditor(
  campaign,
  node
) {
  const overlay =
    document.createElement(
      "div"
    );

  overlay.className =
    "modal-overlay";

  const isRoot =
    !node.parentId;

  const possibleParents =
    getPossibleParents(
      campaign,
      node
    );

  overlay.innerHTML = `
    <div class="modal-panel">

      <div class="modal-header">

        <div>
          <p class="eyebrow">
            EDITAR NODE
          </p>

          <h2>
            ${escapeHtml(
              node.name
            )}
          </h2>
        </div>

        <button
          class="modal-close"
          id="cancelEditNode"
        >
          ×
        </button>

      </div>

      <div class="editor-field">

        <label for="editNodeName">
          Nome
        </label>

        <input
          id="editNodeName"
          type="text"
          value="${escapeHtml(
            node.name
          )}"
        >

      </div>

      <div class="editor-field">

        <label for="editNodeType">
          Tipo
        </label>

        <input
          id="editNodeType"
          type="text"
          value="${escapeHtml(
            node.type || ""
          )}"
        >

      </div>

      <div class="editor-field">

        <label for="editNodeParent">
          Localização
        </label>

        ${
          isRoot
            ? `
              <div class="editor-static">
                NODE RAIZ
              </div>
            `
            : `
              <select
                id="editNodeParent"
              >
                ${possibleParents
                  .map(
                    (parent) => `
                      <option
                        value="${parent.id}"
                        ${
                          parent.id ===
                          node.parentId
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
            `
        }

      </div>

      <div class="editor-field">

        <label for="editNodeContent">
          Conteúdo
        </label>

        <textarea
          id="editNodeContent"
          rows="12"
        >${escapeHtml(
          node.content || ""
        )}</textarea>

      </div>

      <div class="modal-actions">

        <button
          class="secondary-button"
          id="cancelEditNodeBottom"
        >
          CANCELAR
        </button>

        <button
          class="primary-button"
          id="saveEditNode"
        >
          SALVAR ALTERAÇÕES
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  const cancelButtons =
    [
      document.getElementById(
        "cancelEditNode"
      ),
      document.getElementById(
        "cancelEditNodeBottom"
      )
    ];

  cancelButtons.forEach(
    (button) => {

      if (button) {
        button.addEventListener(
          "click",
          () => {
            overlay.remove();
          }
        );
      }

    }
  );

  document
    .getElementById(
      "saveEditNode"
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

        saveData();

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
   POSSÍVEIS PAIS
   ========================================================= */

function getPossibleParents(
  campaign,
  node
) {
  const descendants =
    new Set();

  function collectDescendants(
    currentNode
  ) {
    const children =
      Array.isArray(
        currentNode.children
      )
        ? currentNode.children
        : [];

    children.forEach(
      (childId) => {

        if (
          descendants.has(
            childId
          )
        ) {
          return;
        }

        descendants.add(
          childId
        );

        const child =
          getNode(
            campaign,
            childId
          );

        if (child) {
          collectDescendants(
            child
          );
        }

      }
    );
  }

  collectDescendants(
    node
  );

  return campaign.nodes
    .filter(
      (candidate) =>
        candidate.id !== node.id &&
        !descendants.has(
          candidate.id
        )
    )
    .sort(
      (a, b) =>
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
   LOCALIZAÇÃO DO NODE
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
      (item) =>
        item.name
    )
    .join(
      " › "
    );
}


/* =========================================================
   CRIAR NODE
   ========================================================= */

function openCreateNodeEditor(
  campaign,
  currentParent
) {
  const overlay =
    document.createElement(
      "div"
    );

  overlay.className =
    "modal-overlay";

  const possibleParents =
    getAllNodesSorted(
      campaign
    );

  overlay.innerHTML = `
    <div class="modal-panel">

      <div class="modal-header">

        <div>
          <p class="eyebrow">
            CRIAR NODE
          </p>

          <h2>
            Novo Node
          </h2>
        </div>

        <button
          class="modal-close"
          id="cancelCreateNode"
        >
          ×
        </button>

      </div>

      <div class="editor-field">

        <label for="createNodeName">
          Nome
        </label>

        <input
          id="createNodeName"
          type="text"
          placeholder="Nome do Node"
        >

      </div>

      <div class="editor-field">

        <label for="createNodeType">
          Tipo
        </label>

        <input
          id="createNodeType"
          type="text"
          placeholder="node"
        >

      </div>

      <div class="editor-field">

        <label for="createNodeParent">
          Localização
        </label>

        <select
          id="createNodeParent"
        >

          ${possibleParents
            .map(
              (parent) => `
                <option
                  value="${parent.id}"
                  ${
                    parent.id ===
                    currentParent.id
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

      </div>

      <div class="editor-field">

        <label for="createNodeContent">
          Conteúdo
        </label>

        <textarea
          id="createNodeContent"
          rows="12"
          placeholder="Conteúdo do Node..."
        ></textarea>

      </div>

      <div class="modal-actions">

        <button
          class="secondary-button"
          id="cancelCreateNodeBottom"
        >
          CANCELAR
        </button>

        <button
          class="primary-button"
          id="saveCreateNode"
        >
          CRIAR NODE
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  const cancelButtons =
    [
      document.getElementById(
        "cancelCreateNode"
      ),
      document.getElementById(
        "cancelCreateNodeBottom"
      )
    ];

  cancelButtons.forEach(
    (button) => {

      if (button) {
        button.addEventListener(
          "click",
          () => {
            overlay.remove();
          }
        );
      }

    }
  );

  document
    .getElementById(
      "saveCreateNode"
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
            "O Node pai não foi encontrado."
          );
          return;
        }

        const newNode = {
          id:
            generateNodeId(),

          name,

          type:
            type || "node",

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
   CRIA ID ÚNICO
   ========================================================= */

function generateNodeId() {
  return (
    "node-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 8)
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

function getNodeIcon(
  type
) {
  const icons = {
    campaign: "◈",
    faction: "◆",
    player: "●",
    npc: "○",
    leadership: "▲",
    sheet: "▣",
    biography: "▤",
    event: "◉",
    threat: "☠",
    location: "⌖",
    mission: "⚑",
    item: "◇",
    weapon: "╋",
    creature: "♢",
    rule: "≡",
    node: "•"
  };

  return (
    icons[type] ||
    icons.node
  );
}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}
