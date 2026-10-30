Option Explicit
Dim fs, shell, folder, shortcut
Set fs = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
folder = fs.GetParentFolderName(WScript.ScriptFullName)
Set shortcut = shell.CreateShortcut(fs.BuildPath(folder, "SlotForge Track Builder.lnk"))
shortcut.TargetPath = fs.BuildPath(folder, "SlotForge Track Builder.html")
shortcut.WorkingDirectory = folder
shortcut.IconLocation = fs.BuildPath(folder, "app\icon.ico") & ",0"
shortcut.Description = "Open SlotForge Track Builder"
shortcut.Save
MsgBox "SlotForge Track Builder shortcut created in this folder.", 64, "SlotForge Track Builder"
