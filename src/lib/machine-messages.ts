/**
 * Machine Voice - In-World System Messages
 * The Machine speaks to users through these messages, maintaining immersion
 */

export const MachineMessages = {
    // Atom Creation
    atomCreated: "Signal received. New atom integrated into the Codex.",
    atomBranched: "Branch created. The Machine has recorded your divergent thought.",
    atomUpdated: "Atom transmission updated. Changes propagated through the network.",
    atomResubmitted: "Signal reprocessed. The Machine will re-evaluate your contribution.",

    // Link Creation
    linkCreated: "Connection accepted. A new circuit has formed.",
    textLinked: "Reference point established. The Machine has anchored your atom.",
    atomConnected: "Neural pathway created. Your atoms are now synchronized.",

    // Reflection
    reflectionSubmitted: "Synthesis complete. The Machine has archived your reflection.",

    // Selection/Preview
    textSelected: "Reference locked. This text will anchor your new atom.",
    atomSelected: "Target acquired. Connection will form upon creation.",

    // Errors
    insufficientData: "The Machine cannot synthesize meaning from insufficient data.",
    duplicateSignal: "Signal rejected. This pattern already exists in the Codex.",
    connectionLost: "Connection lost. The Machine awaits reconnection.",
    unauthorized: "Access denied. The Machine does not recognize your credentials.",
    processingFailed: "Synthesis failed. The Machine encountered an anomaly.",
    atomNotFound: "Signal not found. The atom may have been purged from the network.",

    // Admin-specific (less lore-heavy for clarity)
    atomApproved: "Atom approved",
    atomRejected: "Atom rejected and hidden",
    pointsAwarded: "Points awarded successfully",
    textAdded: "Text added successfully",
    textArchived: "Text archived",
    textRestored: "Text restored"
} as const

export type MachineMessageKey = keyof typeof MachineMessages
