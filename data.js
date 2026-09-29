// PALANTIR GM // 0.2
// Modelo de dados inicial do Palantir

const PALANTIR_DATA = {
  version: "0.2",

  campaigns: [
    {
      id: "campaign-the-red-veil",

      name: "The Red Veil",

      description:
        "Campanha de teste do modelo de Nodes e conexoes do Palantir.",

      rootNodeId: "node-red-veil",

      nodes: [
        {
          id: "node-red-veil",
          name: "The Red Veil",
          type: "campaign-root",
          parentId: null,

          content: "Universo da campanha.",

          children: [
            "node-factions",
            "node-events",
            "node-threats"
          ],

          relations: []
        },

        {
          id: "node-factions",
          name: "Facções",
          type: "folder",
          parentId: "node-red-veil",

          content: "Organizações e grupos da campanha.",

          children: [
            "node-bsaa",
            "node-ordo-realitas"
          ],

          relations: []
        },

        {
          id: "node-bsaa",
          name: "BSAA",
          type: "faction",
          parentId: "node-factions",

          content:
            "Organização ligada ao combate contra o paranormal.",

          children: [
            "node-bsaa-players",
            "node-bsaa-npcs",
            "node-bsaa-leadership"
          ],

          relations: []
        },

        {
          id: "node-bsaa-players",
          name: "Players",
          type: "folder",
          parentId: "node-bsaa",

          content:
            "Personagens dos jogadores ligados à BSAA.",

          children: [
            "node-bsaa-sheets",
            "node-bsaa-biographies"
          ],

          relations: []
        },

        {
          id: "node-bsaa-sheets",
          name: "Fichas",
          type: "folder",
          parentId: "node-bsaa-players",

          content:
            "Fichas dos personagens dos jogadores.",

          children: [
            "node-fantasma-sheet"
          ],

          relations: []
        },

        {
          id: "node-bsaa-biographies",
          name: "Biografias",
          type: "folder",
          parentId: "node-bsaa-players",

          content:
            "Biografias dos personagens dos jogadores.",

          children: [
            "node-fantasma-biography"
          ],

          relations: []
        },

        {
          id: "node-fantasma-sheet",
          name: "O Fantasma",
          type: "character-sheet",
          parentId: "node-bsaa-sheets",

          content:
            "Ficha de O Fantasma.",

          children: [],

          relations: [
            {
              targetId: "node-fantasma-biography",
              type: "possui-biografia"
            },

            {
              targetId: "node-bsaa",
              type: "pertence-a"
            }
          ]
        },

        {
          id: "node-fantasma-biography",
          name: "Biografia de O Fantasma",
          type: "biography",
          parentId: "node-bsaa-biographies",

          content:
            "História e passado de O Fantasma.",

          children: [],

          relations: [
            {
              targetId: "node-fantasma-sheet",
              type: "possui-ficha"
            },

            {
              targetId: "node-ordo-realitas",
              type: "relacionado-a"
            },

            {
              targetId: "node-hexatombe",
              type: "relacionado-a"
            },

            {
              targetId: "node-aniquilacao",
              type: "relacionado-a"
            }
          ]
        },

        {
          id: "node-bsaa-npcs",
          name: "NPCs",
          type: "folder",
          parentId: "node-bsaa",

          content:
            "NPCs ligados à BSAA.",

          children: [],

          relations: []
        },

        {
          id: "node-bsaa-leadership",
          name: "Liderança",
          type: "folder",
          parentId: "node-bsaa",

          content:
            "Liderança da BSAA.",

          children: [],

          relations: []
        },

        {
          id: "node-ordo-realitas",
          name: "Ordo Realitas",
          type: "faction",
          parentId: "node-factions",

          content:
            "Organização relacionada à história de O Fantasma.",

          children: [],

          relations: []
        },

        {
          id: "node-events",
          name: "Eventos",
          type: "folder",
          parentId: "node-red-veil",

          content:
            "Eventos importantes da campanha.",

          children: [
            "node-hexatombe"
          ],

          relations: []
        },

        {
          id: "node-hexatombe",
          name: "Hexatombe",
          type: "event",
          parentId: "node-events",

          content:
            "Evento relacionado à história de O Fantasma.",

          children: [],

          relations: []
        },

        {
          id: "node-threats",
          name: "Ameaças",
          type: "folder",
          parentId: "node-red-veil",

          content:
            "Ameaças conhecidas da campanha.",

          children: [
            "node-aniquilacao"
          ],

          relations: []
        },

        {
          id: "node-aniquilacao",
          name: "Aniquilação",
          type: "threat",
          parentId: "node-threats",

          content:
            "Ameaça relacionada à história de O Fantasma.",

          children: [],

          relations: []
        }
      ]
    }
  ]
};

// Disponibiliza os dados para o restante do Palantir
window.PALANTIR_DATA = PALANTIR_DATA;
