export default {
  modules: {
    hair: {
      ui: {
        designer: {
          title: "Hairstyle Designer",
          description:
            "Build one or more subject-scoped hairstyles, then assign color and material externally when needed.",
        },
        override: {
          title: "Custom Override",
          description:
            "Replace the structured Hairstyle Designer output with your own instruction.",
          placeholder: "Describe the complete hairstyle instruction...",
        },
        styles: {
          actions: {
            duplicate: "Duplicate hairstyle",
            remove: "Remove hairstyle",
            add: "Add Hairstyle",
          },
          fields: {
            name: {
              label: "Hairstyle name",
              placeholder: "Hairstyle name",
            },
            key: {
              label: "Semantic key",
              hint: "lowerCamelCase · auto-unique",
            },
            preset: {
              label: "Starter preset",
              placeholder: "No preset",
            },
            targets: {
              label: "Whose hair is this?",
              placeholder: "Select subject targets",
            },
            source: {
              label: "Baseline source",
            },
            referenceHint: {
              label: "Reference hair hint",
              placeholder: "e.g. the hairstyle of the person on the left",
            },
            additionalDetails: {
              label: "Additional hairstyle details",
              placeholder: "Optional structural or styling instructions...",
            },
          },
          sections: {
            base: {
              title: "Base Hair Structure",
              description:
                "Color and material are intentionally assigned from their own modules.",
            },
            components: {
              title: "Add hairstyle components",
              description:
                "Add bangs, braids, buns, ponytails, hair accessories, or custom elements.",
              addSelected: "Add selected",
              placeholder: "Select hairstyle components...",
              empty:
                "No extra hairstyle components. Base hair structure can stand on its own.",
            },
          },
          footer: {
            description:
              "Create separate hairstyles for different subjects or alternate looks.",
          },
        },
        component: {
          actions: {
            duplicate: "Duplicate component",
            remove: "Remove component",
          },
          fields: {
            name: {
              label: "Component name",
              placeholder: "Display name",
            },
            key: {
              label: "Semantic key",
              hint: "Unique inside this hairstyle",
            },
            type: {
              label: "Component type",
            },
            customType: {
              label: "Custom component",
              placeholder: "Describe the hair component...",
            },
            additionalDetails: {
              label: "Additional component details",
              placeholder: "Optional structural or styling details...",
            },
          },
        },
      },
    },
    outfit: {
      ui: {
        designer: {
          title: "Outfit Designer",
          description:
            "Build one or more wearable sets, assign each set to subjects, then configure every item independently.",
        },
        override: {
          title: "Custom Override",
          description:
            "Replace the structured Outfit Designer output with your own instruction.",
          placeholder: "Describe the complete outfit instruction...",
        },
        sets: {
          actions: {
            duplicate: "Duplicate set",
            remove: "Remove set",
            add: "Add Outfit Set",
          },
          fields: {
            name: {
              label: "Set name",
              placeholder: "Outfit set name",
            },
            key: {
              label: "Semantic key",
              hint: "lowerCamelCase · auto-unique",
            },
            preset: {
              label: "Starter preset",
              placeholder: "No preset",
            },
            targets: {
              label: "Who wears this set?",
              placeholder: "Select subject targets",
            },
            additionalDetails: {
              label: "Additional set details",
              placeholder: "Optional instructions for the whole outfit set...",
            },
          },
          sections: {
            items: {
              title: "Add wearable items",
              description:
                "Choose canonical items, prepared starters, or a custom wearable.",
              addSelected: "Add selected",
              placeholder: "Select clothes and wearable items...",
              empty: "This set has no wearable items yet.",
            },
          },
          footer: {
            description:
              "Create separate outfit sets for different subjects or alternate looks.",
          },
        },
        item: {
          actions: {
            duplicate: "Duplicate item",
            remove: "Remove item",
          },
          fields: {
            name: {
              label: "Item name",
              placeholder: "Display name",
            },
            key: {
              label: "Semantic key",
              hint: "Unique inside this set",
            },
            type: {
              label: "Wearable type",
            },
            customType: {
              label: "Custom wearable",
              placeholder: "Describe the wearable item...",
            },
            propertyFamily: {
              label: "Property family",
            },
            source: {
              label: "Baseline source",
            },
            referenceHint: {
              label: "Reference item hint",
              placeholder: "e.g. the blouse worn by the person on the left",
            },
            additionalDetails: {
              label: "Additional item details",
              placeholder: "Optional construction or wearing details...",
            },
          },
        },
      },
    },
  },
};
