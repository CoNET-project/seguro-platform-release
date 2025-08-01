; CreateSilentPassVPNInstaller.iss

[Setup]
; --- App Info
AppName=Silent-Pass-Proxy
AppVersion=1.0.0
AppPublisher=Your Company Name
AppId={{YOUR_UNIQUE_APP_ID}}

; --- Installation Directories
DefaultDirName={autopf}\Silent-Pass-Proxy
DefaultGroupName=Silent-Pass-Proxy
DisableProgramGroupPage=yes

; =================================================================
; == 新增指令：指定安裝包的圖示文件 ==
SetupIconFile=public\512.ico
; =================================================================

; --- Output Configuration
OutputDir=Output
OutputBaseFilename=Silent-Pass-Proxy-Setup
; --- 其他設定
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin


; --- 簽名設定 ---
; 由於我們是在Linux上透過Docker執行，而EV簽名的硬體權杖通常在Windows上，
; 所以我們在這裡不簽署最終的安裝包。
; 最佳做法是：先生成未簽名的安裝包，然後將其複製到Windows機器上進行最後的簽名。
; SignTool=... (此處保持註解狀態)


[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"


[Files]
; --- 主要應用程式檔案 ---
; 來源路徑是相對於 Inno Setup 腳本的位置。
; 因為 EXE 已經簽名，所以我們 **不** 使用 'sign' 標誌。
Source: "win-unpacked\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs


[Icons]
; --- 建立捷徑 (核心需求) ---
; 這是實現您參數傳遞目標的地方。
; 我們將您提供的兩個參數完整地放入 Parameters 欄位。

; 開始功能表捷徑
Name: "{group}\Silent-Pass-Proxy"; \
    Filename: "{app}\Silent-Pass-Proxy.exe"; \
    Parameters: "--ChannelPartners {#ChannelPartnersVar} --referrals {#ReferralsVar}"

; 桌面捷徑
Name: "{commondesktop}\Silent-Pass-Proxy"; \
    Filename: "{app}\Silent-Pass-Proxy.exe"; \
    Parameters: "--ChannelPartners {#ChannelPartnersVar} --referrals {#ReferralsVar}"; \
    Tasks: desktopicon

[Tasks]
; 讓使用者可以選擇是否建立桌面捷徑
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:";


[Run]
; 直接寫入固定的描述文字，不再使用任何變數或常數
Filename: "{app}\Silent-Pass-Proxy.exe"; Description: "Launch Silent-Pass-Proxy"; Flags: nowait postinstall skipifsilent


[UninstallDelete]
; 卸載時，確保整個應用程式目錄都被刪除
Type: filesandordirs; Name: "{app}"