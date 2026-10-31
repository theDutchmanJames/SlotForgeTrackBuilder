Option Explicit
Dim fs, shell, folder, shortcut
Set fs = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
folder = fs.GetParentFolderName(WScript.ScriptFullName)
Set shortcut = shell.CreateShortcut(fs.BuildPath(folder, "SlotForge Circuit.lnk"))
shortcut.TargetPath = fs.BuildPath(folder, "SlotForge Circuit.html")
shortcut.WorkingDirectory = folder
shortcut.IconLocation = fs.BuildPath(folder, "app\icon.ico") & ",0"
shortcut.Description = "Open SlotForge Circuit"
shortcut.Save
MsgBox "SlotForge Circuit shortcut created in this folder.", 64, "SlotForge Circuit"
