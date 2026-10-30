// Windows Script Host starts the private runtime without a console window.
function vbs(runtime){return `Option Explicit
Dim sh, fso, root, node, launcher, q, result
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
If WScript.Arguments.Count > 0 Then
  MsgBox WScript.Arguments(0), 16, "SlotForge Track Builder"
  WScript.Quit 1
End If
root = fso.GetParentFolderName(WScript.ScriptFullName)
node = "${runtime.replaceAll('"','""')}"
launcher = fso.BuildPath(root, "launcher.cjs")
If Not fso.FileExists(node) Or Not fso.FileExists(launcher) Then
  MsgBox "SlotForge is missing an app or runtime file. Run the installer again. Your data folder will be kept.", 16, "SlotForge Track Builder"
  WScript.Quit 1
End If
sh.CurrentDirectory = root
q = Chr(34)
On Error Resume Next
result = sh.Run(q & node & q & " " & q & launcher & q, 0, False)
If Err.Number <> 0 Then
  MsgBox "SlotForge could not start: " & Err.Description & vbCrLf & "Run the installer again. Your saved data will be kept.", 16, "SlotForge Track Builder"
  WScript.Quit 1
End If
`;}
function batch(){return '@echo off\r\nsetlocal\r\nwscript.exe "%~dp0Start SlotForge.vbs"\r\nif errorlevel 1 (\r\n echo SlotForge could not start. Run the installer again. Your saved data will be kept.\r\n pause\r\n exit /b 1\r\n)\r\n';}
module.exports={vbs,batch};
