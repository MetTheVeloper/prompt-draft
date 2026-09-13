!include "MUI2.nsh"

!ifndef PublishDir
  !error "PublishDir define is required."
!endif

!ifndef OutputDir
  !define OutputDir "."
!endif

!ifndef InstallerIcon
  !error "InstallerIcon define is required."
!endif

!define APP_NAME "Prompt Draft Server Manager"
!define APP_VERSION "0.1.2"
!define APP_PUBLISHER "MetTheVeloper"
!define APP_EXE "PromptDraft.ServerManager.exe"
!define APP_REG_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\PromptDraftServerManager"
!define APP_RUN_KEY "Software\Microsoft\Windows\CurrentVersion\Run"

Unicode True
Name "${APP_NAME}"
OutFile "${OutputDir}\PromptDraftServerManager-Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\MetTheVeloper\Prompt Draft Server Manager"
InstallDirRegKey HKCU "Software\MetTheVeloper\PromptDraftServerManager" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
Icon "${InstallerIcon}"
UninstallIcon "${InstallerIcon}"

VIProductVersion "0.1.2.0"
VIAddVersionKey /LANG=1033 "ProductName" "${APP_NAME}"
VIAddVersionKey /LANG=1033 "CompanyName" "${APP_PUBLISHER}"
VIAddVersionKey /LANG=1033 "FileDescription" "Prompt Draft local operations console"
VIAddVersionKey /LANG=1033 "FileVersion" "${APP_VERSION}"
VIAddVersionKey /LANG=1033 "ProductVersion" "${APP_VERSION}"
VIAddVersionKey /LANG=1033 "LegalCopyright" "Copyright 2026 MetTheVeloper"

!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Run Prompt Draft Server Manager"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install" SEC_MAIN
  SetShellVarContext current
  SetOutPath "$INSTDIR"
  SetOverwrite on

  ; Install the complete publish payload, not just the managed launcher.
  ; Self-contained WPF publishes can emit native sidecar libraries that are
  ; required before managed startup code is reached. Omitting them causes the
  ; process to terminate before our startup diagnostics can write a log.
  File /r "${PublishDir}\*.*"

  WriteRegStr HKCU "Software\MetTheVeloper\PromptDraftServerManager" "InstallDir" "$INSTDIR"

  ; Start automatically when the current Windows user signs in.
  WriteRegStr HKCU "${APP_RUN_KEY}" "${APP_NAME}" '$\"$INSTDIR\${APP_EXE}$\"'

  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"

  WriteUninstaller "$INSTDIR\Uninstall.exe"

  WriteRegStr HKCU "${APP_REG_KEY}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKCU "${APP_REG_KEY}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "${APP_REG_KEY}" "Publisher" "${APP_PUBLISHER}"
  WriteRegStr HKCU "${APP_REG_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${APP_REG_KEY}" "DisplayIcon" "$INSTDIR\${APP_EXE}"
  WriteRegStr HKCU "${APP_REG_KEY}" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
  WriteRegDWORD HKCU "${APP_REG_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${APP_REG_KEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  SetShellVarContext current

  DeleteRegValue HKCU "${APP_RUN_KEY}" "${APP_NAME}"
  DeleteRegKey HKCU "${APP_REG_KEY}"
  DeleteRegKey HKCU "Software\MetTheVeloper\PromptDraftServerManager"

  Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"

  ; The uninstaller runs from a temporary copy, so the whole install payload
  ; can be removed safely, including native runtime sidecars.
  RMDir /r "$INSTDIR"
SectionEnd
