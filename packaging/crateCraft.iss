; crateCraft Windows installer (formerly Serato Library).
;
; SIGNING HOOK (dormant): this script does not call SignTool.
; scripts/release_sign.py signs the packaged executables and this installer
; when WINDOWS_CERTIFICATE_PFX_BASE64 and WINDOWS_CERTIFICATE_PASSWORD are
; both set. When those secrets are absent, signing is skipped and the
; build stays unsigned. Do not add a SignTool directive here; a missing
; certificate would fail the compile.

#ifndef AppVersion
  #error Pass /DAppVersion= from the release identity.
#endif
#ifndef SourceDir
  #error Pass /DSourceDir= pointing at the PyInstaller folder.
#endif

[Setup]
; AppId is unchanged from Serato Library so an existing install upgrades in
; place (Inno reuses its folder) instead of installing a second copy.
AppId={{7F3C1A2E-9B84-4D6F-8C15-2E6A0B9D4F71}
AppName=crateCraft
AppVersion={#AppVersion}
AppPublisher=crateCraft
DefaultDirName={localappdata}\Programs\crateCraft
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputBaseFilename=crateCraft-windows-setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
SetupIconFile=app-icon.ico
UninstallDisplayIcon={app}\crateCraft.exe
CloseApplications=yes
RestartApplications=no

[Files]
; The PyInstaller folder only. This does not copy the Serato library.
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Tasks]
Name: desktopicon; Description: "Add a desktop shortcut"; GroupDescription: "Shortcuts:"; Flags: unchecked

[InstallDelete]
; Shortcuts and the launcher left by a Serato Library install. Only these
; app files are removed. Settings in %APPDATA% and the Serato library are
; not touched.
Type: files; Name: "{autoprograms}\Serato Library.lnk"
Type: files; Name: "{autodesktop}\Serato Library.lnk"
Type: files; Name: "{app}\Serato Library.exe"

[Icons]
Name: "{autoprograms}\crateCraft"; Filename: "{app}\crateCraft.exe"
Name: "{autodesktop}\crateCraft"; Filename: "{app}\crateCraft.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\crateCraft.exe"; Description: "Open crateCraft"; Flags: nowait postinstall skipifsilent
