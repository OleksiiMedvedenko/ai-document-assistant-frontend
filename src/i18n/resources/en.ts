export const en = {
  brand: {
    workspace: "AI Workspace",
    name: "Document Assistant",
    subtitle: "Analyze, compare, extract and chat with documents in one place.",
  },
  nav: {
    home: "Home",
    documents: "Documents",
    compare: "Compare",
    chat: "AI Chat",
    account: "Account",
    adminUsers: "Admin users",
    documentStructure: "Document structure",
    pendingDecisions: "{{count}} decisions need review",
    smartWorkspace: "Smart workspace",
  },
  common: {
    logout: "Logout",
    loading: "Loading...",
    workspace: "Workspace",
    dashboard: "Dashboard",
    aiPowered: "AI-powered document workflow",
    language: "Language",
    close: "Close",
    openMenu: "Open menu",
    save: "Save",
    cancel: "Cancel",
    yes: "Yes",
    no: "No",
    unexpectedError: "An unexpected error occurred.",
    used: "Used",
    remaining: "Remaining",
    limit: "Limit",
    unlimited: "Unlimited",
    refresh: "Refresh",
  },
  limits: {
    chatReached: "You have already reached your monthly chat message limit.",
    summaryReached: "You have already reached your monthly summary limit.",
    extractReached: "You have already reached your monthly extraction limit.",
    compareReached: "You have already reached your monthly comparison limit.",
    uploadReached:
      "You have already reached your monthly document upload limit.",
  },
  folderChat: {
    title: "Folder AI conversation",
    subtitle:
      "Ask questions about all processed documents inside this folder and its subfolders.",
    contextAware: "Context-aware chat for the whole folder.",
    sessions: "Folder chat sessions",
    session: "Session",
    noSessions: "No saved folder sessions yet. Send your first question.",
    empty: "Start by asking about the documents in this folder.",
    thinking: "Thinking...",
    placeholder:
      "Ask about invoices, CVs, contracts or all files in this folder...",
    send: "Send",
    you: "You",
    assistant: "Assistant",
    loadError: "Failed to load folder chat.",
    loadMessagesError: "Failed to load folder messages.",
    sendError: "Failed to send the message.",
    totalDocuments: "Wszystkie dokumenty",
    readyDocuments: "Gotowe dla AI",
    processingBannerTitle: "Część dokumentów nadal się przetwarza",
    processingBannerDescription:
      "Aktualnie {{count}} dokumentów w tym folderze jest jeszcze przetwarzanych. Chat odpowiada tylko na podstawie gotowych dokumentów.",
  },
  documentStructurePage: {
    kicker: "Structure overview",
    title: "Document structure",
    subtitle:
      "Browse folders, subfolders, and documents in one tree and open the file preview on the right side.",
    treeKicker: "Structure",
    treeTitle: "Folders and documents",
    searchPlaceholder: "Search folder or document...",
    uncategorized: "Uncategorized",
    emptyTreeTitle: "No results",
    emptyTreeSubtitle: "No folders or documents matched your search.",
    previewKicker: "File preview",
    openOriginal: "Open original",
    loadingPreview: "Loading preview...",
    previewUnavailableTitle: "Preview unavailable",
    previewUnavailableSubtitle: "This file type cannot be shown inline.",
    emptyPreviewTitle: "Select a document",
    emptyPreviewSubtitle:
      "When you click a document, its preview will appear on the right.",
    openChat: "Go to chat",
    openFolderChat: "Go to folder chat",
    folderSelectedTitle: "Folder selected",
    folderSelectedSubtitle:
      "You can open chat for the whole folder or choose a document to preview.",
    treeSubtitle:
      "Browse folders and documents in a more comfortable structure view.",
  },
  documents: {
    confirmAssignment: "Keep / teach AI",
    batchUploadTitle: "Drop files or click to upload",
    batchUploadSubtitle: "Upload one file or a whole package at once",
    uploadError: "Upload failed. Please try again.",
    openFolderChat: "Chat with this folder",
    newBadge: "New",
    heroBadge: "Smart document workflow",
    title: "Turn files into answers, summaries and structured insights.",
    subtitle:
      "Upload documents, manage them safely and organize them into folders in a cleaner, more usable workspace.",
    uploadTitle: "Drop file or click to upload",
    uploadSubtitle: "PDF, DOCX and other supported document formats",
    uploadTarget: "Upload target:",
    uploading: "Uploading...",
    quickStats: "Workspace overview",
    totalDocuments: "Total documents",
    aiReady: "AI-ready files",
    folders: "Folders",
    libraryTitle: "Document library",
    librarySubtitle:
      "Browse, search, manage, drag and drop, and open your processed files.",
    emptyTitle: "No documents yet",
    emptySubtitle: "Upload your first file to start analyzing content.",
    untitled: "Untitled document",
    readyForAi: "AI workflow ready",
    actions: "Summary · Extract · Chat",
    openDetails: "Open details",
    searchPlaceholder: "Search documents and folders...",
    delete: "Delete",
    createFolder: "Create folder",
    deleteFolder: "Delete folder",
    deleteFolderTitle: "Delete folder",
    deleteFolderDescription:
      "Are you sure you want to delete this folder? The folder must be empty before it can be removed.",
    currentView: "Current view",
    treeTitle: "Folders",
    treeSubtitle:
      "Create folders and subfolders, then drop documents into them like in a file explorer.",
    treeKicker: "Folder tree",
    smartOrganize: "Smart organize on upload",
    smartOrganizeHint:
      "Let AI suggest or assign the best folder when you upload without a selected target folder.",
    autoCreateFolders: "Allow AI to create folders",
    autoCreateFoldersHint:
      "When nothing matches, the assistant may create a clean system folder with translated names.",
    dragToFolder: "Drag this card into a folder",
    confidence: "Confidence",
    status: {
      uploaded: "Uploaded",
      queued: "Queued",
      processing: "Processing",
      ready: "Ready",
      failed: "Failed",
      unknown: "Unknown",
    },
    processingNow: "Processing now",
    libraryKicker: "Document space",
    tree: {
      allDocuments: "All documents",
      uncategorized: "Uncategorized",
    },
    folderModal: {
      createTitle: "Create folder",
      createSubtitle:
        "Add a new folder with translated names so the interface can display it correctly in every language.",
      createChildTitle: "Create subfolder",
      createChildSubtitle:
        "Add a child folder under the currently selected location.",
      editTitle: "Edit folder",
      editSubtitle:
        "Update folder names and translations without changing the current visual style.",
      name: "Default name",
      namePl: "Name (Polish)",
      nameEn: "Name (English)",
      nameUa: "Name (Ukrainian)",
      saveCreate: "Create folder",
      saveEdit: "Save changes",
    },
    folderClassification: {
      none: "Folder not assigned",
      manual: "Assigned manually",
      pending: "Waiting for AI",
      autoAssigned: "Assigned by AI",
      autoCreated: "AI created folder",
      suggested: "AI suggestion",
      uncategorized: "Uncategorized",
      fromStructure: "Assigned from folder structure",
    },
  },
  details: {
    overview: "Document overview",
    subtitle:
      "View status, generate summary, extract structured data and jump into AI chat.",
    fileType: "File type",
    mimeType: "MIME type",
    size: "Size",
    documentId: "Document ID",
    summary: "Summary",
    extraction: "Structured extraction",
    extractionSubtitle: "Extract reusable fields from the document.",
    extractionHistory: "Extraction history",
    extractionType: "Extraction type",
    fields: "Fields (comma separated)",
    generateSummary: "Generate summary",
    generating: "Generating...",
    openChat: "Open AI chat",
    compare: "Compare documents",
    runExtraction: "Run extraction",
    extracting: "Extracting...",
    noSummary: "No summary yet. Generate one from the action above.",
    noExtractions: "No extractions yet.",
    extractionItem: "Extraction",
    notFound: "Document not found.",
    summaryKicker: "AI summary",
    extractionKicker: "Structured extraction",
    historyKicker: "Previous runs",
    openPreview: "Open preview",
  },
  chat: {
    title: "AI conversation",
    subtitle:
      "Ask questions about the uploaded content and restore previous sessions.",
    contextAware: "Context-aware chat for this document.",
    sessions: "Chat sessions",
    session: "Session",
    noSessions: "No saved sessions yet. Send your first question.",
    empty: "Start by asking a question about the document.",
    thinking: "Thinking...",
    send: "Send",
    placeholder:
      "Ask about the document, request a summary, find facts, risks or differences...",
    you: "You",
    assistant: "Assistant",
    headerKicker: "Document conversation",
  },
  compare: {
    badge: "AI comparison workspace",
    title: "Compare two documents with AI",
    subtitle:
      "Select a base document, choose a second file and generate a structured comparison.",
    first: "First document",
    second: "Second document",
    prompt: "Comparison prompt",
    defaultPrompt:
      "Compare these documents and highlight the key differences, similarities and risks.",
    run: "Run compare",
    running: "Comparing...",
    result: "Comparison result",
    empty: "Choose two documents and run the comparison.",
    setupKicker: "Compare setup",
    setupTitle: "Choose documents and prompt",
    resultKicker: "AI comparison",
    searchDocuments: "Search documents",
    swap: "Swap documents",
    suggestionGeneral:
      "Compare these documents and identify the most important differences, similarities and risks.",
    suggestionDifferences:
      "Focus only on the key differences between the documents.",
    suggestionRisks: "List risks, gaps and potential issues.",
    suggestionSummary: "Prepare a short bullet-point comparison summary.",
  },
  deleteModal: {
    title: "Delete document",
    description:
      "Are you sure you want to delete this document? This action cannot be undone.",
    delete: "Delete",
    cancel: "Cancel",
  },
  auth: {
    loader: {
      title: "Preparing your AI workspace",
      subtitle: "Loading documents, preferences and your session...",
    },
    login: {
      badge: "Next-gen document workflow",
      title: "Welcome back 👋",
      subtitle:
        "Chat with files, compare versions and extract insights in a much cleaner workspace.",
      featureChat: "Ask questions and continue previous AI conversations.",
      featureCompare: "Compare documents and catch differences faster.",
      featureExtract:
        "Generate summaries and structured extraction in one flow.",
      formTitle: "Sign in",
      formSubtitle:
        "Access your workspace and continue exactly where you left off.",
      email: "Email",
      emailPlaceholder: "name@company.com",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      submit: "Sign in",
      signingIn: "Signing in...",
      noAccount: "No account yet?",
      createAccount: "Create one",
      error: "Login failed. Please check your credentials and try again.",
      loaderTitle: "Signing you in",
      loaderSubtitle: "Restoring your workspace and session...",
      registrationSuccess:
        "Your account has been created. Check your email to activate it before signing in.",
      resendConfirmation: "Resend confirmation email",
      resending: "Sending...",
      resendSuccess: "A new confirmation email has been sent.",
      resendError: "Could not resend the confirmation email.",
    },
    confirm: {
      kicker: "Email confirmation",
      loadingTitle: "Confirming your email",
      successTitle: "Email confirmed",
      errorTitle: "Confirmation failed",
      successMessage:
        "Your email was confirmed successfully. You can now sign in.",
      errorMessage: "The confirmation link is invalid or has expired.",
      invalidLink: "This confirmation link is incomplete or invalid.",
      resendButton: "Resend confirmation email",
      resending: "Sending...",
      resendSuccess: "A new confirmation email has been sent.",
      resendError: "Could not resend the confirmation email.",
      goToLogin: "Go to sign in",
      emailLabel: "Email",
    },
    register: {
      badge: "Create your AI workspace",
      title: "Create your account ✨",
      subtitle:
        "Start building your document analysis workspace in a cleaner and smarter interface.",
      featureWorkspace: "Set up your personal AI workspace in seconds.",
      featureFiles: "Upload, analyze and compare files in one place.",
      featureFlow: "Move faster with summaries, extraction and chat.",
      formTitle: "Create account",
      formSubtitle:
        "Join the workspace and start organizing your document flow.",
      email: "Email",
      emailPlaceholder: "name@company.com",
      password: "Password",
      passwordPlaceholder: "Create a strong password",
      submit: "Create account",
      creating: "Creating...",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
      error: "Registration failed. Please try again.",
      loaderTitle: "Creating your account",
      loaderSubtitle:
        "Preparing your workspace and redirecting you to sign in...",
      successTitle: "Account created",
      successSubtitle:
        "We are preparing your workspace. Please confirm your email next.",
    },
    errors: {
      emailRequired: "Email is required.",
      emailInvalid: "Enter a valid email address.",
      passwordRequired: "Password is required.",
      passwordTooShort: "Password must be at least 8 characters long.",
      emailAlreadyExists: "An account with this email already exists.",
      invalidCredentials: "Invalid email or password.",
      emailNotConfirmed:
        "Your account is not activated yet. Confirm your email to continue.",
      accountInactive: "Your account is inactive.",
      confirmationInvalidOrExpired:
        "The confirmation link is invalid or has expired.",
      confirmationResendCooldown:
        "Please wait before requesting another confirmation email.",
      confirmationDeliveryFailed:
        "We could not send the confirmation email right now. Try again in a moment.",
      emailAlreadyConfirmed: "This email address has already been confirmed.",
      confirmationUrlInvalid: "The confirmation link configuration is invalid.",
      invalidSession: "Your session is invalid. Please sign in again.",
      notAuthenticated: "You are not authenticated.",
    },
  },
  home: {
    badge: "New AI workspace",
    title: "A cleaner place to upload, compare and chat with documents.",
    subtitle:
      "Start from one simple dashboard, then jump into documents, AI chat and comparisons without fighting the interface.",
    primaryCta: "Open documents",
    secondaryCta: "Start compare",
    quickActionsEyebrow: "Start here",
    quickActionsTitle: "Quick actions",
    highlightsEyebrow: "Why this workspace",
    highlightsTitle: "What you can do",
    preview: {
      documents: "Documents",
      ready: "AI-ready",
      flow: "Workflow",
    },
    actions: {
      uploadTitle: "Upload and manage files",
      uploadDescription:
        "Open the document library and start working with your files.",
      compareTitle: "Compare two documents",
      compareDescription: "Run AI comparison and quickly spot key differences.",
      chatTitle: "Continue AI chat",
      chatDescription:
        "Jump into document conversations and continue analysis.",
    },
    highlights: {
      libraryTitle: "Cleaner document library",
      libraryDescription:
        "Browse, search and open files in a simpler workspace.",
      aiTitle: "Faster AI actions",
      aiDescription:
        "Move from files to summary, extraction and chat with less friction.",
      compareTitle: "Better comparison flow",
      compareDescription:
        "Compare documents from one focused workspace instead of a cluttered layout.",
    },
  },
  usage: {
    chatMessages: "Chat messages",
    documentUploads: "Document uploads",
    summarizations: "Summarizations",
    extractions: "Extractions",
    comparisons: "Comparisons",
  },
  account: {
    badge: "Your account",
    title: "Account and AI workspace access",
    subtitle:
      "Review your account details, access status and current monthly AI usage limits.",
    profileKicker: "User profile",
    profileTitle: "Account information",
    profileSubtitle: "Core account data and identity within the system.",
    accessKicker: "Access and status",
    accessTitle: "Permissions and access",
    usageKicker: "Monthly usage",
    usageTitle: "Limits and usage overview",
    usageSubtitle:
      "Check your current usage for chat, uploads, summarizations, extractions and comparisons.",
    email: "Email",
    displayName: "Display name",
    role: "Role",
    provider: "Provider",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    unlimited: "Unlimited access",
    totalUsage: "Total usage",
    security: "Account security",
    securityDescription:
      "Access and permissions are assigned directly to your user account.",
    usageAccess: "AI feature access",
    usageAccessDescription:
      "Your available features depend on assigned limits or unlimited access.",
    monthlyTracking: "Monthly tracking",
    monthlyTrackingDescription:
      "Usage resets according to system rules and your account limits.",
  },
  roles: {
    admin: "Admin",
    user: "User",
  },
  adminUsers: {
    badge: "Smart admin control center",
    title: "User management & AI limits",
    subtitle:
      "Monitor usage, manage roles, control overrides and keep the whole platform healthy in one premium dashboard.",
    totalUsers: "Total users",
    details: "Details",
    admins: "Admins",
    activeAdmins: "Admin ratio",
    unlimited: "Unlimited",
    active: "Active",
    inactive: "Inactive",
    overrides: "Overrides",
    platformHealth: "Platform health",
    liveOverview: "Live overview",
    systemLoad: "System load",
    monthlyActivity: "Monthly activity",
    insightUsersHint: "All accounts in the workspace",
    insightAdminsHint: "Privileges distribution",
    insightOverridesHint: "Custom limit profiles enabled",
    insightActivityHint: "Total actions across all AI tools",
    userManagementKicker: "Workspace control",
    userManagementTitle: "Manage users",
    filterAll: "All",
    filterAdmins: "Admins",
    filterActive: "Active",
    filterUnlimited: "Unlimited",
    searchPlaceholder: "Search by name, email, role or provider...",
    noUsersFound: "No users found.",
    provider: "Provider",
    status: "Status",
    role: "Role",
    editLimits: "Edit limits",
    resetToDefault: "Reset",
    overrideActive: "Override active",
    detailsBadge: "Usage analytics",
    unlimitedAccess: "Unlimited AI access",
    noReason: "No reason provided",
    editLimitsTitle: "Edit user limits",
    editingKicker: "Configuration",
    chatLimit: "Chat messages limit",
    uploadLimit: "Document uploads limit",
    summaryLimit: "Summarizations limit",
    extractLimit: "Extractions limit",
    compareLimit: "Comparisons limit",
    reason: "Reason",
    reasonPlaceholder: "Why were these limits changed?",
    unlimitedAccessHint: "Removes monthly AI limits for this user",
    topUsageKicker: "Highlights",
    topUsageTitle: "Top usage users",
    activityBreakdownKicker: "Overview",
    activityBreakdownTitle: "Activity breakdown",
    totalConsumption: "Total consumption",
    resetConfirmation:
      "Are you sure you want to reset this user's limits to the default values?",
    resetConfirmTitle: "Reset custom limits?",
    resetConfirmDescription:
      "This will remove custom usage overrides for {{email}} and restore the default limits.",
  },
  smartWorkspace: {
    loading: "Loading Smart Workspace...",
    heroBadge: "Smart Folder Assistant 2.1",
    title: "Review and organize your documents",
    subtitle:
      "Review AI folder decisions, see which document each decision affects, merge duplicate folders, and manage reusable AI templates.",
    suggestedFolder: "Suggested folder",

    decision: {
      title: "Folder decisions",
      description:
        "Review AI decisions only when a document needs confirmation or correction. For confident assignments, confirm the choice to teach the assistant.",
      currentAssignment: "Current AI assignment",
      needsReview: "User decision required",
    },

    correction: {
      kicker: "Folder correction",
      title: "Choose the right folder",
      description:
        "Moving a document teaches the assistant how you organize files.",
      noFolders: "You do not have any folders to choose from yet.",
    },

    reasonCodes: {
      smart_folder_auto_assigned_existing:
        "AI selected an existing folder using the document structure and content.",
      smart_folder_auto_assigned_existing_path:
        "AI matched the proposed path to an existing folder and assigned the document.",
      smart_folder_auto_created_path:
        "AI created the missing folder path and assigned the document.",
      smart_folder_auto_created_and_assigned:
        "AI created a folder and assigned the document.",
      smart_folder_auto_assigned_from_structure:
        "The folder was recognized from the uploaded directory structure.",
      smart_folder_upload_structure_matched_existing:
        "The uploaded directory structure matched an existing folder.",
      smart_folder_upload_structure_created_path:
        "AI created folders from the uploaded directory structure.",
      smart_folder_needs_review:
        "AI is not confident enough and asks for a user decision.",
      smart_folder_no_confident_match: "No confident folder match was found.",
      smart_folder_no_useful_signal:
        "The document does not contain enough useful signals for folder assignment.",
      smart_folder_proposed_existing_needs_review:
        "AI found a possible existing folder, but it needs your review.",
      smart_folder_proposed_path_needs_review:
        "AI proposed a new folder path, but it needs your review before creating it.",
      smart_folder_existing_path_selected:
        "AI selected the best existing folder path.",
      smart_folder_new_path_proposed: "AI proposed a new folder path.",
      smart_folder_user_confirmed_assignment:
        "The user confirmed the folder assignment.",
      smart_folder_user_confirmed_uncategorized:
        "The user confirmed that the document should remain uncategorized.",
      smart_folder_suggestion_accepted:
        "The user accepted the folder suggestion.",
      smart_folder_suggestion_rejected_uncategorized:
        "The suggestion was rejected and the document was moved to uncategorized.",
      smart_folder_manual_folder_selected: "The folder was selected manually.",
      smart_folder_manual_upload_folder_selected:
        "The folder was selected manually during upload.",
      smart_folder_manual_folder_removed:
        "The folder assignment was removed manually.",
      smart_folder_pending: "The document is waiting for smart organization.",
      smart_folder_disabled:
        "Smart organization is disabled for this document.",
      smart_folder_suggestions_regenerated:
        "Folder suggestions were regenerated.",
      smart_folder_semantic_profile_match:
        "The document is similar to this folder profile.",
      smart_folder_user_history_match:
        "The document matches your previous folder choices.",
      smart_folder_fallback_local:
        "A local fallback rule suggested this folder.",
      smart_folder_specific_child_path_preferred:
        "A more specific child folder path was preferred.",
    },

    unfiled: "Unfiled",

    metrics: {
      documents: "Documents",
      ready: "Ready",
      inboxReview: "Needs review",
      unfiled: "Unfiled",
    },

    suggestions: {
      kicker: "AI decisions",
      title: "Folder suggestions to review",
      description:
        "Each card represents one document. Review the proposed folders and choose where this document should go.",
      empty: "There are no folder suggestions waiting for review.",
      rank: "Rank #{{rank}}",
      option: "Option #{{rank}}",
      noReason: "No explanation was provided for this suggestion.",
      rules: "Rules {{score}}",
      semantic: "Semantic match {{score}}",
      history: "Your history {{score}}",
      decidingFor: "Decision for document",
      unknownDocument: "Document {{id}}",
      unknownStatus: "Unknown status",
      count: "{{count}} options",
    },

    reasons: {
      topicAndSemantic:
        "The folder matches the document topic. Semantic folder match: {{score}}.",
      typeAndSemantic:
        "The folder matches the document type. Semantic folder match: {{score}}.",
      semanticOnly:
        "The document is semantically similar to this folder. Match: {{score}}.",
    },

    inbox: {
      kicker: "Review inbox",
      title: "Documents needing attention",
      empty: "No documents need your attention right now.",
    },

    tools: {
      kicker: "Workspace tools",
      title: "Cleanup and automation",
      description:
        "Use these tools when you want to clean up similar folders or save repeatable AI instructions. They are optional and do not affect pending folder decisions.",
    },

    duplicates: {
      kicker: "Cleanup",
      title: "Possible duplicate folders",
      empty: "No duplicate folder candidates were found.",
      similar: "{{score}} similar",
    },

    templates: {
      kicker: "AI templates",
      title: "Reusable AI actions",
      description:
        "Optional templates let you save prompts you use often, for example invoice extraction or contract risk review.",
      empty: "You have not saved any AI templates yet.",
      defaultName: "Invoice extraction",
      defaultPrompt:
        "Extract invoice number, seller, buyer, net amount, VAT, gross amount and payment due date.",
      namePlaceholder: "Template name",
      documentTypePlaceholder: "Document type, e.g. invoice",
      promptPlaceholder: "What should AI do with this document?",
      outputFormatPlaceholder: "Output format, e.g. json",
      anyDocument: "any document",

      formTitle: "Template editor",
      savedTitle: "Saved templates",
      editing: "Editing selected template",
      clearSelection: "Clear",
      selected: "Selected",
      selectedHint: "This template is currently loaded into the form.",
      loadTemplate: "Load template",
      nameLabel: "Template name",
      documentTypeLabel: "Document type",
      promptLabel: "Prompt",
      outputFormatLabel: "Output format",
    },

    actions: {
      accept: "Accept",
      reject: "Reject",
      merge: "Merge",
      saveTemplate: "Save template",
      deleteTemplate: "Delete template",

      confirmAssignment: "Keep / teach AI",
      changeFolder: "Change folder",
      unfile: "Uncategorized",
      openDocument: "Open document",
    },

    notices: {
      accepted:
        "Suggestion accepted. The document was moved and the assistant learned from your choice.",
      rejected: "Suggestion rejected.",
      merged: "Duplicate folders were merged.",
      templateSaved: "AI template saved.",
      templateDeleted: "AI template deleted.",

      assignmentConfirmed: "Assignment confirmed. AI learned from this choice.",
      folderChanged: "Document folder changed. AI learned from the correction.",
      unfiled: "Document moved to uncategorized.",
      templateLoaded: "Template loaded into the form.",
    },

    errors: {
      load: "Could not load Smart Workspace.",
      accept: "Could not accept this suggestion.",
      reject: "Could not reject this suggestion.",
      merge: "Could not merge these folders.",
      templateSave: "Could not save this template.",
      confirmAssignment: "Could not confirm the folder assignment.",
      changeFolder: "Could not change the document folder.",
      templateDelete: "Could not delete this template.",
    },
  },
};
