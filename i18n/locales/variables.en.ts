export default {
  catalog: {
    categories: {
      profiles: "Entity Profiles",
      content: "Content Recipes",
      utilities: "Utilities",
    },
    blueprints: {
      personProfile: {
        label: "Person Profile",
        description:
          "Create one or more person profiles with a primary semantic handle and optional reusable metadata.",
        groups: {
          person: {
            label: "Person",
            description:
              "Edit one person template, then create as many indexed profiles as needed.",
            slots: {
              entity: { description: "Person #" },
              name: { description: "Person # name or reusable label" },
              reference: { description: "Person # auxiliary reference image" },
            },
          },
        },
      },
      animalProfile: {
        label: "Animal Profile",
        description:
          "Create one or more animal profiles with a primary semantic handle and optional reusable metadata.",
        groups: {
          animal: {
            label: "Animal",
            description:
              "Edit one animal template, then create as many indexed profiles as needed.",
            slots: {
              entity: { description: "Animal #" },
              name: { description: "Animal # name or reusable label" },
              reference: { description: "Animal # auxiliary reference image" },
            },
          },
        },
      },
      buildingProfile: {
        label: "Building Profile",
        description:
          "Create one or more building profiles with a primary semantic handle and optional reusable metadata.",
        groups: {
          building: {
            label: "Building",
            description:
              "Edit one building template, then create as many indexed profiles as needed.",
            slots: {
              entity: { description: "Building #" },
              name: { description: "Building # name or reusable label" },
              reference: { description: "Building # auxiliary reference image" },
            },
          },
        },
      },
      productProfile: {
        label: "Product Profile",
        description:
          "Create one or more product profiles with a primary semantic handle and optional reusable metadata.",
        groups: {
          product: {
            label: "Product",
            description:
              "Edit one product template, then create as many indexed profiles as needed.",
            slots: {
              entity: { description: "Product #" },
              name: { description: "Product # name or reusable label" },
              reference: { description: "Product # auxiliary reference image" },
            },
          },
        },
      },
      vehicleProfile: {
        label: "Vehicle Profile",
        description:
          "Create one or more vehicle profiles with a primary semantic handle and optional reusable metadata.",
        groups: {
          vehicle: {
            label: "Vehicle",
            description:
              "Edit one vehicle template, then create as many indexed profiles as needed.",
            slots: {
              entity: { description: "Vehicle #" },
              name: { description: "Vehicle # name or reusable label" },
              reference: { description: "Vehicle # auxiliary reference image" },
            },
          },
        },
      },
      multiSubject: {
        label: "Subject Set",
        description:
          "Create a lightweight configurable set of independently targetable subject variables.",
        groups: {
          subjects: {
            label: "Subject",
            description:
              "Edit one subject template and expand it into indexed subject variables.",
            slots: {
              subject: { description: "Subject #" },
            },
          },
        },
      },
      customVariableSet: {
        label: "Custom Variable Set",
        description:
          "Build an open-ended set of variables with editable keys, values and semantic types.",
      },
      posterContent: {
        label: "Poster Content",
        description:
          "Create reusable content handles for a typical promotional or artistic poster.",
        slots: {
          brandName: { description: "Brand or organizer name" },
          headline: { description: "Main headline" },
          subheadline: { description: "Supporting headline" },
          product: { description: "Main promoted product or object" },
          price: { description: "Price text" },
          discount: { description: "Discount or offer text" },
          callToAction: { description: "Call to action" },
          primaryColor: { description: "Primary reusable color" },
          secondaryColor: { description: "Secondary reusable color" },
        },
      },
      businessCard: {
        label: "Business Card",
        description:
          "Create common identity and contact variables for business-card typography.",
        slots: {
          personName: { description: "Displayed person name" },
          jobTitle: { description: "Job title or role" },
          companyName: { description: "Company or studio name" },
          phone: { description: "Phone number" },
          email: { description: "Email address" },
          website: { description: "Website" },
          address: { description: "Address" },
          brandColor: { description: "Primary brand color" },
          brandFont: { description: "Brand font or lettering reference" },
        },
      },
      garmentPrint: {
        label: "Garment Print",
        description:
          "Create a semantic reference handle and optional print instructions for artwork applied to a garment.",
        slots: {
          printArtwork: { description: "Artwork source to reproduce on the garment" },
          printPlacement: { description: "Print placement" },
          printMethod: { description: "Printing method and physical integration" },
          printScale: { description: "Relative print size" },
        },
      },
    },
  },
  ui: {
    types: {
      text: "Text",
      subject: "Subject",
      reference: "Reference",
      object: "Object",
      color: "Color",
      font: "Font",
      custom: "Custom",
    },
    blueprints: {
      placeholder: "Blueprints",
      configureSubtitle: "Configure the variables before adding them to the prompt graph.",
      createVariables: "Create variables",
      variables: "Variables",
      variable: "Variable",
      customVariable: "Custom variable",
      template: "template",
      profiles: "profiles",
      remove: "Remove",
      key: "Key",
      keyPattern: "Key pattern",
      type: "Type",
      initialValue: "Initial value",
      initialValuePattern: "Initial value pattern",
      validation: {
        invalidKey: "Invalid variable key",
        reservedKey: "Reserved variable key",
        exists: "Variable key already exists",
        duplicateKey: "Duplicate variable key",
        exactlyOneHash: "Key must contain exactly one # when creating multiple profiles",
        maxOneHash: "Key can contain at most one #",
        valueMaxOneHash: "Initial value can contain at most one #",
        invalidPattern: "Invalid variable key pattern",
        reservedPattern: "Reserved variable key pattern",
        duplicatePattern: "Duplicate variable key pattern",
      },
    },
  },
}
