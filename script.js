const app = document.querySelector(".app");
const campaignView = document.getElementById("campaignView");

const data = window.PALANTIR_DATA;

// ================================
// PALANTIR 0.2.7.2
// MOTOR DE BUSCA
// ================================

function searchNodes(query) {
  const normalizedQuery = query
    .trim()
    .toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const results = [];

  data.campaigns.forEach((campaign) => {
    campaign.nodes.forEach((node) => {
      const searchableText = [
        node.name,
        node.type,
        node.content
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (searchableText.includes(normalizedQuery)) {
        results.push({
          campaign,
          node
        });
      }
    });
  });

  return results;
}
 
const searchInput = document.getElementById("searchInput");

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    const results = searchNodes(event.target.value);

    window.PALANTIR_SEARCH_RESULTS = results;

    renderSearchResults(results, event.target.value);
  });
}

const STORAGE_KEY = "palantir-gm-data";

const DELETED_STORAGE_KEY =
  "palantir-gm-deleted-nodes";

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDeletedNodeIds() {
  const saved =
    localStorage.getItem(
      DELETED_STORAGE_KEY
    );

  if (!saved) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "Erro ao carregar Nodes excluídos:",
      error
    );

    return [];
  }
}

function saveDeletedNodeIds(
  deletedNodeIds
) {
  localStorage.setItem(
    DELETED_STORAGE_KEY,
    JSON.stringify(
      deletedNodeIds
    )
  );
}

function loadData() {
  const savedData =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!savedData) {
    return;
  }

  try {
    const parsedData =
      JSON.parse(savedData);

    if (
      !parsedData ||
      !Array.isArray(
        parsedData.campaigns
      )
    ) {
      return;
    }

    const deletedNodeIds =
      getDeletedNodeIds();

    data.campaigns.forEach(
      (currentCampaign) => {

        const savedCampaign =
          parsedData.campaigns.find(
            (campaign) =>
              campaign.id ===
              currentCampaign.id
          );

        if (
          !savedCampaign ||
          !Array.isArray(
            savedCampaign.nodes
          )
        ) {
          return;
        }

        const mergedNodes =
          [];

        currentCampaign.nodes.forEach(
          (currentNode) => {

            if (
              deletedNodeIds.includes(
                currentNode.id
              )
            ) {
              return;
            }

            const savedNode =
              savedCampaign.nodes.find(
                (node) =>
                  node.id ===
                  currentNode.id
              );

            if (savedNode) {
              Object.assign(
                currentNode,
                savedNode
              );
            }

            if (
              currentNode
                .deletionPolicy ===
              undefined
            ) {
              currentNode.deletionPolicy =
                "confirm";
            }

            if (
              currentNode.id ===
              "node-bsaa-players"
            ) {
              currentNode.deletionPolicy =
                "protected";
            }

            mergedNodes.push(
              currentNode
            );
          }
        );

        savedCampaign.nodes.forEach(
          (savedNode) => {

            if (
              deletedNodeIds.includes(
                savedNode.id
              )
            ) {
              return;
            }

            const alreadyExists =
              mergedNodes.some(
                (node) =>
                  node.id ===
                  savedNode.id
              );

            if (
              alreadyExists
            ) {
              return;
            }

            const restoredNode = {
              ...savedNode
            };

            if (
              !Array.isArray(
                restoredNode.children
              )
            ) {
              restoredNode.children =
                [];
            }

            if (
              !Array.isArray(
                restoredNode.relations
              )
            ) {
              restoredNode.relations =
                [];
            }

            if (
              restoredNode
                .deletionPolicy ===
              undefined
            ) {
              restoredNode.deletionPolicy =
                "confirm";
            }

            if (
              restoredNode.id ===
              "node-bsaa-players"
            ) {
              restoredNode.deletionPolicy =
                "protected";
            }

            mergedNodes.push(
              restoredNode
            );
          }
        );

        currentCampaign.nodes =
          mergedNodes;
      }
    );

  } catch (error) {
    console.error(
      "Erro ao carregar memória do Palantir:",
      error
    );
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

function getCampaigns() {
  return data.campaigns;
}

function getCampaignById(id) {
  return getCampaigns().find(
    (campaign) => campaign.id === id
  );
}

function getNode(campaign, nodeId) {
  return campaign.nodes.find(
    (node) => node.id === nodeId
  );
}

function getNodeDependencies(
  campaign,
  node
) {
  return campaign.nodes.filter(
    (currentNode) =>
      Array.isArray(
        currentNode.relations
      ) &&
      currentNode.relations.some(
        (relation) =>
          relation.targetId ===
            node.id &&
          relation.dependency !==
            false
      )
  );
}


/* =========================================================
   CAMINHO DO NODE
   ========================================================= */

function getNodePath(
  campaign,
  node
) {
  const path = [];
  let currentNode = node;

  while (currentNode) {
    path.unshift(currentNode);

    if (!currentNode.parentId) {
      break;
    }

    currentNode = getNode(
      campaign,
      currentNode.parentId
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
          (pathNode, index) => `
            <button
              class="breadcrumb-item ${
                index === path.length - 1
                  ? "current"
                  : ""
              }"
              data-node-id="${pathNode.id}"
            >
              ${escapeHtml(
                pathNode.name
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
  const campaigns =
    getCampaigns();

  campaignView.innerHTML = `
    <section class="campaign-list">
      <div class="section-heading">
        <p class="eyebrow">
          UNIVERSOS
        </p>

        <h2>
          Campanhas
        </h2>
      </div>

      <div class="campaign-grid">
        ${
          campaigns.length
            ? campaigns
                .map(
                  (campaign) => `
                    <button
                      class="campaign-card"
                      data-campaign-id="${campaign.id}"
                    >
                      <span class="campaign-icon">
                        ${getNodeIcon(
                          "campaign-root"
                        )}
                      </span>

                      <span class="campaign-name">
                        ${escapeHtml(
                          campaign.name
                        )}
                      </span>

                      <span class="campaign-description">
                        ${escapeHtml(
                          campaign.description ||
                            ""
                        )}
                      </span>
                    </button>
                  `
                )
                .join("")
            : `
                <div class="empty-state">
                  Nenhuma campanha encontrada.
                </div>
              `
        }
      </div>
    </section>
  `;

  document
    .querySelectorAll(
      ".campaign-card"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const campaign =
              getCampaignById(
                button.dataset
                  .campaignId
              );

            if (!campaign) {
              return;
            }

            renderCampaign(
              campaign
            );
          }
        );
      }
    );
}


/* =========================================================
   CAMPANHA
   ========================================================= */

function renderCampaign(
  campaign
) {
  const root =
    campaign.nodes.find(
      (node) =>
        node.id ===
        campaign.rootNodeId
    );

  if (!root) {
    campaignView.innerHTML = `
      <section class="error-panel">
        <p class="eyebrow">
          ERRO DE CAMPANHA
        </p>

        <h2>
          Nó raiz não encontrado.
        </h2>
      </section>
    `;

    return;
  }

  campaignView.innerHTML = `
    <section class="campaign-view">

      <div class="campaign-header">

        <button
          class="back-button"
          id="backToCampaigns"
        >
          ← CAMPANHAS
        </button>

        <div>
          <p class="eyebrow">
            UNIVERSO
          </p>

          <h2>
            ${escapeHtml(
              campaign.name
            )}
          </h2>

          <p class="campaign-description">
            ${escapeHtml(
              campaign.description ||
                ""
            )}
          </p>
        </div>

      </div>

      <div class="view-switcher">

        <button
          class="view-mode-button active"
          id="treeModeButton"
        >
          🌳 ÁRVORE
        </button>

        <button
          class="view-mode-button"
          id="teiaModeButton"
        >
          🕸️ TEIA
        </button>

      </div>

    <div
      id="treeViewPanel"
      class="view-panel"
    >

      <div class="campaign-layout">

        <aside
          class="tree-panel"
          id="treePanel"
        >
        </aside>

        <section
          class="node-panel"
          id="nodePanel"
        >
          <div class="empty-node">
            <p class="eyebrow">
              PALANTIR
            </p>

            <h2>
              Selecione um Node
            </h2>

            <p>
              Navegue pela estrutura
              da campanha.
            </p>
          </div>
        </section>

      </div>

    </div>

    <div
      id="teiaViewPanel"
      class="view-panel"
      hidden
    >
      <div class="empty-node">

        <p class="eyebrow">
          TEIA
        </p>

        <h2>
          A Teia do Palantir
        </h2>

        <p>
          A rede de relações será construída aqui.
        </p>

      </div>
    </div>

  </section>
`;

  document
    .getElementById(
      "backToCampaigns"
    )
    .addEventListener(
      "click",
      () => {
        renderCampaignList();
      }
    );

  const treeModeButton =
  document.getElementById(
    "treeModeButton"
  );

const teiaModeButton =
  document.getElementById(
    "teiaModeButton"
  );

const treeViewPanel =
  document.getElementById(
    "treeViewPanel"
  );

const teiaViewPanel =
  document.getElementById(
    "teiaViewPanel"
  );

if (
  treeModeButton &&
  teiaModeButton &&
  treeViewPanel &&
  teiaViewPanel
) {

  treeModeButton.addEventListener(
    "click",
    () => {

      treeViewPanel.hidden =
        false;

      teiaViewPanel.hidden =
        true;

      treeModeButton.classList.add(
        "active"
      );

      teiaModeButton.classList.remove(
        "active"
      );
    }
  );

  teiaModeButton.addEventListener(
    "click",
    () => {

      treeViewPanel.hidden =
        true;

      teiaViewPanel.hidden =
        false;

      teiaModeButton.classList.add(
        "active"
      );

      treeModeButton.classList.remove(
        "active"
      );
    }
  );
}

  renderTree(
    campaign,
    root
  );
}


/* =========================================================
   ÁRVORE
   ========================================================= */

function renderTree(
  campaign,
  node,
  container = null
) {
  const treeContainer =
    container ||
    document.getElementById(
      "treePanel"
    );

  if (!treeContainer) {
    return;
  }

  if (!container) {
    treeContainer.innerHTML = "";
  }

  const branch =
    document.createElement(
      "div"
    );

  branch.className =
    "tree-branch";

  const nodeButton =
    document.createElement(
      "button"
    );

  nodeButton.className =
    "tree-node";

  nodeButton.dataset.nodeId =
    node.id;

  nodeButton.innerHTML = `
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

  nodeButton.addEventListener(
    "click",
    () => {
      openNode(
        campaign,
        node
      );
    }
  );

  branch.appendChild(
    nodeButton
  );

  const children =
    node.children || [];

  if (children.length) {
    const childrenContainer =
      document.createElement(
        "div"
      );

    childrenContainer.className =
      "tree-children";

    children.forEach(
      (childId) => {
        const child =
          getNode(
            campaign,
            childId
          );

        if (child) {
          renderTree(
            campaign,
            child,
            childrenContainer
          );
        }
      }
    );

    branch.appendChild(
      childrenContainer
    );
  }

  treeContainer.appendChild(
    branch
  );
}

/* =========================================================
   ABRIR NODE
   ========================================================= */

function openNode(
  campaign,
  node
) {
  const nodePanel =
    document.getElementById(
      "nodePanel"
    );

  if (!nodePanel) {
    return;
  }

  const breadcrumb =
    renderBreadcrumb(
      campaign,
      node
    );

  const relations =
    node.relations || [];

  const relationHtml =
    relations.length
      ? relations
          .map(
            (relation, index) => {
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

                <button
                  class="relation-card"
                  data-node-id="${target.id}"
                >
                  <span class="relation-type">
                    ${escapeHtml(
                      relation.type ||
                        "relacionado"
                    )}
                  </span>

                  <span class="relation-name">
                    ${escapeHtml(
                      target.name
                    )}
                  </span>
                  </button>

                  <button
                    class="remove-relation-button"
                    data-relation-index="${index}"
                  >
                    🗑️
                 </button>

               </div>
             `;
            }
          )
          .join("")
      : `
          <div class="empty-relations">
            Nenhuma relação registrada.
          </div>
        `;

  nodePanel.innerHTML = `
    <article class="node-detail">

      ${breadcrumb}

      <header class="node-detail-header">

        <div class="node-title-area">

          <span class="node-detail-icon">
            ${getNodeIcon(
              node.type
            )}
          </span>

          <div>
            <p class="eyebrow">
              ${escapeHtml(
                node.type ||
                  "NODE"
              )}
            </p>

            <h2>
              ${escapeHtml(
                node.name
              )}
            </h2>
          </div>

        </div>

        <div class="node-actions">

          <button
            class="create-node-button"
            id="createNode"
          >
            ＋ CRIAR NODE
          </button>

          <button
            class="edit-node-button"
            id="editNode"
          >
            ✎ EDITAR NODE
          </button>

          <button
            class="delete-node-button"
            id="deleteNode"
          >
            🗑 EXCLUIR NODE
           </button>

        </div>

      </header>

      <section class="node-content">

        <div class="content-section">

          <p class="section-label">
            CONTEÚDO
          </p>

          <div class="node-text">
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

        </div>

        <div class="content-section">

          <p class="section-label">
            RELAÇÕES
          </p>

          <button
            class="create-relation-button"
            id="createRelation"
          >
            ＋ CRIAR RELAÇÃO
          </button>

          <div class="relations-list">
            ${relationHtml}
          </div>

        </div>

      </section>

    </article>
  `;

  document
    .querySelectorAll(
      ".breadcrumb-item"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const targetNode =
              getNode(
                campaign,
                button.dataset
                  .nodeId
              );

            if (targetNode) {
              openNode(
                campaign,
                targetNode
              );
            }
          }
        );
      }
    );

  document
    .querySelectorAll(
      ".relation-card"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const targetNode =
              getNode(
                campaign,
                button.dataset
                  .nodeId
              );

            if (targetNode) {
              openNode(
                campaign,
                targetNode
              );
            }
          }
        );
      }
    );

  document
  .querySelectorAll(
    ".remove-relation-button"
  )
  .forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {

          const relationIndex =
            Number(
              button.dataset
                .relationIndex
            );

          if (
            Number.isNaN(
              relationIndex
            )
          ) {
            return;
          }

          if (
            !Array.isArray(
              node.relations
            )
          ) {
            return;
          }

          const confirmed =
            confirm(
              `Deseja remover esta relação de "${node.name}"?`
            );

          if (!confirmed) {
            return;
          }

          node.relations.splice(
            relationIndex,
            1
          );

          saveData();

          openNode(
            campaign,
            node
          );
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

  const createRelationButton =
  document.getElementById(
    "createRelation"
  );

if (createRelationButton) {
  createRelationButton.addEventListener(
    "click",
    () => {
      openRelationEditor(
        campaign,
        node
      );
    }
  );
}

  const deleteButton =
  document.getElementById(
    "deleteNode"
  );

  if (deleteButton) {
  deleteButton.addEventListener(
    "click",
    () => {

      if (
        node.deletionPolicy ===
        "protected"
      ) {
        alert(
          "Este Node faz parte da estrutura protegida do Palantir e não pode ser excluído."
        );

        return;
      }

      const dependencies =
  getNodeDependencies(
    campaign,
    node
  );

if (dependencies.length > 0) {
  const dependencyNames =
    dependencies
      .map(
        (dependency) =>
          `• ${dependency.name}`
      )
      .join("\n");

  alert(
    `Este Node possui dependências:\n\n${dependencyNames}\n\nA exclusão será bloqueada por enquanto.`
  );

  return;
}

const confirmed =
  confirm(
    `Deseja realmente excluir o Node "${node.name}"?`
  );

if (!confirmed) {
  return;
}

removeNode(
  campaign,
  node
);
    }
  );
}

  document
    .querySelectorAll(
      ".tree-node"
    )
    .forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset
            .nodeId ===
            node.id
        );
      }
    );
}


/* =========================================================
   EDITOR DE NODE
   ========================================================= */

function openNodeEditor(
  campaign,
  node
) {
  const isRoot =
    !node.parentId;

  const possibleParents =
    getPossibleParents(
      campaign,
      node
    );

  const overlay =
    document.createElement(
      "div"
    );

  overlay.className =
    "modal-overlay";

  overlay.innerHTML = `
    <div class="node-editor-modal">

      <div class="modal-header">

        <div>
          <p class="eyebrow">
            EDITOR
          </p>

          <h2>
            Editar Node
          </h2>
        </div>

        <button
          class="modal-close"
          id="cancelNodeEdit"
        >
          ×
        </button>

      </div>

      <div class="editor-fields">

        <label>
          <span>
            Nome
          </span>

          <input
            id="editNodeName"
            type="text"
            value="${escapeHtml(
              node.name
            )}"
          >
        </label>

        <label>
          <span>
            Tipo
          </span>

          <input
            id="editNodeType"
            type="text"
            value="${escapeHtml(
              node.type ||
                "node"
            )}"
          >
        </label>

        <label>
          <span>
            Localização
          </span>

          <select
            id="editNodeParent"
            ${isRoot ? "disabled" : ""}
          >

            ${
              isRoot
                ? `
                    <option value="">
                      RAIZ DA CAMPANHA
                    </option>
                  `
                : possibleParents
                    .map(
                      (
                        parent
                      ) => `
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
                    .join("")
            }

          </select>

        </label>

        <label>
          <span>
            Conteúdo
          </span>

          <textarea
            id="editNodeContent"
            rows="12"
          >${escapeHtml(
            node.content ||
              ""
          )}</textarea>
        </label>

      </div>

      <div class="modal-actions">

        <button
          class="modal-cancel"
          id="cancelNodeEditBottom"
        >
          CANCELAR
        </button>

        <button
          class="modal-save"
          id="saveNodeEdit"
        >
          SALVAR
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  const cancelButtons = [
    document.getElementById(
      "cancelNodeEdit"
    ),
    document.getElementById(
      "cancelNodeEditBottom"
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
      "saveNodeEdit"
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
          oldParentId !==
            newParentId
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
        event.target ===
        overlay
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
      currentNode.children ||
      [];

    children.forEach(
      (childId) => {
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

  return campaign.nodes.filter(
    (candidate) => {
      if (
        candidate.id ===
        node.id
      ) {
        return false;
      }

      if (
        descendants.has(
          candidate.id
        )
      ) {
        return false;
      }

      return true;
    }
  );
              }

/* =========================================================
   CRIAR NODE
   ========================================================= */

function openCreateNodeEditor(
  campaign,
  currentParent
) {
  const allNodes =
    getAllNodesSorted(
      campaign
    );

  const overlay =
    document.createElement(
      "div"
    );

  overlay.className =
    "modal-overlay";

  overlay.innerHTML = `
    <div class="node-editor-modal">

      <div class="modal-header">

        <div>
          <p class="eyebrow">
            NOVO NODE
          </p>

          <h2>
            Criar Node
          </h2>
        </div>

        <button
          class="modal-close"
          id="cancelCreateNode"
        >
          ×
        </button>

      </div>

      <div class="editor-fields">

        <label>
          <span>
            Nome
          </span>

          <input
            id="createNodeName"
            type="text"
            placeholder="Nome do Node"
          >
        </label>

        <label>
          <span>
            Tipo
          </span>

          <input
            id="createNodeType"
            type="text"
            placeholder="node"
          >
        </label>

        <label>
          <span>
            Localização
          </span>

          <select
            id="createNodeParent"
          >

            ${allNodes
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

        </label>

        <label>
          <span>
            Conteúdo
          </span>

          <textarea
            id="createNodeContent"
            rows="12"
            placeholder="Conteúdo do Node..."
          ></textarea>
        </label>

      </div>

      <div class="modal-actions">

        <button
          class="modal-cancel"
          id="cancelCreateNodeBottom"
        >
          CANCELAR
        </button>

        <button
          class="modal-save"
          id="saveCreateNode"
        >
          CRIAR
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  const cancelButtons = [
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

        if (!parentId) {
          alert(
            "O Node precisa ter um local."
          );

          return;
        }

        const newNode = {
          id:
            generateNodeId(),
          name:
            name,
          type:
            type || "node",
          content:
            content,
          parentId:
            parentId,
          children: [],
          relations: []
        };

        campaign.nodes.push(
          newNode
        );

        const parent =
          getNode(
            campaign,
            parentId
          );

        if (parent) {

          if (
            !Array.isArray(
              parent.children
            )
          ) {
            parent.children =
              [];
          }

          parent.children.push(
            newNode.id
          );
        }

        saveData();

        overlay.remove();

        openNode(
          campaign,
          newNode
        );

        renderTree(
          campaign,
          campaign.nodes.find(
            (node) =>
              node.id ===
              campaign.rootNodeId
          )
        );
      }
    );

  overlay.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        overlay
      ) {
        overlay.remove();
      }

    }
  );
}

function openRelationEditor(
  campaign,
  node
) {
  const allNodes =
    getAllNodesSorted(
      campaign
    ).filter(
      (targetNode) =>
        targetNode.id !== node.id
    );

  const overlay =
    document.createElement(
      "div"
    );

  overlay.className =
    "modal-overlay";

  overlay.innerHTML = `
    <div class="node-editor-modal">

      <div class="modal-header">

        <div>
          <p class="eyebrow">
            NOVA RELAÇÃO
          </p>

          <h2>
            Criar Relação
          </h2>
        </div>

        <button
          class="modal-close"
          id="cancelCreateRelation"
        >
          ×
        </button>

      </div>

      <div class="editor-fields">

        <label>
          <span>
            Node de destino
          </span>

          <select
            id="relationTarget"
          >

            <option value="">
              Selecione um Node
            </option>

            ${allNodes
              .map(
                (targetNode) => `
                  <option
                    value="${targetNode.id}"
                  >
                    ${escapeHtml(
                      targetNode.name
                    )}
                  </option>
                `
              )
              .join("")}

          </select>

        </label>

        <label>
          <span>
            Tipo da relação
          </span>

          <input
            type="text"
            id="relationType"
            value="relacionado-a"
            placeholder="Ex.: relacionado-a"
          >

        </label>

        <label>
          <span>
            Gera dependência?
          </span>

          <select
            id="relationDependency"
          >
            <option value="true">
              Sim
            </option>

            <option value="false">
              Não
            </option>
          </select>
        </label>

      </div>

      <div class="modal-actions">

        <button
          class="modal-cancel"
          id="cancelCreateRelationBottom"
        >
          CANCELAR
        </button>

        <button
          class="modal-save"
          id="saveRelation"
        >
          SALVAR RELAÇÃO
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  const cancelButtons = [
    document.getElementById(
      "cancelCreateRelation"
    ),
    document.getElementById(
      "cancelCreateRelationBottom"
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
      "saveRelation"
    )
    .addEventListener(
      "click",
      () => {

        const targetId =
          document
            .getElementById(
              "relationTarget"
            )
            .value;

        const relationType =
          document
            .getElementById(
              "relationType"
            )
            .value
            .trim();

        const relationDependency =
          document
            .getElementById(
              "relationDependency"
            )
            .value ===
            "true";

        if (!targetId) {
          alert(
            "Selecione um Node de destino."
          );

          return;
        }

        if (!relationType) {
          alert(
            "Informe o tipo da relação."
          );

          return;
        }

        const targetNode =
          getNode(
            campaign,
            targetId
          );

        if (!targetNode) {
          alert(
            "O Node de destino não foi encontrado."
          );

          return;
        }

        if (
          !Array.isArray(
            node.relations
          )
        ) {
          node.relations = [];
        }

        node.relations.push({
          targetId:
            targetNode.id,
          type:
            relationType,
          dependency:
            relationDependency
        });

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
        event.target ===
        overlay
      ) {
        overlay.remove();
      }

    }
  );
}


/* =========================================================
   ORDENAR NODES
   ========================================================= */

function getAllNodesSorted(
  campaign
) {
  return [
    ...campaign.nodes
  ].sort(
    (a, b) =>
      a.name.localeCompare(
        b.name,
        "pt-BR"
      )
  );
}


/* =========================================================
   GERAR ID
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
      (pathNode) =>
        pathNode.name
    )
    .join(" › ");
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
    oldParentId
      ? getNode(
          campaign,
          oldParentId
        )
      : null;

  const newParent =
    newParentId
      ? getNode(
          campaign,
          newParentId
        )
      : null;

  if (
    newParentId &&
    !newParent
  ) {
    return;
  }

  if (oldParent) {

    if (
      !Array.isArray(
        oldParent.children
      )
    ) {
      oldParent.children =
        [];
    }

    oldParent.children =
      oldParent.children.filter(
        (childId) =>
          childId !==
          node.id
      );
  }

  if (newParent) {

    if (
      !Array.isArray(
        newParent.children
      )
    ) {
      newParent.children =
        [];
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
  }

  node.parentId =
    newParentId;

  saveData();
}

function removeNode(
  campaign,
  node
) {
    if (
    node.deletionPolicy ===
    "protected"
  ) {
    alert(
      "Este Node faz parte da estrutura protegida do Palantir e não pode ser excluído."
    );

    return;
  }
  if (
    node.id ===
    campaign.rootNodeId
  ) {
    alert(
      "O Node raiz não pode ser excluído."
    );

    return;
  }

  const parent =
    node.parentId
      ? getNode(
          campaign,
          node.parentId
        )
      : null;

  if (parent) {
    if (
      !Array.isArray(
        parent.children
      )
    ) {
      parent.children =
        [];
    }

    parent.children =
      parent.children.filter(
        (childId) =>
          childId !==
          node.id
      );
  }

  const deletedNodeIds =
  getDeletedNodeIds();

  if (
  !deletedNodeIds.includes(
    node.id
  )
) {
  deletedNodeIds.push(
    node.id
  );
}

saveDeletedNodeIds(
  deletedNodeIds
);

  campaign.nodes =
    campaign.nodes.filter(
      (currentNode) =>
        currentNode.id !==
        node.id
    );

  saveData();

  if (parent) {
    openNode(
      campaign,
      parent
    );

    renderTree(
      campaign,
      campaign.nodes.find(
        (currentNode) =>
          currentNode.id ===
          campaign.rootNodeId
      )
    );
  }
}


/* =========================================================
   ÍCONES
   ========================================================= */

function getNodeIcon(
  type
) {
  const icons = {
    "campaign-root": "◈",
    campaign: "◈",
    faction: "⬢",
    organization: "⬢",
    player: "♙",
    npc: "♟",
    leadership: "♛",
    sheet: "▣",
    biography: "▤",
    event: "✦",
    threat: "☠",
    location: "⌖",
    mission: "⚑",
    weapon: "⚔",
    item: "◇",
    character: "♙",
    node: "◆"
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

function renderSearchResults(results, query) {
  console.log("RENDERIZANDO BUSCA:", query, results);

  let resultsContainer = document.getElementById(
    "searchResults"
  );

  if (!resultsContainer) {
    resultsContainer = document.createElement("div");

    resultsContainer.id = "searchResults";
    resultsContainer.className = "search-results";

    const searchBox = document.querySelector(
      ".topbar-search"
    );

    if (searchBox) {
      searchBox.appendChild(resultsContainer);
    }
  }

  if (!query.trim()) {
    resultsContainer.innerHTML = "";
    resultsContainer.style.display = "none";
    return;
  }

  if (results.length === 0) {
    resultsContainer.innerHTML = `
      <div class="search-empty">
        Nenhum Node encontrado.
      </div>
    `;

    resultsContainer.style.display = "block";
    return;
  }

  resultsContainer.innerHTML = results
    .map(({ campaign, node }) => {
      return `
        <button
          class="search-result"
          data-campaign-id="${escapeHtml(campaign.id)}"
          data-node-id="${escapeHtml(node.id)}"
        >
          <span class="search-result-name">
            ${escapeHtml(node.name)}
          </span>

          <span class="search-result-type">
            ${escapeHtml(node.type || "node")}
          </span>
        </button>
      `;
    })
    .join("");

  resultsContainer.style.display = "block";
  const searchResultButtons = resultsContainer.querySelectorAll(
  ".search-result"
);

searchResultButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const campaignId = button.dataset.campaignId;
    const nodeId = button.dataset.nodeId;

    const campaign = data.campaigns.find(
      (item) => item.id === campaignId
    );

    if (!campaign) {
      return;
    }

    const node = campaign.nodes.find(
      (item) => item.id === nodeId
    );

    if (!node) {
      return;
    }

    openNode(campaign, node);

    resultsContainer.style.display = "none";
  });
});
}
