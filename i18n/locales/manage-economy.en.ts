export default {
  manage: {
    sections: {
      economy: {
        label: "Economy",
        description: "Manage Goin reference value, issuance rewards, and spend policies.",
      },
    },
    economy: {
      loading: "Loading economy settings…",
      loadError: "Economy settings could not be loaded.",
      saveError: "Economy settings could not be saved.",
      saved: "Economy settings saved.",
      unchanged: "No economy settings changed.",
      lastUpdated: "Last updated {date}",
      neverUpdated: "Using seeded economy policy",
      simulationNotice: "Goin is an internal simulation unit. The toman value below is reference metadata only, not a purchase, cash-out, or redemption promise.",
      historyNotice: "Policy changes apply to future issuance and future first unlocks. Existing ledger events and historical unlock prices are never repriced.",
      summary: {
        referenceValue: {
          label: "Reference value",
          helper: "Simulation toman per Goin",
        },
        issuanceRule: {
          label: "Issuance rule",
          helper: "Current reward policy version",
        },
        sinkRule: {
          label: "Sink rule",
          helper: "Current spend policy version",
        },
        promptUnlock: {
          label: "Prompt unlock",
          helper: "First meaningful copy",
        },
      },
      sections: {
        reference: {
          title: "Unit reference",
          description: "Adjust the simulation reference value used when comparing Goin to toman. This does not create fiat convertibility.",
        },
        issuance: {
          title: "Goin issuance",
          description: "Set how much Goin future XP/reward events issue. Changing any value increments the issuance rule version.",
        },
        sinks: {
          title: "Goin spending",
          description: "Set the current first-unlock cost for spendable actions. Changing a sink increments the sink rule version.",
        },
      },
      fields: {
        referenceValueToman: {
          label: "Reference value (toman per Goin)",
          helper: "Positive whole number. Current simulation default is 250 toman.",
        },
        accountCreated: {
          label: "Account created",
          helper: "Goin issued when the account-created reward event is recorded.",
        },
        profileEmailAdded: {
          label: "Email added",
          helper: "Goin issued when the profile-email reward event is recorded.",
        },
        referralJoined: {
          label: "Referred user joined",
          helper: "Goin issued to the user who joined through a referral.",
        },
        referralReward: {
          label: "Referrer reward",
          helper: "Goin issued to the referrer for a successful referral.",
        },
        draftCreated: {
          label: "Draft created",
          helper: "V1 is intentionally zero to avoid trivial farming loops.",
        },
        promptArchiveUnlock: {
          label: "Prompt Archive first unlock",
          helper: "Charged once per user and Prompt. Repeat copies remain free after durable unlock.",
        },
      },
      validation: {
        reference: "Reference value must be a positive whole number.",
        nonNegative: "Goin amounts must be whole numbers greater than or equal to zero.",
      },
      actions: {
        save: "Save economy policy",
        saving: "Saving economy policy…",
        reload: "Reload settings",
      },
      units: {
        goin: "goin",
        toman: "toman",
        ruleVersion: "Rule v{version}",
      },
    },
  },
};
