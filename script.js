const app = document.querySelector(".app");
const campaignView = document.getElementById("campaignView");

const data = window.PALANTIR_DATA;

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

/*
  Retorna o caminho hierárquico do Node.

  Exemplo:

  The Red Veil
  → Facções
  → BSAA
  → Players
  → Fichas
  → O Fantasma
*/
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

/*
  Cria o breadcrumb visual do Node.

  Importante:
  o breadcrumb representa a localização na ÁRVORE,
  não o caminho usado para chegar até o Node.
*/
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

  /*
    Breadcrumb
  */

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

  /*
    Voltar para a árvore
  */

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

  /*
    Links internos e relações
  */

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
    icons[type] || "•"
  );
}

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
